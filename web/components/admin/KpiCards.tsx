"use client";

interface Kpis {
  totalUsers: number;
  totalCards: number;
  todayUsers: number;
  todayCards: number;
  todayScreenshots: number;
  errorRate: number;
  avgLatency: number;
}

const kpiConfig: { key: keyof Kpis; label: string; icon: string; color: string; suffix?: string }[] = [
  { key: "totalUsers", label: "總用戶數", icon: "👥", color: "text-sky" },
  { key: "totalCards", label: "總單字卡數", icon: "📚", color: "text-seed" },
  { key: "todayUsers", label: "今日新用戶", icon: "🆕", color: "text-sky" },
  { key: "todayCards", label: "今日新單字", icon: "🌱", color: "text-sprout" },
  { key: "todayScreenshots", label: "今日截圖", icon: "📸", color: "text-sun" },
  { key: "errorRate", label: "錯誤率 (7d)", icon: "⚠️", color: "text-bloom", suffix: "%" },
  { key: "avgLatency", label: "平均延遲 (7d)", icon: "⚡", color: "text-sky", suffix: "ms" },
];

export default function KpiCards({ data }: { data: Kpis }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {kpiConfig.map(({ key, label, icon, color, suffix }) => (
        <div
          key={key}
          className="bg-white rounded-2xl border border-mist/60 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg ${color}`}>{icon}</span>
            <span className="text-xs text-earth-light font-medium">{label}</span>
          </div>
          <div className="font-heading font-extrabold text-2xl text-earth">
            {data[key].toLocaleString()}
            {suffix && (
              <span className="text-sm text-earth-light font-medium ml-0.5">
                {suffix}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
