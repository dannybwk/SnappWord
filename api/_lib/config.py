"""Environment configuration for SnappWord."""

import os

# LINE Messaging API
LINE_CHANNEL_SECRET: str = os.environ.get("LINE_CHANNEL_SECRET", "").strip()
LINE_CHANNEL_ACCESS_TOKEN: str = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "").strip()

# Supabase
SUPABASE_URL: str = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_SERVICE_KEY: str = os.environ.get("SUPABASE_SERVICE_KEY", "").strip()

# Google Gemini
GEMINI_API_KEY: str = os.environ.get("GEMINI_API_KEY", "").strip()

# Admin notification
ADMIN_LINE_USER_ID: str = os.environ.get("ADMIN_LINE_USER_ID", "").strip()

# Storage
STORAGE_BUCKET = "user_screenshots"

# Brand
BRAND_COLOR = "#06C755"
BRAND_NAME = "SnappWord 截詞"

# Startup validation (skip during tests)
import sys as _sys

if "pytest" not in _sys.modules:
    _REQUIRED = {
        "LINE_CHANNEL_SECRET": LINE_CHANNEL_SECRET,
        "LINE_CHANNEL_ACCESS_TOKEN": LINE_CHANNEL_ACCESS_TOKEN,
        "SUPABASE_URL": SUPABASE_URL,
        "SUPABASE_SERVICE_KEY": SUPABASE_SERVICE_KEY,
        "GEMINI_API_KEY": GEMINI_API_KEY,
    }
    _missing = [k for k, v in _REQUIRED.items() if not v]
    if _missing:
        raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")
