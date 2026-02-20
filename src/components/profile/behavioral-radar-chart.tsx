"use client";

import { useState } from "react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface BehavioralRadarProps {
  radar: {
    adventurous: number;
    diversePalate: number | null;
    discerning: number;
    loyal: number;
  };
}

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #fed7aa",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  fontSize: 13,
};

const AXIS_DEFINITIONS: Record<string, string> = {
  Adventurous:
    "How often you try new restaurants vs revisiting the same ones. Higher = more unique spots.",
  Diverse:
    "How many different items you order vs sticking to the same thing. Higher = more variety.",
  Discerning:
    "How much your ratings vary across entries. Higher = strong opinions about what's good and what's not.",
  Loyal:
    "How much you return to your favorite spot. Higher = a clear go-to restaurant.",
};

function AxisTick({
  x,
  y,
  payload,
}: {
  x: number;
  y: number;
  payload: { value: string };
}) {
  const [hovered, setHovered] = useState(false);
  const trait = payload.value;
  const definition = AXIS_DEFINITIONS[trait] ?? "";

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: "help" }}
    >
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fill={hovered ? "#f97316" : "#6b7280"}
        fontWeight={hovered ? 600 : 400}
        style={{ transition: "fill 0.15s, font-weight 0.15s" }}
        textDecoration={hovered ? "underline" : "none"}
      >
        {trait}
      </text>
      {hovered && definition && (
        <foreignObject
          x={x - 110}
          y={y + 14}
          width={220}
          height={80}
          style={{ overflow: "visible", pointerEvents: "none" }}
        >
          <div
            style={{
              background: "white",
              border: "1px solid #fed7aa",
              borderRadius: 10,
              padding: "6px 10px",
              fontSize: 11,
              lineHeight: "1.4",
              color: "#374151",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            {definition}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

export function BehavioralRadarChart({ radar }: BehavioralRadarProps) {
  const data: { trait: string; score: number }[] = [
    { trait: "Adventurous", score: radar.adventurous },
    { trait: "Discerning", score: radar.discerning },
    { trait: "Loyal", score: radar.loyal },
  ];

  if (radar.diversePalate !== null) {
    data.splice(2, 0, { trait: "Diverse", score: radar.diversePalate });
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis
          dataKey="trait"
          tick={(props: { x: number; y: number; payload: { value: string } }) => (
            <AxisTick x={props.x} y={props.y} payload={props.payload} />
          )}
        />
        <PolarRadiusAxis
          domain={[0, 5]}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickCount={6}
        />
        <Radar
          name="You"
          dataKey="score"
          stroke="#f97316"
          fill="#f97316"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(value: number) => [`${value.toFixed(1)} / 5.0`, "Score"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
