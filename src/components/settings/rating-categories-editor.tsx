"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Star, Plus, Trash2, Check, AlertCircle, Lightbulb, X, RefreshCw } from "lucide-react";
import { DEFAULT_RATING_CATEGORIES } from "@/lib/constants";
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
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showRecalcPrompt, setShowRecalcPrompt] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [recalcResult, setRecalcResult] = useState<string | null>(null);

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
      setShowRecalcPrompt(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    } catch {
      setError("An unexpected error occurred");
      setSaving(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    setRecalcResult(null);
    const supabase = createClient();

    try {
      const { data: entries } = await supabase
        .from("entries")
        .select("id")
        .eq("passion_food_id", passionFoodId);

      if (!entries || entries.length === 0) {
        setRecalcResult("No entries to recalculate.");
        setRecalculating(false);
        return;
      }

      const { data: freshCategories } = await supabase
        .from("rating_categories")
        .select("id, weight")
        .eq("passion_food_id", passionFoodId);

      if (!freshCategories || freshCategories.length === 0) {
        setRecalcResult("No rating categories found.");
        setRecalculating(false);
        return;
      }

      const weightMap = new Map(
        freshCategories.map((c) => [c.id, Number(c.weight)])
      );

      let updated = 0;

      for (const entry of entries) {
        const { data: entryRatings } = await supabase
          .from("entry_ratings")
          .select("rating_category_id, score")
          .eq("entry_id", entry.id);

        if (!entryRatings || entryRatings.length === 0) continue;

        const pairs = entryRatings
          .filter((r) => weightMap.has(r.rating_category_id))
          .map((r) => ({
            score: r.score,
            weight: weightMap.get(r.rating_category_id)!,
          }));

        if (pairs.length === 0) continue;

        const weightedSum = pairs.reduce(
          (sum, p) => sum + p.score * p.weight,
          0
        );
        const composite = Math.round(weightedSum * 100) / 100;

        await supabase
          .from("entries")
          .update({ composite_score: composite })
          .eq("id", entry.id);

        updated++;
      }

      setRecalcResult(
        `Recalculated ${updated} ${updated === 1 ? "entry" : "entries"}.`
      );
      setShowRecalcPrompt(false);
      router.refresh();
    } catch {
      setRecalcResult("Something went wrong during recalculation.");
    } finally {
      setRecalculating(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={18} className="text-amber-500" />
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

      {!nudgeDismissed && categories.length < 5 && (() => {
        const currentNames = new Set(categories.map((c) => c.name.toLowerCase()));
        const missing = DEFAULT_RATING_CATEGORIES
          .filter((d) => !currentNames.has(d.name.toLowerCase()))
          .map((d) => d.name);
        return missing.length > 0 ? (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <Lightbulb size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-emerald-800">
                For richer insights, consider adding{" "}
                <span className="font-medium">{missing.join(" and ")}</span>{" "}
                to your rating categories.
              </p>
            </div>
            <button
              onClick={() => setNudgeDismissed(true)}
              className="text-emerald-400 hover:text-emerald-600 flex-shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : null;
      })()}

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
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
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
                className="w-full px-3 py-2 pr-7 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm text-gray-900 text-right"
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

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <Plus size={15} />
          Add Category
        </button>
        {categories.length >= 5 && (
          <span className="text-[11px] text-gray-400">
            More categories = more to rate each time
          </span>
        )}
      </div>

      {/* Weight indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isValidWeight
                ? "bg-green-400"
                : totalWeight > 100
                  ? "bg-red-400"
                  : "bg-amber-400"
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
                : "text-amber-600"
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
          className="mt-2 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
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
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 px-5 rounded-xl transition-colors text-sm"
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

      {showRecalcPrompt && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-2">
          <p className="text-sm text-amber-800">
            Weights updated. Want to recalculate scores on all existing{" "}
            <span className="font-medium">{passionFoodName.toLowerCase()}</span>{" "}
            entries?
          </p>
          <p className="text-xs text-amber-600">
            This will overwrite historical composite scores with the new weights.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-medium py-2 px-4 rounded-xl transition-colors text-sm"
            >
              <RefreshCw size={14} className={recalculating ? "animate-spin" : ""} />
              {recalculating ? "Recalculating..." : "Recalculate All"}
            </button>
            <button
              onClick={() => setShowRecalcPrompt(false)}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {recalcResult && (
        <div className="mt-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-2.5 flex items-center gap-2">
          <Check size={14} />
          {recalcResult}
        </div>
      )}
    </div>
  );
}
