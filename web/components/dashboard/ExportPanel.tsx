"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

const exportFormats = [
  {
    name: "CSV",
    icon: "📊",
    description: "適用於 Excel、Google Sheets",
  },
  {
    name: "Anki",
    icon: "🃏",
    description: "匯入 Anki 閃卡軟體",
  },
];

export default function ExportPanel() {
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
            <Button variant="outline" size="sm">
              匯出
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Export options */}
      <div className="mt-4 pt-4 border-t border-mist/50">
        <p className="text-xs text-earth-light mb-2">匯出範圍</p>
        <div className="flex flex-wrap gap-2">
          {["全部", "已掌握", "未複習", "本週新增"].map((option) => (
            <button
              key={option}
              className="px-3 py-1 rounded-lg bg-cloud text-xs text-earth-light hover:bg-seed hover:text-white transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
