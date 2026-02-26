import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { EntryForm } from "@/components/entries/entry-form";
import { DEFAULT_RATING_CATEGORIES } from "@/lib/constants";
import type { EntryDish } from "@/lib/supabase/types";

export default async function EditEntryPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  // Get universal rating categories
  let { data: ratingCategories } = await supabase
    .from("rating_categories")
    .select("*")
    .eq("user_id", user.id)
    .is("passion_food_id", null)
    .order("sort_order");

  if (!ratingCategories || ratingCategories.length === 0) {
    const { count } = await supabase
      .from("rating_categories")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("passion_food_id", null);

    if (!count || count === 0) {
      const cats = DEFAULT_RATING_CATEGORIES.map((cat, i) => ({
        user_id: user.id,
        passion_food_id: null,
        name: cat.name,
        weight: cat.weight,
        sort_order: i,
      }));
      await supabase.from("rating_categories").insert(cats);
    }

    const { data: refetched } = await supabase
      .from("rating_categories")
      .select("*")
      .eq("user_id", user.id)
      .is("passion_food_id", null)
      .order("sort_order");
    ratingCategories = refetched ?? [];
  }

  // Get existing ratings and map old category IDs to universal ones by name
  const { data: rawRatings } = await supabase
    .from("entry_ratings")
    .select("rating_category_id, score, rating_categories ( name )")
    .eq("entry_id", entry.id);

  const existingRatings = (rawRatings ?? []).map((r) => {
    const ratingName =
      r.rating_categories &&
      typeof r.rating_categories === "object" &&
      "name" in r.rating_categories
        ? (r.rating_categories as { name: string }).name
        : null;
    const matchedCat = ratingName
      ? (ratingCategories ?? []).find((c) => c.name === ratingName)
      : null;
    return {
      rating_category_id: matchedCat?.id ?? r.rating_category_id,
      score: r.score,
    };
  });

  // Get existing dishes
  const { data: existingDishes } = await supabase
    .from("entry_dishes")
    .select("*")
    .eq("entry_id", entry.id)
    .order("sort_order");

  // Previous cities and dish names for autocomplete
  const { data: prevEntries } = await supabase
    .from("entries")
    .select("city")
    .eq("user_id", user.id);

  const previousCities = [
    ...new Set((prevEntries ?? []).map((e) => e.city).filter(Boolean)),
  ].sort();

  const { data: prevDishes } = await supabase
    .from("entry_dishes")
    .select("name, entries!inner(user_id)")
    .eq("entries.user_id", user.id);

  const previousDishNames = [
    ...new Set((prevDishes ?? []).map((d) => d.name).filter(Boolean)),
  ].sort();

  return (
    <div className="pb-20 md:pb-8">
      <Link
        href={`/entries/${entry.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-emerald-600 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to chomp
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Chomp</h1>
      <p className="text-gray-500 text-sm mb-6">
        Update your chomp at {entry.restaurant_name}
      </p>

      <EntryForm
        userId={user.id}
        username={profile?.username}
        passionFoods={passionFoods ?? []}
        ratingCategories={ratingCategories ?? []}
        existingEntry={entry}
        existingRatings={existingRatings ?? []}
        existingDishes={(existingDishes ?? []) as EntryDish[]}
        previousCities={previousCities}
        previousDishNames={previousDishNames}
      />
    </div>
  );
}
