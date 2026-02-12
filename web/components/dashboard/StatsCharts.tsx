"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { VocabCard } from "@/app/dashboard/page";

// ── Language helpers ──

const langMap: Record<string, string> = {
  en: "英語",
  ja: "日語",
  ko: "韓語",
  es: "西班牙語",
  fr: "法語",
  de: "德語",
  "zh-TW": "中文",
};

const langColors: Record<string, string> = {
  en: "#74B9FF",
  ja: "#FFB7C5",
  ko: "#FFE66D",
  es: "#06C755",
  fr: "#A8E6CF",
  de: "#DFE6E9",
  "zh-TW": "#FFB7C5",
};

const defaultColors = ["#74B9FF", "#FFB7C5", "#06C755", "#FFE66D", "#A8E6CF", "#DFE6E9"];

// ── WeeklyChart ──

const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

export function WeeklyChart({ cards }: { cards: VocabCard[] }) {
  const data = useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toDateString();
      const count = cards.filter(
        (c) => new Date(c.created_at).toDateString() === dateStr
      ).length;
      result.push({ day: weekDays[date.getDay()], count });
    }
    return result;
  }, [cards]);

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3 sm:mb-4">本週新增單字</h3>
      {cards.length === 0 ? (
        <div className="h-32 sm:h-40 flex items-center justify-center text-earth-light text-sm">
          尚無資料
        </div>
      ) : (
        <div className="h-32 sm:h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#636e72" }}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #DFE6E9",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value} 個`, "單字"]}
              />
              <Bar
                dataKey="count"
                fill="#06C755"
                radius={[6, 6, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

// ── LanguagePieChart ──

export function LanguagePieChart({ cards }: { cards: VocabCard[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    cards.forEach((c) => {
      const lang = c.target_lang || "en";
      counts[lang] = (counts[lang] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([lang, value]) => ({
        name: langMap[lang] || lang,
        value,
        fill: langColors[lang] || defaultColors[Object.keys(counts).indexOf(lang) % defaultColors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [cards]);

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3 sm:mb-4">語言分佈</h3>
      {data.length === 0 ? (
        <div className="h-28 sm:h-40 flex items-center justify-center text-earth-light text-sm">
          尚無資料
        </div>
      ) : (
        <>
          <div className="h-28 sm:h-40 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #DFE6E9",
                    fontSize: "12px",
                  }}
                  formatter={(value, name) => [`${value} 個`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
            {data.map((d) => (
              <span key={d.name} className="flex items-center gap-1 text-[10px] sm:text-xs text-earth-light">
                <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full" style={{ background: d.fill }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── MasteryRing ──

export function MasteryRing({ cards }: { cards: VocabCard[] }) {
  const { mastered, total, percentage } = useMemo(() => {
    const t = cards.length;
    const m = cards.filter((c) => c.review_status === 2).length;
    return { mastered: m, total: t, percentage: t > 0 ? Math.round((m / t) * 100) : 0 };
  }, [cards]);

  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5 flex flex-col items-center">
      <h3 className="font-heading font-bold text-sm text-earth mb-3 sm:mb-4 self-start">掌握率</h3>
      {total === 0 ? (
        <div className="h-20 sm:h-[100px] flex items-center justify-center text-earth-light text-sm">
          尚無資料
        </div>
      ) : (
        <>
          <svg className="w-20 h-20 sm:w-[100px] sm:h-[100px]" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="45"
              fill="none" stroke="#DFE6E9" strokeWidth="8"
            />
            <circle
              cx="50" cy="50" r="45"
              fill="none" stroke="#06C755" strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              className="transition-all duration-1000 ease-out"
            />
            <text
              x="50" y="46"
              textAnchor="middle"
              className="font-heading font-extrabold"
              fontSize="20" fill="#2D3436"
            >
              {percentage}%
            </text>
            <text
              x="50" y="62"
              textAnchor="middle"
              fontSize="9" fill="#636e72"
            >
              已掌握
            </text>
          </svg>
          <p className="text-xs text-earth-light mt-2">
            {mastered} / {total} 個單字
          </p>
        </>
      )}
    </div>
  );
}
