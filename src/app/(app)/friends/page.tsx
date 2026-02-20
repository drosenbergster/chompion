import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, Users, UserPlus, Search } from "lucide-react";
import { FOOD_EMOJIS } from "@/lib/constants";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = (following ?? []).map((f) => f.following_id);

  if (followingIds.length === 0) {
    return (
      <div className="pb-20 md:pb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Friends</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-orange-500" size={28} />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No friends yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Follow other Chompion users to see their latest chomps here. Share
            your profile link so friends can find you!
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/friends/search"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              <Search size={16} />
              Find Friends
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", followingIds);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("id, user_id, name, theme_key, is_default")
    .in("user_id", followingIds);

  const foodMap = new Map(
    (passionFoods ?? []).map((f) => [f.id, f])
  );

  const { data: entries } = await supabase
    .from("entries")
    .select(
      `
      id,
      user_id,
      passion_food_id,
      restaurant_name,
      city,
      composite_score,
      eaten_at,
      subtypes ( name )
    `
    )
    .in("user_id", followingIds)
    .order("eaten_at", { ascending: false })
    .limit(30);

  const feedEntries = entries ?? [];

  return (
    <div className="pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <p className="text-sm text-gray-500">
            Recent activity from {followingIds.length}{" "}
            {followingIds.length === 1 ? "person" : "people"} you follow
          </p>
        </div>
        <Link
          href="/friends/search"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"
        >
          <Search size={15} />
          Find
        </Link>
      </div>

      {feedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-orange-500" size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            No chomps yet
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            The people you follow haven&apos;t logged any chomps yet. Check back
            soon!
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-stagger">
          {feedEntries.map((entry) => {
            const profile = profileMap.get(entry.user_id);
            const food = foodMap.get(entry.passion_food_id);
            const emoji = food
              ? FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic
              : FOOD_EMOJIS.generic;
            const subtypeName =
              entry.subtypes &&
              typeof entry.subtypes === "object" &&
              "name" in entry.subtypes
                ? (entry.subtypes as { name: string }).name
                : null;

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Link
                    href={`/u/${profile?.username ?? ""}`}
                    className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-lg flex-shrink-0 hover:ring-2 hover:ring-orange-300 transition-all"
                  >
                    {emoji}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/u/${profile?.username ?? ""}`}
                      className="text-sm font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                    >
                      {profile?.display_name ?? "Unknown"}
                    </Link>
                    <div className="text-xs text-gray-400">
                      {food?.name ?? "Food"} &middot;{" "}
                      {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </div>
                  {entry.composite_score && (
                    <div className="flex items-center gap-0.5 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0">
                      <Star size={11} className="fill-white" />
                      {Number(entry.composite_score).toFixed(1)}
                    </div>
                  )}
                </div>

                <Link
                  href={`/u/${profile?.username ?? ""}/entry/${entry.id}`}
                  className="block group"
                >
                  <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                    {entry.restaurant_name}
                  </div>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {entry.city}
                    {subtypeName && (
                      <span className="text-orange-400 ml-1">
                        &middot; {subtypeName}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
