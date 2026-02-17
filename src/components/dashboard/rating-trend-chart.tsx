"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  label: string;
  score: number;
}

interface RatingTrendChartProps {
  data: DataPoint[];
}

export function RatingTrendChart({ data }: RatingTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          domain={[0, 5]}
          ticks={[1, 2, 3, 4, 5]}
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: "12px",
            border: "1px solid #fed7aa",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            fontSize: "13px",
          }}
          formatter={(value: number) => [value.toFixed(1), "Rating"]}
          labelFormatter={(label: string) => label}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#f97316"
          strokeWidth={2.5}
          dot={{ fill: "#f97316", r: 3 }}
          activeDot={{ r: 5, fill: "#ea580c" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
