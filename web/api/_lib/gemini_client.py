"""Gemini 1.5 Flash multimodal analysis for screenshots."""

from __future__ import annotations

import json
import re
import time

from google import genai
from google.genai import types

from . import config
from .models import GeminiParseResult

SYSTEM_PROMPT = """You are SnappWord, a language learning assistant that analyzes screenshots.

TASK: Extract vocabulary words from the screenshot image.

RULES:
1. IGNORE all UI chrome: status bar, battery, time, app buttons, ads, navigation elements.
2. FOCUS ONLY on language learning content: words, sentences, translations, exercises.
3. Identify the "target language" (what the user is learning) and "source language" (UI language, usually zh-TW).
4. For each learnable word or phrase, extract structured data.
5. If the screenshot contains exercise context (e.g., a sentence), include it.
6. If no example sentence is visible, generate ONE natural example sentence at the same difficulty level.
7. Detect the source app from visual cues (Duolingo green owl/UI, Netflix subtitle bar, etc.).

SUPPORTED LANGUAGES: en, ja, ko, es, fr, de

OUTPUT FORMAT (strict JSON):
{
  "source_app": "Duolingo" | "Netflix" | "YouTube" | "General",
  "target_lang": "en" | "ja" | "ko" | "es" | "fr" | "de",
  "source_lang": "zh-TW",
  "words": [
    {
      "word": "the vocabulary word",
      "pronunciation": "IPA or romaji or pinyin",
      "translation": "Chinese translation",
      "context_sentence": "original sentence from screenshot (if any)",
      "context_trans": "Chinese translation of the sentence",
      "tags": ["Part of Speech", "Topic"],
      "ai_example": "AI-generated example sentence (always provide one)"
    }
  ]
}

If the image contains NO recognizable language learning content, return:
{"source_app": "General", "target_lang": "en", "source_lang": "zh-TW", "words": []}
"""


def _get_client() -> genai.Client:
    return genai.Client(api_key=config.GEMINI_API_KEY)


def analyze_screenshot(image_bytes: bytes, mime_type: str = "image/jpeg") -> tuple[GeminiParseResult, dict]:
    """
    Send screenshot to Gemini for analysis.

    Returns:
        (parsed_result, metadata) where metadata contains latency_ms and token_count
    """
    client = _get_client()

    start = time.time()
    response = client.models.generate_content(
        model="gemini-1.5-flash",
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

    metadata = {
        "latency_ms": latency_ms,
        "token_count": getattr(response.usage_metadata, "total_token_count", None),
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
    except (json.JSONDecodeError, Exception):
        pass

    # Attempt 2: extract JSON block from markdown fences
    match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(1))
            return GeminiParseResult(**data)
        except (json.JSONDecodeError, Exception):
            pass

    # Attempt 3: find first { ... } block
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        try:
            data = json.loads(match.group(0))
            return GeminiParseResult(**data)
        except (json.JSONDecodeError, Exception):
            pass

    # All attempts failed
    return GeminiParseResult(words=[])
