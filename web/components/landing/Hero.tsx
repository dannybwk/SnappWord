"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import PhoneMockup from "@/components/ui/PhoneMockup";
import { UnderlineDoodle, SparklesDoodle } from "@/components/ui/DoodleSVG";
import { stats, demoCards, lineAddFriendUrl } from "@/lib/constants";
import { useState, useEffect } from "react";

function PhoneContent() {
  const [step, setStep] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => {
        if (prev >= 3) {
          setCardIndex((ci) => (ci + 1) % demoCards.length);
          return 0;
        }
        return prev + 1;
      });
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const card = demoCards[cardIndex];

  return (
    <div className="h-full flex flex-col bg-[#7494A5]/10">
      {/* LINE header */}
      <div className="bg-seed px-4 py-2 flex items-center gap-2">
        <div className="w-6 h-6 bg-white/20 rounded-full" />
        <span className="text-white text-xs font-bold">SnappWord 截詞</span>
      </div>

      <div className="flex-1 p-3 flex flex-col justify-end gap-2 overflow-hidden">
        {/* User message - screenshot */}
        <motion.div
          key={`screenshot-${cardIndex}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: step >= 0 ? 1 : 0, y: step >= 0 ? 0 : 20 }}
          className="self-end"
        >
          <div className="bg-seed/90 rounded-2xl rounded-br-sm px-3 py-2 max-w-[70%]">
            <div className="w-32 h-20 bg-white/20 rounded-lg flex items-center justify-center text-white/60 text-[10px]">
              📸 {card.source} 截圖
            </div>
          </div>
        </motion.div>

        {/* Analyzing indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: step === 1 ? 1 : 0 }}
          className="self-start"
        >
          <div className="bg-white rounded-2xl rounded-bl-sm px-3 py-2 shadow-sm">
            <span className="text-xs text-earth-light">分析中</span>
            <motion.span
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-xs text-earth-light"
            >
              ...
            </motion.span>
          </div>
        </motion.div>

        {/* Vocab card result */}
        <motion.div
          key={`card-${cardIndex}`}
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{
            opacity: step >= 2 ? 1 : 0,
            scale: step >= 2 ? 1 : 0.8,
            y: step >= 2 ? 0 : 30,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="self-start max-w-[85%]"
        >
          <div className="bg-white rounded-2xl rounded-bl-sm shadow-md overflow-hidden border border-mist/50">
            <div className="bg-seed px-3 py-1.5">
              <span className="text-[10px] text-white/80">{card.languageFlag} {card.language}</span>
            </div>
            <div className="px-3 py-2">
              <div className="font-heading font-extrabold text-base text-earth">{card.word}</div>
              <div className="text-[10px] text-earth-light">{card.reading}</div>
              <div className="text-xs text-seed font-bold mt-1">{card.translation}</div>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{
                  opacity: step >= 3 ? 1 : 0,
                  height: step >= 3 ? "auto" : 0,
                }}
                className="overflow-hidden"
              >
                <div className="mt-1.5 pt-1.5 border-t border-mist/50">
                  <p className="text-[9px] text-earth-light italic">{card.example}</p>
                  <p className="text-[9px] text-earth-light mt-0.5">{card.exampleTranslation}</p>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-72 h-72 bg-sprout/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-bloom/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-sun/10 rounded-full blur-2xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
        {/* Left content - 60% */}
        <div className="md:col-span-3 space-y-8">
          {/* Tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-sprout-light rounded-full text-sm font-medium text-seed">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                🤖
              </motion.span>
              LINE Bot × AI 驅動
            </span>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-earth leading-tight">
              截圖變單字卡，
              <br />
              <span className="relative inline-block text-seed">
                AI 幫你記憶整理。
                <UnderlineDoodle className="text-sun" />
              </span>
            </h1>
          </motion.div>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-lg text-earth-light max-w-lg leading-relaxed"
          >
            手機截圖 → 轉傳到LINE帳號 → AI 解析 → 精美單字卡，
            <span className="font-semibold text-earth">3 秒搞定</span>
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-4"
          >
            <a href={lineAddFriendUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" icon={<span className="text-xl">💬</span>}>
                加入 LINE 好友
              </Button>
            </a>
            <a href="#how-it-works">
              <Button variant="ghost" size="lg">
                往下看怎麼運作 ↓
              </Button>
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center gap-6 text-sm text-earth-light"
          >
            <span className="flex items-center gap-1.5">
              <SparklesDoodle className="text-sun" />
              已解析 {stats.screenshotsProcessed} 張截圖
            </span>
            <span className="flex items-center gap-1.5">
              <SparklesDoodle className="text-sky" />
              {stats.languagesSupported} 種語言支援
            </span>
          </motion.div>
        </div>

        {/* Right - Phone mockup */}
        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, type: "spring", stiffness: 100, damping: 20 }}
          className="md:col-span-2 flex justify-center"
        >
          <PhoneMockup>
            <PhoneContent />
          </PhoneMockup>
        </motion.div>
      </div>
    </section>
  );
}
