"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEFAULT_RATING_CATEGORIES } from "@/lib/constants";

interface OnboardingFormProps {
  userId: string;
  displayName: string;
  currentUsername: string;
}

export function OnboardingForm({
  userId,
  displayName,
  currentUsername,
}: OnboardingFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = displayName.split(" ")[0] || "there";

  async function checkUsername(value: string) {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    const supabase = createClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("username", value)
      .neq("id", userId);
    setUsernameAvailable(count === 0);
    setCheckingUsername(false);
  }

  function handleUsernameChange(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_-]/g, "");
    setUsername(cleaned);
    setUsernameAvailable(null);

    if (cleaned.length >= 3) {
      const timeout = setTimeout(() => checkUsername(cleaned), 400);
      return () => clearTimeout(timeout);
    }
  }

  async function handleFinish() {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    // Create universal rating categories for this user
    const cats = DEFAULT_RATING_CATEGORIES.map((cat, i) => ({
      user_id: userId,
      passion_food_id: null,
      name: cat.name,
      weight: cat.weight,
      sort_order: i,
    }));

    await supabase.from("rating_categories").insert(cats);

    if (username.length >= 3 && usernameAvailable) {
      await supabase.from("profiles").update({ username }).eq("id", userId);
    }

    router.push("/dashboard?success=welcome");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 -mt-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">👋</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hey {firstName}! Welcome to Chompion.
          </h1>
          <p className="text-gray-500">
            Pick a username so your friends can find you, then start logging chomps.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  @
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder={currentUsername}
                  maxLength={30}
                  className="w-full pl-8 pr-10 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleFinish();
                    }
                  }}
                />
                {username.length >= 3 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {checkingUsername ? (
                      <span className="text-gray-400">...</span>
                    ) : usernameAvailable ? (
                      <span className="text-emerald-500">&#10003;</span>
                    ) : usernameAvailable === false ? (
                      <span className="text-red-500">taken</span>
                    ) : null}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                Letters, numbers, dashes, underscores. Min 3 chars.
                {!username && " Leave blank to keep your current one."}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={
                loading ||
                (username.length > 0 &&
                  (username.length < 3 || usernameAvailable === false))
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              {loading ? "Setting up..." : "Start Chomping!"}
            </button>

            <button
              onClick={() => router.push("/dashboard?success=welcome")}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip for now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
