import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Star, ArrowLeft, Pencil, Calendar, DollarSign, Hash } from "lucide-react";
import { generateMapsLink } from "@/lib/utils";
import { DeleteEntryButton } from "@/components/entries/delete-entry-button";

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get the entry with all related data
  const { data: entry, error } = await supabase
    .from("entries")
    .select(
      `
      *,
      subtypes ( id, name ),
      entry_ratings (
        id,
        score,
        rating_categories ( id, name, weight )
      )
    `
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !entry) {
    notFound();
  }

  const subtypeName =
    entry.subtypes && typeof entry.subtypes === "object" && "name" in entry.subtypes
      ? (entry.subtypes as { name: string }).name
      : null;

  const ratings = (
    entry.entry_ratings as {
      id: string;
      score: number;
      rating_categories: { id: string; name: string; weight: number };
    }[]
  ).sort((a, b) => a.rating_categories.name.localeCompare(b.rating_categories.name));

  return (
    <div className="pb-20 md:pb-8">
      {/* Back button */}
      <Link
        href="/entries"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to chomps
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-6">
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
          <div className="flex items-center gap-1.5 text-gray-500">
            <MapPin size={14} />
            <a
              href={generateMapsLink(entry.restaurant_name, entry.city)}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-orange-500 transition-colors"
            >
              {entry.city}
            </a>
          </div>
        </div>

        {entry.composite_score && (
          <div className="flex items-center gap-1 bg-orange-500 text-white font-bold px-3.5 py-1.5 rounded-xl text-lg flex-shrink-0">
            <Star size={16} className="fill-white" />
            {Number(entry.composite_score).toFixed(1)}
          </div>
        )}
      </div>

      {/* Rating breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Rating Breakdown
        </h3>
        <div className="space-y-3">
          {ratings.map((r) => (
            <div key={r.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {r.rating_categories.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({Math.round(Number(r.rating_categories.weight) * 100)}%)
                </span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={
                      star <= r.score
                        ? "fill-orange-400 text-orange-400"
                        : "fill-none text-gray-200"
                    }
                  />
                ))}
                <span className="text-sm font-semibold text-gray-700 ml-1.5">
                  {r.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Details
        </h3>
        <div className="grid grid-cols-2 gap-4">
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
                <div className="text-xs text-gray-400">Quantity</div>
                <div className="text-sm font-medium text-gray-900">
                  {entry.quantity}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Location details */}
      {(entry.address || entry.phone_number || entry.location_notes) && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Location Info
          </h3>
          <div className="space-y-2 text-sm">
            {entry.address && (
              <div>
                <span className="text-gray-400">Address: </span>
                <span className="text-gray-700">{entry.address}</span>
              </div>
            )}
            {entry.phone_number && (
              <div>
                <span className="text-gray-400">Phone: </span>
                <a
                  href={`tel:${entry.phone_number}`}
                  className="text-orange-500 hover:text-orange-600"
                >
                  {entry.phone_number}
                </a>
              </div>
            )}
            {entry.location_notes && (
              <div>
                <span className="text-gray-400">Notes: </span>
                <span className="text-gray-700">{entry.location_notes}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {entry.notes && (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Notes
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {entry.notes}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Link
          href={`/entries/${entry.id}/edit`}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          <Pencil size={16} />
          Edit Entry
        </Link>
        <DeleteEntryButton entryId={entry.id} />
      </div>
    </div>
  );
}
