"""Tests for webhook event handling logic."""

from unittest.mock import patch, AsyncMock
from urllib.parse import parse_qs

from api._lib.line_client import verify_signature


def test_postback_data_parsing():
    """Test that postback data string can be correctly parsed."""
    data = "action=save&card_id=abc-123"
    params = parse_qs(data)
    assert params["action"][0] == "save"
    assert params["card_id"][0] == "abc-123"


def test_postback_skip_parsing():
    data = "action=skip&card_id=xyz-789"
    params = parse_qs(data)
    assert params["action"][0] == "skip"


def test_verify_signature_rejects_invalid():
    """Signature verification rejects mismatched signatures."""
    with patch("api._lib.line_client.config") as mock_config:
        mock_config.LINE_CHANNEL_SECRET = "test_secret"
        result = verify_signature(b"test body", "invalid_signature")
        assert result is False
