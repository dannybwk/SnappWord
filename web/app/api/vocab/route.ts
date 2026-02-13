/**
 * GET /api/vocab?userId=UUID        → all cards for user
 * GET /api/vocab?cardId=UUID&userId=UUID → single card (with ownership check)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMonthlyUsage, getUserById } from "@/lib/server/supabase-server";

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

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  // Single card lookup — requires userId for ownership verification
  if (cardId) {
    const { data, error } = await sb
      .from("vocab_cards")
      .select("*")
      .eq("id", cardId)
      .eq("user_id", userId)
      .single();

    if (error) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }
    return NextResponse.json({ card: data });
  }

  // All cards for user
  const TIER_LIMITS: Record<string, number> = {
    free: 30,
    sprout: 200,
    bloom: Infinity,
  };

  const [cardsResult, usage, dbUser] = await Promise.all([
    sb
      .from("vocab_cards")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    getMonthlyUsage(userId),
    getUserById(userId),
  ]);

  if (cardsResult.error) {
    return NextResponse.json({ error: cardsResult.error.message }, { status: 500 });
  }

  const tier = dbUser?.subscription_tier || "free";
  const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;

  return NextResponse.json({
    cards: cardsResult.data || [],
    quota: { used: usage.used, limit, tier },
  });
}
