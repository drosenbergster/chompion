"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Plus, X, Share2, ArrowRight, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StarRating } from "./star-rating";
import { calculateCompositeScore, generateMapsLink } from "@/lib/utils";
import type {
  PassionFood,
  Subtype,
  RatingCategory,
  Entry,
} from "@/lib/supabase/types";

interface ExistingRating {
  rating_category_id: string;
  score: number;
}

interface EntryFormProps {
  userId: string;
  username?: string;
  passionFood: PassionFood;
  passionFoods: PassionFood[];
  subtypes: Subtype[];
  ratingCategories: RatingCategory[];
  existingEntry?: Entry;
  existingRatings?: ExistingRating[];
  prefillEntry?: Entry;
}

export function EntryForm({
  userId,
  username,
  passionFood: initialPassionFood,
  passionFoods,
  subtypes: initialSubtypes,
  ratingCategories,
  existingEntry,
  existingRatings,
  prefillEntry,
}: EntryFormProps) {
  const router = useRouter();
  const isEditing = !!existingEntry;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Source for pre-filling: editing takes precedence, then prefill (log again)
  const source = existingEntry ?? prefillEntry;

  // Form state -- pre-populate from existing/prefill entry
  const [selectedFoodId, setSelectedFoodId] = useState(
    source?.passion_food_id ?? initialPassionFood.id
  );
  const [restaurantName, setRestaurantName] = useState(
    source?.restaurant_name ?? ""
  );
  const [city, setCity] = useState(source?.city ?? "");
  const [address, setAddress] = useState(source?.address ?? "");
  const [phoneNumber, setPhoneNumber] = useState(
    source?.phone_number ?? ""
  );
  const [locationNotes, setLocationNotes] = useState(
    source?.location_notes ?? ""
  );
  const [subtypeId, setSubtypeId] = useState<string>(
    source?.subtype_id ?? ""
  );
  const [quantity, setQuantity] = useState(
    source?.quantity ? String(source.quantity) : ""
  );
  const [cost, setCost] = useState(
    source?.cost ? String(source.cost) : ""
  );
  const [notes, setNotes] = useState("");
  const [eatenAt, setEatenAt] = useState(
    existingEntry
      ? new Date(existingEntry.eaten_at).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );

  // Dynamic rating categories and subtypes (per food)
  const [activeFoodCategories, setActiveFoodCategories] =
    useState<RatingCategory[]>(ratingCategories);
  const [loadingFood, setLoadingFood] = useState(false);

  // Rating state
  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    ratingCategories.forEach((cat) => {
      const existing = existingRatings?.find(
        (r) => r.rating_category_id === cat.id
      );
      initial[cat.id] = existing?.score ?? 0;
    });
    return initial;
  });

  // Subtypes state
  const [subtypes, setSubtypes] = useState(initialSubtypes);
  const [showAddSubtype, setShowAddSubtype] = useState(false);
  const [newSubtypeName, setNewSubtypeName] = useState("");

  // Fetch categories and subtypes when selected food changes
  const fetchFoodData = useCallback(
    async (foodId: string) => {
      if (foodId === initialPassionFood.id) {
        setActiveFoodCategories(ratingCategories);
        setSubtypes(initialSubtypes);
        const initial: Record<string, number> = {};
        ratingCategories.forEach((cat) => {
          const existing = existingRatings?.find(
            (r) => r.rating_category_id === cat.id
          );
          initial[cat.id] = existing?.score ?? 0;
        });
        setRatings(initial);
        return;
      }

      setLoadingFood(true);
      const supabase = createClient();

      const [{ data: cats }, { data: subs }] = await Promise.all([
        supabase
          .from("rating_categories")
          .select("*")
          .eq("passion_food_id", foodId)
          .order("sort_order"),
        supabase
          .from("subtypes")
          .select("*")
          .eq("passion_food_id", foodId)
          .order("sort_order"),
      ]);

      const newCats = (cats ?? []) as RatingCategory[];
      setActiveFoodCategories(newCats);
      setSubtypes((subs ?? []) as Subtype[]);
      setSubtypeId("");

      const freshRatings: Record<string, number> = {};
      newCats.forEach((cat) => {
        freshRatings[cat.id] = 0;
      });
      setRatings(freshRatings);
      setLoadingFood(false);
    },
    [initialPassionFood.id, ratingCategories, initialSubtypes, existingRatings]
  );

  useEffect(() => {
    if (selectedFoodId !== initialPassionFood.id) {
      fetchFoodData(selectedFoodId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFoodId]);

  // Composite score
  const ratedCategories = activeFoodCategories
    .filter((cat) => ratings[cat.id] > 0)
    .map((cat) => ({ score: ratings[cat.id], weight: Number(cat.weight) }));

  const compositeScore =
    ratedCategories.length > 0
      ? calculateCompositeScore(ratedCategories)
      : null;

  const allRated = activeFoodCategories.every((cat) => ratings[cat.id] > 0);

  const hasLocationDetails = !!(address || phoneNumber || locationNotes);
  const hasEntryDetails = !!(subtypeId || quantity || cost || notes);

  async function handleAddSubtype() {
    if (!newSubtypeName.trim()) return;

    const supabase = createClient();
    const { data, error: subError } = await supabase
      .from("subtypes")
      .insert({
        passion_food_id: selectedFoodId,
        name: newSubtypeName.trim(),
        sort_order: subtypes.length,
      })
      .select()
      .single();

    if (subError || !data) {
      setError(subError?.message ?? "Failed to add subtype");
      return;
    }

    setSubtypes([...subtypes, data]);
    setSubtypeId(data.id);
    setNewSubtypeName("");
    setShowAddSubtype(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!restaurantName.trim() || !city.trim()) {
      setError("Restaurant name and city are required");
      setLoading(false);
      return;
    }

    if (ratedCategories.length === 0) {
      setError("Please rate at least one category");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const entryData = {
      passion_food_id: selectedFoodId,
      user_id: userId,
      restaurant_name: restaurantName.trim(),
      city: city.trim(),
      address: address.trim() || null,
      phone_number: phoneNumber.trim() || null,
      location_notes: locationNotes.trim() || null,
      subtype_id: subtypeId || null,
      quantity: quantity ? parseInt(quantity) : null,
      cost: cost ? parseFloat(cost) : null,
      notes: notes.trim() || null,
      eaten_at: new Date(eatenAt).toISOString(),
    };

    if (isEditing) {
      // UPDATE existing entry
      const { error: updateError } = await supabase
        .from("entries")
        .update(entryData)
        .eq("id", existingEntry.id);

      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Delete old ratings, insert new ones
      await supabase
        .from("entry_ratings")
        .delete()
        .eq("entry_id", existingEntry.id);

      const ratingsToInsert = activeFoodCategories
        .filter((cat) => ratings[cat.id] > 0)
        .map((cat) => ({
          entry_id: existingEntry.id,
          rating_category_id: cat.id,
          score: ratings[cat.id],
        }));

      if (ratingsToInsert.length > 0) {
        const { error: ratingsError } = await supabase
          .from("entry_ratings")
          .insert(ratingsToInsert);

        if (ratingsError) {
          setError(ratingsError.message);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setLoading(false);
    } else {
      // INSERT new entry
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

      const ratingsToInsert = activeFoodCategories
        .filter((cat) => ratings[cat.id] > 0)
        .map((cat) => ({
          entry_id: entry.id,
          rating_category_id: cat.id,
          score: ratings[cat.id],
        }));

      if (ratingsToInsert.length > 0) {
        const { error: ratingsError } = await supabase
          .from("entry_ratings")
          .insert(ratingsToInsert);

        if (ratingsError) {
          setError(ratingsError.message);
          setLoading(false);
          return;
        }
      }

      setSuccess(true);
      setLoading(false);
    }
  }

  const [copied, setCopied] = useState(false);

  const FOOD_EMOJIS: Record<string, string> = {
    burritos: "🌯",
    pizza: "🍕",
    tacos: "🌮",
    ramen: "🍜",
    sushi: "🍣",
    burgers: "🍔",
    hotdogs: "🌭",
    wings: "🍗",
    icecream: "🍦",
    pho: "🍲",
    generic: "🍽️",
  };

  const foodEmoji =
    FOOD_EMOJIS[initialPassionFood.theme_key] ?? FOOD_EMOJIS.generic;

  async function handleShare() {
    const profileUrl = username
      ? `${window.location.origin}/u/${username}`
      : window.location.origin;

    const shareText = `${compositeScore !== null ? compositeScore.toFixed(1) + "/5.0 " : ""}${initialPassionFood.name} at ${restaurantName} — tracked on Chompion!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Chompion Rating",
          text: shareText,
          url: profileUrl,
        });
        return;
      } catch {
        // User cancelled or API unavailable, fall through to copy
      }
    }

    await navigator.clipboard.writeText(`${shareText}\n${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleGoToDashboard() {
    router.push(
      `/dashboard?success=${isEditing ? "updated" : "1"}`
    );
    router.refresh();
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-10 text-center animate-fade-in space-y-5">
        <div className="text-5xl animate-scale-pop">{foodEmoji}</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {isEditing ? "Chomp updated!" : "Chomp logged!"}
          </h2>
          <p className="text-gray-500">
            {compositeScore !== null && (
              <span className="text-orange-600 font-semibold">
                {compositeScore.toFixed(1)} / 5.0
              </span>
            )}
            {" "}at {restaurantName}
          </p>
        </div>

        <div className="flex flex-col gap-3 max-w-xs mx-auto pt-2">
          <button
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-700 font-medium py-3 px-5 rounded-xl transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} />
                Link Copied!
              </>
            ) : (
              <>
                <Share2 size={18} />
                Share This Chomp
              </>
            )}
          </button>
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-5 rounded-xl transition-colors"
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
      {/* Passion food selector (if multiple and not editing) */}
      {!isEditing && passionFoods.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {passionFoods.map((food) => (
            <button
              key={food.id}
              type="button"
              disabled={loadingFood}
              onClick={() => {
                setSelectedFoodId(food.id);
                fetchFoodData(food.id);
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                food.id === selectedFoodId
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {food.name}
            </button>
          ))}
        </div>
      )}

      {/* Location section */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Where
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="restaurant"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Restaurant *
            </label>
            <input
              id="restaurant"
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="e.g., Taqueria El Farolito"
            />
          </div>

          <div>
            <label
              htmlFor="city"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              City *
            </label>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400"
              placeholder="e.g., San Francisco"
            />
          </div>
        </div>

        {restaurantName.trim() && city.trim() && (
          <a
            href={generateMapsLink(restaurantName, city)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 hover:text-orange-600"
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
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
              placeholder="Address"
            />
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
              placeholder="Phone number"
            />
            <input
              type="text"
              value={locationNotes}
              onChange={(e) => setLocationNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400 text-sm"
              placeholder="Hours, tips, reservations..."
            />
          </div>
        </details>
      </div>

      {/* Rating section -- moved above details for prominence */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Rating
          </h3>
          {compositeScore !== null && (
            <div className="bg-orange-500 text-white text-sm font-bold px-3 py-1 rounded-full animate-scale-pop">
              {compositeScore.toFixed(1)} / 5.0
            </div>
          )}
        </div>

        {loadingFood ? (
          <div className="py-4 text-center text-sm text-gray-400">
            Loading categories...
          </div>
        ) : (
          <div className="space-y-3">
            {activeFoodCategories.map((cat) => (
              <StarRating
                key={cat.id}
                label={cat.name}
                weight={Number(cat.weight)}
                value={ratings[cat.id] ?? 0}
                onChange={(score) =>
                  setRatings((prev) => ({ ...prev, [cat.id]: score }))
                }
              />
            ))}
          </div>
        )}

        {!allRated && ratedCategories.length > 0 && (
          <p className="text-xs text-gray-400">
            {activeFoodCategories.length - ratedCategories.length} unrated (optional)
          </p>
        )}
      </div>

      {/* Details section -- collapsed by default */}
      <details className="group" open={hasEntryDetails || undefined}>
        <summary className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 cursor-pointer hover:bg-orange-50/30 transition-colors select-none flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Details
          </span>
          <span className="text-xs text-gray-400 group-open:hidden">
            Order, cost, quantity, when...
          </span>
        </summary>
        <div className="bg-white rounded-b-2xl shadow-sm border border-t-0 border-orange-100 p-5 -mt-3 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="subtype"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Order
              </label>
              {!showAddSubtype ? (
                <div className="flex gap-2">
                  <select
                    id="subtype"
                    value={subtypeId}
                    onChange={(e) => setSubtypeId(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 bg-white"
                  >
                    <option value="">None</option>
                    {subtypes.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowAddSubtype(true)}
                    className="px-3 py-2.5 rounded-xl border border-dashed border-orange-300 text-orange-500 hover:bg-orange-50 transition-colors"
                    title="Add new order"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtypeName}
                    onChange={(e) => setNewSubtypeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtype();
                      }
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                    placeholder="e.g., Carne Asada"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtype}
                    className="px-3 py-2.5 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddSubtype(false);
                      setNewSubtypeName("");
                    }}
                    className="px-3 py-2.5 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="How many?"
              />
            </div>

            <div>
              <label
                htmlFor="cost"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cost ($)
              </label>
              <input
                id="cost"
                type="number"
                min="0"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="eatenAt"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              When
            </label>
            <input
              id="eatenAt"
              type="datetime-local"
              value={eatenAt}
              onChange={(e) => setEatenAt(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-400 resize-none"
              placeholder="How was the experience?"
            />
          </div>
        </div>
      </details>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-3.5 px-4 rounded-xl transition-colors text-lg"
      >
        {loading ? "Saving..." : isEditing ? "Update Chomp" : "Log Chomp"}
      </button>
    </form>
  );
}
