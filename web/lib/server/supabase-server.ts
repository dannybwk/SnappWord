/**
 * Supabase server-side operations (uses service role key).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { GeminiParseResult, DbUser } from "./types";

const STORAGE_BUCKET = "user_screenshots";

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

/** Update review_status of a vocab card. */
export async function updateCardStatus(
  cardId: string,
  status: number
): Promise<void> {
  const sb = getClient();
  await sb
    .from("vocab_cards")
    .update({
      review_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId);
}

// ── Quota & Rate Limiting ──

/** Tier limits: screenshots per month. */
const MONTHLY_LIMITS: Record<string, number> = {
  free: 30,
  sprout: 200,
  bloom: Infinity,
};

/** Per-minute cooldown (seconds between screenshots). */
const MIN_INTERVAL_SECONDS: Record<string, number> = {
  free: 10,
  sprout: 5,
  bloom: 3,
};

function getUserTier(user: DbUser): string {
  // TODO: When Stripe is integrated, check subscription status.
  // For now, is_premium = true maps to "sprout" tier.
  if (!user.is_premium) return "free";
  return "sprout";
}

export interface QuotaCheck {
  allowed: boolean;
  reason?: "rate_limit" | "monthly_quota";
  tier: string;
  monthlyUsed: number;
  monthlyLimit: number;
}

/** Check if user can send another screenshot (rate limit + monthly quota). */
export async function checkQuota(user: DbUser): Promise<QuotaCheck> {
  const sb = getClient();
  const tier = getUserTier(user);
  const monthlyLimit = MONTHLY_LIMITS[tier] ?? MONTHLY_LIMITS.free;
  const cooldownSeconds = MIN_INTERVAL_SECONDS[tier] ?? MIN_INTERVAL_SECONDS.free;

  // 1. Rate limit: check last image_received timestamp
  const { data: recentLogs } = await sb
    .from("api_logs")
    .select("created_at")
    .eq("user_id", user.id)
    .eq("event_type", "image_received")
    .order("created_at", { ascending: false })
    .limit(1);

  if (recentLogs && recentLogs.length > 0) {
    const lastTime = new Date(recentLogs[0].created_at).getTime();
    const elapsed = (Date.now() - lastTime) / 1000;
    if (elapsed < cooldownSeconds) {
      return {
        allowed: false,
        reason: "rate_limit",
        tier,
        monthlyUsed: 0,
        monthlyLimit,
      };
    }
  }

  // 2. Monthly quota: count image_received events this month
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
