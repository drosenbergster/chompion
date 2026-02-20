"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2, Plus, X, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PassionFood } from "@/lib/supabase/types";

import {
  FOOD_EMOJIS,
  POPULAR_FOODS,
  DEFAULT_RATING_CATEGORIES,
} from "@/lib/constants";

interface MyFoodsManagerProps {
  userId: string;
  initialFoods: PassionFood[];
  entryCounts: Record<string, number>;
}

export function MyFoodsManager({
  userId,
  initialFoods,
  entryCounts,
}: MyFoodsManagerProps) {
  const router = useRouter();
  const [foods, setFoods] = useState(initialFoods);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [customFood, setCustomFood] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleAddFood() {
    const foodName = addingCustom ? customFood.trim() : selectedFood;
    if (!foodName) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();

    const matchedTheme =
      POPULAR_FOODS.find(
        (f) => f.name.toLowerCase() === foodName.toLowerCase()
      )?.theme ?? "generic";

    const { data: newFood, error: createError } = await supabase
      .from("passion_foods")
      .insert({
        user_id: userId,
        name: foodName,
        theme_key: matchedTheme,
        is_default: false,
      })
      .select()
      .single();

    if (createError || !newFood) {
      setError(createError?.message ?? "Failed to add list");
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

    setFoods([...foods, newFood]);
    setShowAdd(false);
    setSelectedFood(null);
    setCustomFood("");
    setAddingCustom(false);
    setLoading(false);
    router.refresh();
  }

  async function handleSetDefault(foodId: string) {
    const supabase = createClient();

    await supabase
      .from("passion_foods")
      .update({ is_default: false })
      .eq("user_id", userId);

    await supabase
      .from("passion_foods")
      .update({ is_default: true })
      .eq("id", foodId);

    setFoods(
      foods.map((f) => ({ ...f, is_default: f.id === foodId }))
    );
    router.refresh();
  }

  async function handleDelete(foodId: string) {
    setDeletingId(foodId);
    const supabase = createClient();

    const entryIds =
      (
        await supabase
          .from("entries")
          .select("id")
          .eq("passion_food_id", foodId)
      ).data?.map((e) => e.id) ?? [];

    if (entryIds.length > 0) {
      await supabase
        .from("entry_ratings")
        .delete()
        .in("entry_id", entryIds);
      await supabase
        .from("entries")
        .delete()
        .eq("passion_food_id", foodId);
    }

    await supabase
      .from("subtypes")
      .delete()
      .eq("passion_food_id", foodId);
    await supabase
      .from("rating_categories")
      .delete()
      .eq("passion_food_id", foodId);
    await supabase.from("passion_foods").delete().eq("id", foodId);

    const remaining = foods.filter((f) => f.id !== foodId);

    if (remaining.length > 0 && !remaining.some((f) => f.is_default)) {
      await supabase
        .from("passion_foods")
        .update({ is_default: true })
        .eq("id", remaining[0].id);
      remaining[0] = { ...remaining[0], is_default: true };
    }

    setFoods(remaining);
    setConfirmDeleteId(null);
    setDeletingId(null);
    router.refresh();

    if (remaining.length === 0) {
      router.push("/dashboard");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Lists</h1>
          <p className="text-sm text-gray-500">
            Manage your chomp tracking lists
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} />
          Add List
        </button>
      </div>

      {/* Food cards */}
      <div className="space-y-3">
        {foods.map((food) => {
          const emoji = FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic;
          const count = entryCounts[food.id] ?? 0;
          const isConfirming = confirmDeleteId === food.id;
          const isDeleting = deletingId === food.id;

          return (
            <div
              key={food.id}
              className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5"
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl flex-shrink-0">{emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 text-lg truncate">
                      {food.name}
                    </h3>
                    {food.is_default && (
                      <span className="flex-shrink-0 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {count} {count === 1 ? "chomp" : "chomps"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {!food.is_default && (
                    <button
                      onClick={() => handleSetDefault(food.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                      title="Set as default"
                    >
                      <Star size={14} />
                      Set default
                    </button>
                  )}

                  {isConfirming ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(food.id)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:bg-red-300 transition-colors"
                        title="Confirm delete"
                      >
                        {isDeleting ? (
                          <span className="text-xs px-1">...</span>
                        ) : (
                          <Check size={14} />
                        )}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        disabled={isDeleting}
                        className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(food.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete food"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add food modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                Add a New List
              </h2>
              <button
                onClick={() => {
                  setShowAdd(false);
                  setSelectedFood(null);
                  setCustomFood("");
                  setAddingCustom(false);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {!addingCustom ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {POPULAR_FOODS.map((food) => (
                    <button
                      key={food.name}
                      onClick={() => setSelectedFood(food.name)}
                      className={`p-3 rounded-xl border-2 text-left transition-all text-sm font-medium ${
                        selectedFood === food.name
                          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                          : "border-gray-100 hover:border-gray-200 text-gray-700"
                      }`}
                    >
                      <span className="mr-1.5">{food.emoji}</span>
                      {food.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setAddingCustom(true)}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 text-gray-500 hover:text-emerald-600 transition-all text-sm font-medium text-center"
                >
                  Something else...
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAddingCustom(false);
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
                  placeholder="Enter a food to track..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddFood();
                    }
                  }}
                />
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <button
              onClick={handleAddFood}
              disabled={
                loading ||
                (!addingCustom && !selectedFood) ||
                (addingCustom && !customFood.trim())
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
            >
              {loading ? "Adding..." : "Add List"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
