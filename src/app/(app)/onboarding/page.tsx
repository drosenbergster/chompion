"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const POPULAR_FOODS = [
  { name: "Pizza", theme: "pizza", emoji: "🍕" },
  { name: "Burritos", theme: "burritos", emoji: "🌯" },
  { name: "Tacos", theme: "tacos", emoji: "🌮" },
  { name: "Ramen", theme: "ramen", emoji: "🍜" },
  { name: "Sushi", theme: "sushi", emoji: "🍣" },
  { name: "Burgers", theme: "burgers", emoji: "🍔" },
  { name: "Hot Dogs", theme: "hotdogs", emoji: "🌭" },
  { name: "Wings", theme: "wings", emoji: "🍗" },
  { name: "Ice Cream", theme: "icecream", emoji: "🍦" },
  { name: "Pho", theme: "pho", emoji: "🍲" },
];

const DEFAULT_RATING_CATEGORIES = [
  { name: "Taste", weight: 0.34 },
  { name: "Value", weight: 0.33 },
  { name: "Presentation", weight: 0.33 },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"food" | "custom">("food");
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [customFood, setCustomFood] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const foodName = selectedFood === "custom" ? customFood.trim() : selectedFood;
    if (!foodName) {
      setError("Please pick or enter a food");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Find matching theme or use generic
    const matchedTheme =
      POPULAR_FOODS.find(
        (f) => f.name.toLowerCase() === foodName.toLowerCase()
      )?.theme ?? "generic";

    // Create the passion food
    const { data: passionFood, error: createError } = await supabase
      .from("passion_foods")
      .insert({
        user_id: user.id,
        name: foodName,
        theme_key: matchedTheme,
        is_default: true,
      })
      .select()
      .single();

    if (createError || !passionFood) {
      setError(createError?.message ?? "Failed to save your food");
      setLoading(false);
      return;
    }

    // Create default rating categories
    const categories = DEFAULT_RATING_CATEGORIES.map((cat, i) => ({
      passion_food_id: passionFood.id,
      name: cat.name,
      weight: cat.weight,
      sort_order: i,
    }));

    const { error: catError } = await supabase
      .from("rating_categories")
      .insert(categories);

    if (catError) {
      setError(catError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            What&apos;s your food obsession?
          </h1>
          <p className="text-gray-600">
            Pick the food you can&apos;t stop eating. You can always add
            more later.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {step === "food" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {POPULAR_FOODS.map((food) => (
                  <button
                    key={food.name}
                    onClick={() => setSelectedFood(food.name)}
                    className={`p-4 rounded-xl border-2 text-left transition-all font-medium ${
                      selectedFood === food.name
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-gray-100 hover:border-gray-200 text-gray-700"
                    }`}
                  >
                    <span className="mr-2">{food.emoji}</span>
                    {food.name}
                  </button>
                ))}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-3 text-gray-400">
                    or enter your own
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedFood("custom");
                  setStep("custom");
                }}
                className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-orange-300 text-gray-500 hover:text-orange-500 transition-all font-medium text-center"
              >
                Something else...
              </button>
            </div>
          )}

          {step === "custom" && (
            <div className="space-y-4">
              <button
                onClick={() => {
                  setStep("food");
                  setSelectedFood(null);
                }}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                &larr; Back to popular foods
              </button>
              <input
                type="text"
                value={customFood}
                onChange={(e) => setCustomFood(e.target.value)}
                placeholder="Enter your food obsession..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-lg"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mt-4">
              {error}
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={
              loading ||
              (!selectedFood && !customFood.trim()) ||
              (selectedFood === "custom" && !customFood.trim())
            }
            className="w-full mt-6 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
          >
            {loading ? "Setting up..." : "Let's Go!"}
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            We&apos;ll set up default rating categories (Taste, Value,
            Presentation) that you can customize later in settings.
          </p>
        </div>
      </div>
    </div>
  );
}
