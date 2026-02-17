import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InsightsCharts } from "@/components/insights/insights-charts";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";

export default async function InsightsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: passionFood } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (!passionFood) redirect("/dashboard");

  const { data: entries } = await supabase
    .from("entries")
    .select(
      `
      id,
      restaurant_name,
      city,
      composite_score,
      cost,
      quantity,
      eaten_at,
      subtype_id,
      subtypes ( name ),
      entry_ratings (
        score,
        rating_categories ( name, weight )
      )
    `
    )
    .eq("passion_food_id", passionFood.id)
    .order("eaten_at", { ascending: true });

  const entryCount = entries?.length ?? 0;

  if (entryCount < 3) {
    return (
      <div className="pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Insights</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="text-orange-500" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Almost there!
          </h3>
          <p className="text-gray-500 mb-2 max-w-sm mx-auto">
            Log a few more chomps to unlock your insights.
          </p>
          <div className="flex items-center justify-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  i < entryCount
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
          <p className="text-sm text-orange-600 font-medium mb-6">
            {entryCount}/3 chomps logged
          </p>
          <Link
            href="/entries/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <Plus size={20} />
            Log a Chomp
          </Link>
        </div>
      </div>
    );
  }

  // Compute chart data server-side

  // 1. Rating over time
  const ratingOverTime = (entries ?? [])
    .filter((e) => e.composite_score)
    .map((e) => ({
      date: new Date(e.eaten_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: Number(Number(e.composite_score).toFixed(1)),
      restaurant: e.restaurant_name,
    }));

  // 2. Order breakdown (subtypes)
  const orderCounts: Record<string, number> = {};
  (entries ?? []).forEach((e) => {
    const name =
      e.subtypes && typeof e.subtypes === "object" && "name" in e.subtypes
        ? (e.subtypes as { name: string }).name
        : "No order specified";
    orderCounts[name] = (orderCounts[name] ?? 0) + 1;
  });
  const orderBreakdown = Object.entries(orderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 3. City breakdown
  const cityCounts: Record<string, number> = {};
  (entries ?? []).forEach((e) => {
    const city = e.city;
    cityCounts[city] = (cityCounts[city] ?? 0) + 1;
  });
  const cityBreakdown = Object.entries(cityCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Rating category radar
  const categoryScores: Record<string, { total: number; count: number }> = {};
  (entries ?? []).forEach((e) => {
    const ratings = e.entry_ratings as unknown as {
      score: number;
      rating_categories: { name: string; weight: number };
    }[];
    if (!ratings) return;
    ratings.forEach((r) => {
      const catName = r.rating_categories?.name;
      if (!catName) return;
      if (!categoryScores[catName]) {
        categoryScores[catName] = { total: 0, count: 0 };
      }
      categoryScores[catName].total += r.score;
      categoryScores[catName].count += 1;
    });
  });
  const radarData = Object.entries(categoryScores).map(([name, data]) => ({
    category: name,
    score: Number((data.total / data.count).toFixed(2)),
  }));

  // 5. Cost vs rating scatter
  const costVsRating = (entries ?? [])
    .filter((e) => e.cost && e.composite_score)
    .map((e) => ({
      cost: Number(e.cost),
      rating: Number(Number(e.composite_score).toFixed(1)),
      restaurant: e.restaurant_name,
    }));

  // 6. Monthly activity
  const monthlyCounts: Record<string, number> = {};
  (entries ?? []).forEach((e) => {
    const d = new Date(e.eaten_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyCounts[key] = (monthlyCounts[key] ?? 0) + 1;
  });
  const monthlyActivity = Object.entries(monthlyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => {
      const [y, m] = month.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(
        "en-US",
        { month: "short", year: "2-digit" }
      );
      return { month: label, count };
    });

  return (
    <div className="pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm text-gray-500">
            {passionFood.name} stats from {entryCount} chomps
          </p>
        </div>
      </div>

      <InsightsCharts
        ratingOverTime={ratingOverTime}
        orderBreakdown={orderBreakdown}
        cityBreakdown={cityBreakdown}
        radarData={radarData}
        costVsRating={costVsRating}
        monthlyActivity={monthlyActivity}
        foodName={passionFood.name}
      />
    </div>
  );
}
