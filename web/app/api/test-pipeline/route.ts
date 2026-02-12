/**
 * Temporary test endpoint to diagnose the processing pipeline.
 * DELETE this file after debugging is complete.
 */

import { NextResponse } from "next/server";
import { getMessageContent } from "@/lib/server/line-client";
import { analyzeScreenshot } from "@/lib/server/gemini-client";
import { getOrCreateUser, uploadImage, saveVocabCards } from "@/lib/server/supabase-server";

export const maxDuration = 60;

export async function GET() {
  const steps: Record<string, string> = {};
  const testUserId = "TEST_PIPELINE";

  // Step 1: Supabase — getOrCreateUser
  try {
    const user = await getOrCreateUser(testUserId);
    steps["1_supabase_user"] = `OK — id: ${user.id}`;
  } catch (e) {
    steps["1_supabase_user"] = `FAIL — ${e instanceof Error ? e.message : String(e)}`;
    return NextResponse.json({ steps });
  }

  // Step 2: Gemini — test with a tiny image (1x1 white pixel JPEG)
  try {
    const tinyJpeg = Buffer.from(
      "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP//AP/CABEIAAEAAQMBIgACEQEDEQH/xAAUAAEAAAAAAAAAAAAAAAAAAAAI/9oACAEBAAAAAEf/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/9oACAECEAAAAH//xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF/P//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8Af//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Af//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Af//Z",
      "base64"
    );
    const [result, meta] = await analyzeScreenshot(tinyJpeg);
    steps["2_gemini"] = `OK — ${meta.latencyMs}ms, words: ${result.words.length}`;
  } catch (e) {
    steps["2_gemini"] = `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }

  // Step 3: Supabase Storage — upload test
  try {
    const tinyBuf = Buffer.from("test");
    const url = await uploadImage(tinyBuf, "test-pipeline");
    steps["3_supabase_storage"] = `OK — ${url.slice(0, 60)}...`;
  } catch (e) {
    steps["3_supabase_storage"] = `FAIL — ${e instanceof Error ? e.message : String(e)}`;
  }

  return NextResponse.json({ steps });
}
