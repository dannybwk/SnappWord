"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { recentVocab } from "@/lib/constants";

type VocabStatus = "all" | "new" | "learning" | "mastered";

const statusConfig: Record<string, { label: string; color: string }> = {
  new: { label: "新字", color: "bg-sky-light text-sky" },
  learning: { label: "學習中", color: "bg-sun-light text-sun" },
  mastered: { label: "已掌握", color: "bg-sprout-light text-seed" },
};

export default function VocabTable() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<VocabStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return recentVocab.filter((v) => {
      const matchSearch =
        !search ||
        v.word.toLowerCase().includes(search.toLowerCase()) ||
        v.translation.includes(search);
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [search, statusFilter]);

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
          {(["all", "new", "learning", "mastered"] as VocabStatus[]).map((s) => (
            <button
              key={s}
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
          {filtered.map((vocab, i) => (
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
                  className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig[vocab.status].color}`}
                >
                  {statusConfig[vocab.status].label}
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
                    <div className="mt-2 pt-2 border-t border-mist/50 flex items-center gap-3 text-xs text-earth-light">
                      <span>{vocab.language}</span>
                      <span>{vocab.source}</span>
                      <span className={`font-bold ${
                        vocab.mastery < 30 ? "text-bloom" : vocab.mastery < 60 ? "text-sun" : "text-seed"
                      }`}>
                        掌握 {vocab.mastery}%
                      </span>
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
                  <td className="py-2.5 px-2 text-earth-light">{vocab.language}</td>
                  <td className="py-2.5 px-2 text-earth-light">{vocab.source}</td>
                  <td className="py-2.5 px-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${statusConfig[vocab.status].color}`}
                    >
                      {statusConfig[vocab.status].label}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-earth-light text-sm">
          找不到符合條件的單字
        </div>
      )}
    </div>
  );
}
