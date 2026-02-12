"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/auth/AuthProvider";
import type { VocabCard } from "@/app/dashboard/page";
import Button from "@/components/ui/Button";
import Link from "next/link";

const statusConfig: Record<number, { label: string; color: string }> = {
  0: { label: "新字", color: "bg-sky-light text-sky" },
  1: { label: "學習中", color: "bg-sun-light text-sun" },
  2: { label: "已掌握", color: "bg-sprout-light text-seed" },
};

const langMap: Record<string, string> = {
  en: "英語",
  ja: "日語",
  ko: "韓語",
  es: "西班牙語",
  fr: "法語",
  de: "德語",
  "zh-TW": "中文",
};

export default function VocabDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const [card, setCard] = useState<VocabCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCard() {
      try {
        const res = await fetch(`/api/vocab?cardId=${id}`);
        if (res.ok) {
          const data = await res.json();
          setCard(data.card || null);
        }
      } catch {
        // not found
      } finally {
        setLoading(false);
      }
    }
    fetchCard();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 text-earth-light">
        載入中...
      </div>
    );
  }

  if (!card) {
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

  const status = statusConfig[card.review_status] || statusConfig[0];
  const lang = langMap[card.target_lang] || card.target_lang;
  const createdDate = card.created_at ? new Date(card.created_at).toLocaleDateString("zh-TW") : "";

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
          <span className="text-white/80 text-sm font-medium">{lang}</span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${status.color}`}>
            {status.label}
          </span>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Word */}
          <div>
            <h1 className="font-heading font-extrabold text-4xl text-earth">{card.word}</h1>
            {card.pronunciation && (
              <p className="text-sm text-earth-light mt-1">{card.pronunciation}</p>
            )}
            <p className="text-lg text-seed font-bold mt-2">{card.translation}</p>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-cloud rounded-xl p-3">
              <span className="text-xs text-earth-light block mb-1">來源</span>
              <span className="text-sm font-medium text-earth">{card.source_app}</span>
            </div>
            <div className="bg-cloud rounded-xl p-3">
              <span className="text-xs text-earth-light block mb-1">建立日期</span>
              <span className="text-sm font-medium text-earth">{createdDate}</span>
            </div>
          </div>

          {/* Original sentence */}
          {card.original_sentence && (
            <div className="bg-cloud rounded-xl p-4">
              <span className="text-xs text-earth-light font-bold block mb-2">原文句子</span>
              <p className="text-sm text-earth">{card.original_sentence}</p>
              {card.context_trans && (
                <p className="text-xs text-earth-light mt-1">{card.context_trans}</p>
              )}
            </div>
          )}

          {/* AI example */}
          {card.ai_example && (
            <div className="bg-sprout-light/30 rounded-xl p-4">
              <span className="text-xs text-seed font-bold block mb-2">AI 例句</span>
              <p className="text-sm text-earth italic">&ldquo;{card.ai_example}&rdquo;</p>
            </div>
          )}

          {/* Tags */}
          {card.tags && card.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {card.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-sky-light text-sky text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Link href="/quiz">
              <Button size="md" icon={<span>🎯</span>}>
                開始複習
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="md">
                返回列表
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
