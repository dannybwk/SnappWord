/**
 * GET  /api/flashcard?userId=UUID  → flashcard deck for review
 * POST /api/flashcard              → record review { userId, cardId, known }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getUserById,
  getUserTier,
  getFlashcardDeck,
  recordFlashcardReview,
} from "@/lib/server/supabase-server";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const tier = getUserTier(user);
  const deck = await getFlashcardDeck(userId, tier);

  return NextResponse.json(deck);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, cardId, known } = body;

  if (!userId || !cardId || typeof known !== "boolean") {
    return NextResponse.json(
      { error: "Missing userId, cardId, or known" },
      { status: 400 }
    );
  }

  // Verify card ownership
  const sb = getClient();
  const { data: card } = await sb
    .from("vocab_cards")
    .select("id")
    .eq("id", cardId)
    .eq("user_id", userId)
    .single();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }

  const result = await recordFlashcardReview(cardId, userId, known);
  return NextResponse.json({ success: true, streak: result.streak });
}
