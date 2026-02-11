"use client";

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
import { weeklyStats, languageDistribution } from "@/lib/constants";

export function WeeklyChart() {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-4">本週截圖數</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={[...weeklyStats]}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#636e72" }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #DFE6E9",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value} 張`, "截圖"]}
            />
            <Bar
              dataKey="screenshots"
              fill="#06C755"
              radius={[6, 6, 0, 0]}
              maxBarSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function LanguagePieChart() {
  const data = [...languageDistribution];

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-4">語言分佈</h3>
      <div className="h-40 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={60}
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
      <div className="flex flex-wrap gap-2 mt-2">
        {data.map((d) => (
          <span key={d.name} className="flex items-center gap-1.5 text-xs text-earth-light">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export function MasteryRing() {
  const mastered = 68;
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (mastered / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-5 flex flex-col items-center">
      <h3 className="font-heading font-bold text-sm text-earth mb-4 self-start">掌握率</h3>
      <svg width="100" height="100" viewBox="0 0 100 100">
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
          {mastered}%
        </text>
        <text
          x="50" y="62"
          textAnchor="middle"
          fontSize="9" fill="#636e72"
        >
          已掌握
        </text>
      </svg>
    </div>
  );
}
