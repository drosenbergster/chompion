"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpDown } from "lucide-react";

interface EntryFiltersProps {
  cities: string[];
  orders: string[];
}

export function EntryFilters({ cities, orders }: EntryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "date";
  const currentCity = searchParams.get("city") ?? "";
  const currentCuisine = searchParams.get("cuisine") ?? "";

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("success");
    router.push(`/entries?${params.toString()}`);
  }

  const sortOptions = [
    { value: "date", label: "Newest" },
    { value: "date-asc", label: "Oldest" },
    { value: "rating", label: "Top Rated" },
    { value: "cost", label: "Most Expensive" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <ArrowUpDown size={14} className="text-gray-400 ml-3" />
        {sortOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => updateParams("sort", opt.value)}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              currentSort === opt.value
                ? "bg-emerald-600 text-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {cities.length > 1 && (
        <select
          value={currentCity}
          onChange={(e) => updateParams("city", e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none"
        >
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      )}

      {orders.length > 1 && (
        <select
          value={currentCuisine}
          onChange={(e) => updateParams("cuisine", e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs text-gray-700 bg-white focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 outline-none"
        >
          <option value="">All cuisines</option>
          {orders.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      )}

      {(currentCity || currentCuisine || currentSort !== "date") && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("sort");
            params.delete("city");
            params.delete("cuisine");
            const food = params.get("food");
            router.push(`/entries${food ? `?food=${food}` : ""}`);
          }}
          className="px-3 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
        >
          Reset
        </button>
      )}
    </div>
  );
}
