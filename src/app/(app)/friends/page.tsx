import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, Users, UserPlus, Search, UtensilsCrossed } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: following }, { count: followerCount }] = await Promise.all([
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id),
    supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", user.id),
  ]);

  const followingIds = (following ?? []).map((f) => f.following_id);
  const followingCount = followingIds.length;
  const followers = followerCount ?? 0;

  if (followingIds.length === 0) {
    return (
      <div className="pb-20 md:pb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
          <Link
            href="/friends/search"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
          >
            <Search size={15} />
            Find
          </Link>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          {followers} {followers === 1 ? "follower" : "followers"} &middot; 0
          following
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-emerald-600" size={28} />
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
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
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

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: entries } = await supabase
    .from("entries")
    .select(`
      id, user_id, passion_food_id, restaurant_name, city,
      composite_score, cost, notes, eaten_at, cuisine,
      entry_dishes ( name, rating, sort_order )
    `)
    .in("user_id", followingIds)
    .order("eaten_at", { ascending: false })
    .limit(30);

  const feedEntries = entries ?? [];

  return (
    <div className="pb-20 md:pb-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
        <Link
          href="/friends/search"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
        >
          <Search size={15} />
          Find
        </Link>
      </div>
      <p className="text-sm text-gray-500 mb-6">
        {followers} {followers === 1 ? "follower" : "followers"} &middot;{" "}
        {followingCount} following
      </p>

      {feedEntries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="text-emerald-600" size={28} />
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
        <div className="space-y-2.5 animate-stagger">
          {feedEntries.map((entry) => {
            const profile = profileMap.get(entry.user_id);
            const displayName = profile?.display_name ?? "Someone";
            const score = entry.composite_score
              ? Number(entry.composite_score).toFixed(1)
              : null;

            const entryDishes = Array.isArray(entry.entry_dishes)
              ? (entry.entry_dishes as { name: string; rating: number | null; sort_order: number }[])
                  .sort((a, b) => a.sort_order - b.sort_order)
              : [];
            const dishNames = entryDishes.map((d) => d.name).join(", ");

            return (
              <Link
                key={entry.id}
                href={`/u/${profile?.username ?? ""}/entry/${entry.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <div className="text-sm text-gray-900 truncate">
                    <span className="font-semibold">{displayName}</span>
                    {" rated "}
                    <span className="font-semibold">{entry.restaurant_name}</span>
                    {score && (
                      <>
                        {" "}
                        <span className="inline-flex items-center gap-0.5 text-emerald-600 font-bold">
                          {score}
                          <Star size={11} className="fill-emerald-600 text-emerald-600 -mt-px" />
                        </span>
                      </>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {timeAgo(entry.eaten_at)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <MapPin size={10} />
                  <span>{entry.city}</span>
                  {dishNames && (
                    <>
                      <span>&middot;</span>
                      <UtensilsCrossed size={10} />
                      <span className="truncate">{dishNames}</span>
                    </>
                  )}
                  {entry.cuisine && <span>&middot; {entry.cuisine}</span>}
                  {entry.cost && <span>&middot; ${Number(entry.cost).toFixed(0)}</span>}
                </div>

                {entry.notes && (
                  <p className="text-xs text-gray-500 italic mt-1.5 line-clamp-2">
                    &ldquo;{entry.notes.slice(0, 120)}
                    {entry.notes.length > 120 ? "..." : ""}&rdquo;
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
