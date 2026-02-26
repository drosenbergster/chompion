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
  UtensilsCrossed,
  Trophy,
  BarChart3,
} from "lucide-react";
import { SuccessToast } from "@/components/ui/success-toast";
import { WelcomeTutorial } from "@/components/tutorial/welcome-tutorial";
import { FOOD_EMOJIS } from "@/lib/constants";

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

interface SmartRanking {
  title: string;
  icon: React.ReactNode;
  items: { name: string; subtitle: string; score: number | null; id?: string }[];
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

  // Fetch ALL user entries (not filtered by collection)
  const { data: allEntries } = await supabase
    .from("entries")
    .select(`
      id, restaurant_name, city, composite_score, cost, quantity,
      eaten_at, notes, cuisine, passion_food_id,
      entry_dishes ( name, rating, sort_order )
    `)
    .eq("user_id", user.id)
    .order("eaten_at", { ascending: false });

  const entries = allEntries ?? [];
  const entryCount = entries.length;

  const hasNoData = entryCount === 0 && (!passionFoods || passionFoods.length === 0);

  if (hasNoData) {
    return (
      <div className="pb-20 md:pb-8">
        <WelcomeTutorial />
      </div>
    );
  }

  // --- Aggregate stats ---
  const ratedEntries = entries.filter((e) => e.composite_score);
  const avgRating =
    ratedEntries.length > 0
      ? ratedEntries.reduce((sum, e) => sum + Number(e.composite_score), 0) / ratedEntries.length
      : null;
  const streak = calculateStreak(entries.map((e) => new Date(e.eaten_at)));
  const uniqueRestaurants = new Set(entries.map((e) => e.restaurant_name)).size;
  const uniqueCities = new Set(entries.map((e) => e.city)).size;
  const totalSpent = entries.reduce((sum, e) => sum + (e.cost ? Number(e.cost) : 0), 0);

  const restaurantCounts: Record<string, number> = {};
  entries.forEach((e) => {
    restaurantCounts[e.restaurant_name] = (restaurantCounts[e.restaurant_name] ?? 0) + 1;
  });
  const mostVisited = Object.entries(restaurantCounts).sort((a, b) => b[1] - a[1])[0];

  // --- Headline ---
  function pickHeadline(): string {
    if (entryCount === 0) return "Your chomp journey starts now.";
    const options: string[] = [];
    if (streak >= 3) options.push(`${streak}-week streak. Absolute machine.`);
    if (entryCount >= 10) options.push(`${entryCount} chomps and counting.`);
    if (totalSpent >= 100)
      options.push(`$${Math.round(totalSpent).toLocaleString()} spent on food. Worth every cent.`);
    if (mostVisited && mostVisited[1] >= 3)
      options.push(`${mostVisited[0]} — ${mostVisited[1]} visits. You're a regular.`);
    if (uniqueRestaurants >= 5 && mostVisited)
      options.push(`${uniqueRestaurants} spots tried. But you keep going back to ${mostVisited[0]}.`);
    if (uniqueCities >= 3)
      options.push(`${entryCount} chomps across ${uniqueCities} cities.`);
    if (options.length === 0)
      return `${entryCount} chomp${entryCount === 1 ? "" : "s"} logged. The journey continues.`;
    const dayIndex = new Date().getDate() % options.length;
    return options[dayIndex];
  }

  // --- Smart Rankings ---
  function buildSmartRankings(): SmartRanking[] {
    const rankings: SmartRanking[] = [];

    // Top by cuisine
    const cuisineBuckets: Record<string, typeof entries> = {};
    entries.forEach((e) => {
      if (e.cuisine) {
        if (!cuisineBuckets[e.cuisine]) cuisineBuckets[e.cuisine] = [];
        cuisineBuckets[e.cuisine].push(e);
      }
    });

    Object.entries(cuisineBuckets)
      .filter(([, bucket]) => bucket.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3)
      .forEach(([cuisine, bucket]) => {
        const ranked = [...bucket]
          .filter((e) => e.composite_score)
          .sort((a, b) => Number(b.composite_score) - Number(a.composite_score))
          .slice(0, 3);
        if (ranked.length >= 2) {
          rankings.push({
            title: `Top ${cuisine}`,
            icon: <Trophy size={16} />,
            items: ranked.map((e) => ({
              name: e.restaurant_name,
              subtitle: e.city,
              score: e.composite_score ? Number(e.composite_score) : null,
              id: e.id,
            })),
          });
        }
      });

    // Best dishes across all entries
    const allDishes: { name: string; rating: number; restaurant: string; entryId: string }[] = [];
    entries.forEach((e) => {
      const dishes = Array.isArray(e.entry_dishes)
        ? (e.entry_dishes as { name: string; rating: number | null }[])
        : [];
      dishes.forEach((d) => {
        if (d.rating && Number(d.rating) > 0) {
          allDishes.push({
            name: d.name,
            rating: Number(d.rating),
            restaurant: e.restaurant_name,
            entryId: e.id,
          });
        }
      });
    });

    if (allDishes.length >= 3) {
      const topDishes = allDishes
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      rankings.push({
        title: "Highest Rated Dishes",
        icon: <UtensilsCrossed size={16} />,
        items: topDishes.map((d) => ({
          name: d.name,
          subtitle: `at ${d.restaurant}`,
          score: d.rating,
          id: d.entryId,
        })),
      });
    }

    // Most visited spots
    const spotVisits = Object.entries(restaurantCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (spotVisits.length >= 2) {
      rankings.push({
        title: "Most Visited Spots",
        icon: <Repeat size={16} />,
        items: spotVisits.map(([name, count]) => {
          const latest = entries.find((e) => e.restaurant_name === name);
          return {
            name,
            subtitle: `${count} visits`,
            score: latest?.composite_score ? Number(latest.composite_score) : null,
          };
        }),
      });
    }

    // Best in each city (if multiple cities)
    if (uniqueCities >= 2) {
      const cityBuckets: Record<string, typeof entries> = {};
      entries.forEach((e) => {
        if (!cityBuckets[e.city]) cityBuckets[e.city] = [];
        cityBuckets[e.city].push(e);
      });

      const topCity = Object.entries(cityBuckets)
        .sort((a, b) => b[1].length - a[1].length)[0];

      if (topCity && topCity[1].length >= 3) {
        const ranked = [...topCity[1]]
          .filter((e) => e.composite_score)
          .sort((a, b) => Number(b.composite_score) - Number(a.composite_score))
          .slice(0, 3);
        if (ranked.length >= 2) {
          rankings.push({
            title: `Best in ${topCity[0]}`,
            icon: <MapPin size={16} />,
            items: ranked.map((e) => ({
              name: e.restaurant_name,
              subtitle: e.cuisine ?? "",
              score: e.composite_score ? Number(e.composite_score) : null,
              id: e.id,
            })),
          });
        }
      }
    }

    return rankings;
  }

  // --- Insight spotlights ---
  function buildInsights(): Insight[] {
    const all: Insight[] = [];

    const withCostAndRating = entries.filter(
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

    if (ratedEntries.length >= 6) {
      const recent5 = ratedEntries.slice(0, 5);
      const prev5 = ratedEntries.slice(5, 10);
      const recentAvg = recent5.reduce((s, e) => s + Number(e.composite_score), 0) / recent5.length;
      const prevAvg = prev5.reduce((s, e) => s + Number(e.composite_score), 0) / prev5.length;
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

    const now = new Date();
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.eaten_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (thisMonth.length >= 2) {
      all.push({
        icon: <Compass size={14} />,
        text: `${thisMonth.length} chomps this month`,
      });
    }

    if (mostVisited && mostVisited[1] >= 3) {
      all.push({
        icon: <Repeat size={14} />,
        text: `${mostVisited[0]} is your go-to (${mostVisited[1]} visits)`,
      });
    }

    return all;
  }

  const headline = pickHeadline();
  const insights = buildInsights();
  const smartRankings = buildSmartRankings();
  const visibleInsights =
    insights.length <= 2
      ? insights
      : (() => {
          const dayIndex = new Date().getDate();
          return [
            insights[dayIndex % insights.length],
            insights[(dayIndex + 1) % insights.length],
          ].filter((v, i, a) => a.indexOf(v) === i);
        })();

  const topRated = [...entries]
    .filter((e) => e.composite_score)
    .sort((a, b) => Number(b.composite_score) - Number(a.composite_score))
    .slice(0, 3);

  const recentEntries = entries.slice(0, 5);

  const successMessage =
    params.success === "1"
      ? "Chomp logged!"
      : params.success === "updated"
        ? "Chomp updated!"
        : params.success === "welcome"
          ? "Welcome to Chompion!"
          : null;

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {successMessage && <SuccessToast message={successMessage} />}

      {/* Collection tabs + "All" overview */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        <Link
          href="/dashboard"
          className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
            !params.food
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <BarChart3 size={14} className="inline mr-1.5 -mt-0.5" />
          Overview
        </Link>
        {(passionFoods ?? []).map((food) => (
          <Link
            key={food.id}
            href={`/dashboard?food=${food.id}`}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              food.id === params.food
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
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
          🍽️ {headline}
        </h2>

        {entryCount > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
              {entryCount} chomps
            </span>
            {avgRating && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                <Star size={10} className="fill-current" />
                {avgRating.toFixed(1)} avg
              </span>
            )}
            {streak > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                <Flame size={10} className="text-amber-500" />
                {streak}wk streak
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
              <MapPin size={10} />
              {uniqueRestaurants} spots
            </span>
            {uniqueCities >= 2 && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
                <Compass size={10} />
                {uniqueCities} cities
              </span>
            )}
            {totalSpent > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-emerald-100 text-emerald-700">
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
              style={{ borderLeftWidth: 3, borderLeftColor: "#059669" }}
            >
              <span className="text-emerald-600">{insight.icon}</span>
              <span className="text-sm text-gray-700">{insight.text}</span>
            </div>
          ))}
        </div>
      )}

      {entryCount === 0 && (
        <Link
          href="/entries/new"
          className="flex items-center gap-4 bg-emerald-50 rounded-2xl p-4 transition-colors group animate-fade-in hover:opacity-80"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Plus size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Ready to log your first chomp?</p>
            <p className="text-xs text-gray-500">Tap here to get your stats rolling</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
        </Link>
      )}

      {/* Smart Rankings */}
      {smartRankings.length > 0 && (
        <div className="space-y-4">
          {smartRankings.map((ranking, ri) => (
            <div
              key={ri}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up"
            >
              <div className="flex items-center gap-2 mb-4">
                <span className="text-emerald-600">{ranking.icon}</span>
                <h3 className="font-semibold text-gray-900">{ranking.title}</h3>
              </div>
              <div className="space-y-3">
                {ranking.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {ranking.items.length > 1 && (
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {i + 1}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {item.id ? (
                        <Link href={`/entries/${item.id}`} className="hover:opacity-70 transition-opacity">
                          <div className="font-medium text-gray-900 truncate">{item.name}</div>
                          {item.subtitle && (
                            <div className="text-xs text-gray-400">{item.subtitle}</div>
                          )}
                        </Link>
                      ) : (
                        <>
                          <div className="font-medium text-gray-900 truncate">{item.name}</div>
                          {item.subtitle && (
                            <div className="text-xs text-gray-400">{item.subtitle}</div>
                          )}
                        </>
                      )}
                    </div>
                    {item.score && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-emerald-700 tabular-nums">
                          {item.score.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Rated (overall) */}
      {topRated.length > 0 && smartRankings.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-gray-900">Top Rated</h3>
          </div>
          <div className="space-y-3">
            {topRated.map((entry, i) => (
              <Link key={entry.id} href={`/entries/${entry.id}`} className="flex items-center gap-3 group">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate group-hover:opacity-70 transition-opacity">
                    {entry.restaurant_name}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <MapPin size={10} />
                    {entry.city}
                    {entry.cuisine && <span className="ml-1">&middot; {entry.cuisine}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star size={12} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-emerald-700 tabular-nums">
                    {Number(entry.composite_score).toFixed(1)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Chomps</h3>
            <Link href="/entries" className="text-sm font-medium text-emerald-600">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {recentEntries.map((entry) => {
              const entryDishes = Array.isArray(entry.entry_dishes)
                ? (entry.entry_dishes as { name: string }[])
                : [];
              const dishNames = entryDishes.map((d) => d.name).join(", ");

              return (
                <Link key={entry.id} href={`/entries/${entry.id}`} className="flex items-center justify-between group">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate group-hover:opacity-70 transition-opacity">
                      {entry.restaurant_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {dishNames && <span>{dishNames} &middot; </span>}
                      {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {entry.cost && <span> &middot; ${Number(entry.cost).toFixed(2)}</span>}
                    </div>
                  </div>
                  {entry.composite_score && (
                    <div className="text-sm font-semibold text-emerald-600 flex-shrink-0">
                      {Number(entry.composite_score).toFixed(1)}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
