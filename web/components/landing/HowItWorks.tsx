"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    icon: "📸",
    title: "截圖",
    description: "任何 App 的學習畫面",
    detail: "Duolingo、Netflix 字幕、電子書、網頁文章… 看到生字就截圖",
    color: "bg-sky-light text-sky",
    ringColor: "ring-sky/30",
  },
  {
    icon: "🤖",
    title: "AI 解析",
    description: "3 秒即時解析",
    detail: "Gemini AI 辨識截圖內容，自動抓取生字、生成翻譯和例句",
    color: "bg-sun-light text-sun",
    ringColor: "ring-sun/30",
  },
  {
    icon: "📖",
    title: "單字卡",
    description: "永久保存複習",
    detail: "精美 Flex Message 卡片推送到 LINE，一鍵收藏、隨時複習",
    color: "bg-sprout-light text-seed",
    ringColor: "ring-seed/30",
  },
];

function StepNode({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.8 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 40, scale: 0.8 }
      }
      transition={{
        delay: index * 0.2,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className="flex flex-col items-center text-center relative"
    >
      {/* Circle */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : { scale: 0 }}
        transition={{
          delay: index * 0.2 + 0.1,
          type: "spring",
          stiffness: 300,
          damping: 15,
        }}
        className={`
          w-24 h-24 rounded-full flex items-center justify-center
          ${step.color} ring-4 ${step.ringColor}
          text-4xl mb-5
        `}
      >
        {step.icon}
      </motion.div>

      <h3 className="font-heading font-extrabold text-xl text-earth mb-1">
        {step.title}
      </h3>
      <p className="font-bold text-seed text-sm mb-2">{step.description}</p>
      <p className="text-earth-light text-sm max-w-[220px] leading-relaxed">
        {step.detail}
      </p>
    </motion.div>
  );
}

function ConnectorLine({ index }: { index: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <svg
      ref={ref}
      viewBox="0 0 120 30"
      fill="none"
      className="hidden md:block w-28 h-8 text-mist self-start mt-12"
    >
      <motion.path
        d="M0 15 C30 5, 60 25, 90 12 C100 9, 110 14, 120 15"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 4"
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ delay: index * 0.2 + 0.3, duration: 0.8, ease: "easeInOut" }}
      />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-cloud via-white to-cloud pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-seed font-heading font-bold text-sm uppercase tracking-widest">
            How it works
          </span>
          <h2 className="font-heading font-extrabold text-3xl sm:text-4xl text-earth mt-3">
            三步成詞
          </h2>
          <p className="text-earth-light mt-3 max-w-md mx-auto">
            從截圖到記憶，比你想的還要簡單
          </p>
        </motion.div>

        {/* Steps */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="contents">
              <StepNode step={step} index={i} />
              {i < steps.length - 1 && <ConnectorLine index={i} />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
