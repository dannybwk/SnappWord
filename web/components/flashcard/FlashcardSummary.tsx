"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Button from "@/components/ui/Button";
import StreakBadge from "@/components/dashboard/StreakBadge";

interface FlashcardSummaryProps {
  known: number;
  forgot: number;
  streak: { current_streak: number; longest_streak: number };
}

export default function FlashcardSummary({ known, forgot, streak }: FlashcardSummaryProps) {
  const total = known + forgot;
  const accuracy = total > 0 ? Math.round((known / total) * 100) : 0;

  // SVG progress ring
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (accuracy / 100) * circumference;

  const message =
    accuracy >= 90
      ? "太厲害了！🎉"
      : accuracy >= 70
        ? "很不錯！繼續加油 💪"
        : accuracy >= 50
          ? "還可以，多複習幾次！📖"
          : "別灰心，複習讓記憶更深 🌱";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 max-w-sm mx-auto text-center"
    >
      <h2 className="font-heading font-extrabold text-2xl text-earth">
        複習完成！
      </h2>

      {/* Streak badge */}
      <StreakBadge
        currentStreak={streak.current_streak}
        longestStreak={streak.longest_streak}
      />

      {/* Accuracy ring */}
      <div className="relative">
        <svg width="160" height="160" className="-rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="10"
            fill="none"
          />
          <motion.circle
            cx="80"
            cy="80"
            r={radius}
            stroke={accuracy >= 70 ? "#22c55e" : accuracy >= 50 ? "#f59e0b" : "#ef4444"}
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            strokeDasharray={circumference}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-heading font-extrabold text-3xl text-earth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {accuracy}%
          </motion.span>
          <span className="text-earth-light text-xs">正確率</span>
        </div>
      </div>

      <p className="text-earth font-medium text-lg">{message}</p>

      {/* Stats */}
      <div className="flex gap-8">
        <div className="text-center">
          <div className="font-bold text-2xl text-seed">{known}</div>
          <div className="text-earth-light text-sm">記得</div>
        </div>
        <div className="text-center">
          <div className="font-bold text-2xl text-bloom">{forgot}</div>
          <div className="text-earth-light text-sm">忘了</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full mt-4">
        <Link href="/dashboard" className="w-full">
          <Button variant="primary" fullWidth icon={<span>🏠</span>}>
            回到首頁
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}
