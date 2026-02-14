"""
LINE Webhook handler for SnappWord 截詞.

Architecture: Inline async processing
1. Receive image → reply "analyzing..." instantly (via reply token)
2. Process inline (await) so Vercel keeps the function alive until completion
3. Push result via Push Message API; every failure path guarantees a user-facing message
"""

from __future__ import annotations

import asyncio
import logging
import time
from datetime import datetime, timezone
from urllib.parse import parse_qs

from fastapi import FastAPI, Request, HTTPException

from _lib import config
from _lib.models import ReviewStatus
from _lib.line_client import (
    verify_signature,
    reply_loading,
    push_message,
    get_message_content,
    get_user_profile,
    reply_text,
)
from _lib.gemini_client import analyze_screenshot
from _lib.supabase_client import (
    get_or_create_user,
    check_quota,
    upload_image,
    save_vocab_cards,
    update_card_status,
    log_event,
    create_upgrade_request,
    get_pending_upgrade_request,
    complete_upgrade_request,
    upload_upgrade_proof,
)
from _lib.flex_messages import (
    build_vocab_carousel,
    build_error_message,
)

logger = logging.getLogger(__name__)

# Timeout for the Gemini API call (seconds).
# Must be well under Vercel's maxDuration (60s) to leave room for
# the error-handling push message if it times out.
GEMINI_TIMEOUT = 45

app = FastAPI()

# Simple in-memory dedup to handle LINE webhook retries.
# Cleared on cold start, which is acceptable.
_processed_events: dict[str, float] = {}
_DEDUP_WINDOW = 60  # seconds


def _is_duplicate(event_id: str) -> bool:
    """Return True if this webhook event was already processed recently."""
    now = time.time()
    # Clean expired entries
    expired = [k for k, v in _processed_events.items() if now - v > _DEDUP_WINDOW]
    for k in expired:
        del _processed_events[k]
    if event_id in _processed_events:
        return True
    _processed_events[event_id] = now
    return False


@app.post("/api/webhook")
async def webhook(request: Request) -> dict:
    """LINE Webhook endpoint.

    Events are processed inline (awaited) so Vercel keeps the serverless
    function alive for the full duration.  Using BackgroundTasks would cause
    Vercel to kill the process right after the response is sent.
    """
    body = await request.body()
    signature = request.headers.get("X-Line-Signature", "")

    if not verify_signature(body, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    payload = await request.json()
    events = payload.get("events", [])

    for event in events:
        event_id = event.get("webhookEventId", "")
        if event_id and _is_duplicate(event_id):
            logger.info("Skipping duplicate event %s", event_id)
            continue
        await _handle_event(event)

    return {"status": "ok"}


# ── Helpers ──────────────────────────────────────────────────────────


async def _safe_push(user_id: str, messages: list[dict]) -> None:
    """Push message with error suppression — never raises."""
    try:
        await push_message(user_id, messages)
    except Exception:
        logger.exception("Failed to push message to %s", user_id)


async def _safe_log(user_id: str | None, event_type: str, **kwargs) -> None:
    """Log event with error suppression — never raises."""
    try:
        await asyncio.to_thread(log_event, user_id, event_type, **kwargs)
    except Exception:
        logger.exception("Failed to log event %s", event_type)


async def _notify_admin_error(user_display: str, error_msg: str) -> None:
    """Notify admin about a processing failure so no user is left hanging."""
    if not config.ADMIN_LINE_USER_ID:
        return
    try:
        await push_message(config.ADMIN_LINE_USER_ID, [
            build_error_message(
                f"⚠️ 處理失敗通知\n\n"
                f"用戶：{user_display}\n"
                f"錯誤：{error_msg[:100]}"
            )
        ])
    except Exception:
        logger.exception("Failed to notify admin about error")


# ── Event Router ─────────────────────────────────────────────────────


async def _handle_event(event: dict) -> None:
    """Route event to appropriate handler.

    Safety-net: if anything fails, try to send an error message to the
    user so they are never left with just "正在解析..." and no follow-up.
    """
    event_type = event.get("type")
    line_user_id = event.get("source", {}).get("userId")

    try:
        if event_type == "follow":
            await _handle_follow(event)
        elif event_type == "message":
            await _handle_message(event)
        elif event_type == "postback":
            await _handle_postback(event)
    except Exception:
        logger.exception("Unhandled error in event handler")
        # Safety net: notify user so they're not left waiting forever
        if line_user_id:
            await _safe_push(line_user_id, [
                build_error_message(
                    "處理時發生未預期的錯誤 😅\n請稍後重試一次。"
                )
            ])


# ── Follow ───────────────────────────────────────────────────────────


async def _handle_follow(event: dict) -> None:
    """Welcome message when a user adds the bot as a friend."""
    reply_token = event.get("replyToken", "")
    source = event.get("source", {})
    line_user_id = source.get("userId")

    if not line_user_id:
        return

    # Ensure user record exists
    profile = await get_user_profile(line_user_id)
    display_name = profile["displayName"] if profile else None
    await asyncio.to_thread(get_or_create_user, line_user_id, display_name)

    await reply_text(
        reply_token,
        "嗨！歡迎加入 SnappWord 截詞 👋\n\n"
        "我是你的 AI 單字卡助手 ✨\n"
        "只要把學語言時的截圖傳給我，我就能幫你秒變精美單字卡！\n\n"
        "📸 支援各種來源：\n"
        "• Duolingo、Busuu 等學習 App\n"
        "• Netflix、YouTube 字幕\n"
        "• 文章、新聞、任何有生字的畫面\n\n"
        "🚀 現在就試試看吧！\n"
        "傳一張截圖給我，幾秒後就能收到你的第一組單字卡。\n\n"
        "💡 輸入「幫助」可隨時查看使用說明",
    )


# ── Message ──────────────────────────────────────────────────────────


async def _handle_message(event: dict) -> None:
    """Handle incoming messages (image or text)."""
    message = event.get("message", {})
    msg_type = message.get("type")
    reply_token = event.get("replyToken", "")
    source = event.get("source", {})
    line_user_id = source.get("userId")

    if not line_user_id:
        return

    if msg_type == "image":
        # Step 1: Immediately reply with loading indicator
        await reply_loading(reply_token)

        # Step 2: Process — errors are handled inside and always push a message
        await _process_screenshot(line_user_id, message["id"])

    elif msg_type == "text":
        text = message.get("text", "").strip()
        await _handle_text_command(reply_token, line_user_id, text)

    else:
        await reply_text(
            reply_token,
            "📸 請傳送截圖給我！\n我會幫你把圖片中的生字變成單字卡 ✨",
        )


async def _process_screenshot(line_user_id: str, message_id: str) -> None:
    """Full pipeline: download → upload → AI analyze → store → push card.

    Guarantees: the user ALWAYS receives a push message (success or error).
    """
    # Fetch LINE profile for display name
    profile = await get_user_profile(line_user_id)
    display_name = profile["displayName"] if profile else None
    user = await asyncio.to_thread(get_or_create_user, line_user_id, display_name)
    user_id = user["id"]

    try:
        # Check for pending upgrade request (payment screenshot flow)
        upgrade_req = await asyncio.to_thread(get_pending_upgrade_request, user_id)
        if upgrade_req:
            image_bytes = await get_message_content(message_id)
            image_url = await asyncio.to_thread(upload_upgrade_proof, image_bytes, user_id)
            await asyncio.to_thread(complete_upgrade_request, upgrade_req["id"], image_url)
            await push_message(line_user_id, [
                build_error_message(
                    "已收到你的付款截圖！我們會在 24 小時內為你升級 🎉"
                )
            ])
            # Notify admin via LINE
            if config.ADMIN_LINE_USER_ID:
                tier = upgrade_req.get("tier", "unknown")
                await _safe_push(config.ADMIN_LINE_USER_ID, [
                    build_error_message(
                        f"🔔 新付費通知\n\n"
                        f"用戶：{display_name or line_user_id}\n"
                        f"方案：{tier}\n\n"
                        f"請至後台審核 👉 snappword.com/admin"
                    )
                ])
            return

        # Check rate limit & monthly quota before processing
        quota = await asyncio.to_thread(check_quota, user)
        if not quota["allowed"]:
            if quota["reason"] == "daily_quota":
                await push_message(line_user_id, [
                    build_error_message(
                        "📊 今天的截圖解析量已達上限\n"
                        "明天就會自動重置，請明天再繼續！"
                    )
                ])
            elif quota["reason"] == "monthly_quota":
                # Calculate next month's first day for reset date
                now = datetime.now(timezone.utc)
                if now.month == 12:
                    reset_date = now.replace(year=now.year + 1, month=1, day=1)
                else:
                    reset_date = now.replace(month=now.month + 1, day=1)
                reset_str = reset_date.strftime("%-m/%-d")
                await push_message(line_user_id, [
                    build_error_message(
                        f"📊 本月已使用 {quota['monthly_used']}/{int(quota['monthly_limit'])} 張截圖額度\n"
                        f"額度已用完，{reset_str} 會自動重置，届時可再度使用！\n\n"
                        "💎 升級方案可獲得更多額度：\nsnappword.com/pricing"
                    )
                ])
            return

        # Download image from LINE
        image_bytes = await get_message_content(message_id)

        await _safe_log(
            user_id, "image_received",
            payload={"message_id": message_id},
        )

        # Upload to Supabase Storage
        image_url = await asyncio.to_thread(upload_image, image_bytes, user_id)

        # AI analysis — with explicit timeout so we never hang forever
        try:
            parse_result, metadata = await asyncio.wait_for(
                asyncio.to_thread(analyze_screenshot, image_bytes),
                timeout=GEMINI_TIMEOUT,
            )
        except asyncio.TimeoutError:
            logger.error("Gemini API timed out for user %s", user_id)
            await _safe_log(user_id, "parse_fail", payload={"error": "Gemini timeout"})
            await _safe_push(line_user_id, [
                build_error_message(
                    "AI 分析超時了 ⏱\n請稍後重試一次！"
                )
            ])
            await _notify_admin_error(display_name or line_user_id, "Gemini API timeout")
            return

        await _safe_log(
            user_id, "gemini_call",
            latency_ms=metadata.get("latency_ms"),
            token_count=metadata.get("token_count"),
            payload={"word_count": len(parse_result.words)},
        )

        if not parse_result.words:
            await push_message(line_user_id, [
                build_error_message(
                    "我在這張截圖中沒有發現你在學習的單字 🤔\n"
                    "試試傳送 Duolingo、Netflix 字幕或文章的截圖！"
                )
            ])
            return

        # Save to database
        saved_cards = await asyncio.to_thread(
            save_vocab_cards, user_id, image_url, parse_result
        )

        await _safe_log(
            user_id, "parse_success",
            payload={
                "cards_saved": len(saved_cards),
                "source_app": parse_result.source_app,
            },
        )

        # Build and send Flex Message
        word_card_pairs = [
            (w, card["id"])
            for w, card in zip(parse_result.words, saved_cards)
        ]
        flex_msg = build_vocab_carousel(word_card_pairs, parse_result.source_app)
        await push_message(line_user_id, [flex_msg])

    except Exception as e:
        logger.exception("Failed to process screenshot for user %s", user_id)
        await _safe_log(user_id, "parse_fail", payload={"error": str(e)})
        await _safe_push(line_user_id, [
            build_error_message(
                "處理截圖時發生錯誤 😅\n請稍後重試，或換一張更清晰的截圖。"
            )
        ])
        await _notify_admin_error(display_name or line_user_id, str(e))


# ── Text Commands ────────────────────────────────────────────────────


async def _handle_text_command(reply_token: str, line_user_id: str, text: str) -> None:
    """Handle text commands like help, upgrade, etc."""
    lower = text.lower()

    if lower in ("help", "幫助", "說明"):
        await reply_text(
            reply_token,
            "📸 使用方式：\n\n"
            "1. 在任何 App 截圖（Duolingo、Netflix、文章...）\n"
            "2. 把截圖傳給我\n"
            "3. 幾秒內收到精美單字卡！\n\n"
            "就是這麼簡單 ✨",
        )
    elif lower in ("升級", "upgrade"):
        profile = await get_user_profile(line_user_id)
        display_name = profile["displayName"] if profile else None
        user = await asyncio.to_thread(get_or_create_user, line_user_id, display_name)
        await asyncio.to_thread(create_upgrade_request, user["id"])
        await reply_text(
            reply_token,
            "好的！請傳送付款成功的截圖，我會轉給團隊處理 🧾\n\n"
            "💡 提醒：最少需支付 1 個月費用，也可一次支付多個月喔！",
        )
    else:
        await reply_text(
            reply_token,
            "📸 請傳送截圖給我，我來幫你提取單字！\n"
            "輸入「幫助」查看使用說明。",
        )


# ── Postback ─────────────────────────────────────────────────────────


async def _handle_postback(event: dict) -> None:
    """Handle postback actions from Flex Message buttons."""
    data_str = event.get("postback", {}).get("data", "")
    reply_token = event.get("replyToken", "")
    source = event.get("source", {})
    line_user_id = source.get("userId")
    params = parse_qs(data_str)

    action = params.get("action", [""])[0]
    card_id = params.get("card_id", [""])[0]

    if not line_user_id or not card_id:
        return

    # Look up user to get user_id for ownership verification
    user = await asyncio.to_thread(get_or_create_user, line_user_id)
    user_id = user["id"]

    if action == "save" and card_id:
        updated = await asyncio.to_thread(
            update_card_status, card_id, user_id, ReviewStatus.LEARNING
        )
        if updated:
            await reply_text(reply_token, "✅ 已存入你的單字本！明天早上會推播複習提醒喔 📚")
        else:
            await reply_text(reply_token, "⚠️ 找不到這張單字卡")

    elif action == "skip" and card_id:
        await reply_text(reply_token, "⏭ 已跳過")
