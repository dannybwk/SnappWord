"""Tests for Gemini response parsing logic."""

from api._lib.gemini_client import _parse_response
from api._lib.models import GeminiParseResult


def test_parse_valid_json():
    raw = '{"source_app": "Duolingo", "target_lang": "en", "source_lang": "zh-TW", "words": [{"word": "ephemeral", "pronunciation": "/ɪˈfem.ər.əl/", "translation": "短暫的", "context_sentence": "Beauty is ephemeral.", "context_trans": "美是短暫的。", "tags": ["Adjective"], "ai_example": "Fame can be ephemeral."}]}'
    result = _parse_response(raw)
    assert isinstance(result, GeminiParseResult)
    assert len(result.words) == 1
    assert result.words[0].word == "ephemeral"
    assert result.source_app == "Duolingo"


def test_parse_json_in_markdown_fence():
    raw = '''Here is the result:
```json
{"source_app": "Netflix", "target_lang": "ja", "source_lang": "zh-TW", "words": [{"word": "桜", "pronunciation": "さくら", "translation": "櫻花", "context_sentence": "", "context_trans": "", "tags": ["Noun"], "ai_example": "桜が咲きました。"}]}
```
'''
    result = _parse_response(raw)
    assert len(result.words) == 1
    assert result.words[0].word == "桜"
    assert result.target_lang == "ja"


def test_parse_garbage_returns_empty():
    raw = "I cannot process this image."
    result = _parse_response(raw)
    assert isinstance(result, GeminiParseResult)
    assert len(result.words) == 0


def test_parse_partial_fields():
    raw = '{"words": [{"word": "hola"}]}'
    result = _parse_response(raw)
    assert len(result.words) == 1
    assert result.words[0].word == "hola"
    assert result.words[0].translation == ""
    assert result.source_app == "General"


def test_parse_multiple_words():
    raw = '{"source_app": "Duolingo", "target_lang": "es", "source_lang": "zh-TW", "words": [{"word": "gato", "translation": "貓"}, {"word": "perro", "translation": "狗"}, {"word": "casa", "translation": "房子"}]}'
    result = _parse_response(raw)
    assert len(result.words) == 3
    assert result.words[2].word == "casa"
