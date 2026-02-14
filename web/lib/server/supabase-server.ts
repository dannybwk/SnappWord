/**
 * Supabase server-side operations (uses service role key).
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { GeminiParseResult, DbUser, DbWordList } from "./types";

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

  if (existing) {
    // Backfill display name if missing
    if (displayName && !existing.display_name) {
      await sb
        .from("users")
        .update({ display_name: displayName })
        .eq("id", existing.id);
      existing.display_name = displayName;
    }
    return existing as DbUser;
  }

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

/** Update review_status with ownership verification. Returns true if card was updated. */
export async function updateCardStatusWithOwner(
  cardId: string,
  userId: string,
  status: number
): Promise<boolean> {
  const sb = getClient();
  const now = new Date();
  const update: Record<string, unknown> = {
    review_status: status,
    updated_at: now.toISOString(),
  };
  if (status === 1) {
    update.next_review_at = new Date(now.getTime() + SRS_INTERVALS[0] * 86400000).toISOString();
  }
  const { data } = await sb
    .from("vocab_cards")
    .update(update)
    .eq("id", cardId)
    .eq("user_id", userId)
    .select("id");
  return (data?.length ?? 0) > 0;
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

export function getUserTier(user: DbUser): string {
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

// ── Upgrade Requests ──

export interface UpgradeRequest {
  id: string;
  user_id: string;
  payment_image_url: string | null;
  status: string;
  approved_tier: string | null;
  months_paid: number;
  created_at: string;
  reviewed_at: string | null;
}

/** Create a new upgrade request in waiting_image state. */
export async function createUpgradeRequest(userId: string): Promise<UpgradeRequest> {
  const sb = getClient();
  const { data, error } = await sb
    .from("upgrade_requests")
    .insert({ user_id: userId, status: "waiting_image" })
    .select()
    .single();
  if (error) throw new Error(`Failed to create upgrade request: ${error.message}`);
  return data as UpgradeRequest;
}

/** Get a recent waiting_image upgrade request (within 10 minutes). */
export async function getPendingUpgradeRequest(
  userId: string
): Promise<UpgradeRequest | null> {
  const sb = getClient();
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data } = await sb
    .from("upgrade_requests")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "waiting_image")
    .gte("created_at", tenMinAgo)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (data as UpgradeRequest) || null;
}

/** Complete an upgrade request: set image URL and status to pending. */
export async function completeUpgradeRequest(
  requestId: string,
  imageUrl: string
): Promise<void> {
  const sb = getClient();
  await sb
    .from("upgrade_requests")
    .update({ status: "pending", payment_image_url: imageUrl })
    .eq("id", requestId);
}

/** List upgrade requests (for admin). Optional status filter. */
export async function getUpgradeRequests(
  status?: string
): Promise<(UpgradeRequest & { users: { display_name: string; subscription_tier: string | null; subscription_expires_at: string | null } })[]> {
  const sb = getClient();
  let query = sb
    .from("upgrade_requests")
    .select("*, users(display_name, subscription_tier, subscription_expires_at)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list upgrade requests: ${error.message}`);
  return data || [];
}

/** Admin review: approve or reject an upgrade request. */
export async function reviewUpgradeRequest(
  requestId: string,
  approved: boolean,
  tier?: string,
  months?: number
): Promise<void> {
  const sb = getClient();
  const now = new Date();
  const nowIso = now.toISOString();

  if (approved) {
    const paidMonths = months || 1;

    // Get user_id + current expiry from the request
    const { data: req } = await sb
      .from("upgrade_requests")
      .select("user_id")
      .eq("id", requestId)
      .single();

    if (!req) throw new Error("Upgrade request not found");

    // Calculate expiry: extend from current expiry if still active, otherwise from now
    const { data: user } = await sb
      .from("users")
      .select("subscription_expires_at")
      .eq("id", req.user_id)
      .single();

    const currentExpiry = user?.subscription_expires_at
      ? new Date(user.subscription_expires_at)
      : null;
    const base = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(base);
    expiresAt.setMonth(expiresAt.getMonth() + paidMonths);

    // Update request status
    await sb
      .from("upgrade_requests")
      .update({
        status: "approved",
        approved_tier: tier || "sprout",
        months_paid: paidMonths,
        reviewed_at: nowIso,
      })
      .eq("id", requestId);

    // Update user tier + expiry
    await sb
      .from("users")
      .update({
        subscription_tier: tier || "sprout",
        is_premium: true,
        subscription_expires_at: expiresAt.toISOString(),
      })
      .eq("id", req.user_id);
  } else {
    await sb
      .from("upgrade_requests")
      .update({ status: "rejected", reviewed_at: nowIso })
      .eq("id", requestId);
  }
}

/** Get users whose subscription expires in exactly N days. */
export async function getUsersExpiringIn(
  days: number
): Promise<{ id: string; line_user_id: string; display_name: string | null; subscription_tier: string; subscription_expires_at: string }[]> {
  const sb = getClient();
  const target = new Date();
  target.setDate(target.getDate() + days);
  const dayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).toISOString();
  const dayEnd = new Date(target.getFullYear(), target.getMonth(), target.getDate() + 1).toISOString();

  const { data } = await sb
    .from("users")
    .select("id, line_user_id, display_name, subscription_tier, subscription_expires_at")
    .gte("subscription_expires_at", dayStart)
    .lt("subscription_expires_at", dayEnd)
    .neq("subscription_tier", "free");

  return (data || []) as { id: string; line_user_id: string; display_name: string | null; subscription_tier: string; subscription_expires_at: string }[];
}

// ── Flashcard Review ──

/** Daily review limits per tier. */
const FLASHCARD_DAILY_LIMITS: Record<string, number> = {
  free: 10,
  sprout: Infinity,
  bloom: Infinity,
};

/** Get flashcard deck for review with remaining count and streak. */
export async function getFlashcardDeck(
  userId: string,
  tier: string
): Promise<{
  cards: Record<string, unknown>[];
  remaining: number;
  limitReached: boolean;
  streak: { current_streak: number; longest_streak: number };
}> {
  const sb = getClient();
  const cards = await getDueCards(userId);

  const dailyLimit = FLASHCARD_DAILY_LIMITS[tier] ?? FLASHCARD_DAILY_LIMITS.free;

  let remaining = Infinity;
  let limitReached = false;

  if (dailyLimit !== Infinity) {
    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const { count } = await sb
      .from("api_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("event_type", "flashcard_review")
      .gte("created_at", dayStart.toISOString());

    const reviewedToday = count ?? 0;
    remaining = Math.max(0, dailyLimit - reviewedToday);
    limitReached = remaining === 0;
  }

  const streak = await getStreak(userId);

  // If limit reached, return empty cards
  if (limitReached) {
    return { cards: [], remaining: 0, limitReached: true, streak };
  }

  // Cap cards to remaining limit
  const cappedCards = dailyLimit !== Infinity ? cards.slice(0, remaining) : cards;

  return { cards: cappedCards, remaining, limitReached: false, streak };
}

/** Record a flashcard review (correct or incorrect), update SRS and streak. */
export async function recordFlashcardReview(
  cardId: string,
  userId: string,
  known: boolean
): Promise<{ streak: { current_streak: number; longest_streak: number } }> {
  if (known) {
    await advanceCardSRS(cardId);
  } else {
    await resetCardSRS(cardId);
  }

  await logEvent(userId, "flashcard_review", {
    payload: { card_id: cardId, known },
  });

  const streak = await updateStreak(userId);
  return { streak };
}

// ── Streak ──

/** Update user streak based on review activity. */
export async function updateStreak(
  userId: string
): Promise<{ current_streak: number; longest_streak: number }> {
  const sb = getClient();

  const { data: user } = await sb
    .from("users")
    .select("current_streak, longest_streak, last_review_date")
    .eq("id", userId)
    .single();

  if (!user) return { current_streak: 0, longest_streak: 0 };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (user.last_review_date === todayStr) {
    // Already reviewed today, no change
    return { current_streak: user.current_streak, longest_streak: user.longest_streak };
  }

  let newStreak: number;

  if (user.last_review_date) {
    const lastDate = new Date(user.last_review_date + "T00:00:00");
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 1) {
      // Consecutive day
      newStreak = user.current_streak + 1;
    } else {
      // Streak broken
      newStreak = 1;
    }
  } else {
    // First review ever
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, user.longest_streak);

  await sb
    .from("users")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_review_date: todayStr,
    })
    .eq("id", userId);

  return { current_streak: newStreak, longest_streak: newLongest };
}

/** Get user streak data. */
export async function getStreak(
  userId: string
): Promise<{ current_streak: number; longest_streak: number }> {
  const sb = getClient();
  const { data } = await sb
    .from("users")
    .select("current_streak, longest_streak")
    .eq("id", userId)
    .single();

  return {
    current_streak: data?.current_streak ?? 0,
    longest_streak: data?.longest_streak ?? 0,
  };
}

// ── Word Lists ──

/** Get user's word lists with card counts, plus language groups. */
export async function getUserWordLists(
  userId: string
): Promise<{
  lists: DbWordList[];
  languageGroups: { lang: string; count: number }[];
}> {
  const sb = getClient();

  // Manual lists with card counts
  const { data: lists } = await sb
    .from("word_lists")
    .select("*, vocab_cards(count)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const formattedLists: DbWordList[] = (lists || []).map((l: Record<string, unknown>) => ({
    id: l.id as string,
    user_id: l.user_id as string,
    name: l.name as string,
    emoji: l.emoji as string,
    created_at: l.created_at as string,
    card_count: Array.isArray(l.vocab_cards) && l.vocab_cards.length > 0
      ? (l.vocab_cards[0] as { count: number }).count
      : 0,
  }));

  // Language groups
  const { data: cards } = await sb
    .from("vocab_cards")
    .select("target_lang")
    .eq("user_id", userId);

  const langMap = new Map<string, number>();
  for (const c of cards || []) {
    const lang = (c as { target_lang: string }).target_lang;
    langMap.set(lang, (langMap.get(lang) || 0) + 1);
  }
  const languageGroups = Array.from(langMap.entries())
    .map(([lang, count]) => ({ lang, count }))
    .sort((a, b) => b.count - a.count);

  return { lists: formattedLists, languageGroups };
}

/** Create a word list (free limit: 3). */
export async function createWordList(
  userId: string,
  name: string,
  emoji: string,
  tier: string
): Promise<{ list?: DbWordList; error?: string }> {
  const sb = getClient();

  if (tier === "free") {
    const { count } = await sb
      .from("word_lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if ((count ?? 0) >= 3) {
      return { error: "free_limit" };
    }
  }

  const { data, error } = await sb
    .from("word_lists")
    .insert({ user_id: userId, name, emoji })
    .select()
    .single();

  if (error) throw new Error(`Failed to create word list: ${error.message}`);
  return { list: { ...(data as DbWordList), card_count: 0 } };
}

/** Delete a word list (cards' list_id will be set null by FK). */
export async function deleteWordList(
  listId: string,
  userId: string
): Promise<boolean> {
  const sb = getClient();
  const { data } = await sb
    .from("word_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId)
    .select("id");

  return (data?.length ?? 0) > 0;
}

/** Assign cards to a word list. */
export async function assignCardsToList(
  cardIds: string[],
  listId: string | null,
  userId: string
): Promise<void> {
  const sb = getClient();
  await sb
    .from("vocab_cards")
    .update({ list_id: listId })
    .in("id", cardIds)
    .eq("user_id", userId);
}

/** Get users who have due cards (for cron review reminders). */
export async function getUsersWithDueCards(): Promise<
  { id: string; line_user_id: string; display_name: string | null; current_streak: number; due_count: number }[]
> {
  const sb = getClient();
  const now = new Date().toISOString();

  // Get all users with due cards
  const { data: cards } = await sb
    .from("vocab_cards")
    .select("user_id")
    .or(`review_status.eq.0,next_review_at.lte.${now}`);

  if (!cards || cards.length === 0) return [];

  // Count due cards per user
  const userCounts = new Map<string, number>();
  for (const c of cards) {
    const uid = (c as { user_id: string }).user_id;
    userCounts.set(uid, (userCounts.get(uid) || 0) + 1);
  }

  const userIds = Array.from(userCounts.keys());

  // Get user details
  const { data: users } = await sb
    .from("users")
    .select("id, line_user_id, display_name, current_streak")
    .in("id", userIds);

  return (users || []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    line_user_id: u.line_user_id as string,
    display_name: u.display_name as string | null,
    current_streak: (u.current_streak as number) ?? 0,
    due_count: userCounts.get(u.id as string) || 0,
  }));
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
