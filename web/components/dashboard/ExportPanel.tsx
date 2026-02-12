"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import type { VocabCard } from "@/app/dashboard/page";

type ExportRange = "all" | "mastered" | "review" | "week";

const rangeLabels: Record<ExportRange, string> = {
  all: "全部",
  mastered: "已掌握",
  review: "未複習",
  week: "本週新增",
};

function filterByRange(cards: VocabCard[], range: ExportRange): VocabCard[] {
  switch (range) {
    case "mastered":
      return cards.filter((c) => c.review_status === 2);
    case "review":
      return cards.filter((c) => c.review_status < 2);
    case "week": {
      const weekAgo = Date.now() - 7 * 86400000;
      return cards.filter((c) => new Date(c.created_at).getTime() > weekAgo);
    }
    default:
      return cards;
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob(["\uFEFF" + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function exportCSV(cards: VocabCard[]) {
  const header = "單字,翻譯,發音,語言,來源,例句,狀態,建立日期";
  const statusMap: Record<number, string> = { 0: "新字", 1: "學習中", 2: "已掌握" };
  const rows = cards.map((c) => {
    const fields = [
      c.word,
      c.translation,
      c.pronunciation || "",
      c.target_lang,
      c.source_app,
      c.ai_example || "",
      statusMap[c.review_status] || "",
      c.created_at?.split("T")[0] || "",
    ];
    return fields.map((f) => `"${f.replace(/"/g, '""')}"`).join(",");
  });
  downloadFile([header, ...rows].join("\n"), "snappword-vocab.csv", "text/csv");
}

function exportAnki(cards: VocabCard[]) {
  // Anki TSV format: front\tback
  const rows = cards.map((c) => {
    const front = c.word;
    const back = [
      c.translation,
      c.pronunciation ? `(${c.pronunciation})` : "",
      c.ai_example ? `例: ${c.ai_example}` : "",
    ]
      .filter(Boolean)
      .join("<br>");
    return `${front}\t${back}`;
  });
  downloadFile(rows.join("\n"), "snappword-anki.txt", "text/plain");
}

interface Props {
  cards: VocabCard[];
}

export default function ExportPanel({ cards }: Props) {
  const [range, setRange] = useState<ExportRange>("all");

  const filtered = filterByRange(cards, range);

  const exportFormats = [
    {
      name: "CSV",
      icon: "📊",
      description: "適用於 Excel、Google Sheets",
      action: () => exportCSV(filtered),
    },
    {
      name: "Anki",
      icon: "🃏",
      description: "匯入 Anki 閃卡軟體",
      action: () => exportAnki(filtered),
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-4">匯出單字</h3>

      <div className="space-y-3">
        {exportFormats.map((format, i) => (
          <motion.div
            key={format.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-cloud hover:bg-sprout-light/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{format.icon}</span>
              <div>
                <div className="font-heading font-bold text-sm text-earth">
                  {format.name}
                </div>
                <div className="text-xs text-earth-light">{format.description}</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={format.action}
              disabled={filtered.length === 0}
            >
              匯出{filtered.length > 0 ? ` (${filtered.length})` : ""}
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Export range */}
      <div className="mt-4 pt-4 border-t border-mist/50">
        <p className="text-xs text-earth-light mb-2">匯出範圍</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(rangeLabels) as ExportRange[]).map((key) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                range === key
                  ? "bg-seed text-white"
                  : "bg-cloud text-earth-light hover:bg-mist"
              }`}
            >
              {rangeLabels[key]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
