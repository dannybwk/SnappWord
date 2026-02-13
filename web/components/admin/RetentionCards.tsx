"use client";

interface RetentionMetric {
  rate: number;
  retained: number;
  eligible: number;
}

interface RetentionData {
  d1: RetentionMetric;
  d7: RetentionMetric;
  d30: RetentionMetric;
}

const retentionConfig: { key: keyof RetentionData; label: string; desc: string }[] = [
  { key: "d1", label: "D1", desc: "隔日留存" },
  { key: "d7", label: "D7", desc: "七日留存" },
  { key: "d30", label: "D30", desc: "三十日留存" },
];

function rateColor(rate: number): string {
  if (rate >= 50) return "text-sprout";
  if (rate >= 25) return "text-yellow-600";
  return "text-bloom";
}

function rateBg(rate: number): string {
  if (rate >= 50) return "bg-sprout/10";
  if (rate >= 25) return "bg-yellow-50";
  return "bg-bloom/10";
}

export default function RetentionCards({ data }: { data: RetentionData }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {retentionConfig.map(({ key, label, desc }) => {
        const m = data[key];
        return (
          <div
            key={key}
            className={`rounded-2xl border border-mist/60 p-4 text-center ${rateBg(m.rate)}`}
          >
            <div className="text-xs text-earth-light font-medium mb-1">
              {label} {desc}
            </div>
            <div className={`font-heading font-extrabold text-3xl ${rateColor(m.rate)}`}>
              {m.rate}
              <span className="text-sm font-medium ml-0.5">%</span>
            </div>
            <div className="text-[11px] text-earth-light mt-1">
              {m.retained}/{m.eligible} 人
            </div>
          </div>
        );
      })}
    </div>
  );
}
