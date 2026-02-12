"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { VocabCard } from "@/app/dashboard/page";

const statusStyle: Record<number, { bg: string; text: string; bar: string }> = {
  0: { bg: "border-bloom", text: "text-bloom", bar: "bg-bloom" },
  1: { bg: "border-sun", text: "text-sun", bar: "bg-sun" },
  2: { bg: "border-seed", text: "text-seed", bar: "bg-seed" },
};

const statusLabel: Record<number, string> = {
  0: "新字",
  1: "複習中",
  2: "已掌握",
};

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "今天";
  if (diff === 1) return "昨天";
  return `${diff} 天前`;
}

interface Props {
  cards: VocabCard[];
  loading: boolean;
}

export default function ReviewQueue({ cards, loading }: Props) {
  const dueCards = useMemo(() => {
    const now = Date.now();
    return cards
      .filter((c) => {
        // New cards are always due
        if (c.review_status === 0) return true;
        // Cards past their next_review_at are due
        if (c.next_review_at && new Date(c.next_review_at).getTime() <= now) return true;
        return false;
      })
      .sort((a, b) => {
        // New cards (status 0) last, overdue cards first (most overdue = earliest next_review_at)
        if (a.review_status === 0 && b.review_status !== 0) return 1;
        if (a.review_status !== 0 && b.review_status === 0) return -1;
        if (a.next_review_at && b.next_review_at) {
          return new Date(a.next_review_at).getTime() - new Date(b.next_review_at).getTime();
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
  }, [cards]);

  if (loading) {
    return (
      <div className="text-center py-8 text-earth-light text-sm">
        載入中...
      </div>
    );
  }

  if (dueCards.length === 0) {
    return (
      <div className="text-center py-8 text-earth-light">
        <span className="text-4xl block mb-3">🎉</span>
        <p className="font-medium">
          {cards.length === 0 ? "還沒有單字，快去截圖吧！" : "所有單字都已掌握！"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
      {dueCards.map((card, i) => {
        const style = statusStyle[card.review_status] || statusStyle[0];
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`
              flex-shrink-0 w-44 snap-start
              bg-white rounded-2xl border p-4
              cursor-pointer transition-shadow
              hover:shadow-lg hover:shadow-seed/5
              ${style.bg}
            `}
          >
            <div className="text-xl font-heading font-extrabold text-earth mb-0.5">
              {card.word}
            </div>
            <div className="text-xs text-earth-light mb-2 line-clamp-1">{card.translation}</div>

            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-earth-light">
                {daysAgo(card.created_at)}
              </span>
              <span className={`text-[10px] font-bold ${style.text}`}>
                {statusLabel[card.review_status]}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
