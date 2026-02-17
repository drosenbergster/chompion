import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EntryForm } from "@/components/entries/entry-form";

export default async function NewEntryPage() {
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
    redirect("/onboarding");
  }

  const defaultFood = passionFoods.find((f) => f.is_default) ?? passionFoods[0];

  // Get subtypes for default food
  const { data: subtypes } = await supabase
    .from("subtypes")
    .select("*")
    .eq("passion_food_id", defaultFood.id)
    .order("sort_order");

  // Get rating categories for default food
  const { data: ratingCategories } = await supabase
    .from("rating_categories")
    .select("*")
    .eq("passion_food_id", defaultFood.id)
    .order("sort_order");

  return (
    <div className="pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Log a Chomp</h1>
      <p className="text-gray-500 text-sm mb-6">
        How was the {defaultFood.name.toLowerCase()}?
      </p>
      <EntryForm
        userId={user.id}
        username={profile?.username}
        passionFood={defaultFood}
        passionFoods={passionFoods}
        subtypes={subtypes ?? []}
        ratingCategories={ratingCategories ?? []}
      />
    </div>
  );
}
