"""Supabase database and storage operations."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

from supabase import create_client, Client

from . import config
from .models import GeminiParseResult, ReviewStatus

logger = logging.getLogger(__name__)

# Tier limits: screenshots per month
MONTHLY_LIMITS: dict[str, float] = {
    "free": 30,
    "sprout": 200,
    "bloom": float("inf"),
}

# Daily caps (anti-abuse for unlimited tiers)
DAILY_LIMITS: dict[str, float] = {
    "free": float("inf"),
    "sprout": float("inf"),
    "bloom": 500,
}


def _get_client() -> Client:
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def get_or_create_user(line_user_id: str, display_name: str | None = None) -> dict:
    """Find existing user or create a new one. Returns user dict."""
    sb = _get_client()
    result = sb.table("users").select("*").eq("line_user_id", line_user_id).execute()

    if result.data:
        user = result.data[0]
        # Backfill display name if missing
        if display_name and not user.get("display_name"):
            sb.table("users").update({"display_name": display_name}).eq("id", user["id"]).execute()
            user["display_name"] = display_name
        return user

    new_user = {
        "line_user_id": line_user_id,
        "display_name": display_name or "",
    }
    result = sb.table("users").insert(new_user).execute()
    if not result.data:
        raise RuntimeError(f"Failed to create user for {line_user_id}")
    return result.data[0]


def check_quota(user: dict) -> dict:
    """Check if user can send another screenshot (daily + monthly quota).

    Returns dict with keys: allowed, reason, tier, monthly_used, monthly_limit.
    """
    sb = _get_client()
    tier = user.get("subscription_tier") or "free"
    if tier == "free" and user.get("is_premium"):
        tier = "sprout"

    monthly_limit = MONTHLY_LIMITS.get(tier, MONTHLY_LIMITS["free"])
    daily_limit = DAILY_LIMITS.get(tier, float("inf"))
    user_id = user["id"]

    # Daily quota check
    if daily_limit != float("inf"):
        day_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        result = (
            sb.table("api_logs")
            .select("*", count="exact", head=True)
            .eq("user_id", user_id)
            .eq("event_type", "parse_success")
            .gte("created_at", day_start.isoformat())
            .execute()
        )
        daily_count = result.count or 0
        if daily_count >= daily_limit:
            return {
                "allowed": False,
                "reason": "daily_quota",
                "tier": tier,
                "monthly_used": 0,
                "monthly_limit": monthly_limit,
            }

    # Monthly quota check
    if monthly_limit != float("inf"):
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        result = (
            sb.table("api_logs")
            .select("*", count="exact", head=True)
            .eq("user_id", user_id)
            .eq("event_type", "parse_success")
            .gte("created_at", month_start.isoformat())
            .execute()
        )
        used = result.count or 0
        if used >= monthly_limit:
            return {
                "allowed": False,
                "reason": "monthly_quota",
                "tier": tier,
                "monthly_used": used,
                "monthly_limit": monthly_limit,
            }
        return {"allowed": True, "tier": tier, "monthly_used": used, "monthly_limit": monthly_limit}

    return {"allowed": True, "tier": tier, "monthly_used": 0, "monthly_limit": monthly_limit}


def upload_image(image_bytes: bytes, user_id: str) -> str:
    """Upload screenshot to Supabase Storage. Returns public URL."""
    if len(image_bytes) > 5_242_880:  # 5 MB
        raise ValueError("Image too large (max 5 MB)")

    sb = _get_client()
    filename = f"{user_id}/{uuid.uuid4().hex}.jpg"
    sb.storage.from_(config.STORAGE_BUCKET).upload(
        filename, image_bytes, {"content-type": "image/jpeg"}
    )
    return sb.storage.from_(config.STORAGE_BUCKET).get_public_url(filename)


def save_vocab_cards(
    user_id: str,
    image_url: str,
    parse_result: GeminiParseResult,
) -> list[dict]:
    """Save parsed words as vocab_cards. Returns list of inserted records."""
    sb = _get_client()
    rows = []
    for w in parse_result.words:
        rows.append({
            "user_id": user_id,
            "word": w.word,
            "translation": w.translation,
            "pronunciation": w.pronunciation,
            "original_sentence": w.context_sentence,
            "context_trans": w.context_trans,
            "ai_example": w.ai_example,
            "image_url": image_url,
            "source_app": parse_result.source_app,
            "target_lang": parse_result.target_lang,
            "tags": w.tags,
            "review_status": ReviewStatus.NEW,
        })

    if not rows:
        return []

    result = sb.table("vocab_cards").insert(rows).execute()
    if not result.data:
        raise RuntimeError("Failed to save vocab cards")
    return result.data


def update_card_status(card_id: str, user_id: str, status: int) -> bool:
    """Update review_status of a vocab card. Verifies ownership.

    Returns True if the card was found and updated, False otherwise.
    """
    sb = _get_client()
    result = (
        sb.table("vocab_cards")
        .update({
            "review_status": status,
            "updated_at": datetime.now(timezone.utc).isoformat(),
        })
        .eq("id", card_id)
        .eq("user_id", user_id)
        .execute()
    )
    return bool(result.data)


def get_recent_cards(user_id: str, limit: int = 10) -> list[dict]:
    """Get user's most recent vocab cards."""
    sb = _get_client()
    result = (
        sb.table("vocab_cards")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return result.data or []


# ── Upgrade Requests ──


def create_upgrade_request(user_id: str) -> dict:
    """Create a new upgrade request in waiting_image state."""
    sb = _get_client()
    result = (
        sb.table("upgrade_requests")
        .insert({"user_id": user_id, "status": "waiting_image"})
        .execute()
    )
    if not result.data:
        raise RuntimeError("Failed to create upgrade request")
    return result.data[0]


def get_pending_upgrade_request(user_id: str) -> dict | None:
    """Get a recent waiting_image upgrade request (within 10 minutes)."""
    sb = _get_client()
    ten_min_ago = (
        datetime.now(timezone.utc) - timedelta(minutes=10)
    ).isoformat()

    result = (
        sb.table("upgrade_requests")
        .select("*")
        .eq("user_id", user_id)
        .eq("status", "waiting_image")
        .gte("created_at", ten_min_ago)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def complete_upgrade_request(request_id: str, image_url: str) -> None:
    """Complete an upgrade request: set image URL and status to pending."""
    sb = _get_client()
    sb.table("upgrade_requests").update(
        {"status": "pending", "payment_image_url": image_url}
    ).eq("id", request_id).execute()


def upload_upgrade_proof(image_bytes: bytes, user_id: str) -> str:
    """Upload payment proof to Supabase Storage. Returns public URL."""
    sb = _get_client()
    filename = f"upgrade_proofs/{user_id}/{uuid.uuid4().hex}.jpg"
    sb.storage.from_(config.STORAGE_BUCKET).upload(
        filename, image_bytes, {"content-type": "image/jpeg"}
    )
    return sb.storage.from_(config.STORAGE_BUCKET).get_public_url(filename)


def log_event(user_id: str | None, event_type: str, **kwargs) -> None:
    """Write an operational log entry."""
    try:
        sb = _get_client()
        sb.table("api_logs").insert({
            "user_id": user_id,
            "event_type": event_type,
            "latency_ms": kwargs.get("latency_ms"),
            "token_count": kwargs.get("token_count"),
            "payload": kwargs.get("payload"),
        }).execute()
    except Exception:
        logger.exception("Failed to write log event: %s", event_type)
