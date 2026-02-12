/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session and returns the URL.
 *
 * Body: { userId: string, tier: "sprout" | "bloom" }
 */

import { NextRequest, NextResponse } from "next/server";
import { getStripe, PRICE_IDS } from "@/lib/server/stripe";
import { getUserById } from "@/lib/server/supabase-server";

export async function POST(request: NextRequest) {
  const { userId, tier } = await request.json();

  if (!userId || !tier) {
    return NextResponse.json({ error: "Missing userId or tier" }, { status: 400 });
  }

  const priceId = PRICE_IDS[tier];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const stripe = getStripe();

  // Reuse existing Stripe customer or create new one
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { userId: user.id, lineUserId: user.line_user_id },
      name: user.display_name || undefined,
    });
    customerId = customer.id;
  }

  const origin = request.nextUrl.origin;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?upgraded=true`,
    cancel_url: `${origin}/pricing`,
    metadata: { userId: user.id, tier },
    subscription_data: {
      metadata: { userId: user.id, tier },
    },
  });

  return NextResponse.json({ url: session.url });
}
