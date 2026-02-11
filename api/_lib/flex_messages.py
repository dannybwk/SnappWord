"""LINE Flex Message template builders for vocab cards."""

from __future__ import annotations

from . import config
from .models import ParsedWord

BRAND_COLOR = config.BRAND_COLOR


def build_vocab_card(
    word: ParsedWord,
    card_id: str,
    source_app: str = "General",
) -> dict:
    """Build a single Flex Message bubble for a vocabulary word."""
    # Header: word + pronunciation
    header = {
        "type": "box",
        "layout": "vertical",
        "backgroundColor": BRAND_COLOR,
        "paddingAll": "16px",
        "contents": [
            {
                "type": "text",
                "text": f"📖 {word.word}",
                "color": "#FFFFFF",
                "size": "xl",
                "weight": "bold",
            },
            {
                "type": "text",
                "text": word.pronunciation or " ",
                "color": "#E0FFE0",
                "size": "sm",
                "margin": "xs",
            },
        ],
    }

    # Body: context sentence + translation + tags
    body_contents = []

    if word.context_sentence:
        body_contents.append({
            "type": "text",
            "text": word.context_sentence,
            "size": "md",
            "wrap": True,
            "color": "#333333",
        })

    body_contents.append({
        "type": "text",
        "text": f"🇹🇼 {word.translation}" if word.translation else " ",
        "size": "md",
        "wrap": True,
        "color": "#555555",
        "margin": "md",
    })

    if word.context_trans:
        body_contents.append({
            "type": "text",
            "text": word.context_trans,
            "size": "sm",
            "wrap": True,
            "color": "#888888",
            "margin": "sm",
        })

    if word.ai_example:
        body_contents.extend([
            {"type": "separator", "margin": "lg"},
            {
                "type": "text",
                "text": "💡 AI 補充例句",
                "size": "xs",
                "color": "#AAAAAA",
                "margin": "lg",
            },
            {
                "type": "text",
                "text": word.ai_example,
                "size": "sm",
                "wrap": True,
                "color": "#666666",
                "margin": "sm",
            },
        ])

    # Tags row
    tag_labels = [source_app] + word.tags[:2]
    tag_contents = []
    for tag in tag_labels:
        if tag:
            tag_contents.append({
                "type": "box",
                "layout": "horizontal",
                "backgroundColor": "#F0F0F0",
                "cornerRadius": "8px",
                "paddingAll": "4px",
                "paddingStart": "8px",
                "paddingEnd": "8px",
                "contents": [
                    {
                        "type": "text",
                        "text": f"🏷 {tag}",
                        "size": "xxs",
                        "color": "#888888",
                    }
                ],
            })
    if tag_contents:
        body_contents.append({
            "type": "box",
            "layout": "horizontal",
            "spacing": "sm",
            "margin": "lg",
            "contents": tag_contents,
        })

    body = {
        "type": "box",
        "layout": "vertical",
        "paddingAll": "16px",
        "spacing": "sm",
        "contents": body_contents,
    }

    # Footer: action buttons
    footer = {
        "type": "box",
        "layout": "horizontal",
        "spacing": "md",
        "paddingAll": "12px",
        "contents": [
            {
                "type": "button",
                "action": {
                    "type": "postback",
                    "label": "✅ 記住了",
                    "data": f"action=save&card_id={card_id}",
                    "displayText": "✅ 已存入單字本！",
                },
                "style": "primary",
                "color": BRAND_COLOR,
                "height": "sm",
            },
            {
                "type": "button",
                "action": {
                    "type": "postback",
                    "label": "❌ 跳過",
                    "data": f"action=skip&card_id={card_id}",
                    "displayText": "已跳過",
                },
                "style": "secondary",
                "height": "sm",
            },
        ],
    }

    return {
        "type": "bubble",
        "size": "kilo",
        "header": header,
        "body": body,
        "footer": footer,
    }


def build_vocab_carousel(
    words: list[tuple[ParsedWord, str]],
    source_app: str = "General",
) -> dict:
    """
    Build a Flex Message carousel for multiple words.

    Args:
        words: list of (ParsedWord, card_id) tuples
        source_app: detected source application
    """
    bubbles = [
        build_vocab_card(word, card_id, source_app)
        for word, card_id in words[:10]  # LINE max 12 bubbles
    ]

    if len(bubbles) == 1:
        return {
            "type": "flex",
            "altText": f"📖 單字卡：{words[0][0].word}",
            "contents": bubbles[0],
        }

    return {
        "type": "flex",
        "altText": f"📖 {len(bubbles)} 個單字卡",
        "contents": {
            "type": "carousel",
            "contents": bubbles,
        },
    }


def build_error_message(text: str) -> dict:
    """Build a simple error/info Flex Message."""
    return {
        "type": "flex",
        "altText": text,
        "contents": {
            "type": "bubble",
            "size": "kilo",
            "body": {
                "type": "box",
                "layout": "vertical",
                "paddingAll": "20px",
                "contents": [
                    {
                        "type": "text",
                        "text": "⚠️ SnappWord",
                        "weight": "bold",
                        "size": "md",
                        "color": BRAND_COLOR,
                    },
                    {
                        "type": "text",
                        "text": text,
                        "wrap": True,
                        "size": "sm",
                        "color": "#666666",
                        "margin": "md",
                    },
                ],
            },
        },
    }


def build_save_confirmation() -> dict:
    """Build confirmation message after saving a word."""
    return {
        "type": "text",
        "text": "✅ 已存入你的單字本！明天早上會推播複習提醒喔 📚",
    }
