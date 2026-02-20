import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/(auth)/actions";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { RatingCategoriesEditor } from "@/components/settings/rating-categories-editor";
import type { RatingCategory } from "@/lib/supabase/types";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ food?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  if (!passionFoods || passionFoods.length === 0) {
    redirect("/dashboard");
  }

  const selectedFood = params.food
    ? passionFoods.find((f) => f.id === params.food)
    : undefined;
  const activeFood =
    selectedFood ?? passionFoods.find((f) => f.is_default) ?? passionFoods[0];

  const { data: ratingCategories } = await supabase
    .from("rating_categories")
    .select("*")
    .eq("passion_food_id", activeFood.id)
    .order("sort_order");

  return (
    <div className="pb-20 md:pb-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Profile */}
      <ProfileEditor
        userId={user.id}
        email={user.email ?? ""}
        displayName={profile?.display_name ?? ""}
        username={profile?.username ?? ""}
      />

      {/* Rating Categories with food selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
        {passionFoods.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
            {passionFoods.map((food) => (
              <Link
                key={food.id}
                href={`/settings?food=${food.id}`}
                className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                  food.id === activeFood.id
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {food.name}
              </Link>
            ))}
          </div>
        )}

        <RatingCategoriesEditor
          key={activeFood.id}
          passionFoodId={activeFood.id}
          passionFoodName={activeFood.name}
          categories={(ratingCategories ?? []) as RatingCategory[]}
        />
      </div>

      {/* Logout */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-6">
        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            Log Out
          </button>
        </form>
      </div>
    </div>
  );
}
