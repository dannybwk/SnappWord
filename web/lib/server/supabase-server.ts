/**
 * Supabase server-side operations (uses service role key).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { GeminiParseResult, DbUser } from "./types";

const STORAGE_BUCKET = "user_screenshots";

/**
 * SRS interval progression (in days).
 * Each correct answer advances to the next interval.
 * Incorrect answer resets to the first interval.
 */
const SRS_INTERVALS = [1, 3, 7, 14, 30];

function getClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

/** Find existing user or create a new one. */
export async function getOrCreateUser(
  lineUserId: string,
  displayName?: string
): Promise<DbUser> {
  const sb = getClient();

  const { data: existing } = await sb
    .from("users")
    .select("*")
    .eq("line_user_id", lineUserId)
    .single();

  if (existing) return existing as DbUser;

  const { data: created, error } = await sb
    .from("users")
    .insert({ line_user_id: lineUserId, display_name: displayName || "" })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  return created as DbUser;
}

/** Upload screenshot to Supabase Storage. Returns public URL. */
export async function uploadImage(
  imageBytes: Buffer,
  userId: string
): Promise<string> {
  const sb = getClient();
  const filename = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(filename, imageBytes, { contentType: "image/jpeg" });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = sb.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/** Save parsed words as vocab_cards. Returns inserted records. */
export async function saveVocabCards(
  userId: string,
  imageUrl: string,
  parseResult: GeminiParseResult
): Promise<Record<string, unknown>[]> {
  if (parseResult.words.length === 0) return [];

  const sb = getClient();
  const rows = parseResult.words.map((w) => ({
    user_id: userId,
    word: w.word,
    translation: w.translation,
    pronunciation: w.pronunciation,
    original_sentence: w.context_sentence,
    context_trans: w.context_trans,
    ai_example: w.ai_example,
    image_url: imageUrl,
    source_app: parseResult.source_app,
    target_lang: parseResult.target_lang,
    tags: w.tags,
    review_status: 0,
  }));

  const { data, error } = await sb
    .from("vocab_cards")
    .insert(rows)
    .select();

  if (error) throw new Error(`Save cards failed: ${error.message}`);
  return data || [];
}

/** Update review_status of a vocab card. Sets next_review_at for SRS scheduling. */
export async function updateCardStatus(
  cardId: string,
  status: number
): Promise<void> {
  const sb = getClient();
  const now = new Date();
  const update: Record<string, unknown> = {
    review_status: status,
    updated_at: now.toISOString(),
  };
  // When marking as Learning (1), schedule the first SRS interval
  if (status === 1) {
    update.next_review_at = new Date(now.getTime() + SRS_INTERVALS[0] * 86400000).toISOString();
  }
  await sb.from("vocab_cards").update(update).eq("id", cardId);
}

// ── Quota & Rate Limiting ──

/** Tier limits: screenshots per month. */
const MONTHLY_LIMITS: Record<string, number> = {
  free: 30,
  sprout: 200,
  bloom: Infinity,
};


/** Daily caps (anti-abuse for unlimited tiers). */
const DAILY_LIMITS: Record<string, number> = {
  free: Infinity,   // already capped by monthly quota
  sprout: Infinity,  // already capped by monthly quota
  bloom: 500,
};

function getUserTier(user: DbUser): string {
  // Check subscription_tier from Stripe integration
  if (user.subscription_tier && user.subscription_tier !== "free") {
    return user.subscription_tier;
  }
  // Legacy fallback: is_premium flag
  if (user.is_premium) return "sprout";
  return "free";
}

/** Update a user's subscription tier. */
export async function updateUserTier(
  userId: string,
  tier: string,
  stripeCustomerId?: string
): Promise<void> {
  const sb = getClient();
  const update: Record<string, unknown> = {
    subscription_tier: tier,
    is_premium: tier !== "free",
  };
  if (stripeCustomerId) {
    update.stripe_customer_id = stripeCustomerId;
  }
  await sb.from("users").update(update).eq("id", userId);
}

/** Find user by Stripe customer ID. */
export async function getUserByStripeCustomerId(
  stripeCustomerId: string
): Promise<DbUser | null> {
  const sb = getClient();
  const { data } = await sb
    .from("users")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  return data as DbUser | null;
}

/** Find user by DB ID. */
export async function getUserById(userId: string): Promise<DbUser | null> {
  const sb = getClient();
  const { data } = await sb.from("users").select("*").eq("id", userId).single();
  return data as DbUser | null;
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: "monthly_quota" | "daily_quota";
  tier: string;
  monthlyUsed: number;
  monthlyLimit: number;
}

/** Check if user can send another screenshot (daily + monthly quota). */
export async function checkQuota(user: DbUser): Promise<QuotaCheck> {
  const sb = getClient();
  const tier = getUserTier(user);
  const monthlyLimit = MONTHLY_LIMITS[tier] ?? MONTHLY_LIMITS.free;

  // 1. Daily quota: anti-abuse cap for unlimited tiers
  const dailyLimit = DAILY_LIMITS[tier] ?? Infinity;
  if (dailyLimit !== Infinity) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const { count: dailyCount } = await sb
      .from("api_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "image_received")
      .gte("created_at", dayStart.toISOString());

    if ((dailyCount ?? 0) >= dailyLimit) {
      return {
        allowed: false,
        reason: "daily_quota",
        tier,
        monthlyUsed: 0,
        monthlyLimit,
      };
    }
  }

  // 3. Monthly quota: count image_received events this month
  if (monthlyLimit !== Infinity) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { count } = await sb
      .from("api_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("event_type", "image_received")
      .gte("created_at", monthStart);

    const used = count ?? 0;
    if (used >= monthlyLimit) {
      return {
        allowed: false,
        reason: "monthly_quota",
        tier,
        monthlyUsed: used,
        monthlyLimit,
      };
    }

    return { allowed: true, tier, monthlyUsed: used, monthlyLimit };
  }

  return { allowed: true, tier, monthlyUsed: 0, monthlyLimit };
}

/** Get current month usage for dashboard display. */
export async function getMonthlyUsage(userId: string): Promise<{ used: number }> {
  const sb = getClient();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await sb
    .from("api_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "image_received")
    .gte("created_at", monthStart);

  return { used: count ?? 0 };
}

// ── SRS Spaced Repetition ──

/** Estimate the current SRS interval from DB timestamps. */
function estimateCurrentInterval(nextReviewAt: string | null, updatedAt: string): number {
  if (!nextReviewAt) return 0;
  const diff = new Date(nextReviewAt).getTime() - new Date(updatedAt).getTime();
  const days = Math.round(diff / 86400000);
  return Math.max(days, 0);
}

/** Advance a card's SRS after a correct answer. */
export async function advanceCardSRS(cardId: string): Promise<void> {
  const sb = getClient();

  const { data: card } = await sb
    .from("vocab_cards")
    .select("review_status, next_review_at, updated_at")
    .eq("id", cardId)
    .single();

  if (!card) return;

  const now = new Date();

  if (card.review_status === 0) {
    // New → Learning, first interval (1 day)
    await sb.from("vocab_cards").update({
      review_status: 1,
      next_review_at: new Date(now.getTime() + SRS_INTERVALS[0] * 86400000).toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", cardId);
  } else {
    // Learning or Mastered → advance to next interval
    const currentInterval = estimateCurrentInterval(card.next_review_at, card.updated_at);
    const currentIdx = SRS_INTERVALS.findIndex((i) => i >= currentInterval);
    const nextIdx = Math.min(
      (currentIdx === -1 ? 0 : currentIdx) + 1,
      SRS_INTERVALS.length - 1
    );
    const nextInterval = SRS_INTERVALS[nextIdx];
    const mastered = nextIdx === SRS_INTERVALS.length - 1;

    await sb.from("vocab_cards").update({
      review_status: mastered ? 2 : 1,
      next_review_at: new Date(now.getTime() + nextInterval * 86400000).toISOString(),
      updated_at: now.toISOString(),
    }).eq("id", cardId);
  }
}

/** Reset a card's SRS after an incorrect answer. */
export async function resetCardSRS(cardId: string): Promise<void> {
  const sb = getClient();
  const now = new Date();

  await sb.from("vocab_cards").update({
    review_status: 1,
    next_review_at: new Date(now.getTime() + SRS_INTERVALS[0] * 86400000).toISOString(),
    updated_at: now.toISOString(),
  }).eq("id", cardId);
}

/** Get cards due for review (new cards + past next_review_at). */
export async function getDueCards(userId: string): Promise<Record<string, unknown>[]> {
  const sb = getClient();
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from("vocab_cards")
    .select("*")
    .eq("user_id", userId)
    .or(`review_status.eq.0,next_review_at.lte.${now}`)
    .order("review_status", { ascending: true })
    .limit(20);

  if (error) {
    console.error("getDueCards error:", error);
    return [];
  }

  return data || [];
}

/** Get all card translations for a user (used as quiz distractors). */
export async function getAllCardTranslations(
  userId: string
): Promise<{ id: string; translation: string; target_lang: string }[]> {
  const sb = getClient();

  const { data } = await sb
    .from("vocab_cards")
    .select("id, translation, target_lang")
    .eq("user_id", userId)
    .not("translation", "is", null);

  return (data || []) as { id: string; translation: string; target_lang: string }[];
}

// ── Logging ──

/** Write an operational log entry. */
export async function logEvent(
  userId: string | null,
  eventType: string,
  meta?: {
    latencyMs?: number;
    tokenCount?: number | null;
    payload?: Record<string, unknown>;
  }
): Promise<void> {
  const sb = getClient();
  await sb.from("api_logs").insert({
    user_id: userId,
    event_type: eventType,
    latency_ms: meta?.latencyMs ?? null,
    token_count: meta?.tokenCount ?? null,
    payload: meta?.payload ?? null,
  });
}
