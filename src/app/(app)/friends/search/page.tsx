"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { FOOD_EMOJIS } from "@/lib/constants";
import { FollowButton } from "@/components/profile/follow-button";

interface SearchResult {
  id: string;
  display_name: string;
  username: string;
  defaultFood: { name: string; theme_key: string } | null;
  entryCount: number;
  isFollowing: boolean;
}

export default function FriendsSearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearched(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    setCurrentUserId(user?.id ?? null);

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
      .limit(20);

    if (!profiles || profiles.length === 0) {
      setResults([]);
      setLoading(false);
      return;
    }

    const profileIds = profiles.map((p) => p.id);

    const [{ data: foods }, { data: entryCounts }, { data: follows }] =
      await Promise.all([
        supabase
          .from("passion_foods")
          .select("user_id, name, theme_key")
          .in("user_id", profileIds)
          .eq("is_default", true),
        supabase
          .from("entries")
          .select("user_id")
          .in("user_id", profileIds),
        user
          ? supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", user.id)
              .in("following_id", profileIds)
          : Promise.resolve({ data: [] }),
      ]);

    const foodMap = new Map(
      (foods ?? []).map((f) => [f.user_id, f])
    );

    const countMap = new Map<string, number>();
    (entryCounts ?? []).forEach((e) => {
      countMap.set(e.user_id, (countMap.get(e.user_id) ?? 0) + 1);
    });

    const followingSet = new Set(
      (follows ?? []).map((f) => f.following_id)
    );

    const mapped: SearchResult[] = profiles
      .filter((p) => p.id !== user?.id)
      .map((p) => ({
        id: p.id,
        display_name: p.display_name,
        username: p.username,
        defaultFood: foodMap.get(p.id) ?? null,
        entryCount: countMap.get(p.id) ?? 0,
        isFollowing: followingSet.has(p.id),
      }));

    setResults(mapped);
    setLoading(false);
  }

  return (
    <div className="pb-20 md:pb-8">
      <div className="mb-6">
        <Link
          href="/friends"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Friends
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Find Friends</h1>
        <p className="text-sm text-gray-500">
          Search by username or display name
        </p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium rounded-xl transition-colors text-sm"
        >
          {loading ? "..." : "Search"}
        </button>
      </form>

      {searched && results.length === 0 && !loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-8 text-center">
          <p className="text-gray-500">
            No users found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((user) => {
            const emoji = user.defaultFood
              ? FOOD_EMOJIS[user.defaultFood.theme_key] ?? FOOD_EMOJIS.generic
              : FOOD_EMOJIS.generic;

            return (
              <div
                key={user.id}
                className="bg-white rounded-xl border border-emerald-100 p-4 flex items-center gap-3"
              >
                <Link
                  href={`/u/${user.username}`}
                  className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg flex-shrink-0 hover:ring-2 hover:ring-emerald-300 transition-all"
                >
                  {emoji}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/u/${user.username}`}
                    className="text-sm font-semibold text-gray-900 hover:text-emerald-700 transition-colors"
                  >
                    {user.display_name}
                  </Link>
                  <div className="text-xs text-gray-400">
                    @{user.username}
                    {user.defaultFood && (
                      <span>
                        {" "}
                        &middot; Tracking {user.defaultFood.name}
                      </span>
                    )}
                    {user.entryCount > 0 && (
                      <span>
                        {" "}
                        &middot; {user.entryCount} chomp
                        {user.entryCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                </div>
                <FollowButton
                  targetUserId={user.id}
                  currentUserId={currentUserId}
                  isFollowing={user.isFollowing}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
