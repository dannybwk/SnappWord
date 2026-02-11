"""Supabase database and storage operations."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from supabase import create_client, Client

from . import config
from .models import GeminiParseResult, ParsedWord


def _get_client() -> Client:
    return create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY)


def get_or_create_user(line_user_id: str, display_name: str | None = None) -> dict:
    """Find existing user or create a new one. Returns user dict."""
    sb = _get_client()
    result = sb.table("users").select("*").eq("line_user_id", line_user_id).execute()

    if result.data:
        return result.data[0]

    new_user = {
        "line_user_id": line_user_id,
        "display_name": display_name or "",
    }
    result = sb.table("users").insert(new_user).execute()
    return result.data[0]


def upload_image(image_bytes: bytes, user_id: str) -> str:
    """Upload screenshot to Supabase Storage. Returns public URL."""
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
            "review_status": 0,
        })

    if not rows:
        return []

    result = sb.table("vocab_cards").insert(rows).execute()
    return result.data


def update_card_status(card_id: str, status: int) -> None:
    """Update review_status of a vocab card."""
    sb = _get_client()
    sb.table("vocab_cards").update({
        "review_status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", card_id).execute()


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
    return result.data


def log_event(user_id: str | None, event_type: str, **kwargs) -> None:
    """Write an operational log entry."""
    sb = _get_client()
    sb.table("api_logs").insert({
        "user_id": user_id,
        "event_type": event_type,
        "latency_ms": kwargs.get("latency_ms"),
        "token_count": kwargs.get("token_count"),
        "payload": kwargs.get("payload"),
    }).execute()
