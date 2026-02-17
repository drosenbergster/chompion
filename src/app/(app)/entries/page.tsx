import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MapPin, Star, Plus, ChevronRight } from "lucide-react";
import { SuccessToast } from "@/components/ui/success-toast";
import { EntryFilters } from "@/components/entries/entry-filters";

export default async function EntriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    sort?: string;
    city?: string;
    order?: string;
  }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: passionFood } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  if (!passionFood) redirect("/onboarding");

  const { data: allEntries } = await supabase
    .from("entries")
    .select(
      `
      *,
      subtypes ( name )
    `
    )
    .eq("passion_food_id", passionFood.id)
    .order("eaten_at", { ascending: false });

  const allCities = [
    ...new Set((allEntries ?? []).map((e) => e.city).filter(Boolean)),
  ].sort();

  const allOrders = [
    ...new Set(
      (allEntries ?? [])
        .map((e) => {
          if (
            e.subtypes &&
            typeof e.subtypes === "object" &&
            "name" in e.subtypes
          ) {
            return (e.subtypes as { name: string }).name;
          }
          return null;
        })
        .filter(Boolean) as string[]
    ),
  ].sort();

  let entries = [...(allEntries ?? [])];

  if (params.city) {
    entries = entries.filter((e) => e.city === params.city);
  }

  if (params.order) {
    entries = entries.filter((e) => {
      if (
        e.subtypes &&
        typeof e.subtypes === "object" &&
        "name" in e.subtypes
      ) {
        return (e.subtypes as { name: string }).name === params.order;
      }
      return false;
    });
  }

  switch (params.sort) {
    case "rating":
      entries.sort(
        (a, b) =>
          Number(b.composite_score ?? 0) - Number(a.composite_score ?? 0)
      );
      break;
    case "cost":
      entries.sort((a, b) => Number(b.cost ?? 0) - Number(a.cost ?? 0));
      break;
    case "date-asc":
      entries.sort(
        (a, b) =>
          new Date(a.eaten_at).getTime() - new Date(b.eaten_at).getTime()
      );
      break;
    default:
      break;
  }

  const totalCount = allEntries?.length ?? 0;
  const filteredCount = entries.length;
  const isFiltered = totalCount !== filteredCount;

  const successMessage =
    params.success === "1"
      ? "Chomp logged!"
      : params.success === "deleted"
        ? "Chomp deleted!"
        : params.success === "updated"
          ? "Chomp updated!"
          : null;

  return (
    <div className="pb-20 md:pb-8">
      {successMessage && <SuccessToast message={successMessage} />}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chomps</h1>
          <p className="text-sm text-gray-500">
            {isFiltered ? `${filteredCount} of ` : ""}
            {totalCount} {passionFood.name.toLowerCase()}{" "}
            {totalCount === 1 ? "chomp" : "chomps"}
          </p>
        </div>
        <Link
          href="/entries/new"
          className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Log Chomp
        </Link>
      </div>

      {totalCount > 0 && (
        <div className="mb-4">
          <EntryFilters cities={allCities} orders={allOrders} />
        </div>
      )}

      {entries.length === 0 && !isFiltered ? (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-12 text-center animate-fade-in">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No chomps yet!
          </h2>
          <p className="text-gray-500 mb-6">
            Time to go eat some {passionFood.name.toLowerCase()} and tell us about it.
          </p>
          <Link
            href="/entries/new"
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <Plus size={18} />
            Log Your First Chomp
          </Link>
        </div>
      ) : entries.length === 0 && isFiltered ? (
        <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-8 text-center">
          <p className="text-gray-500">No chomps match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const subtypeName =
              entry.subtypes && typeof entry.subtypes === "object" && "name" in entry.subtypes
                ? (entry.subtypes as { name: string }).name
                : null;

            return (
              <Link
                key={entry.id}
                href={`/entries/${entry.id}`}
                className="block bg-white rounded-2xl shadow-sm border border-orange-100 p-4 hover:border-orange-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                        {entry.restaurant_name}
                      </h3>
                      {subtypeName && (
                        <span className="flex-shrink-0 text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                          {subtypeName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <MapPin size={13} className="flex-shrink-0" />
                      <span className="truncate">{entry.city}</span>
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {entry.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                      <span>
                        {new Date(entry.eaten_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      {entry.cost && (
                        <span>${Number(entry.cost).toFixed(2)}</span>
                      )}
                      {entry.quantity && entry.quantity > 1 && (
                        <span>x{entry.quantity}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Composite score badge */}
                    {entry.composite_score && (
                      <div className="flex items-center gap-0.5 bg-orange-500 text-white text-sm font-bold px-2.5 py-1 rounded-xl">
                        <Star size={13} className="fill-white" />
                        {Number(entry.composite_score).toFixed(1)}
                      </div>
                    )}
                    <ChevronRight
                      size={16}
                      className="text-gray-300 group-hover:text-orange-400 transition-colors"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
