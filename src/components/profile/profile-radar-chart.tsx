"use client";

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RadarDataPoint {
  category: string;
  score: number;
}

interface ProfileRadarChartProps {
  data: RadarDataPoint[];
}

export function ProfileRadarChart({ data }: ProfileRadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "#6b7280" }}
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickCount={6}
        />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #fed7aa",
            fontSize: 13,
          }}
          formatter={(value: number) => [
            `${value.toFixed(1)} / 5.0`,
            "Avg Score",
          ]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
