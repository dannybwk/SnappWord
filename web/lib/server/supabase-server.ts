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
