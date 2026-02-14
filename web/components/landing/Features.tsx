"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { supportedLanguages } from "@/lib/constants";

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  className?: string;
  children?: React.ReactNode;
  delay?: number;
}

function FeatureCard({ title, description, icon, className = "", children, delay = 0 }: FeatureCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ delay, type: "spring", stiffness: 200, damping: 20 }}
      className={`
        group bg-white rounded-3xl border border-mist/60 p-6
        hover:shadow-xl hover:shadow-seed/5 hover:border-sprout/60
        transition-all duration-300
        ${className}
      `}
    >
      <span className="text-3xl block mb-3">{icon}</span>
      <h3 className="font-heading font-extrabold text-lg text-earth mb-1">{title}</h3>
      <p className="text-sm text-earth-light leading-relaxed">{description}</p>
      {children}
    </motion.div>
  );
}

function LanguageFlags() {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {supportedLanguages.map((lang) => (
        <motion.span
          key={lang.name}
          whileHover={{ scale: 1.2, rotate: 5 }}
          className="inline-flex items-center gap-1 bg-cloud px-2.5 py-1 rounded-full text-xs text-earth-light"
        >
          <span className="text-base">{lang.flag}</span>
          {lang.name}
        </motion.span>
      ))}
    </div>
  );
}

function MemoryCurve() {
  return (
    <div className="mt-3 relative h-16 overflow-hidden">
      <svg viewBox="0 0 200 60" fill="none" className="w-full h-full">
        <motion.path
          d="M0 50 C20 50, 25 10, 40 10 C50 10, 55 40, 70 40 C80 40, 85 15, 100 15 C110 15, 115 35, 130 35 C140 35, 145 18, 160 18 C170 18, 175 30, 200 28"
          stroke="#06C755"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
        <text x="5" y="58" fill="#636e72" fontSize="7" fontFamily="sans-serif">Day 1</text>
        <text x="170" y="26" fill="#06C755" fontSize="7" fontFamily="sans-serif">Day 30</text>
      </svg>
    </div>
  );
}

function SwipeDemo() {
  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <motion.div
        className="flex items-center gap-1 text-xs text-red-400 font-medium"
        animate={{ x: [-2, -6, -2] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <span>忘了</span>
        <span>👈</span>
      </motion.div>
      <div className="w-16 h-20 bg-cloud rounded-xl border border-mist/60 flex flex-col items-center justify-center shadow-sm">
        <span className="text-lg font-heading font-bold text-earth">単語</span>
        <span className="text-[9px] text-earth-light mt-0.5">たんご</span>
      </div>
      <motion.div
        className="flex items-center gap-1 text-xs text-seed font-medium"
        animate={{ x: [2, 6, 2] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <span>👉</span>
        <span>記得</span>
      </motion.div>
    </div>
  );
}

function StreakDisplay() {
  return (
    <div className="mt-3 flex items-center gap-2">
      {[1, 2, 3, 4, 5, 6, 7].map((day) => (
        <motion.div
          key={day}
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: day * 0.08, type: "spring", stiffness: 300 }}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            day <= 5
              ? "bg-orange-100 text-orange-500"
              : "bg-cloud text-earth-light/40"
          }`}
        >
          {day <= 5 ? "🔥" : day}
        </motion.div>
      ))}
    </div>
  );
}

export default function Features() {
  return (
    <section id="features" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-cloud via-white to-cloud pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-seed font-heading font-bold text-sm uppercase tracking-widest">
            Features
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-earth mt-3">
            你的語言花園
          </h2>
          <p className="text-earth-light mt-3">
            每個功能都是幫助你成長的養分
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Large card - AI */}
          <FeatureCard
            title="AI 智能辨識"
            description="多模態 AI，能理解截圖中的文字、語境、甚至是手寫筆記。不只辨識單字，還生成例句和語境解釋。"
            icon="🧠"
            className="sm:col-span-2 lg:col-span-2 lg:row-span-2"
            delay={0}
          >
            <div className="mt-4 grid grid-cols-3 gap-2">
              {["Duolingo", "Netflix", "電子書"].map((app) => (
                <div
                  key={app}
                  className="bg-cloud rounded-xl p-3 text-center group-hover:bg-sprout-light transition-colors"
                >
                  <span className="text-2xl block mb-1">
                    {app === "Duolingo" ? "🦉" : app === "Netflix" ? "🎬" : "📚"}
                  </span>
                  <span className="text-xs text-earth-light">{app}</span>
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Languages */}
          <FeatureCard
            title="6 種語言"
            description="英、日、韓、西、法、德，持續擴增中"
            icon="🌏"
            delay={0.1}
          >
            <LanguageFlags />
          </FeatureCard>

          {/* Flashcard review - NEW */}
          <FeatureCard
            title="翻卡複習"
            description="左滑忘了、右滑記得，像交友軟體一樣直覺。到期的單字自動浮出，複習不費腦。"
            icon="🃏"
            delay={0.15}
          >
            <SwipeDemo />
          </FeatureCard>

          {/* SRS + Streak */}
          <FeatureCard
            title="SRS 間隔複習"
            description="科學化的記憶曲線排程，在最佳時機提醒你複習。搭配連續天數追蹤，養成每日學習習慣。"
            icon="🔥"
            delay={0.2}
          >
            <StreakDisplay />
          </FeatureCard>

          {/* Word lists - NEW */}
          <FeatureCard
            title="單字本分類"
            description="依語言自動分類，也能手動建立專屬單字本。整理你的學習成果，一目瞭然。"
            icon="📚"
            delay={0.25}
          />

          {/* TTS - NEW */}
          <FeatureCard
            title="真人發音"
            description="一鍵播放單字原生發音，支援英日韓等多種語言，聽說讀寫全面覆蓋。"
            icon="🔊"
            delay={0.3}
          />

          {/* Free tier */}
          <FeatureCard
            title="免費開始"
            description="每月 NT$0 起，無需綁定信用卡就能開始你的語言花園"
            icon="🌱"
            delay={0.35}
          />
        </div>
      </div>
    </section>
  );
}
