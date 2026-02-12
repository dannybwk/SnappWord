"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #DFE6E9",
  fontSize: "12px",
};

interface DistItem {
  name: string;
  value: number;
}

const langColors: Record<string, string> = {
  en: "#74B9FF",
  ja: "#FFB7C5",
  ko: "#FFE66D",
  es: "#06C755",
  fr: "#A8E6CF",
  de: "#DFE6E9",
  "zh-TW": "#FFB7C5",
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

const sourceAppColors: Record<string, string> = {
  Duolingo: "#58CC02",
  Netflix: "#E50914",
  YouTube: "#FF0000",
};

const tierColors: Record<string, string> = {
  free: "#DFE6E9",
  sprout: "#06C755",
  bloom: "#FFB7C5",
};

const defaultColors = ["#74B9FF", "#FFB7C5", "#06C755", "#FFE66D", "#A8E6CF", "#DFE6E9"];

function DonutChart({
  title,
  data,
  colorMap,
  labelMap,
}: {
  title: string;
  data: DistItem[];
  colorMap?: Record<string, string>;
  labelMap?: Record<string, string>;
}) {
  const colored = data.map((d, i) => ({
    ...d,
    displayName: labelMap?.[d.name] || d.name,
    fill: colorMap?.[d.name] || defaultColors[i % defaultColors.length],
  }));

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">{title}</h3>
      {colored.length === 0 ? (
        <div className="h-28 flex items-center justify-center text-earth-light text-sm">
          尚無資料
        </div>
      ) : (
        <>
          <div className="h-28 sm:h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={colored}
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={45}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="displayName"
                >
                  {colored.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, name) => [`${value} 個`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {colored.map((d) => (
              <span
                key={d.name}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-earth-light"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: d.fill }}
                />
                {d.displayName} ({d.value})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface DistributionsProps {
  languages: DistItem[];
  sourceApps: DistItem[];
  tiers: DistItem[];
}

export default function DistributionCharts({ languages, sourceApps, tiers }: DistributionsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <DonutChart
        title="語言分佈"
        data={languages}
        colorMap={langColors}
        labelMap={langMap}
      />
      <DonutChart
        title="來源 App"
        data={sourceApps}
        colorMap={sourceAppColors}
      />
      <DonutChart
        title="方案分佈"
        data={tiers}
        colorMap={tierColors}
        labelMap={{ free: "免費", sprout: "嫩芽", bloom: "綻放" }}
      />
    </div>
  );
}
