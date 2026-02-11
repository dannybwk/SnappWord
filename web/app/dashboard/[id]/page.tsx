"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { recentVocab, demoCards } from "@/lib/constants";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function VocabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const vocab = recentVocab.find((v) => v.id === id);
  const demoCard = demoCards.find((_, i) => String(i + 1) === id);

  if (!vocab) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <span className="text-5xl block mb-4">🔍</span>
        <h1 className="font-heading font-extrabold text-2xl text-earth mb-2">找不到這個單字</h1>
        <p className="text-earth-light mb-6">這個單字可能已經被刪除了</p>
        <Link href="/dashboard">
          <Button variant="outline">← 回到 Dashboard</Button>
        </Link>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    new: { label: "新字", color: "bg-sky-light text-sky" },
    learning: { label: "學習中", color: "bg-sun-light text-sun" },
    mastered: { label: "已掌握", color: "bg-sprout-light text-seed" },
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm text-earth-light hover:text-seed transition-colors mb-6"
      >
        ← 回到我的單字
      </Link>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-mist/60 overflow-hidden shadow-sm"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-seed to-seed-dark px-6 py-4 flex items-center justify-between">
          <span className="text-white/80 text-sm font-medium">{vocab.language}</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${statusConfig[vocab.status].color}`}
          >
            {statusConfig[vocab.status].label}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Word */}
          <div>
            <h1 className="font-heading font-extrabold text-4xl text-earth">{vocab.word}</h1>
            <p className="text-lg text-seed font-bold mt-2">{vocab.translation}</p>
          </div>

          {/* Mastery */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-earth-light">記憶強度</span>
              <span className="text-xs font-bold text-earth">{vocab.mastery}%</span>
            </div>
            <div className="w-full h-2.5 bg-mist rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${vocab.mastery}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  vocab.mastery < 30
                    ? "bg-bloom"
                    : vocab.mastery < 60
                      ? "bg-sun"
                      : "bg-seed"
                }`}
              />
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cloud rounded-xl p-3">
              <span className="text-xs text-earth-light block mb-1">來源</span>
              <span className="text-sm font-medium text-earth">{vocab.source}</span>
            </div>
            <div className="bg-cloud rounded-xl p-3">
              <span className="text-xs text-earth-light block mb-1">建立日期</span>
              <span className="text-sm font-medium text-earth">{vocab.createdAt}</span>
            </div>
          </div>

          {/* Example sentence (from demo data if available) */}
          {demoCard && (
            <div className="bg-sprout-light/30 rounded-xl p-4">
              <span className="text-xs text-seed font-bold block mb-2">例句</span>
              <p className="text-sm text-earth italic">&ldquo;{demoCard.example}&rdquo;</p>
              <p className="text-xs text-earth-light mt-1">{demoCard.exampleTranslation}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button size="md" icon={<span>🎯</span>}>
              加入複習
            </Button>
            <Button variant="outline" size="md">
              匯出
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
