import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, UtensilsCrossed } from "lucide-react";
import { BehavioralRadarChart } from "@/components/profile/behavioral-radar-chart";
import { FollowButton } from "@/components/profile/follow-button";

import { FOOD_EMOJIS } from "@/lib/constants";

function computeRadar(allEntries: { restaurant_name: string; composite_score: unknown; subtypes: unknown }[]) {
  const count = allEntries.length;
  const scoredEntries = allEntries.filter((e) => e.composite_score);

  const uniqueRestaurantCount = new Set(allEntries.map((e) => e.restaurant_name)).size;
  const adventurous = count > 0 ? (uniqueRestaurantCount / count) * 5 : 0;

  const entriesWithSubtype = allEntries.filter(
    (e) =>
      e.subtypes &&
      typeof e.subtypes === "object" &&
      "name" in (e.subtypes as unknown as Record<string, unknown>)
  );
  const uniqueSubtypes = new Set(
    entriesWithSubtype.map((e) => (e.subtypes as unknown as { name: string }).name)
  ).size;
  const diversePalate = entriesWithSubtype.length > 0
    ? (uniqueSubtypes / entriesWithSubtype.length) * 5
    : null;

  let discerning = 0;
  if (scoredEntries.length >= 2) {
    const scores = scoredEntries.map((e) => Number(e.composite_score));
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    discerning = Math.min(Math.sqrt(variance) / 1.2, 1) * 5;
  }

  const restaurantVisits: Record<string, number> = {};
  allEntries.forEach((e) => {
    restaurantVisits[e.restaurant_name] = (restaurantVisits[e.restaurant_name] ?? 0) + 1;
  });
  const maxVisits = Math.max(0, ...Object.values(restaurantVisits));
  const loyal = count > 0 ? (maxVisits / count) * 5 : 0;

  return {
    adventurous: Number(Math.min(adventurous, 5).toFixed(1)),
    diversePalate: diversePalate !== null ? Number(Math.min(diversePalate, 5).toFixed(1)) : null,
    discerning: Number(Math.min(discerning, 5).toFixed(1)),
    loyal: Number(Math.min(loyal, 5).toFixed(1)),
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", profile.id)
    .order("is_default", { ascending: false });

  const { data: entries } = await supabase
    .from("entries")
    .select(
      `
      id,
      passion_food_id,
      restaurant_name,
      city,
      composite_score,
      eaten_at,
      subtypes ( name ),
      entry_ratings (
        score,
        rating_category_id,
        rating_categories ( name )
      )
    `
    )
    .eq("user_id", profile.id)
    .order("eaten_at", { ascending: false });

  const allEntries = entries ?? [];
  const totalEntryCount = allEntries.length;

  // Group entries by passion food
  const entriesByFood = new Map<string, typeof allEntries>();
  allEntries.forEach((e) => {
    const foodId = e.passion_food_id;
    if (!entriesByFood.has(foodId)) entriesByFood.set(foodId, []);
    entriesByFood.get(foodId)!.push(e);
  });

  // Filter passion foods to those with 3+ entries, default food first
  const qualifyingFoods = (passionFoods ?? []).filter(
    (f) => (entriesByFood.get(f.id)?.length ?? 0) >= 3
  );

  // For the header: show all tracked food emojis
  const trackedFoods = (passionFoods ?? []).filter(
    (f) => (entriesByFood.get(f.id)?.length ?? 0) > 0
  );

  const primaryFood = passionFoods?.find((f) => f.is_default) ?? passionFoods?.[0];
  const primaryEmoji = primaryFood
    ? FOOD_EMOJIS[primaryFood.theme_key] ?? FOOD_EMOJIS.generic
    : FOOD_EMOJIS.generic;

  // Check if current user follows this profile
  let isFollowing = false;
  if (currentUser && currentUser.id !== profile.id) {
    const { data: follow } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", profile.id)
      .maybeSingle();
    isFollowing = !!follow;
  }

  const { count: followerCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Chompion
          </Link>
          {!currentUser && (
            <Link
              href="/signup"
              className="text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              Join Chompion
            </Link>
          )}
          {currentUser && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              My Dashboard
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6 pb-16">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center text-4xl mx-auto mb-3">
            {primaryEmoji}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.display_name}
          </h1>
          <p className="text-sm text-gray-500 mb-3">@{profile.username}</p>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-4">
            <span>
              <strong className="text-gray-900">{totalEntryCount}</strong>{" "}
              {totalEntryCount === 1 ? "chomp" : "chomps"}
            </span>
            <span>
              <strong className="text-gray-900">{followerCount ?? 0}</strong>{" "}
              followers
            </span>
            <span>
              <strong className="text-gray-900">{followingCount ?? 0}</strong>{" "}
              following
            </span>
          </div>

          {trackedFoods.length > 0 && (
            <p className="text-sm text-orange-600 font-medium mb-4">
              {trackedFoods.map((f) => {
                const em = FOOD_EMOJIS[f.theme_key] ?? FOOD_EMOJIS.generic;
                return `${em} ${f.name}`;
              }).join("  ·  ")}
            </p>
          )}

          <FollowButton
            targetUserId={profile.id}
            currentUserId={currentUser?.id ?? null}
            isFollowing={isFollowing}
          />
        </div>

        {/* Empty state */}
        {totalEntryCount === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center">
            <div className="text-5xl mb-3">{primaryEmoji}</div>
            <p className="text-gray-500">
              {profile.display_name} hasn&apos;t logged any chomps yet.
            </p>
          </div>
        )}

        {/* Per-food sections */}
        {qualifyingFoods.map((food) => {
          const foodEntries = entriesByFood.get(food.id) ?? [];
          const foodEmoji = FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic;
          const foodCount = foodEntries.length;

          const topRated = [...foodEntries]
            .filter((e) => e.composite_score)
            .sort(
              (a, b) =>
                Number(b.composite_score) - Number(a.composite_score)
            )
            .slice(0, 3);

          const radar = computeRadar(foodEntries);

          return (
            <div key={food.id} className="space-y-4">
              {/* Food section header */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xl">{foodEmoji}</span>
                <h2 className="text-lg font-bold text-gray-900">
                  {food.name}
                </h2>
                <span className="text-xs text-gray-400 ml-auto">
                  {foodCount} chomp{foodCount !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Behavioral Radar */}
              {foodCount >= 5 && (
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {food.name} Personality
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">
                    What {profile.display_name}&apos;s {food.name.toLowerCase()}{" "}
                    habits reveal
                  </p>
                  <BehavioralRadarChart radar={radar} />
                </div>
              )}

              {/* Top rated */}
              {topRated.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
                  <div className="flex items-center gap-2 mb-4">
                    <UtensilsCrossed size={18} className="text-orange-500" />
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
                        <div
                          key={entry.id}
                          className="flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-600 flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
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
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent activity */}
              <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-3">
                  {foodEntries.slice(0, 8).map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate text-sm">
                          {entry.restaurant_name}
                        </div>
                        <div className="text-xs text-gray-400">
                          {entry.city} &middot;{" "}
                          {new Date(entry.eaten_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </div>
                      </div>
                      {entry.composite_score && (
                        <div className="text-sm font-semibold text-orange-600 flex-shrink-0">
                          {Number(entry.composite_score).toFixed(1)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* If user has entries but none qualify (all <3), show a simple recent list */}
        {totalEntryCount > 0 && qualifyingFoods.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {allEntries.slice(0, 10).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {entry.restaurant_name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.city} &middot;{" "}
                      {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  {entry.composite_score && (
                    <div className="text-sm font-semibold text-orange-600 flex-shrink-0">
                      {Number(entry.composite_score).toFixed(1)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
