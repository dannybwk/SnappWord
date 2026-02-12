/**
 * GET /api/vocab?userId=UUID        → all cards for user
 * GET /api/vocab?cardId=UUID        → single card by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMonthlyUsage } from "@/lib/server/supabase-server";

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  const cardId = request.nextUrl.searchParams.get("cardId");
  const sb = getClient();

  // Single card lookup
  if (cardId) {
    const { data, error } = await sb
      .from("vocab_cards")
      .select("*")
      .eq("id", cardId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json({ card: data });
  }

  // All cards for user
  if (!userId) {
    return NextResponse.json({ error: "Missing userId or cardId" }, { status: 400 });
  }

  const [cardsResult, usage] = await Promise.all([
    sb
      .from("vocab_cards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    getMonthlyUsage(userId),
  ]);

  if (cardsResult.error) {
    return NextResponse.json({ error: cardsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    cards: cardsResult.data || [],
    quota: { used: usage.used, limit: 30 }, // TODO: adjust limit per tier after Stripe
  });
}
