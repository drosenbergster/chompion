import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InsightsCharts } from "@/components/insights/insights-charts";
import Link from "next/link";
import { Plus, BarChart3 } from "lucide-react";
import { FOOD_EMOJIS } from "@/lib/constants";
import { FoodThemeProvider } from "@/components/ui/food-theme-provider";
import { getFoodTheme } from "@/lib/themes";

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ food?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  if (!passionFoods || passionFoods.length === 0) redirect("/dashboard");

  const selectedFood = params.food
    ? passionFoods.find((f) => f.id === params.food)
    : undefined;
  const passionFood =
    selectedFood ?? passionFoods.find((f) => f.is_default) ?? passionFoods[0];

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

  if (entryCount === 0) {
    return (
      <div className="pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Insights</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="text-emerald-600" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No data yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Log your first chomp to start seeing insights about your{" "}
            {passionFood.name.toLowerCase()} journey.
          </p>
          <Link
            href="/entries/new"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <Plus size={20} />
            Log a Chomp
          </Link>
        </div>
      </div>
    );
  }

  const allEntries = entries ?? [];

  // --- Summary stats ---
  const totalSpent = allEntries.reduce(
    (sum, e) => sum + (e.cost ? Number(e.cost) : 0),
    0
  );
  const uniqueRestaurants = new Set(allEntries.map((e) => e.restaurant_name))
    .size;
  const citiesVisited = new Set(allEntries.map((e) => e.city)).size;

  const summaryStats = {
    totalEntries: entryCount,
    totalSpent,
    uniqueRestaurants,
    citiesVisited,
  };

  // 1. Top restaurants by average rating
  const restaurantMap: Record<
    string,
    { totalScore: number; count: number }
  > = {};
  allEntries.forEach((e) => {
    if (!e.composite_score) return;
    if (!restaurantMap[e.restaurant_name]) {
      restaurantMap[e.restaurant_name] = { totalScore: 0, count: 0 };
    }
    restaurantMap[e.restaurant_name].totalScore += Number(e.composite_score);
    restaurantMap[e.restaurant_name].count += 1;
  });
  const hasRepeatVisits = Object.values(restaurantMap).some(
    (r) => r.count >= 2
  );
  const topRestaurants = Object.entries(restaurantMap)
    .filter(([, data]) => (hasRepeatVisits ? data.count >= 2 : true))
    .map(([name, data]) => ({
      name,
      avgRating: Number((data.totalScore / data.count).toFixed(1)),
      visits: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 8);

  // 2. Monthly activity
  const monthlyCounts: Record<string, number> = {};
  allEntries.forEach((e) => {
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

  // 3. Subtype breakdown
  const orderCounts: Record<string, number> = {};
  allEntries.forEach((e) => {
    const name =
      e.subtypes && typeof e.subtypes === "object" && "name" in e.subtypes
        ? (e.subtypes as { name: string }).name
        : "No order specified";
    orderCounts[name] = (orderCounts[name] ?? 0) + 1;
  });
  const orderBreakdown = Object.entries(orderCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // 4. Spending over time
  const monthlySpend: Record<string, number> = {};
  allEntries.forEach((e) => {
    if (!e.cost) return;
    const d = new Date(e.eaten_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlySpend[key] = (monthlySpend[key] ?? 0) + Number(e.cost);
  });
  const spendingOverTime = Object.entries(monthlySpend)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => {
      const [y, m] = month.split("-");
      const label = new Date(Number(y), Number(m) - 1).toLocaleDateString(
        "en-US",
        { month: "short", year: "2-digit" }
      );
      return { month: label, total: Number(total.toFixed(2)) };
    });
  const entriesWithCost = allEntries.filter((e) => e.cost).length;

  // 5. Behavioral radar dimensions
  const scoredEntries = allEntries.filter((e) => e.composite_score);

  // Adventurous: unique restaurants / total entries
  const uniqueRestaurantCount = new Set(allEntries.map((e) => e.restaurant_name)).size;
  const adventurous = entryCount > 0
    ? (uniqueRestaurantCount / entryCount) * 5
    : 0;

  // Diverse Palate: unique subtypes / entries with subtypes
  const entriesWithSubtype = allEntries.filter(
    (e) =>
      e.subtypes &&
      typeof e.subtypes === "object" &&
      "name" in (e.subtypes as unknown as Record<string, unknown>) &&
      (e.subtypes as unknown as { name: string }).name !== "No order specified"
  );
  const uniqueSubtypes = new Set(
    entriesWithSubtype.map(
      (e) => (e.subtypes as unknown as { name: string }).name
    )
  ).size;
  const diversePalate =
    entriesWithSubtype.length > 0
      ? (uniqueSubtypes / entriesWithSubtype.length) * 5
      : null;

  // Discerning: score standard deviation normalized (0-5)
  let discerning = 0;
  if (scoredEntries.length >= 2) {
    const scores = scoredEntries.map((e) => Number(e.composite_score));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    discerning = Math.min(stdDev / 1.2, 1) * 5;
  }

  // Loyal: max visits to single restaurant / total entries
  const restaurantVisits: Record<string, number> = {};
  allEntries.forEach((e) => {
    restaurantVisits[e.restaurant_name] =
      (restaurantVisits[e.restaurant_name] ?? 0) + 1;
  });
  const maxVisits = Math.max(0, ...Object.values(restaurantVisits));
  const loyal = entryCount > 0 ? (maxVisits / entryCount) * 5 : 0;

  // Category averages for inline display
  const catScores: Record<string, { total: number; count: number }> = {};
  allEntries.forEach((e) => {
    const ratings = e.entry_ratings as unknown as {
      score: number;
      rating_categories: { name: string; weight: number };
    }[];
    if (!ratings) return;
    ratings.forEach((r) => {
      const catName = r.rating_categories?.name;
      if (!catName) return;
      if (!catScores[catName]) catScores[catName] = { total: 0, count: 0 };
      catScores[catName].total += r.score;
      catScores[catName].count += 1;
    });
  });
  const categoryAverages = Object.entries(catScores).map(([name, data]) => ({
    name,
    avg: Number((data.total / data.count).toFixed(1)),
  }));

  const behavioralRadar = {
    adventurous: Number(Math.min(adventurous, 5).toFixed(1)),
    diversePalate: diversePalate !== null ? Number(Math.min(diversePalate, 5).toFixed(1)) : null,
    discerning: Number(Math.min(discerning, 5).toFixed(1)),
    loyal: Number(Math.min(loyal, 5).toFixed(1)),
  };

  // Price vs Quality scatter data
  const priceVsQuality = allEntries
    .filter((e) => e.cost && e.composite_score)
    .map((e) => ({
      name: e.restaurant_name,
      cost: Number(e.cost),
      rating: Number(e.composite_score),
    }));

  const theme = getFoodTheme(passionFood.theme_key);

  return (
    <FoodThemeProvider themeKey={passionFood.theme_key} className="pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm text-gray-500">
            {passionFood.name} stats from {entryCount} chomps
          </p>
        </div>
      </div>

      {passionFoods.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-6">
          {passionFoods.map((food) => (
            <Link
              key={food.id}
              href={`/insights?food=${food.id}`}
              className={`flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold transition-colors ${
                food.id === passionFood.id
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
              }`}
              style={
                food.id === passionFood.id
                  ? { backgroundColor: "var(--food-primary)" }
                  : undefined
              }
            >
              {FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic} {food.name}
            </Link>
          ))}
        </div>
      )}

      <InsightsCharts
        summaryStats={summaryStats}
        topRestaurants={topRestaurants}
        monthlyActivity={monthlyActivity}
        orderBreakdown={orderBreakdown}
        spendingOverTime={spendingOverTime}
        entriesWithCost={entriesWithCost}
        behavioralRadar={behavioralRadar}
        categoryAverages={categoryAverages}
        priceVsQuality={priceVsQuality}
        foodName={passionFood.name}
        entryCount={entryCount}
        themeColors={theme.chart}
        themePrimary={theme.primary}
        themeTint={theme.tint}
      />
    </FoodThemeProvider>
  );
}
