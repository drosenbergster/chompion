"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { POPULAR_FOODS, DEFAULT_RATING_CATEGORIES } from "@/lib/constants";

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
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [customFood, setCustomFood] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [username, setUsername] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const firstName = displayName.split(" ")[0] || "there";
  const foodName = addingCustom ? customFood.trim() : selectedFood;
  const canProceedStep1 = !!foodName;

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
    if (!foodName) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const matchedTheme =
      POPULAR_FOODS.find(
        (f) => f.name.toLowerCase() === foodName.toLowerCase()
      )?.theme ?? "generic";

    const { data: newFood, error: foodError } = await supabase
      .from("passion_foods")
      .insert({
        user_id: userId,
        name: foodName,
        theme_key: matchedTheme,
        is_default: true,
      })
      .select()
      .single();

    if (foodError || !newFood) {
      setError(foodError?.message ?? "Failed to create food list");
      setLoading(false);
      return;
    }

    const categories = DEFAULT_RATING_CATEGORIES.map((cat, i) => ({
      passion_food_id: newFood.id,
      name: cat.name,
      weight: cat.weight,
      sort_order: i,
    }));

    await supabase.from("rating_categories").insert(categories);

    if (username.length >= 3 && usernameAvailable) {
      await supabase
        .from("profiles")
        .update({ username })
        .eq("id", userId);
    }

    router.push("/dashboard?success=welcome");
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 -mt-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">
            {step === 1 ? "🍽️" : "👋"}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 1
              ? `Hey ${firstName}! What's your food obsession?`
              : "Almost there — claim your handle"}
          </h1>
          <p className="text-gray-500">
            {step === 1
              ? "Pick the food you can't stop thinking about. You can always add more later."
              : "Pick a username so your friends can find you."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
          {step === 1 && (
            <div className="space-y-4">
              {!addingCustom ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {POPULAR_FOODS.map((food) => (
                      <button
                        key={food.name}
                        onClick={() => setSelectedFood(food.name)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                          selectedFood === food.name
                            ? "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-sm"
                            : "border-gray-100 hover:border-gray-200 text-gray-700"
                        }`}
                      >
                        <span className="mr-1.5 text-base">{food.emoji}</span>
                        {food.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setAddingCustom(true);
                      setSelectedFood(null);
                    }}
                    className="w-full p-3.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 text-gray-500 hover:text-emerald-600 transition-all text-sm font-medium text-center"
                  >
                    Something else...
                  </button>
                </>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setAddingCustom(false);
                      setCustomFood("");
                    }}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    &larr; Back to popular foods
                  </button>
                  <input
                    type="text"
                    value={customFood}
                    onChange={(e) => setCustomFood(e.target.value)}
                    placeholder="Enter a food to track..."
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canProceedStep1) {
                        e.preventDefault();
                        setStep(2);
                      }
                    }}
                  />
                </div>
              )}

              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors mt-2"
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">
                  {POPULAR_FOODS.find((f) => f.name === foodName)?.emoji ??
                    "🍽️"}
                </span>
                <div>
                  <p className="text-sm font-medium text-emerald-800">
                    Tracking: {foodName}
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    Change
                  </button>
                </div>
              </div>

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

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={
                    loading ||
                    (username.length > 0 &&
                      (username.length < 3 || usernameAvailable === false))
                  }
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  {loading ? "Setting up..." : "Let's go! 🎉"}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2 mt-6">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                step === 1 ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                step === 2 ? "bg-emerald-500" : "bg-gray-200"
              }`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
