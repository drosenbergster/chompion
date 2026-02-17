import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntryForm } from "@/components/entries/entry-form";
import type { Entry } from "@/lib/supabase/types";

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
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

  // Get user's passion foods
  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  if (!passionFoods || passionFoods.length === 0) {
    redirect("/dashboard");
  }

  // If "from" param is set, pre-fill from a previous entry
  let prefillEntry: Entry | undefined;
  if (params.from) {
    const { data } = await supabase
      .from("entries")
      .select("*")
      .eq("id", params.from)
      .eq("user_id", user.id)
      .single();
    if (data) {
      prefillEntry = data as Entry;
    }
  }

  const activeFood = prefillEntry
    ? passionFoods.find((f) => f.id === prefillEntry.passion_food_id) ??
      passionFoods.find((f) => f.is_default) ??
      passionFoods[0]
    : passionFoods.find((f) => f.is_default) ?? passionFoods[0];

  // Get subtypes for active food
  const { data: subtypes } = await supabase
    .from("subtypes")
    .select("*")
    .eq("passion_food_id", activeFood.id)
    .order("sort_order");

  // Get rating categories for active food
  const { data: ratingCategories } = await supabase
    .from("rating_categories")
    .select("*")
    .eq("passion_food_id", activeFood.id)
    .order("sort_order");

  return (
    <div className="pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {prefillEntry ? "Log Again" : "Log a Chomp"}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        {prefillEntry
          ? `Back at ${prefillEntry.restaurant_name}? Rate it again.`
          : `How was the ${activeFood.name.toLowerCase()}?`}
      </p>
      <EntryForm
        userId={user.id}
        username={profile?.username}
        passionFood={activeFood}
        passionFoods={passionFoods}
        subtypes={subtypes ?? []}
        ratingCategories={ratingCategories ?? []}
        prefillEntry={prefillEntry}
      />
    </div>
  );
}
