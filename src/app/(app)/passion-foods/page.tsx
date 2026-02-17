import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MyFoodsManager } from "@/components/passion-foods/my-foods-manager";

export default async function PassionFoodsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: passionFoods } = await supabase
    .from("passion_foods")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false });

  // Get entry counts per food
  const { data: entries } = await supabase
    .from("entries")
    .select("passion_food_id")
    .eq("user_id", user.id);

  const entryCounts: Record<string, number> = {};
  (entries ?? []).forEach((e) => {
    entryCounts[e.passion_food_id] =
      (entryCounts[e.passion_food_id] ?? 0) + 1;
  });

  return (
    <div className="pb-20 md:pb-8">
      <MyFoodsManager
        userId={user.id}
        initialFoods={passionFoods ?? []}
        entryCounts={entryCounts}
      />
    </div>
  );
}
