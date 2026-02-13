"""Pydantic data models for SnappWord."""

from __future__ import annotations

from datetime import datetime
from enum import IntEnum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


# --- Enums ---

class ReviewStatus(IntEnum):
    """Vocabulary card review status."""
    NEW = 0
    LEARNING = 1
    MASTERED = 2


# --- Gemini AI Response Models ---

class ParsedWord(BaseModel):
    """A single vocabulary word extracted by Gemini."""
    word: str
    pronunciation: str = ""
    translation: str = ""
    context_sentence: str = ""
    context_trans: str = ""
    tags: list[str] = Field(default_factory=list)
    ai_example: str = ""


class GeminiParseResult(BaseModel):
    """Complete Gemini analysis result for a screenshot."""
    source_app: str = "General"
    target_lang: str = "en"
    source_lang: str = "zh-TW"
    words: list[ParsedWord] = Field(default_factory=list)


# --- Database Models ---

class User(BaseModel):
    id: UUID
    line_user_id: str
    display_name: Optional[str] = None
    is_premium: bool = False
    subscription_tier: str = "free"
    created_at: Optional[datetime] = None


class VocabCard(BaseModel):
    id: UUID
    user_id: UUID
    word: str
    translation: Optional[str] = None
    pronunciation: Optional[str] = None
    original_sentence: Optional[str] = None
    context_trans: Optional[str] = None
    ai_example: Optional[str] = None
    image_url: Optional[str] = None
    source_app: str = "General"
    target_lang: str = "en"
    tags: list[str] = Field(default_factory=list)
    review_status: int = ReviewStatus.NEW
    next_review_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# --- Webhook Event Models ---

class PostbackData(BaseModel):
    """Parsed postback action data from Flex Message buttons."""
    action: str  # "save", "review", "skip"
    card_id: str
