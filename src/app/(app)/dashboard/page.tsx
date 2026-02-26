import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Plus,
  Star,
  MapPin,
  TrendingUp,
  Flame,
  ChevronRight,
  Lightbulb,
  Compass,
  DollarSign,
  TrendingDown,
  Repeat,
} from "lucide-react";
import { SuccessToast } from "@/components/ui/success-toast";
import { WelcomeTutorial } from "@/components/tutorial/welcome-tutorial";
import { FOOD_EMOJIS } from "@/lib/constants";
import { FoodThemeProvider } from "@/components/ui/food-theme-provider";

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  d.setDate(d.getDate() - dayOfWeek);
  return d.toISOString().slice(0, 10);
}

function calculateStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const weekSet = new Set(dates.map((d) => getWeekKey(d)));
  const now = new Date();
  let streak = 0;
  const checkDate = new Date(now);
  while (true) {
    const weekKey = getWeekKey(checkDate);
    if (weekSet.has(weekKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 7);
    } else {
      break;
    }
  }
  return streak;
}

interface Insight {
  icon: React.ReactNode;
  text: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; food?: string }>;
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

  const hasNoFoods = !passionFoods || passionFoods.length === 0;

  if (hasNoFoods) {
    return (
      <div className="pb-20 md:pb-8">
        <WelcomeTutorial />
      </div>
    );
  }

  const selectedFood = params.food
    ? passionFoods.find((f) => f.id === params.food)
    : undefined;
  const defaultFood =
    selectedFood ?? passionFoods.find((f) => f.is_default) ?? passionFoods[0];

  const foodEmoji = FOOD_EMOJIS[defaultFood.theme_key] ?? FOOD_EMOJIS.generic;

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
      notes,
      subtypes ( name )
    `
    )
    .eq("passion_food_id", defaultFood.id)
    .order("eaten_at", { ascending: false });

  const entryCount = entries?.length ?? 0;
  const ratedEntries = (entries ?? []).filter((e) => e.composite_score);

  const avgRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce(
          (sum, e) => sum + Number(e.composite_score),
          0
        ) / ratedEntries.length
      : null;

  const streak = calculateStreak(
    (entries ?? []).map((e) => new Date(e.eaten_at))
  );

  const restaurantCounts: Record<string, number> = {};
  (entries ?? []).forEach((e) => {
    restaurantCounts[e.restaurant_name] =
      (restaurantCounts[e.restaurant_name] ?? 0) + 1;
  });
  const mostVisited = Object.entries(restaurantCounts).sort(
    (a, b) => b[1] - a[1]
  )[0];

  const topRated = [...(entries ?? [])]
    .filter((e) => e.composite_score)
    .sort((a, b) => Number(b.composite_score) - Number(a.composite_score))
    .slice(0, 3);

  const recentEntries = (entries ?? []).slice(0, 5);

  const totalSpent = (entries ?? []).reduce(
    (sum, e) => sum + (e.cost ? Number(e.cost) : 0),
    0
  );
  const uniqueCities = new Set((entries ?? []).map((e) => e.city)).size;
  const uniqueRestaurants = new Set(
    (entries ?? []).map((e) => e.restaurant_name)
  ).size;

  const foodNameLower = defaultFood.name.toLowerCase();

  // --- Headline ---
  function pickHeadline(): string {
    if (entryCount === 0) return `Your ${foodNameLower} journey starts now.`;
    const options: string[] = [];
    if (streak >= 3)
      options.push(`${streak}-week streak. Absolute machine.`);
    if (entryCount >= 10)
      options.push(`${entryCount} ${foodNameLower} and counting.`);
    if (totalSpent >= 100)
      options.push(
        `$${Math.round(totalSpent).toLocaleString()} spent on ${foodNameLower}. Worth every cent.`
      );
    if (mostVisited && mostVisited[1] >= 3)
      options.push(
        `${mostVisited[0]} — ${mostVisited[1]} visits. You're a regular.`
      );
    if (uniqueRestaurants >= 5 && mostVisited)
      options.push(
        `${uniqueRestaurants} spots tried. But you keep going back to ${mostVisited[0]}.`
      );
    if (uniqueCities >= 3)
      options.push(
        `${entryCount} ${foodNameLower} across ${uniqueCities} cities.`
      );
    if (options.length === 0)
      return `${entryCount} ${foodNameLower} logged. The journey continues.`;
    const dayIndex = new Date().getDate() % options.length;
    return options[dayIndex];
  }

  // --- Insight spotlights ---
  function buildInsights(): Insight[] {
    const all: Insight[] = [];

    // Best value: highest score / lowest cost
    const withCostAndRating = (entries ?? []).filter(
      (e) => e.cost && Number(e.cost) > 0 && e.composite_score
    );
    if (withCostAndRating.length >= 2) {
      const best = [...withCostAndRating].sort(
        (a, b) =>
          Number(b.composite_score) / Number(b.cost) -
          Number(a.composite_score) / Number(a.cost)
      )[0];
      all.push({
        icon: <DollarSign size={14} />,
        text: `Best value: ${best.restaurant_name} — ${Number(best.composite_score).toFixed(1)} for $${Number(best.cost).toFixed(0)}`,
      });
    }

    // Rating trend: last 5 vs previous 5
    if (ratedEntries.length >= 6) {
      const recent5 = ratedEntries.slice(0, 5);
      const prev5 = ratedEntries.slice(5, 10);
      const recentAvg =
        recent5.reduce((s, e) => s + Number(e.composite_score), 0) /
        recent5.length;
      const prevAvg =
        prev5.reduce((s, e) => s + Number(e.composite_score), 0) /
        prev5.length;
      const diff = recentAvg - prevAvg;
      if (Math.abs(diff) >= 0.1) {
        const direction = diff > 0 ? "up" : "down";
        const Icon = diff > 0 ? TrendingUp : TrendingDown;
        all.push({
          icon: <Icon size={14} />,
          text: `Ratings trending ${direction}: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} over your last 5`,
        });
      }
    }

    // Discovery rate: new restaurants this month vs last
    const now = new Date();
    const thisMonth = (entries ?? []).filter((e) => {
      const d = new Date(e.eaten_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const thisMonthNewSpots = new Set(thisMonth.map((e) => e.restaurant_name));
    if (thisMonthNewSpots.size >= 2) {
      all.push({
        icon: <Compass size={14} />,
        text: `${thisMonthNewSpots.size} spots visited this month`,
      });
    }

    // Go-to pattern: most common subtype at most visited spot
    if (mostVisited && mostVisited[1] >= 2) {
      const atFav = (entries ?? []).filter(
        (e) => e.restaurant_name === mostVisited[0]
      );
      const subtypeCounts: Record<string, number> = {};
      atFav.forEach((e) => {
        const sn =
          e.subtypes &&
          typeof e.subtypes === "object" &&
          "name" in e.subtypes
            ? (e.subtypes as { name: string }).name
            : null;
        if (sn) subtypeCounts[sn] = (subtypeCounts[sn] ?? 0) + 1;
      });
      const topSubtype = Object.entries(subtypeCounts).sort(
        (a, b) => b[1] - a[1]
      )[0];
      if (topSubtype) {
        all.push({
          icon: <Repeat size={14} />,
          text: `Your go-to: ${mostVisited[0]} ${topSubtype[0].toLowerCase()} (${mostVisited[1]} visits)`,
        });
      }
    }

    // Most adventurous city
    if (uniqueCities >= 2) {
      const cityRestaurants: Record<string, Set<string>> = {};
      (entries ?? []).forEach((e) => {
        if (!cityRestaurants[e.city]) cityRestaurants[e.city] = new Set();
        cityRestaurants[e.city].add(e.restaurant_name);
      });
      const topCity = Object.entries(cityRestaurants).sort(
        (a, b) => b[1].size - a[1].size
      )[0];
      if (topCity[1].size >= 2) {
        all.push({
          icon: <Compass size={14} />,
          text: `Most explored: ${topCity[0]} (${topCity[1].size} unique spots)`,
        });
      }
    }

    return all;
  }

  const headline = pickHeadline();
  const insights = buildInsights();
  const dayIndex = new Date().getDate();
  const visibleInsights = insights.length <= 2
    ? insights
    : [
        insights[dayIndex % insights.length],
        insights[(dayIndex + 1) % insights.length],
      ].filter(
        (v, i, a) => a.indexOf(v) === i
      );

  const successMessage =
    params.success === "1"
      ? "Chomp logged!"
      : params.success === "updated"
        ? "Chomp updated!"
        : params.success === "welcome"
          ? "Welcome to Chompion!"
          : null;

  return (
    <FoodThemeProvider themeKey={defaultFood.theme_key} className="space-y-5 pb-20 md:pb-8">
      {successMessage && <SuccessToast message={successMessage} />}

      {/* Food tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {passionFoods.map((food) => (
          <Link
            key={food.id}
            href={`/dashboard?food=${food.id}`}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              food.id === defaultFood.id
                ? "text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
            style={
              food.id === defaultFood.id
                ? { backgroundColor: "var(--food-primary)" }
                : undefined
            }
          >
            {FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic} {food.name}
          </Link>
        ))}
        <Link
          href="/passion-foods"
          className="flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium text-emerald-600 border border-dashed border-emerald-300 hover:bg-emerald-50 transition-colors"
        >
          + Add
        </Link>
      </div>

      {/* Hero headline + stat pills */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight mb-3">
          {foodEmoji} {headline}
        </h2>

        {entryCount > 0 && (
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "var(--food-tint)", color: "var(--food-primary)" }}
            >
              {entryCount} chomps
            </span>
            {avgRating && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "var(--food-tint)", color: "var(--food-primary)" }}
              >
                <Star size={10} className="fill-current" />
                {avgRating.toFixed(1)} avg
              </span>
            )}
            {streak > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "var(--food-tint)", color: "var(--food-primary)" }}
              >
                <Flame size={10} className="text-amber-500" />
                {streak}wk streak
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: "var(--food-tint)", color: "var(--food-primary)" }}
            >
              <MapPin size={10} />
              {uniqueRestaurants} spots
            </span>
            {totalSpent > 0 && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: "var(--food-tint)", color: "var(--food-primary)" }}
              >
                ${Math.round(totalSpent)} spent
              </span>
            )}
          </div>
        )}
      </div>

      {/* Insight spotlights */}
      {visibleInsights.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {visibleInsights.map((insight, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 px-4 py-3"
              style={{ borderLeftWidth: 3, borderLeftColor: "var(--food-primary)" }}
            >
              <span style={{ color: "var(--food-primary)" }}>{insight.icon}</span>
              <span className="text-sm text-gray-700">{insight.text}</span>
            </div>
          ))}
        </div>
      )}

      {entryCount === 0 && (
        <Link
          href="/entries/new"
          className="flex items-center gap-4 rounded-2xl p-4 transition-colors group animate-fade-in hover:opacity-80"
          style={{ backgroundColor: "var(--food-tint)" }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ backgroundColor: "var(--food-primary)" }}
          >
            <Plus size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Ready to log your first {foodNameLower}?
            </p>
            <p className="text-xs text-gray-500">
              Tap here to get your stats rolling
            </p>
          </div>
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        </Link>
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} style={{ color: "var(--food-primary)" }} />
            <h3 className="font-semibold text-gray-900">Top Rated</h3>
          </div>
          <div className="space-y-3">
            {topRated.map((entry, i) => {
              const subtypeName =
                entry.subtypes &&
                typeof entry.subtypes === "object" &&
                "name" in entry.subtypes
                  ? (entry.subtypes as { name: string }).name
                  : null;

              return (
                <Link
                  key={entry.id}
                  href={`/entries/${entry.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{
                      backgroundColor: "var(--food-tint)",
                      color: "var(--food-primary)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate group-hover:opacity-70 transition-opacity">
                      {entry.restaurant_name}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} />
                      {entry.city}
                      {subtypeName && (
                        <span style={{ color: "var(--food-primary-light)" }} className="ml-1">
                          &middot; {subtypeName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="flex items-center gap-px">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const score = Number(entry.composite_score);
                        const filled = score >= star;
                        const half = !filled && score >= star - 0.5;
                        return (
                          <Star
                            key={star}
                            size={12}
                            className={
                              filled
                                ? "text-amber-400 fill-amber-400"
                                : half
                                  ? "text-amber-400 fill-amber-200"
                                  : "text-gray-200 fill-gray-100"
                            }
                          />
                        );
                      })}
                    </div>
                    <span
                      className="text-xs font-bold tabular-nums"
                      style={{ color: "var(--food-primary)" }}
                    >
                      {Number(entry.composite_score).toFixed(1)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Chomps</h3>
            <Link
              href="/entries"
              className="text-sm font-medium"
              style={{ color: "var(--food-primary)" }}
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/entries/${entry.id}`}
                className="flex items-center justify-between group"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate group-hover:opacity-70 transition-opacity">
                    {entry.restaurant_name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {entry.cost && (
                      <span> &middot; ${Number(entry.cost).toFixed(2)}</span>
                    )}
                  </div>
                </div>
                {entry.composite_score && (
                  <div
                    className="text-sm font-semibold flex-shrink-0"
                    style={{ color: "var(--food-primary)" }}
                  >
                    {Number(entry.composite_score).toFixed(1)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </FoodThemeProvider>
  );
}
