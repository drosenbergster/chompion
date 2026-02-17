import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/(auth)/actions";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { RatingCategoriesEditor } from "@/components/settings/rating-categories-editor";

export default async function SettingsPage() {
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

  const { data: passionFood } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_default", true)
    .single();

  let ratingCategories = null;

  if (passionFood) {
    const { data: cats } = await supabase
      .from("rating_categories")
      .select("*")
      .eq("passion_food_id", passionFood.id)
      .order("sort_order");

    ratingCategories = cats;
  }

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

      {/* Rating Categories */}
      {passionFood && ratingCategories && (
        <RatingCategoriesEditor
          passionFoodId={passionFood.id}
          passionFoodName={passionFood.name}
          categories={ratingCategories}
        />
      )}

      {/* Logout */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6">
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
