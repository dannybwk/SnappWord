/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 */

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, STRIPE_WEBHOOK_SECRET } from "@/lib/server/stripe";
import {
  updateUserTier,
  getUserByStripeCustomerId,
} from "@/lib/server/supabase-server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        break;
    }
  } catch (err) {
    console.error(`Stripe webhook handler error for ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tier = session.metadata?.tier;
  const customerId = session.customer as string;

  if (!userId || !tier) {
    console.error("Checkout session missing metadata:", session.id);
    return;
  }

  await updateUserTier(userId, tier, customerId);
  console.log(`User ${userId} upgraded to ${tier} (customer: ${customerId})`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error("No user found for Stripe customer:", customerId);
    return;
  }

  if (subscription.status === "active" || subscription.status === "trialing") {
    const tier = subscription.metadata?.tier || "sprout";
    await updateUserTier(user.id, tier);
    console.log(`Subscription updated for user ${user.id}: tier=${tier}`);
  } else if (
    subscription.status === "canceled" ||
    subscription.status === "unpaid" ||
    subscription.status === "past_due"
  ) {
    await updateUserTier(user.id, "free");
    console.log(`Subscription ${subscription.status} for user ${user.id}, reverted to free`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await getUserByStripeCustomerId(customerId);
  if (!user) {
    console.error("No user found for Stripe customer:", customerId);
    return;
  }

  await updateUserTier(user.id, "free");
  console.log(`Subscription deleted for user ${user.id}, reverted to free`);
}
