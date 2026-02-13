"use client";

interface RevenueData {
  monthly: number;
  total: number;
  paidUsers: number;
  conversionRate: number;
}

const revenueConfig: {
  key: keyof RevenueData;
  label: string;
  icon: string;
  color: string;
  prefix?: string;
  suffix?: string;
}[] = [
  { key: "monthly", label: "本月營收", icon: "💰", color: "text-sun", prefix: "NT$" },
  { key: "total", label: "累計營收", icon: "🏦", color: "text-seed", prefix: "NT$" },
  { key: "paidUsers", label: "付費用戶數", icon: "👑", color: "text-sky" },
  { key: "conversionRate", label: "付費轉換率", icon: "📈", color: "text-sprout", suffix: "%" },
];

export default function RevenueCards({ data }: { data: RevenueData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {revenueConfig.map(({ key, label, icon, color, prefix, suffix }) => (
        <div
          key={key}
          className="bg-white rounded-2xl border border-mist/60 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg ${color}`}>{icon}</span>
            <span className="text-xs text-earth-light font-medium">{label}</span>
          </div>
          <div className="font-heading font-extrabold text-2xl text-earth">
            {prefix && (
              <span className="text-sm text-earth-light font-medium mr-0.5">
                {prefix}
              </span>
            )}
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
