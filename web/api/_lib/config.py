"""Environment configuration for SnappWord."""

import os

# LINE Messaging API
LINE_CHANNEL_SECRET = os.environ.get("LINE_CHANNEL_SECRET", "")
LINE_CHANNEL_ACCESS_TOKEN = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN", "")

# Supabase
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Google Gemini
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Storage
STORAGE_BUCKET = "user_screenshots"

# Brand
BRAND_COLOR = "#06C755"
BRAND_NAME = "SnappWord 截詞"
