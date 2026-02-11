"use client";

import { motion } from "framer-motion";
import { recentVocab } from "@/lib/constants";

const dueCards = recentVocab.filter((v) => v.mastery < 70);

function getMasteryColor(mastery: number): string {
  if (mastery < 30) return "bg-bloom/20 border-bloom text-bloom";
  if (mastery < 60) return "bg-sun-light border-sun text-sun";
  return "bg-sprout-light border-seed text-seed";
}

export default function ReviewQueue() {
  if (dueCards.length === 0) {
    return (
      <div className="text-center py-8 text-earth-light">
        <span className="text-4xl block mb-3">🎉</span>
        <p className="font-medium">今天的複習都完成了！</p>
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
      {dueCards.map((card, i) => (
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
            ${getMasteryColor(card.mastery).split(" ").slice(1).join(" ")}
          `}
        >
          <div className="text-xl font-heading font-extrabold text-earth mb-0.5">
            {card.word}
          </div>
          <div className="text-xs text-earth-light mb-2">{card.translation}</div>

          {/* Mastery bar */}
          <div className="w-full h-1.5 bg-mist rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${card.mastery}%` }}
              transition={{ delay: i * 0.05 + 0.3, duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${
                card.mastery < 30 ? "bg-bloom" : card.mastery < 60 ? "bg-sun" : "bg-seed"
              }`}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-earth-light">{card.language}</span>
            <span className={`text-[10px] font-bold ${
              card.mastery < 30 ? "text-bloom" : card.mastery < 60 ? "text-sun" : "text-seed"
            }`}>
              {card.mastery}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
