"""Gemini 1.5 Flash multimodal analysis for screenshots."""

from __future__ import annotations

import json
import logging
import re
import time

from google import genai
from google.genai import types
from pydantic import ValidationError

from . import config
from .models import GeminiParseResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are SnappWord, a language learning assistant that analyzes screenshots.

TASK: Extract vocabulary words from the screenshot image.

RULES:
1. IGNORE all UI chrome: status bar, battery, time, navigation bars, ads.
2. EXTRACT vocabulary from ANY of these sources:
   - Language learning apps (Duolingo, Busuu, HelloTalk, etc.)
   - Video subtitles (Netflix, YouTube, Disney+, etc.)
   - Social media language teaching posts (Instagram, Facebook, TikTok, Twitter)
   - Educational images with vocabulary explanations
   - Articles, news, books, or any text with foreign language words
   - Vocabulary matching exercises, flashcards, word lists
   - Handwritten notes with vocabulary
   - ANY image where a user is clearly trying to learn a word or phrase
3. Identify the "target language" (what the user is learning) and "source language" (usually zh-TW).
4. For each learnable word or phrase, extract structured data.
5. If the screenshot contains exercise context (e.g., a sentence), include it.
6. If no example sentence is visible, generate ONE natural example sentence.
7. Detect the source app from visual cues. Use "Social Media" for social media posts.
8. Be GENEROUS in extracting words — if there's any word the user might want to learn, include it.
9. For images with vocabulary explanations (e.g., "X 用英語怎麼說？"), extract the word being taught.

SUPPORTED LANGUAGES: en, ja, ko, es, fr, de

OUTPUT FORMAT (strict JSON):
{
  "source_app": "Duolingo" | "Netflix" | "YouTube" | "Social Media" | "General",
  "target_lang": "en" | "ja" | "ko" | "es" | "fr" | "de",
  "source_lang": "zh-TW",
  "words": [
    {
      "word": "the vocabulary word",
      "pronunciation": "IPA or romaji or reading",
      "translation": "Chinese translation",
      "context_sentence": "original sentence from screenshot (if any)",
      "context_trans": "Chinese translation of the sentence",
      "tags": ["Part of Speech", "Topic"],
      "ai_example": "AI-generated example sentence (always provide one)"
    }
  ]
}

If the image truly contains NO text or language content at all (e.g., a pure photo with no text), return:
{"source_app": "General", "target_lang": "en", "source_lang": "zh-TW", "words": []}
"""

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _get_client() -> genai.Client:
    return genai.Client(api_key=config.GEMINI_API_KEY)


def analyze_screenshot(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
) -> tuple[GeminiParseResult, dict]:
    """
    Send screenshot to Gemini for analysis.

    Returns:
        (parsed_result, metadata) where metadata contains latency_ms and token_count
    """
    if mime_type not in ALLOWED_MIME_TYPES:
        mime_type = "image/jpeg"

    client = _get_client()

    start = time.time()
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[
            types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
            "Analyze this screenshot and extract vocabulary words. Output strict JSON only.",
        ],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            temperature=0.2,
            max_output_tokens=2048,
        ),
    )
    latency_ms = int((time.time() - start) * 1000)

    metadata: dict = {
        "latency_ms": latency_ms,
        "token_count": getattr(response.usage_metadata, "total_token_count", 0),
    }

    raw_text = response.text
    parsed = _parse_response(raw_text)
    return parsed, metadata


def _parse_response(raw: str) -> GeminiParseResult:
    """Parse Gemini response text into structured result with fallback."""
    # Attempt 1: direct parse
    try:
        data = json.loads(raw)
        return GeminiParseResult(**data)
    except (json.JSONDecodeError, ValidationError):
        logger.debug("Direct JSON parse failed, trying fallback")

    # Attempt 2: extract JSON block from markdown fences
    match = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", raw)
    if match:
        try:
            data = json.loads(match.group(1))
            return GeminiParseResult(**data)
        except (json.JSONDecodeError, ValidationError):
            logger.debug("Markdown fence parse failed, trying fallback")

    # Attempt 3: find first { ... } block (greedy to handle nested objects)
    match = re.search(r"\{[\s\S]*\}", raw)
    if match:
        try:
            data = json.loads(match.group(0))
            return GeminiParseResult(**data)
        except (json.JSONDecodeError, ValidationError):
            logger.debug("Regex JSON extract failed")

    # All attempts failed
    logger.warning("All Gemini response parsing attempts failed")
    return GeminiParseResult(words=[])
