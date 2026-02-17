"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Star, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { RatingCategory } from "@/lib/supabase/types";

interface RatingCategoriesEditorProps {
  passionFoodId: string;
  passionFoodName: string;
  categories: RatingCategory[];
}

interface EditableCategory {
  id: string;
  name: string;
  weight: string;
  isNew?: boolean;
}

export function RatingCategoriesEditor({
  passionFoodId,
  passionFoodName,
  categories: initialCategories,
}: RatingCategoriesEditorProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<EditableCategory[]>(
    initialCategories.map((c) => ({
      id: c.id,
      name: c.name,
      weight: String(Math.round(Number(c.weight) * 100)),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track which IDs exist in the database so we know what to delete on save.
  // Updated after every successful save.
  const knownDbIds = useRef<Set<string>>(
    new Set(initialCategories.map((c) => c.id))
  );

  const totalWeight = categories.reduce(
    (sum, c) => sum + (parseInt(c.weight) || 0),
    0
  );
  const isValidWeight = totalWeight === 100;

  function distributeWeightsEvenly(cats: EditableCategory[]): EditableCategory[] {
    const count = cats.length;
    if (count === 0) return cats;
    const base = Math.floor(100 / count);
    const remainder = 100 - base * count;
    return cats.map((c, i) => ({
      ...c,
      weight: String(base + (i < remainder ? 1 : 0)),
    }));
  }

  function handleAddCategory() {
    const newCats = [
      ...categories,
      {
        id: `new-${Date.now()}`,
        name: "",
        weight: "0",
        isNew: true,
      },
    ];
    setCategories(distributeWeightsEvenly(newCats));
  }

  function handleRemoveCategory(id: string) {
    if (categories.length <= 1) return;
    const filtered = categories.filter((c) => c.id !== id);
    setCategories(distributeWeightsEvenly(filtered));
  }

  function handleDistributeEvenly() {
    setCategories(distributeWeightsEvenly(categories));
    setSaved(false);
  }

  function handleUpdateCategory(
    id: string,
    field: "name" | "weight",
    value: string
  ) {
    setCategories(
      categories.map((c) =>
        c.id === id ? { ...c, [field]: value } : c
      )
    );
    setSaved(false);
  }

  async function handleSave() {
    if (!isValidWeight) {
      setError("Weights must add up to 100%");
      return;
    }

    if (categories.some((c) => !c.name.trim())) {
      setError("All categories need a name");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    try {
      // 1. Delete categories that existed in DB but were removed by the user
      const keepIds = new Set(
        categories.filter((c) => !c.isNew).map((c) => c.id)
      );
      const idsToDelete = [...knownDbIds.current].filter(
        (id) => !keepIds.has(id)
      );

      if (idsToDelete.length > 0) {
        const { error: delErr } = await supabase
          .from("rating_categories")
          .delete()
          .in("id", idsToDelete);
        if (delErr) {
          setError("Failed to delete categories: " + delErr.message);
          setSaving(false);
          return;
        }
      }

      // 2. Update existing categories (non-new)
      for (const cat of categories.filter((c) => !c.isNew)) {
        const { error: updErr } = await supabase
          .from("rating_categories")
          .update({
            name: cat.name.trim(),
            weight: (parseInt(cat.weight) || 0) / 100,
            sort_order: categories.indexOf(cat),
          })
          .eq("id", cat.id);
        if (updErr) {
          setError("Failed to update " + cat.name + ": " + updErr.message);
          setSaving(false);
          return;
        }
      }

      // 3. Insert new categories in a single batch
      const newCats = categories.filter((c) => c.isNew);
      if (newCats.length > 0) {
        const rows = newCats.map((cat) => ({
          passion_food_id: passionFoodId,
          name: cat.name.trim(),
          weight: (parseInt(cat.weight) || 0) / 100,
          sort_order: categories.indexOf(cat),
        }));
        const { error: insErr } = await supabase
          .from("rating_categories")
          .insert(rows);
        if (insErr) {
          setError("Failed to add new categories: " + insErr.message);
          setSaving(false);
          return;
        }
      }

      // 4. Re-fetch from DB to get authoritative state (real IDs, etc.)
      const { data: freshCats } = await supabase
        .from("rating_categories")
        .select("*")
        .eq("passion_food_id", passionFoodId)
        .order("sort_order");

      if (freshCats) {
        setCategories(
          freshCats.map((c) => ({
            id: c.id,
            name: c.name,
            weight: String(Math.round(Number(c.weight) * 100)),
            isNew: false,
          }))
        );
        knownDbIds.current = new Set(freshCats.map((c) => c.id));
      }

      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-orange-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            Rating Categories
          </h2>
        </div>
        <span className="text-xs text-gray-400">
          {passionFoodName}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Customize how you rate your {passionFoodName.toLowerCase()}. Weights
        must add up to 100%.
      </p>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="flex items-center gap-2">
            <input
              type="text"
              value={cat.name}
              onChange={(e) =>
                handleUpdateCategory(cat.id, "name", e.target.value)
              }
              placeholder="Category name"
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
            />
            <div className="relative w-20 flex-shrink-0">
              <input
                type="number"
                min="0"
                max="100"
                value={cat.weight}
                onChange={(e) =>
                  handleUpdateCategory(cat.id, "weight", e.target.value)
                }
                className="w-full px-3 py-2 pr-7 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-sm text-gray-900 text-right"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                %
              </span>
            </div>
            {categories.length > 1 && (
              <button
                onClick={() => handleRemoveCategory(cat.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={handleAddCategory}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600 font-medium"
      >
        <Plus size={15} />
        Add Category
      </button>

      {/* Weight indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isValidWeight
                ? "bg-green-400"
                : totalWeight > 100
                  ? "bg-red-400"
                  : "bg-orange-400"
            }`}
            style={{ width: `${Math.min(totalWeight, 100)}%` }}
          />
        </div>
        <span
          className={`text-xs font-medium ${
            isValidWeight
              ? "text-green-600"
              : totalWeight > 100
                ? "text-red-600"
                : "text-orange-600"
          }`}
        >
          {totalWeight}%
        </span>
      </div>

      {!isValidWeight && totalWeight > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
          <AlertCircle size={13} />
          {totalWeight > 100
            ? `${totalWeight - 100}% over — reduce weights`
            : `${100 - totalWeight}% remaining`}
        </div>
      )}

      {categories.length > 1 && (
        <button
          type="button"
          onClick={handleDistributeEvenly}
          className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-medium"
        >
          Distribute evenly
        </button>
      )}

      {error && (
        <div className="mt-3 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || !isValidWeight}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-2.5 px-5 rounded-xl transition-colors text-sm"
        >
          {saving ? "Saving..." : "Save Categories"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm text-green-600">
            <Check size={14} />
            Saved
          </span>
        )}
      </div>
    </div>
  );
}
