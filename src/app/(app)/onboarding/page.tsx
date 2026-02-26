import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user has already set up rating categories (sign of completed onboarding)
  const { count } = await supabase
    .from("rating_categories")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("passion_food_id", null);

  if (count && count > 0) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, username")
    .eq("id", user.id)
    .single();

  return (
    <OnboardingForm
      userId={user.id}
      displayName={profile?.display_name ?? ""}
      currentUsername={profile?.username ?? ""}
    />
  );
}
