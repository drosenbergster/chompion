import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Star, MapPin, TrendingUp, Flame } from "lucide-react";
import { SuccessToast } from "@/components/ui/success-toast";

const FOOD_EMOJIS: Record<string, string> = {
  burritos: "🌯",
  pizza: "🍕",
  tacos: "🌮",
  ramen: "🍜",
  sushi: "🍣",
  burgers: "🍔",
  hotdogs: "🌭",
  wings: "🍗",
  icecream: "🍦",
  pho: "🍲",
  generic: "🍽️",
};

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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
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

  if (!passionFoods || passionFoods.length === 0) {
    redirect("/onboarding");
  }

  const defaultFood =
    passionFoods.find((f) => f.is_default) ?? passionFoods[0];

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

  const avgRating =
    entryCount > 0
      ? (entries ?? []).reduce(
          (sum, e) =>
            sum + (e.composite_score ? Number(e.composite_score) : 0),
          0
        ) / (entries ?? []).filter((e) => e.composite_score).length
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

  const successMessage =
    params.success === "1"
      ? "Chomp logged!"
      : params.success === "updated"
        ? "Chomp updated!"
        : null;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {successMessage && <SuccessToast message={successMessage} />}

      {/* Food tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {passionFoods.map((food) => (
          <div
            key={food.id}
            className={`flex-shrink-0 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
              food.id === defaultFood.id
                ? "bg-orange-500 text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {food.name}
          </div>
        ))}
        <Link
          href="/passion-foods"
          className="flex-shrink-0 px-4 py-2.5 rounded-2xl text-sm font-medium text-orange-500 border border-dashed border-orange-300 hover:bg-orange-50 transition-colors"
        >
          + Add
        </Link>
      </div>

      {/* Stats grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-fade-in">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {foodEmoji} {defaultFood.name}
        </h2>
        <p className="text-gray-500 text-sm mb-5">Your chomp stats</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-stagger">
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {entryCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Chomps</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">
              {avgRating ? avgRating.toFixed(1) : "--"}
            </div>
            <div className="text-xs text-gray-500 mt-1">Avg Rating</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-600 flex items-center justify-center gap-1">
              {streak > 0 && <Flame size={20} className="text-orange-500" />}
              {streak > 0 ? streak : "--"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Week Streak
            </div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div
              className="text-lg font-bold text-orange-600 truncate leading-tight mt-1"
              title={mostVisited?.[0]}
            >
              {mostVisited ? mostVisited[0] : "--"}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {mostVisited ? `${mostVisited[1]}x` : "Most Visited"}
            </div>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {entryCount === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center animate-slide-up">
          <div className="text-6xl mb-4">{foodEmoji}</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No chomps yet!
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Your first {defaultFood.name.toLowerCase()} awaits. Start logging
            to see your stats come to life.
          </p>
          <Link
            href="/entries/new"
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            <Plus size={20} />
            Log Your First Chomp
          </Link>
        </div>
      )}

      {/* Top Rated */}
      {topRated.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-orange-500" />
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
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                      {entry.restaurant_name}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} />
                      {entry.city}
                      {subtypeName && (
                        <span className="text-orange-400 ml-1">
                          &middot; {subtypeName}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
                    <Star size={11} className="fill-white" />
                    {Number(entry.composite_score).toFixed(1)}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Recent Chomps</h3>
            <Link
              href="/entries"
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
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
                  <div className="font-medium text-gray-900 truncate group-hover:text-orange-600 transition-colors">
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
                  <div className="text-sm font-semibold text-orange-600 flex-shrink-0">
                    {Number(entry.composite_score).toFixed(1)}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
