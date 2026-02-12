"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { VocabCard } from "@/app/dashboard/page";

type StatusFilter = "all" | 0 | 1 | 2;

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

function getLangName(code: string): string {
  return langMap[code] || code;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface Props {
  cards: VocabCard[];
  loading: boolean;
}

export default function VocabTable({ cards, loading }: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return cards.filter((v) => {
      const matchSearch =
        !search ||
        v.word.toLowerCase().includes(search.toLowerCase()) ||
        v.translation.includes(search);
      const matchStatus = statusFilter === "all" || v.review_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [cards, search, statusFilter]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-mist/60 p-8 text-center text-earth-light text-sm">
        載入中...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      {/* Search + Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="搜尋單字或翻譯..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-cloud border border-mist/60 text-sm text-earth placeholder:text-earth-light/60 focus:outline-none focus:border-seed transition-colors"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-light text-sm">
            🔍
          </span>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {(["all", 0, 1, 2] as StatusFilter[]).map((s) => (
            <button
              key={String(s)}
              onClick={() => setStatusFilter(s)}
              className={`
                flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${statusFilter === s
                  ? "bg-seed text-white"
                  : "bg-cloud text-earth-light hover:bg-mist"
                }
              `}
            >
              {s === "all" ? "全部" : statusConfig[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: Card list */}
      <div className="sm:hidden space-y-2">
        <AnimatePresence>
          {filtered.map((vocab) => (
            <motion.div
              key={vocab.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpanded(expanded === vocab.id ? null : vocab.id)}
              className="p-3 rounded-xl bg-cloud/50 active:bg-cloud transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-heading font-bold text-earth text-base">
                    {vocab.word}
                  </div>
                  <div className="text-earth-light text-sm mt-0.5">
                    {vocab.translation}
                  </div>
                </div>
                <span
                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig[vocab.review_status]?.color || ""}`}
                >
                  {statusConfig[vocab.review_status]?.label || ""}
                </span>
              </div>

              <AnimatePresence>
                {expanded === vocab.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 pt-2 border-t border-mist/50 space-y-1 text-xs text-earth-light">
                      <div className="flex items-center gap-3">
                        <span>{getLangName(vocab.target_lang)}</span>
                        <span>{vocab.source_app}</span>
                        <span>{formatDate(vocab.created_at)}</span>
                      </div>
                      {vocab.pronunciation && (
                        <div className="text-earth-light/80">{vocab.pronunciation}</div>
                      )}
                      {vocab.ai_example && (
                        <div className="italic text-earth-light/80">{vocab.ai_example}</div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Desktop: Table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist/50">
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">單字</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">翻譯</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">語言</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">來源</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">狀態</th>
              <th className="text-left py-2 px-2 text-earth-light font-medium text-xs">日期</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {filtered.map((vocab) => (
                <motion.tr
                  key={vocab.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-mist/30 hover:bg-cloud/50 transition-colors"
                >
                  <td className="py-2.5 px-2">
                    <span className="font-heading font-bold text-earth">{vocab.word}</span>
                  </td>
                  <td className="py-2.5 px-2 text-earth-light">{vocab.translation}</td>
                  <td className="py-2.5 px-2 text-earth-light">{getLangName(vocab.target_lang)}</td>
                  <td className="py-2.5 px-2 text-earth-light">{vocab.source_app}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig[vocab.review_status]?.color || ""}`}
                    >
                      {statusConfig[vocab.review_status]?.label || ""}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-earth-light text-xs">
                    {formatDate(vocab.created_at)}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-earth-light text-sm">
          {cards.length === 0 ? "還沒有單字，快去 LINE 傳截圖吧！" : "找不到符合條件的單字"}
        </div>
      )}
    </div>
  );
}
