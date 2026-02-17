"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = [
  "#f97316",
  "#fb923c",
  "#fdba74",
  "#fed7aa",
  "#ffedd5",
  "#ea580c",
  "#c2410c",
  "#9a3412",
  "#7c2d12",
  "#431407",
];

interface InsightsChartsProps {
  ratingOverTime: { date: string; score: number; restaurant: string }[];
  orderBreakdown: { name: string; count: number }[];
  cityBreakdown: { name: string; count: number }[];
  radarData: { category: string; score: number }[];
  costVsRating: { cost: number; rating: number; restaurant: string }[];
  monthlyActivity: { month: string; count: number }[];
  foodName: string;
}

export function InsightsCharts({
  ratingOverTime,
  orderBreakdown,
  cityBreakdown,
  radarData,
  costVsRating,
  monthlyActivity,
  foodName,
}: InsightsChartsProps) {
  return (
    <div className="space-y-6 animate-stagger">
      {/* Rating Over Time */}
      {ratingOverTime.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">
            Rating Over Time
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Are your {foodName.toLowerCase()} getting better?
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ratingOverTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #fed7aa",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)} / 5.0`,
                    "Rating",
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: "#f97316", r: 4 }}
                  activeDot={{ r: 6, fill: "#ea580c" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two-column: Order Breakdown + City Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Breakdown Donut */}
        {orderBreakdown.length > 0 &&
          !(
            orderBreakdown.length === 1 &&
            orderBreakdown[0].name === "No order specified"
          ) && (
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-1">
                Order Breakdown
              </h3>
              <p className="text-xs text-gray-400 mb-4">
                What you order most
              </p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                    >
                      {orderBreakdown.map((_, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #fed7aa",
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [`${value}`, "Entries"]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

        {/* City Breakdown */}
        {cityBreakdown.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">
              By City
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Where you&apos;ve been chomping
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={cityBreakdown}
                  layout="vertical"
                  margin={{ left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f3f4f6"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    width={90}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #fed7aa",
                      fontSize: 13,
                    }}
                    formatter={(value: number) => [`${value}`, "Entries"]}
                  />
                  <Bar
                    dataKey="count"
                    fill="#f97316"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Rating Category Radar */}
      {radarData.length >= 3 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">
            Your Taste Profile
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Average score across all rating categories
          </p>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis
                  dataKey="category"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
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
          </div>
        </div>
      )}

      {/* Cost vs Rating Scatter */}
      {costVsRating.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">
            Cost vs. Rating
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Finding the best value
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="cost"
                  type="number"
                  name="Cost"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  dataKey="rating"
                  type="number"
                  name="Rating"
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #fed7aa",
                    fontSize: 13,
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "Cost") return [`$${value.toFixed(2)}`, name];
                    return [`${value.toFixed(1)} / 5.0`, name];
                  }}
                  labelFormatter={() => ""}
                />
                <Scatter
                  data={costVsRating}
                  fill="#f97316"
                  fillOpacity={0.7}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Monthly Activity */}
      {monthlyActivity.length > 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-1">
            Monthly Activity
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            Your chomping frequency
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivity}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={25}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #fed7aa",
                    fontSize: 13,
                  }}
                  formatter={(value: number) => [`${value}`, "Chomps"]}
                />
                <Bar
                  dataKey="count"
                  fill="#f97316"
                  radius={[6, 6, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
