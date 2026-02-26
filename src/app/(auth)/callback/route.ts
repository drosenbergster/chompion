import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (next === "/dashboard") {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { count } = await supabase
            .from("rating_categories")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .is("passion_food_id", null);
          if (count === 0) {
            return NextResponse.redirect(`${origin}/onboarding`);
          }
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
