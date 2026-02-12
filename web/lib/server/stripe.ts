/**
 * Shared Stripe client (lazy initialization).
 * Avoids build-time crash when STRIPE_SECRET_KEY is not set.
 */

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, { apiVersion: "2026-01-28.clover" });
  }
  return _stripe;
}

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

/** Map tier names to Stripe Price IDs. */
export const PRICE_IDS: Record<string, string | undefined> = {
  sprout: process.env.STRIPE_SPROUT_PRICE_ID,
  bloom: process.env.STRIPE_BLOOM_PRICE_ID,
};
