import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">
          Chompion
        </h1>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Track, rate, and own your food obsession.
          Burritos? Pizza? Ramen? Become the chompion.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-8 rounded-xl transition-colors text-center"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-8 rounded-xl border border-gray-200 transition-colors text-center"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
