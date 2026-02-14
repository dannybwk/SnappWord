"use client";

import { motion } from "framer-motion";

interface StreakBadgeProps {
  currentStreak: number;
  longestStreak: number;
}

export default function StreakBadge({ currentStreak, longestStreak }: StreakBadgeProps) {
  const color =
    currentStreak === 0
      ? "text-earth-light/40"
      : currentStreak >= 7
        ? "text-red-500"
        : currentStreak >= 3
          ? "text-orange-500"
          : "text-earth-light";

  const bgColor =
    currentStreak === 0
      ? "bg-mist/30"
      : currentStreak >= 7
        ? "bg-red-50"
        : currentStreak >= 3
          ? "bg-orange-50"
          : "bg-sprout-light/50";

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${bgColor}`}
    >
      <motion.span
        className={`text-lg ${color}`}
        animate={
          currentStreak >= 7
            ? { scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }
            : {}
        }
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        🔥
      </motion.span>
      <span className={`font-bold text-sm ${color}`}>
        {currentStreak}
      </span>
      <span className="text-earth-light/60 text-xs">
        天連續
      </span>
      {longestStreak > currentStreak && longestStreak > 0 && (
        <span className="text-earth-light/40 text-xs ml-1">
          (最高 {longestStreak})
        </span>
      )}
    </motion.div>
  );
}
