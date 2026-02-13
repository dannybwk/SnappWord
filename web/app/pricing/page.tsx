"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pricingPlans, paymentInfo } from "@/lib/constants";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/ui/Footer";
import Button from "@/components/ui/Button";
import { SparklesDoodle } from "@/components/ui/DoodleSVG";

type PaidPlan = (typeof pricingPlans)[1] | (typeof pricingPlans)[2];

function PricingCard({
  plan,
  index,
  onSelect,
}: {
  plan: (typeof pricingPlans)[number];
  index: number;
  onSelect: (plan: PaidPlan) => void;
}) {
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
          onClick={() => onSelect(plan as PaidPlan)}
        >
          {plan.cta}
        </Button>
      )}
    </motion.div>
  );
}

function PaymentModal({
  plan,
  onClose,
}: {
  plan: PaidPlan;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="font-heading font-extrabold text-xl text-earth">
            升級到{plan.name}
          </h2>
          <p className="text-earth-light text-sm mt-1">
            NT${plan.price} / {plan.period}
          </p>
        </div>

        {/* Payment methods */}
        <div className="space-y-4">
          {/* JKO Pay */}
          <a
            href={paymentInfo.jkoPay.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-mist/60 hover:border-seed/40 hover:bg-sprout-light/30 transition-colors"
          >
            <span className="text-2xl">💳</span>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-sm text-earth">
                {paymentInfo.jkoPay.name}
              </div>
              <div className="text-xs text-earth-light mt-0.5">
                帳號：{paymentInfo.jkoPay.account}
              </div>
            </div>
            <span className="text-seed text-sm font-medium shrink-0">前往轉帳 →</span>
          </a>

          {/* PayPal */}
          <a
            href={paymentInfo.paypal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 rounded-2xl border border-mist/60 hover:border-sky/40 hover:bg-sky-light/30 transition-colors"
          >
            <span className="text-2xl">🅿️</span>
            <div className="flex-1 min-w-0">
              <div className="font-heading font-bold text-sm text-earth">
                {paymentInfo.paypal.name}
              </div>
              <div className="text-xs text-earth-light mt-0.5">
                {paymentInfo.paypal.email}
              </div>
            </div>
            <span className="text-sky text-sm font-medium shrink-0">前往付款 →</span>
          </a>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-2xl bg-cloud/80 text-sm text-earth-light space-y-1.5">
          <p className="font-medium text-earth">付款後請：</p>
          <p>1. 截圖付款成功畫面</p>
          <p>2. 回到 SnappWord LINE 官方帳號，輸入「<span className="font-bold text-seed">升級</span>」並傳送付款截圖</p>
          <p>3. 我們會在 24 小時內為你升級</p>
        </div>

        {/* Close */}
        <div className="mt-6">
          <Button variant="outline" fullWidth onClick={onClose}>
            關閉
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState<PaidPlan | null>(null);

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
                onSelect={setSelectedPlan}
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

      {/* Payment Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <PaymentModal
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
