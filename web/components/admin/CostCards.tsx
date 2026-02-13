"use client";

interface ApiCostData {
  todayCost: number;
  monthlyCost: number;
  totalCost: number;
  todayTokens: number;
  monthlyTokens: number;
  totalTokens: number;
  totalCalls: number;
  avgTokensPerCall: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function formatCost(n: number): string {
  if (n < 0.01) return n > 0 ? "<$0.01" : "$0.00";
  return `$${n.toFixed(2)}`;
}

const costConfig: {
  label: string;
  icon: string;
  color: string;
  getValue: (d: ApiCostData) => string;
  getSub: (d: ApiCostData) => string;
}[] = [
  {
    label: "今日成本",
    icon: "🔥",
    color: "text-bloom",
    getValue: (d) => formatCost(d.todayCost),
    getSub: (d) => `${formatTokens(d.todayTokens)} tokens`,
  },
  {
    label: "本月成本",
    icon: "📅",
    color: "text-sun",
    getValue: (d) => formatCost(d.monthlyCost),
    getSub: (d) => `${formatTokens(d.monthlyTokens)} tokens`,
  },
  {
    label: "累計成本",
    icon: "💵",
    color: "text-seed",
    getValue: (d) => formatCost(d.totalCost),
    getSub: (d) => `${d.totalCalls.toLocaleString()} 次呼叫`,
  },
  {
    label: "平均每次",
    icon: "⚙️",
    color: "text-sky",
    getValue: (d) => formatCost(d.avgTokensPerCall * 0.15 / 1_000_000),
    getSub: (d) => `${formatTokens(d.avgTokensPerCall)} tokens/call`,
  },
];

export default function CostCards({ data }: { data: ApiCostData }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {costConfig.map(({ label, icon, color, getValue, getSub }) => (
        <div
          key={label}
          className="bg-white rounded-2xl border border-mist/60 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg ${color}`}>{icon}</span>
            <span className="text-xs text-earth-light font-medium">{label}</span>
          </div>
          <div className="font-heading font-extrabold text-2xl text-earth">
            {getValue(data)}
          </div>
          <div className="text-[11px] text-earth-light mt-1">
            {getSub(data)}
          </div>
        </div>
      ))}
    </div>
  );
}
