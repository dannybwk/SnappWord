"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { pricingPlans } from "@/lib/constants";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import Button from "@/components/ui/Button";
import { SparklesDoodle } from "@/components/ui/DoodleSVG";

function PricingCard({
  plan,
  index,
  onSubscribe,
  subscribing,
}: {
  plan: (typeof pricingPlans)[number];
  index: number;
  onSubscribe: (tier: string) => void;
  subscribing: string | null;
}) {
  const isLoading = subscribing === plan.tierId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
      className={`
        relative rounded-3xl p-6 md:p-8
        ${plan.highlighted
          ? "bg-white border-2 border-seed shadow-xl shadow-seed/10 scale-105 z-10"
          : "bg-white border border-mist/60 shadow-sm"
        }
      `}
    >
      {/* Popular badge */}
      {plan.highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-4 py-1 bg-seed text-white text-xs font-bold rounded-full shadow-md">
            <SparklesDoodle className="text-sun w-3 h-3" />
            最受歡迎
          </span>
        </div>
      )}

      {/* Plan name */}
      <div className="mb-6">
        <span className="text-xs text-earth-light uppercase tracking-wider font-medium">
          {plan.nameEn}
        </span>
        <h3 className="font-heading font-extrabold text-xl text-earth mt-1">{plan.name}</h3>
        <p className="text-sm text-earth-light mt-1">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-sm text-earth-light">NT$</span>
          <span className="font-heading font-extrabold text-4xl text-earth">{plan.price}</span>
          {plan.price > 0 && (
            <span className="text-sm text-earth-light">/ {plan.period}</span>
          )}
        </div>
        {plan.price === 0 && (
          <span className="text-xs text-seed font-medium">{plan.period}</span>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-earth">
            <span className="text-seed mt-0.5 shrink-0">✓</span>
            {feature}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {plan.tierId === "free" ? (
        <Button
          variant="outline"
          fullWidth
          size="lg"
          onClick={() => window.location.href = "/dashboard"}
        >
          {plan.cta}
        </Button>
      ) : (
        <Button
          variant={plan.highlighted ? "primary" : "outline"}
          fullWidth
          size="lg"
          onClick={() => onSubscribe(plan.tierId)}
          disabled={isLoading}
        >
          {isLoading ? "處理中..." : plan.cta}
        </Button>
      )}
    </motion.div>
  );
}

export default function PricingPage() {
  const [subscribing, setSubscribing] = useState<string | null>(null);

  async function handleSubscribe(tier: string) {
    setSubscribing(tier);

    try {
      // First check if user is logged in by trying to get their info
      // If they're not logged in, redirect to dashboard (which shows login)
      const meRes = await fetch("/api/auth/me?lineUserId=check");
      if (!meRes.ok) {
        window.location.href = "/dashboard";
        return;
      }

      // Try to get userId from localStorage/LIFF context
      // Since pricing page might not have AuthProvider, we redirect through dashboard
      window.location.href = `/dashboard?subscribe=${tier}`;
    } catch {
      window.location.href = `/dashboard?subscribe=${tier}`;
    } finally {
      setSubscribing(null);
    }
  }

  return (
    <>
      <Nav />
      <main className="min-h-screen pt-24 pb-16">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-6 text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-seed font-heading font-bold text-sm uppercase tracking-widest">
              Pricing
            </span>
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-earth mt-3">
              選擇你的花園方案
            </h1>
            <p className="text-earth-light mt-4 text-lg max-w-xl mx-auto">
              從免費種子開始，隨著你的學習花園成長升級
            </p>
          </motion.div>
        </div>

        {/* Plans */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-4 items-start">
            {pricingPlans.map((plan, i) => (
              <PricingCard
                key={plan.nameEn}
                plan={plan}
                index={i}
                onSubscribe={handleSubscribe}
                subscribing={subscribing}
              />
            ))}
          </div>
        </div>

        {/* FAQ-like note */}
        <div className="max-w-2xl mx-auto px-6 mt-16 text-center">
          <p className="text-earth-light text-sm">
            所有方案都包含 LINE Bot 基本功能。升級或取消隨時可以，不需要綁定年約。
          </p>
          <p className="text-earth-light text-xs mt-2">
            🌱 有問題嗎？在 LINE 上跟我們聊聊 @snappword
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
