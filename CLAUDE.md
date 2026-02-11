# SnappWord 截詞 — Development Guide

## Project Overview
SnappWord is a LINE Bot that converts language-learning screenshots into structured vocabulary cards using AI (Gemini 1.5 Flash). Users send screenshots from apps like Duolingo, Netflix, or any reading material, and receive beautiful Flex Message flashcards in return.

## Tech Stack
- **Runtime:** Python 3.11+ on Vercel Serverless Functions
- **Framework:** FastAPI (ASGI)
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (Bucket: `user_screenshots`)
- **AI Engine:** Google Gemini 1.5 Flash (Multimodal)
- **Messaging:** LINE Messaging API (Webhook + Flex Message)

## Project Structure
```
SnappWord/
├── CLAUDE.md                  # This file
├── api/                       # Vercel Serverless Functions
│   ├── webhook.py             # LINE Webhook endpoint (POST /api/webhook)
│   └── _lib/                  # Internal modules (not exposed as routes)
│       ├── config.py          # Environment variables & constants
│       ├── line_client.py     # LINE Messaging API wrapper
│       ├── gemini_client.py   # Gemini multimodal API wrapper
│       ├── supabase_client.py # Supabase DB & Storage operations
│       ├── flex_messages.py   # LINE Flex Message template builders
│       └── models.py          # Pydantic data models
├── supabase/migrations/       # SQL migration files
├── tests/                     # Test suite
├── vercel.json                # Vercel deployment config
├── requirements.txt           # Python dependencies
└── .env.example               # Environment variable template
```

## Architecture Decisions

### Async Reply Pattern
LINE Webhook has a response timeout. Our pattern:
1. Webhook receives image → immediately reply with "Analyzing..." message using Reply Token
2. Process image asynchronously (upload → Gemini → parse → store)
3. Send result via **Push Message API** after processing completes

### Gemini Output Validation
- Use `response_mime_type: "application/json"` for structured output
- Validate with Pydantic models; all fields Optional with defaults
- Fallback: regex extract JSON from response → re-validate → user-friendly error

### Flex Message Design
- Brand color: `#06C755` (mint green)
- No raw images in cards (text only, extracted by AI)
- Carousel for multi-word screenshots (max 5 bubbles)
- Postback actions for button interactions

## Coding Conventions
- Use type hints on all function signatures
- Use `async/await` for I/O operations
- Keep modules focused: one responsibility per file
- Error handling: catch at boundary, log details, return friendly messages
- All API keys via environment variables, never hardcoded

## Key API References
- LINE Messaging API: https://developers.line.biz/en/docs/messaging-api/
- Gemini API: https://ai.google.dev/docs
- Supabase Python: https://supabase.com/docs/reference/python/introduction

## Commands
- Deploy: `vercel --prod`
- Test: `python -m pytest tests/ -v`
- Local dev: `vercel dev`
