-- Phase 1+2: Streak tracking, word lists, and list assignment

-- Streak tracking on users
ALTER TABLE users
  ADD COLUMN current_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN longest_streak INT NOT NULL DEFAULT 0,
  ADD COLUMN last_review_date DATE;

-- Word lists (manual user-created folders)
CREATE TABLE word_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '📁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_word_lists_user ON word_lists(user_id);

-- Optional list assignment on cards
ALTER TABLE vocab_cards
  ADD COLUMN list_id UUID REFERENCES word_lists(id) ON DELETE SET NULL;
CREATE INDEX idx_vocab_cards_list ON vocab_cards(list_id);
