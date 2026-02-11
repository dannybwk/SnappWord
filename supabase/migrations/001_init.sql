-- SnappWord 截詞 - Initial Schema
-- Phase 1: MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    line_user_id TEXT NOT NULL UNIQUE,
    display_name TEXT,
    is_premium BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_line_user_id ON users(line_user_id);

-- ============================================
-- Table: vocab_cards
-- ============================================
CREATE TABLE vocab_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    translation TEXT,
    pronunciation TEXT,
    original_sentence TEXT,
    context_trans TEXT,
    ai_example TEXT,
    image_url TEXT,
    source_app TEXT DEFAULT 'General',
    target_lang TEXT DEFAULT 'en',
    tags TEXT[] DEFAULT '{}',
    review_status INT NOT NULL DEFAULT 0,  -- 0: New, 1: Learning, 2: Mastered
    next_review_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 day',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_vocab_cards_user_id ON vocab_cards(user_id);
CREATE INDEX idx_vocab_cards_review ON vocab_cards(user_id, review_status, next_review_at);

-- ============================================
-- Table: api_logs (operational monitoring)
-- ============================================
CREATE TABLE api_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type TEXT NOT NULL,  -- 'image_received', 'gemini_call', 'parse_success', 'parse_fail'
    latency_ms INT,
    token_count INT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Storage Bucket (run via Supabase Dashboard)
-- ============================================
-- Bucket name: user_screenshots
-- Public: false
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_cards ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by our backend)
CREATE POLICY "Service role full access on users"
    ON users FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

CREATE POLICY "Service role full access on vocab_cards"
    ON vocab_cards FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);
