import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/layout/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen relative">
      {/* Full-page background image */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/chompion-bg.png')" }}
        aria-hidden="true"
      />
      {/* Semi-transparent overlay so content stays readable */}
      <div
        className="fixed inset-0 z-[1]"
        style={{ backgroundColor: "rgba(253, 251, 247, 0.93)" }}
        aria-hidden="true"
      />

      {/* Content above background */}
      <div className="relative z-10">
        <AppNav
          user={{ id: user.id, email: user.email ?? "" }}
          profile={profile}
        />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
