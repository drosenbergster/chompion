import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import { EntryForm } from "@/components/entries/entry-form";

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

  // Get the entry
  const { data: entry } = await supabase
    .from("entries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!entry) notFound();

  // Get the passion food for this entry
  const { data: passionFood } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("id", entry.passion_food_id)
    .single();

  if (!passionFood) notFound();

  // Get all passion foods (for the form)
  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  // Get subtypes
  const { data: subtypes } = await supabase
    .from("subtypes")
    .select("*")
    .eq("passion_food_id", passionFood.id)
    .order("sort_order");

  // Get rating categories
  const { data: ratingCategories } = await supabase
    .from("rating_categories")
    .select("*")
    .eq("passion_food_id", passionFood.id)
    .order("sort_order");

  // Get existing ratings for this entry
  const { data: existingRatings } = await supabase
    .from("entry_ratings")
    .select("rating_category_id, score")
    .eq("entry_id", entry.id);

  return (
    <div className="pb-20 md:pb-8">
      <Link
        href={`/entries/${entry.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-orange-500 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to entry
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Chomp</h1>
      <p className="text-gray-500 text-sm mb-6">
        Update your {passionFood.name.toLowerCase()} at{" "}
        {entry.restaurant_name}
      </p>

      <EntryForm
        userId={user.id}
        passionFood={passionFood}
        passionFoods={passionFoods ?? [passionFood]}
        subtypes={subtypes ?? []}
        ratingCategories={ratingCategories ?? []}
        existingEntry={entry}
        existingRatings={existingRatings ?? []}
      />
    </div>
  );
}
