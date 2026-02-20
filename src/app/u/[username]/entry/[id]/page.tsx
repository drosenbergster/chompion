import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Star, MapPin, Calendar, DollarSign, Hash, ArrowLeft } from "lucide-react";
import { generateMapsLink } from "@/lib/utils";
import { FOOD_EMOJIS } from "@/lib/constants";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, id } = await params;
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("entries")
    .select("restaurant_name, city")
    .eq("id", id)
    .single();

  if (!entry) return { title: "Entry not found | Chompion" };

  return {
    title: `${entry.restaurant_name} in ${entry.city} — @${username} | Chompion`,
    description: `Check out @${username}'s review of ${entry.restaurant_name} on Chompion`,
  };
}

export default async function PublicEntryPage({ params }: PageProps) {
  const { username, id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, username")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const { data: entry } = await supabase
    .from("entries")
    .select(
      `
      *,
      passion_foods ( name, theme_key ),
      subtypes ( name ),
      entry_ratings (
        id,
        score,
        rating_categories ( name, weight )
      )
    `
    )
    .eq("id", id)
    .eq("user_id", profile.id)
    .single();

  if (!entry) notFound();

  const food = entry.passion_foods as { name: string; theme_key: string } | null;
  const emoji = food
    ? FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic
    : FOOD_EMOJIS.generic;

  const subtypeName =
    entry.subtypes && typeof entry.subtypes === "object" && "name" in entry.subtypes
      ? (entry.subtypes as { name: string }).name
      : null;

  const ratings = (
    entry.entry_ratings as {
      id: string;
      score: number;
      rating_categories: { name: string; weight: number };
    }[]
  ).sort((a, b) => a.rating_categories.name.localeCompare(b.rating_categories.name));

  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between h-14">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Chompion
          </Link>
          {currentUser ? (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              My Dashboard
            </Link>
          ) : (
            <Link
              href="/signup"
              className="text-sm font-medium text-orange-500 hover:text-orange-600"
            >
              Join Chompion
            </Link>
          )}
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4 pb-16">
        <Link
          href={`/u/${username}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors"
        >
          <ArrowLeft size={16} />
          @{username}&apos;s profile
        </Link>

        {/* Author + food context */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            href={`/u/${username}`}
            className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl hover:ring-2 hover:ring-orange-300 transition-all"
          >
            {emoji}
          </Link>
          <div>
            <Link
              href={`/u/${username}`}
              className="font-semibold text-gray-900 hover:text-orange-600 transition-colors"
            >
              {profile.display_name}
            </Link>
            <div className="text-xs text-gray-400">
              {food?.name ?? "Food"} &middot;{" "}
              {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Entry header */}
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 animate-fade-in">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {entry.restaurant_name}
                </h1>
                {subtypeName && (
                  <span className="flex-shrink-0 text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium">
                    {subtypeName}
                  </span>
                )}
              </div>
              <a
                href={generateMapsLink(entry.restaurant_name, entry.city)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-gray-500 hover:text-orange-500 transition-colors text-sm"
              >
                <MapPin size={14} />
                {entry.city}
              </a>
            </div>

            {entry.composite_score && (
              <div className="flex items-center gap-1 bg-orange-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-lg flex-shrink-0">
                <Star size={16} className="fill-white" />
                {Number(entry.composite_score).toFixed(1)}
              </div>
            )}
          </div>

          {/* Rating breakdown */}
          {ratings.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Rating Breakdown
              </h3>
              <div className="space-y-2.5">
                {ratings.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {r.rating_categories.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({Math.round(Number(r.rating_categories.weight) * 100)}
                        %)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          className={
                            star <= r.score
                              ? "fill-orange-400 text-orange-400"
                              : "fill-none text-gray-200"
                          }
                        />
                      ))}
                      <span className="text-sm font-semibold text-gray-700 ml-1">
                        {r.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Details row */}
        {(entry.cost || entry.quantity) && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
            <div className="flex gap-6">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                  <Calendar size={15} className="text-orange-500" />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Date</div>
                  <div className="text-sm font-medium text-gray-900">
                    {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              {entry.cost && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={15} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Cost</div>
                    <div className="text-sm font-medium text-gray-900">
                      ${Number(entry.cost).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {entry.quantity && (
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Hash size={15} className="text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Qty</div>
                    <div className="text-sm font-medium text-gray-900">
                      {entry.quantity}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {entry.notes && (
          <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Notes
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              {entry.notes}
            </p>
          </div>
        )}

        {/* CTA for non-users */}
        {!currentUser && (
          <div className="bg-orange-50 rounded-2xl p-5 text-center animate-slide-up">
            <p className="text-sm text-gray-600 mb-3">
              Track and rate your own favorite foods
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-5 rounded-xl transition-colors text-sm"
            >
              Join Chompion — it&apos;s free
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
