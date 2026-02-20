import { describe, it, expect } from "vitest";

interface Entry {
  id: string;
  restaurant_name: string;
  city: string;
  composite_score: number | null;
  cost: number | null;
  eaten_at: string;
  subtype_name: string | null;
}

function computeSummaryStats(entries: Entry[]) {
  return {
    totalEntries: entries.length,
    totalSpent: entries.reduce((sum, e) => sum + (e.cost ?? 0), 0),
    uniqueRestaurants: new Set(entries.map((e) => e.restaurant_name)).size,
    citiesVisited: new Set(entries.map((e) => e.city)).size,
  };
}

function computeTopRestaurants(entries: Entry[]) {
  const map: Record<string, { totalScore: number; count: number }> = {};
  entries.forEach((e) => {
    if (!e.composite_score) return;
    if (!map[e.restaurant_name]) {
      map[e.restaurant_name] = { totalScore: 0, count: 0 };
    }
    map[e.restaurant_name].totalScore += e.composite_score;
    map[e.restaurant_name].count += 1;
  });
  const hasRepeatVisits = Object.values(map).some((r) => r.count >= 2);
  return Object.entries(map)
    .filter(([, data]) => (hasRepeatVisits ? data.count >= 2 : true))
    .map(([name, data]) => ({
      name,
      avgRating: Number((data.totalScore / data.count).toFixed(1)),
      visits: data.count,
    }))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 8);
}

const ENTRIES: Entry[] = [
  { id: "1", restaurant_name: "Blue Bottle", city: "SF", composite_score: 4.2, cost: 6.5, eaten_at: "2025-11-15", subtype_name: "Latte" },
  { id: "2", restaurant_name: "Blue Bottle", city: "SF", composite_score: 4.5, cost: 5.5, eaten_at: "2025-12-02", subtype_name: "Espresso" },
  { id: "3", restaurant_name: "Stumptown", city: "Portland", composite_score: 3.8, cost: 5.0, eaten_at: "2025-12-10", subtype_name: "Pour Over" },
  { id: "4", restaurant_name: "Intelligentsia", city: "LA", composite_score: 4.7, cost: 7.0, eaten_at: "2026-01-05", subtype_name: "Latte" },
  { id: "5", restaurant_name: "Verve", city: "Santa Cruz", composite_score: 4.3, cost: null, eaten_at: "2026-02-01", subtype_name: null },
];

describe("insights data processing", () => {
  describe("computeSummaryStats", () => {
    it("counts totals correctly", () => {
      const stats = computeSummaryStats(ENTRIES);
      expect(stats.totalEntries).toBe(5);
      expect(stats.uniqueRestaurants).toBe(4);
      expect(stats.citiesVisited).toBe(4);
    });

    it("sums cost, skipping nulls", () => {
      const stats = computeSummaryStats(ENTRIES);
      expect(stats.totalSpent).toBe(24);
    });

    it("handles empty entries", () => {
      const stats = computeSummaryStats([]);
      expect(stats.totalEntries).toBe(0);
      expect(stats.totalSpent).toBe(0);
      expect(stats.uniqueRestaurants).toBe(0);
      expect(stats.citiesVisited).toBe(0);
    });
  });

  describe("computeTopRestaurants", () => {
    it("filters to restaurants with 2+ visits when repeat visits exist", () => {
      const top = computeTopRestaurants(ENTRIES);
      expect(top.length).toBe(1);
      expect(top[0].name).toBe("Blue Bottle");
      expect(top[0].visits).toBe(2);
      expect(top[0].avgRating).toBeCloseTo(4.35, 1);
    });

    it("shows all restaurants when none have repeat visits", () => {
      const noRepeats = ENTRIES.filter(
        (e) => e.restaurant_name !== "Blue Bottle" || e.id === "1"
      );
      const top = computeTopRestaurants(noRepeats);
      expect(top.length).toBe(4);
    });

    it("sorts by average rating descending", () => {
      const noRepeats = ENTRIES.filter(
        (e) => e.restaurant_name !== "Blue Bottle" || e.id === "1"
      );
      const top = computeTopRestaurants(noRepeats);
      for (let i = 1; i < top.length; i++) {
        expect(top[i - 1].avgRating).toBeGreaterThanOrEqual(top[i].avgRating);
      }
    });

    it("skips entries without composite_score", () => {
      const entriesWithNull: Entry[] = [
        { id: "x", restaurant_name: "NoScore", city: "X", composite_score: null, cost: null, eaten_at: "2026-01-01", subtype_name: null },
      ];
      const top = computeTopRestaurants(entriesWithNull);
      expect(top.length).toBe(0);
    });
  });
});
