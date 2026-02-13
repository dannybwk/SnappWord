"""LINE Messaging API client wrapper."""

from __future__ import annotations

import hashlib
import hmac
import base64
import logging

import httpx

from . import config

logger = logging.getLogger(__name__)

LINE_API_BASE = "https://api.line.me/v2/bot"


def verify_signature(body: bytes, signature: str) -> bool:
    """Verify LINE webhook signature."""
    if not signature:
        return False
    mac = hmac.new(
        config.LINE_CHANNEL_SECRET.encode("utf-8"),
        body,
        hashlib.sha256,
    )
    expected = base64.b64encode(mac.digest()).decode("utf-8")
    return hmac.compare_digest(expected, signature)


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {config.LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }


async def reply_message(reply_token: str, messages: list[dict]) -> None:
    """Send reply using reply token (must be within 30s of webhook)."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{LINE_API_BASE}/message/reply",
            headers=_headers(),
            json={"replyToken": reply_token, "messages": messages},
        )
        if not resp.is_success:
            logger.warning("LINE reply failed: %d %s", resp.status_code, resp.text)


async def push_message(user_id: str, messages: list[dict]) -> None:
    """Send push message to a user (no time limit)."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{LINE_API_BASE}/message/push",
            headers=_headers(),
            json={"to": user_id, "messages": messages},
        )
        if not resp.is_success:
            logger.warning("LINE push failed: %d %s", resp.status_code, resp.text)


async def get_message_content(message_id: str) -> bytes:
    """Download image/file content from LINE servers."""
    url = f"https://api-data.line.me/v2/bot/message/{message_id}/content"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=_headers())
        resp.raise_for_status()
        return resp.content


async def get_user_profile(user_id: str) -> dict | None:
    """Get user profile from LINE (display name, picture URL)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{LINE_API_BASE}/profile/{user_id}",
            headers=_headers(),
        )
        if not resp.is_success:
            return None
        data = resp.json()
        return {"displayName": data.get("displayName", ""), "pictureUrl": data.get("pictureUrl")}


async def reply_text(reply_token: str, text: str) -> None:
    """Quick helper to reply with a single text message."""
    await reply_message(reply_token, [{"type": "text", "text": text}])


async def reply_loading(reply_token: str) -> None:
    """Reply with a 'processing' indicator message."""
    await reply_text(
        reply_token,
        "🔍 AI 正在解析您的截圖...\n請稍候 3-5 秒，單字卡馬上就來！",
    )
