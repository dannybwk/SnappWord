"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const tooltipStyle = {
  borderRadius: "12px",
  border: "1px solid #DFE6E9",
  fontSize: "12px",
};

const axisTickStyle = { fontSize: 11, fill: "#636e72" };

function formatDate(label: unknown): string {
  const d = new Date(String(label));
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTick(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface DailyCount {
  date: string;
  count: number;
}

interface DailyRate {
  date: string;
  rate: number;
}

export function UserGrowthChart({ data }: { data: DailyCount[] }) {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">
        每日新用戶
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              tickFormatter={formatDateTick}
              interval="preserveStartEnd"
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={formatDate}
              formatter={(value) => [`${value} 人`, "新用戶"]}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#74B9FF"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function DailyCardsChart({ data }: { data: DailyCount[] }) {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">
        每日新單字
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              tickFormatter={formatDateTick}
              interval="preserveStartEnd"
            />
            <YAxis hide allowDecimals={false} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={formatDate}
              formatter={(value) => [`${value} 個`, "單字"]}
            />
            <Bar
              dataKey="count"
              fill="#06C755"
              radius={[4, 4, 0, 0]}
              maxBarSize={16}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ErrorRateChart({ data }: { data: DailyRate[] }) {
  return (
    <div className="bg-white rounded-2xl border border-mist/60 p-4 sm:p-5">
      <h3 className="font-heading font-bold text-sm text-earth mb-3">
        每日錯誤率
      </h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={axisTickStyle}
              tickFormatter={formatDateTick}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={tooltipStyle}
              labelFormatter={formatDate}
              formatter={(value) => [`${value}%`, "錯誤率"]}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#FFB7C5"
              fill="#ffe0e6"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
