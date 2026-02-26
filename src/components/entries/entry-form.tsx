"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  X,
  Share2,
  ArrowRight,
  Check,
  Star,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./star-rating";
import { calculateCompositeScore, generateMapsLink } from "@/lib/utils";
import { detectCuisine } from "@/lib/cuisine-detect";
import { FOOD_EMOJIS, DEFAULT_RATING_CATEGORIES } from "@/lib/constants";
import type {
  PassionFood,
  RatingCategory,
  Entry,
  EntryDish,
} from "@/lib/supabase/types";

interface ExistingRating {
  rating_category_id: string;
  score: number;
}

interface DishRow {
  id: string;
  name: string;
  rating: number;
}

interface EntryFormProps {
  userId: string;
  username?: string;
  passionFoods: PassionFood[];
  ratingCategories: RatingCategory[];
  existingEntry?: Entry;
  existingRatings?: ExistingRating[];
  existingDishes?: EntryDish[];
  prefillEntry?: Entry;
  prefillDishes?: EntryDish[];
  previousCities?: string[];
  previousDishNames?: string[];
  initialCollectionId?: string | null;
}

let dishIdCounter = 0;
function nextDishId() {
  return `dish-${++dishIdCounter}`;
}

export function EntryForm({
  userId,
  username,
  passionFoods,
  ratingCategories,
  existingEntry,
  existingRatings,
  existingDishes,
  prefillEntry,
  prefillDishes,
  previousCities = [],
  previousDishNames = [],
  initialCollectionId = null,
}: EntryFormProps) {
  const router = useRouter();
  const isEditing = !!existingEntry;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const source = existingEntry ?? prefillEntry;

  // --- Location ---
  const [restaurantName, setRestaurantName] = useState(source?.restaurant_name ?? "");
  const [city, setCity] = useState(source?.city ?? "");
  const [address, setAddress] = useState(source?.address ?? "");
  const [phoneNumber, setPhoneNumber] = useState(source?.phone_number ?? "");
  const [locationNotes, setLocationNotes] = useState(source?.location_notes ?? "");

  // --- City autocomplete ---
  const [cityFocused, setCityFocused] = useState(false);
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const cityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cityFocused || !city.trim()) {
      setCitySuggestions([]);
      return;
    }
    const q = city.toLowerCase();
    setCitySuggestions(
      previousCities
        .filter((c) => c.toLowerCase().includes(q) && c.toLowerCase() !== q)
        .slice(0, 5)
    );
  }, [city, cityFocused, previousCities]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Dishes ---
  const initDishes = (): DishRow[] => {
    if (existingDishes && existingDishes.length > 0) {
      return existingDishes.map((d) => ({
        id: nextDishId(),
        name: d.name,
        rating: d.rating ? Number(d.rating) : 0,
      }));
    }
    if (prefillDishes && prefillDishes.length > 0) {
      return prefillDishes.map((d) => ({
        id: nextDishId(),
        name: d.name,
        rating: 0,
      }));
    }
    return [{ id: nextDishId(), name: "", rating: 0 }];
  };

  const [dishes, setDishes] = useState<DishRow[]>(initDishes);

  // --- Dish name autocomplete ---
  const [activeDishIdx, setActiveDishIdx] = useState<number | null>(null);
  const [dishSuggestions, setDishSuggestions] = useState<string[]>([]);
  const dishRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (activeDishIdx === null) {
      setDishSuggestions([]);
      return;
    }
    const q = dishes[activeDishIdx]?.name?.toLowerCase() ?? "";
    if (!q.trim()) {
      setDishSuggestions([]);
      return;
    }
    setDishSuggestions(
      previousDishNames
        .filter((d) => d.toLowerCase().includes(q) && d.toLowerCase() !== q)
        .slice(0, 5)
    );
  }, [activeDishIdx, dishes, previousDishNames]);

  function updateDish(idx: number, field: keyof DishRow, value: string | number) {
    setDishes((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  }

  function addDish() {
    setDishes((prev) => [...prev, { id: nextDishId(), name: "", rating: 0 }]);
  }

  function removeDish(idx: number) {
    if (dishes.length <= 1) return;
    setDishes((prev) => prev.filter((_, i) => i !== idx));
  }

  // --- Experience ratings (universal categories) ---
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ratingCategories.forEach((cat) => {
      const existing = existingRatings?.find((r) => r.rating_category_id === cat.id);
      initial[cat.id] = existing?.score ?? 0;
    });
    return initial;
  });

  const ratedCategories = ratingCategories
    .filter((cat) => ratings[cat.id] > 0)
    .map((cat) => ({ score: ratings[cat.id], weight: Number(cat.weight) }));

  const compositeScore = ratedCategories.length > 0 ? calculateCompositeScore(ratedCategories) : null;
  const allRated = ratingCategories.every((cat) => ratings[cat.id] > 0);

  // --- Details ---
  const [quantity, setQuantity] = useState(source?.quantity ? String(source.quantity) : "");
  const [cost, setCost] = useState(source?.cost ? String(source.cost) : "");
  const [notes, setNotes] = useState(source?.notes ?? "");
  const [eatenAt, setEatenAt] = useState(
    existingEntry
      ? new Date(existingEntry.eaten_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  // --- Collection (optional) ---
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    existingEntry?.passion_food_id ?? initialCollectionId
  );
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  const hasLocationDetails = !!(address || phoneNumber || locationNotes);
  const hasEntryDetails = !!(quantity || cost || notes);

  const validDishes = dishes.filter((d) => d.name.trim());

  // --- Submit ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!restaurantName.trim() || !city.trim()) {
      setError("Restaurant name and city are required");
      setLoading(false);
      return;
    }

    if (validDishes.length === 0) {
      setError("Add at least one dish");
      setLoading(false);
      return;
    }

    if (ratedCategories.length === 0) {
      setError("Please rate at least one experience category");
      setLoading(false);
      return;
    }

    const cuisine = detectCuisine(
      validDishes.map((d) => d.name),
      restaurantName
    );

    const supabase = createClient();

    const entryData = {
      passion_food_id: selectedCollectionId || null,
      user_id: userId,
      restaurant_name: restaurantName.trim(),
      city: city.trim(),
      address: address.trim() || null,
      phone_number: phoneNumber.trim() || null,
      location_notes: locationNotes.trim() || null,
      subtype_id: null,
      quantity: quantity ? parseInt(quantity) : null,
      cost: cost ? parseFloat(cost) : null,
      notes: notes.trim() || null,
      cuisine,
      eaten_at: new Date(eatenAt).toISOString(),
    };

    if (isEditing) {
      const { error: updateError } = await supabase
        .from("entries")
        .update(entryData)
        .eq("id", existingEntry.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Update ratings
      await supabase.from("entry_ratings").delete().eq("entry_id", existingEntry.id);
      const ratingsToInsert = ratingCategories
        .filter((cat) => ratings[cat.id] > 0)
        .map((cat) => ({
          entry_id: existingEntry.id,
          rating_category_id: cat.id,
          score: ratings[cat.id],
        }));
      if (ratingsToInsert.length > 0) {
        const { error: ratingsError } = await supabase.from("entry_ratings").insert(ratingsToInsert);
        if (ratingsError) {
          setError(ratingsError.message);
          setLoading(false);
          return;
        }
      }

      // Update dishes
      await supabase.from("entry_dishes").delete().eq("entry_id", existingEntry.id);
      const dishesToInsert = validDishes.map((d, i) => ({
        entry_id: existingEntry.id,
        name: d.name.trim(),
        rating: d.rating > 0 ? d.rating : null,
        sort_order: i,
      }));
      if (dishesToInsert.length > 0) {
        await supabase.from("entry_dishes").insert(dishesToInsert);
      }

      setSuccess(true);
      setLoading(false);
    } else {
      const { data: entry, error: entryError } = await supabase
        .from("entries")
        .insert(entryData)
        .select()
        .single();

      if (entryError || !entry) {
        setError(entryError?.message ?? "Failed to create entry");
        setLoading(false);
        return;
      }

      // Insert ratings
      const ratingsToInsert = ratingCategories
        .filter((cat) => ratings[cat.id] > 0)
        .map((cat) => ({
          entry_id: entry.id,
          rating_category_id: cat.id,
          score: ratings[cat.id],
        }));
      if (ratingsToInsert.length > 0) {
        const { error: ratingsError } = await supabase.from("entry_ratings").insert(ratingsToInsert);
        if (ratingsError) {
          setError(ratingsError.message);
          setLoading(false);
          return;
        }
      }

      // Insert dishes
      const dishesToInsert = validDishes.map((d, i) => ({
        entry_id: entry.id,
        name: d.name.trim(),
        rating: d.rating > 0 ? d.rating : null,
        sort_order: i,
      }));
      if (dishesToInsert.length > 0) {
        await supabase.from("entry_dishes").insert(dishesToInsert);
      }

      setSuccess(true);
      setLoading(false);
    }
  }

  // --- Share ---
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const profileUrl = username
      ? `${window.location.origin}/u/${username}`
      : window.location.origin;

    const dishList = validDishes.map((d) => d.name).join(", ");
    const shareText = `${compositeScore !== null ? compositeScore.toFixed(1) + "/5.0 " : ""}${dishList} at ${restaurantName} — tracked on Chompion!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "My Chompion Rating", text: shareText, url: profileUrl });
        return;
      } catch {
        // fall through
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoToDashboard() {
    router.push(`/dashboard?success=${isEditing ? "updated" : "1"}`);
    router.refresh();
  }

  // --- Success screen ---
  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-10 text-center animate-fade-in space-y-5">
        <div className="text-5xl animate-scale-pop">🍽️</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {isEditing ? "Chomp updated!" : "Chomp logged!"}
          </h2>
          <p className="text-gray-500">
            {compositeScore !== null && (
              <span className="text-emerald-700 font-semibold">
                {compositeScore.toFixed(1)} / 5.0
              </span>
            )}{" "}
            at {restaurantName}
          </p>
          {validDishes.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {validDishes.map((d) => d.name).join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-medium py-3 px-5 rounded-xl transition-colors"
          >
            {copied ? (
              <><Check size={18} /> Link Copied!</>
            ) : (
              <><Share2 size={18} /> Share This Chomp</>
            )}
          </button>
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-5 rounded-xl transition-colors"
          >
            Go to Dashboard
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* WHERE section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Where</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="restaurant" className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant *
            </label>
            <input
              id="restaurant"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="e.g., Pok Pok"
            />
          </div>

          <div ref={cityRef} className="relative">
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
              City, State *
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onFocus={() => setCityFocused(true)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="e.g., Portland, OR"
            />
            {citySuggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                {citySuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                    onClick={() => {
                      setCity(s);
                      setCityFocused(false);
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {restaurantName.trim() && city.trim() && (
          <a
            href={generateMapsLink(restaurantName, city)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700"
          >
            <MapPin size={14} />
            View on Google Maps
          </a>
        )}

        <details className="group" open={hasLocationDetails || undefined}>
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
            + Address, phone, or location notes
          </summary>
          <div className="mt-3 space-y-3">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
              placeholder="Address"
            />
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
              placeholder="Phone number"
            />
            <input
              type="text"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
              placeholder="Hours, tips, reservations..."
            />
          </div>
        </details>
      </div>

      {/* WHAT I HAD section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          What I Had
        </h3>

        <div className="space-y-3">
          {dishes.map((dish, idx) => (
            <div
              key={dish.id}
              ref={(el) => { dishRefs.current[idx] = el; }}
              className="relative"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={dish.name}
                    onChange={(e) => updateDish(idx, "name", e.target.value)}
                    onFocus={() => setActiveDishIdx(idx)}
                    onBlur={() => setTimeout(() => setActiveDishIdx(null), 150)}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder={idx === 0 ? "e.g., Pad Thai" : "Another dish..."}
                  />
                  {activeDishIdx === idx && dishSuggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                      {dishSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            updateDish(idx, "name", s);
                            setActiveDishIdx(null);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateDish(idx, "rating", star)}
                      className="p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        size={20}
                        className={
                          star <= dish.rating
                            ? "fill-amber-400 text-amber-400"
                            : "fill-none text-gray-300"
                        }
                      />
                    </button>
                  ))}
                </div>

                {dishes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeDish(idx)}
                    className="p-1.5 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addDish}
          className="inline-flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <Plus size={14} />
          Add another dish
        </button>
      </div>

      {/* EXPERIENCE RATING section */}
      <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Rate the Experience
          </h3>
          {compositeScore !== null && (
            <div className="bg-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full animate-scale-pop">
              {compositeScore.toFixed(1)} / 5.0
            </div>
          )}
        </div>

        <div className="space-y-3">
          {ratingCategories.map((cat) => (
            <StarRating
              key={cat.id}
              label={cat.name}
              weight={Number(cat.weight)}
              value={ratings[cat.id] ?? 0}
              onChange={(score) => setRatings((prev) => ({ ...prev, [cat.id]: score }))}
            />
          ))}
        </div>

        {!allRated && ratedCategories.length > 0 && (
          <p className="text-xs text-gray-400">
            {ratingCategories.length - ratedCategories.length} unrated (optional)
          </p>
        )}
      </div>

      {/* DETAILS section */}
      <details className="group" open={hasEntryDetails || undefined}>
        <summary className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-4 cursor-pointer hover:bg-emerald-50/30 transition-colors select-none flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Details
          </span>
          <span className="text-xs text-gray-400 group-open:hidden">
            Cost, quantity, when, notes...
          </span>
        </summary>
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-emerald-100 p-5 -mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-1">
                Cost ($)
              </label>
              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="How many?"
              />
            </div>

            <div>
              <label htmlFor="eatenAt" className="block text-sm font-medium text-gray-700 mb-1">
                When
              </label>
              <input
                id="eatenAt"
                type="datetime-local"
                value={eatenAt}
                onChange={(e) => setEatenAt(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
              placeholder="How was the experience?"
            />
          </div>
        </div>
      </details>

      {/* COLLECTION (optional) */}
      {passionFoods.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <button
            type="button"
            onClick={() => setShowCollectionPicker(!showCollectionPicker)}
            className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>
              {selectedCollectionId
                ? `Collection: ${passionFoods.find((f) => f.id === selectedCollectionId)?.name ?? "Unknown"}`
                : "Add to a collection (optional)"}
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${showCollectionPicker ? "rotate-180" : ""}`}
            />
          </button>
          {showCollectionPicker && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedCollectionId(null);
                  setShowCollectionPicker(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCollectionId
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                None
              </button>
              {passionFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => {
                    setSelectedCollectionId(food.id);
                    setShowCollectionPicker(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    food.id === selectedCollectionId
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {FOOD_EMOJIS[food.theme_key] ?? FOOD_EMOJIS.generic} {food.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors text-lg"
      >
        {loading ? "Saving..." : isEditing ? "Update Chomp" : "Log Chomp"}
      </button>
    </form>
  );
}
