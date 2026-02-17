import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, UtensilsCrossed } from "lucide-react";
import { ProfileRadarChart } from "@/components/profile/profile-radar-chart";
import { FollowButton } from "@/components/profile/follow-button";

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

  const defaultFood =
    passionFoods?.find((f) => f.is_default) ?? passionFoods?.[0];

  const { data: entries } = await supabase
    .from("entries")
    .select(
      `
      id,
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

  const entryCount = entries?.length ?? 0;
  const foodEmoji = defaultFood
    ? FOOD_EMOJIS[defaultFood.theme_key] ?? FOOD_EMOJIS.generic
    : FOOD_EMOJIS.generic;

  const topRated = [...(entries ?? [])]
    .filter((e) => e.composite_score)
    .sort((a, b) => Number(b.composite_score) - Number(a.composite_score))
    .slice(0, 3);

  // Compute radar data from all entry_ratings
  const categoryScores: Record<string, { total: number; count: number; name: string }> = {};
  (entries ?? []).forEach((entry) => {
    const ratings = entry.entry_ratings as unknown as {
      score: number;
      rating_category_id: string;
      rating_categories: { name: string };
    }[];
    if (!Array.isArray(ratings)) return;
    ratings.forEach((r) => {
      const catName = r.rating_categories?.name ?? r.rating_category_id;
      if (!categoryScores[catName]) {
        categoryScores[catName] = { total: 0, count: 0, name: catName };
      }
      categoryScores[catName].total += r.score;
      categoryScores[catName].count += 1;
    });
  });
  const radarData = Object.values(categoryScores).map((c) => ({
    category: c.name,
    score: Math.round((c.total / c.count) * 10) / 10,
  }));

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

  // Follower/following counts
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
          <Link
            href="/"
            className="text-xl font-bold text-gray-900"
          >
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
            {foodEmoji}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.display_name}
          </h1>
          <p className="text-sm text-gray-500 mb-3">@{profile.username}</p>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500 mb-4">
            <span>
              <strong className="text-gray-900">{entryCount}</strong>{" "}
              {entryCount === 1 ? "chomp" : "chomps"}
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

          {defaultFood && (
            <p className="text-sm text-orange-600 font-medium mb-4">
              {foodEmoji} Tracking {defaultFood.name}
            </p>
          )}

          <FollowButton
            targetUserId={profile.id}
            currentUserId={currentUser?.id ?? null}
            isFollowing={isFollowing}
          />
        </div>

        {/* Radar chart */}
        {radarData.length >= 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-1">Taste Profile</h3>
            <p className="text-xs text-gray-400 mb-2">
              Average scores across rating categories
            </p>
            <ProfileRadarChart data={radarData} />
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
                  <div key={entry.id} className="flex items-center gap-3">
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

        {/* Empty state */}
        {entryCount === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center">
            <div className="text-5xl mb-3">{foodEmoji}</div>
            <p className="text-gray-500">
              {profile.display_name} hasn&apos;t logged any chomps yet.
            </p>
          </div>
        )}

        {/* Recent activity */}
        {entries && entries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-slide-up">
            <h3 className="font-semibold text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {entries.slice(0, 10).map((entry) => (
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
