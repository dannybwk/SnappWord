"""Tests for Flex Message template builders."""

from api._lib.flex_messages import (
    build_vocab_card,
    build_vocab_carousel,
    build_error_message,
)
from api._lib.models import ParsedWord


def _sample_word() -> ParsedWord:
    return ParsedWord(
        word="ephemeral",
        pronunciation="/ɪˈfem.ər.əl/",
        translation="短暫的",
        context_sentence="The beauty of cherry blossoms is ephemeral.",
        context_trans="櫻花之美是短暫的。",
        tags=["Adjective", "Advanced"],
        ai_example="Fame can be ephemeral.",
    )


def test_build_vocab_card_structure():
    card = build_vocab_card(_sample_word(), "card-123", "Duolingo")
    assert card["type"] == "bubble"
    assert card["header"]["contents"][0]["text"] == "📖 ephemeral"
    assert card["footer"]["contents"][0]["action"]["data"] == "action=save&card_id=card-123"


def test_build_single_card_carousel():
    word = _sample_word()
    msg = build_vocab_carousel([(word, "id-1")], "Duolingo")
    assert msg["type"] == "flex"
    assert msg["contents"]["type"] == "bubble"  # single card, not carousel


def test_build_multi_card_carousel():
    words = [(_sample_word(), f"id-{i}") for i in range(3)]
    msg = build_vocab_carousel(words, "Netflix")
    assert msg["contents"]["type"] == "carousel"
    assert len(msg["contents"]["contents"]) == 3


def test_build_error_message():
    msg = build_error_message("Something went wrong")
    assert msg["type"] == "flex"
    assert "Something went wrong" in msg["altText"]


def test_card_without_optional_fields():
    word = ParsedWord(word="hola", translation="你好")
    card = build_vocab_card(word, "card-456")
    assert card["type"] == "bubble"
    assert card["header"]["contents"][0]["text"] == "📖 hola"
