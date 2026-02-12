// ── Gemini AI Response Types ──

export interface ParsedWord {
  word: string;
  pronunciation: string;
  translation: string;
  context_sentence: string;
  context_trans: string;
  tags: string[];
  ai_example: string;
}

export interface GeminiParseResult {
  source_app: string;
  target_lang: string;
  source_lang: string;
  words: ParsedWord[];
}

// ── Database Types ──

export interface DbUser {
  id: string;
  line_user_id: string;
  display_name: string | null;
  is_premium: boolean;
  stripe_customer_id: string | null;
  subscription_tier: string; // 'free' | 'sprout' | 'bloom'
  created_at: string;
}

export interface DbVocabCard {
  id: string;
  user_id: string;
  word: string;
  translation: string | null;
  pronunciation: string | null;
  original_sentence: string | null;
  context_trans: string | null;
  ai_example: string | null;
  image_url: string | null;
  source_app: string;
  target_lang: string;
  tags: string[];
  review_status: number;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── LINE Webhook Types ──

export interface LineEvent {
  type: string;
  replyToken?: string;
  source: { userId: string; type: string };
  message?: {
    type: string;
    id: string;
    text?: string;
  };
  postback?: {
    data: string;
  };
}
