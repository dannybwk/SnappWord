/**
 * POST /api/word-lists/cards  { userId, listId, cardIds }  → assign cards to list
 */

import { NextRequest, NextResponse } from "next/server";
import { assignCardsToList } from "@/lib/server/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { userId, listId, cardIds } = body;

  if (!userId || !Array.isArray(cardIds)) {
    return NextResponse.json(
      { error: "Missing userId or cardIds" },
      { status: 400 }
    );
  }

  await assignCardsToList(cardIds, listId ?? null, userId);
  return NextResponse.json({ success: true });
}
