import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntryForm } from "@/components/entries/entry-form";
import type { Entry, EntryDish } from "@/lib/supabase/types";
import { DEFAULT_RATING_CATEGORIES } from "@/lib/constants";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; collection?: string }>;
}) {
  const params = await searchParams;
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

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  // Get or create universal rating categories for this user
  let { data: ratingCategories } = await supabase
    .from("rating_categories")
    .select("*")
    .eq("user_id", user.id)
    .is("passion_food_id", null)
    .order("sort_order");

  if (!ratingCategories || ratingCategories.length === 0) {
    // Double-check to avoid race condition creating duplicates
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

  // Prefill from previous entry
  let prefillEntry: Entry | undefined;
  let prefillDishes: EntryDish[] | undefined;
  if (params.from) {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("id", params.from)
      .eq("user_id", user.id)
      .single();
    if (data) {
      prefillEntry = data as Entry;
      const { data: dishes } = await supabase
        .from("entry_dishes")
        .select("*")
        .eq("entry_id", data.id)
        .order("sort_order");
      prefillDishes = (dishes ?? []) as EntryDish[];
    }
  }

  // Get previous cities and dish names for autocomplete
  const { data: prevEntries } = await supabase
    .from("entries")
    .select("city")
    .eq("user_id", user.id)
    .order("eaten_at", { ascending: false });

  const previousCities = [
    ...new Set((prevEntries ?? []).map((e) => e.city).filter(Boolean)),
  ].sort();

  const { data: prevDishes } = await supabase
    .from("entry_dishes")
    .select("name, entries!inner(user_id)")
    .eq("entries.user_id", user.id);

  const previousDishNames = [
    ...new Set(
      (prevDishes ?? []).map((d) => d.name).filter(Boolean)
    ),
  ].sort();

  return (
    <div className="pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {prefillEntry ? "Log Again" : "Log a Chomp"}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {prefillEntry
          ? `Back at ${prefillEntry.restaurant_name}? Rate it again.`
          : "What did you eat?"}
      </p>
      <EntryForm
        userId={user.id}
        username={profile?.username}
        passionFoods={passionFoods ?? []}
        ratingCategories={ratingCategories ?? []}
        prefillEntry={prefillEntry}
        prefillDishes={prefillDishes}
        previousCities={previousCities}
        previousDishNames={previousDishNames}
        initialCollectionId={params.collection ?? null}
      />
    </div>
  );
}
