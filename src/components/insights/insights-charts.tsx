"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  DollarSign,
  UtensilsCrossed,
  MapPin,
  Hash,
} from "lucide-react";
import { BehavioralRadarChart } from "@/components/profile/behavioral-radar-chart";

const COLORS = [
  "#f97316",
  "#fb923c",
  "#fdba74",
  "#fed7aa",
  "#ffedd5",
  "#ea580c",
  "#c2410c",
  "#9a3412",
];

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid #fed7aa",
  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  fontSize: 13,
};

interface InsightsChartsProps {
  summaryStats: {
    totalEntries: number;
    totalSpent: number;
    uniqueRestaurants: number;
    citiesVisited: number;
  };
  topRestaurants: {
    name: string;
    avgRating: number;
    visits: number;
  }[];
  monthlyActivity: { month: string; count: number }[];
  orderBreakdown: { name: string; count: number }[];
  spendingOverTime: { month: string; total: number }[];
  entriesWithCost: number;
  behavioralRadar: {
    adventurous: number;
    diversePalate: number | null;
    discerning: number;
    loyal: number;
  };
  categoryAverages: { name: string; avg: number }[];
  foodName: string;
  entryCount: number;
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 mb-4">{subtitle}</p>
      {children}
    </div>
  );
}

function ChartNudge({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-center">
      <p className="text-sm text-gray-400 max-w-[220px]">{message}</p>
    </div>
  );
}

export function InsightsCharts({
  summaryStats,
  topRestaurants,
  monthlyActivity,
  orderBreakdown,
  spendingOverTime,
  entriesWithCost,
  behavioralRadar,
  categoryAverages,
  foodName,
  entryCount,
}: InsightsChartsProps) {
  const hasSubtypes =
    orderBreakdown.length > 0 &&
    !(
      orderBreakdown.length === 1 &&
      orderBreakdown[0].name === "No order specified"
    );

  return (
    <div className="space-y-6 animate-stagger">
      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-orange-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <Hash size={16} className="text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {summaryStats.totalEntries}
            </div>
            <div className="text-[11px] text-gray-400">Total Chomps</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <DollarSign size={16} className="text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {summaryStats.totalSpent > 0
                ? `$${summaryStats.totalSpent.toFixed(0)}`
                : "--"}
            </div>
            <div className="text-[11px] text-gray-400">Total Spent</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed size={16} className="text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {summaryStats.uniqueRestaurants}
            </div>
            <div className="text-[11px] text-gray-400">Restaurants</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-orange-100 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-orange-500" />
          </div>
          <div>
            <div className="text-lg font-bold text-gray-900">
              {summaryStats.citiesVisited}
            </div>
            <div className="text-[11px] text-gray-400">Cities</div>
          </div>
        </div>
      </div>

      {/* Behavioral Radar - Food Personality */}
      {entryCount >= 5 ? (
        <ChartCard
          title={`Your ${foodName} Personality`}
          subtitle="What your eating habits reveal about you — hover an axis to learn more"
        >
          <BehavioralRadarChart radar={behavioralRadar} />
        </ChartCard>
      ) : entryCount > 0 ? (
        <ChartCard
          title={`Your ${foodName} Personality`}
          subtitle="What your eating habits reveal about you"
        >
          <ChartNudge message={`Log ${5 - entryCount} more chomp${5 - entryCount !== 1 ? "s" : ""} to unlock your ${foodName.toLowerCase()} personality profile`} />
        </ChartCard>
      ) : null}

      {/* Top Restaurants */}
      <ChartCard
        title="Top Restaurants"
        subtitle={`Your highest-rated ${foodName.toLowerCase()} spots`}
      >
        {topRestaurants.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topRestaurants}
                layout="vertical"
                margin={{ left: 0, right: 12 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f3f4f6"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  domain={[0, 5]}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  width={100}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value: number, _name: string, props: { payload?: { visits?: number } }) => {
                    const visits = props.payload?.visits;
                    return [
                      `${value.toFixed(1)} / 5.0 (${visits} visit${visits !== 1 ? "s" : ""})`,
                      "Avg Rating",
                    ];
                  }}
                />
                <Bar
                  dataKey="avgRating"
                  fill="#f97316"
                  radius={[0, 6, 6, 0]}
                  barSize={18}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <ChartNudge message="Rate a few spots to see your top restaurants here" />
        )}
      </ChartCard>

      {/* Two-column: Monthly Activity + Subtype Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Monthly Activity */}
        <ChartCard
          title={`${foodName} Activity`}
          subtitle={`How often you log ${foodName.toLowerCase()} each month`}
        >
          {monthlyActivity.length > 1 ? (
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
                    label={{ value: "Month", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={30}
                    label={{ value: "Chomps", angle: -90, position: "insideLeft", offset: 10, fontSize: 11, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number) => [
                      `${value} ${foodName.toLowerCase()} chomp${value !== 1 ? "s" : ""}`,
                      "",
                    ]}
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
          ) : (
            <ChartNudge message={`Log ${foodName.toLowerCase()} across multiple months to see your activity trend`} />
          )}
        </ChartCard>

        {/* Subtype Breakdown */}
        <ChartCard
          title={`${foodName} Orders`}
          subtitle={`What ${foodName.toLowerCase()} you order most`}
        >
          {hasSubtypes ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="name"
                  >
                    {orderBreakdown.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number, name: string) => [
                      `${value} chomp${value !== 1 ? "s" : ""}`,
                      name,
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartNudge message={`Add subtypes to your ${foodName.toLowerCase()} entries to see what you order most`} />
          )}
        </ChartCard>
      </div>

      {/* Two-column: Spending Over Time + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spending Over Time */}
        <ChartCard
          title={`${foodName} Spending`}
          subtitle={`How much you spend on ${foodName.toLowerCase()} each month`}
        >
          {entriesWithCost >= 3 && spendingOverTime.length > 1 ? (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spendingOverTime}>
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
                    label={{ value: "Month", position: "insideBottom", offset: -2, fontSize: 11, fill: "#9ca3af" }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                    tickFormatter={(v) => `$${v}`}
                    label={{ value: "Spent", angle: -90, position: "insideLeft", offset: 14, fontSize: 11, fill: "#9ca3af" }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value: number) => [
                      `$${value.toFixed(2)}`,
                      `${foodName} spending`,
                    ]}
                  />
                  <Bar
                    dataKey="total"
                    fill="#f97316"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ChartNudge message={`Track cost on your ${foodName.toLowerCase()} entries to unlock spending insights`} />
          )}
        </ChartCard>

        {/* Category Averages */}
        {categoryAverages.length > 0 && (
          <ChartCard
            title={`${foodName} Ratings`}
            subtitle={`Your average scores across rating categories`}
          >
            <div className="space-y-2">
              {categoryAverages.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{cat.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full"
                        style={{ width: `${(cat.avg / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-8 text-right tabular-nums">
                      {cat.avg}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        )}
      </div>
    </div>
  );
}
