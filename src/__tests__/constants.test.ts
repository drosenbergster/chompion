import { describe, it, expect } from "vitest";
import {
  POPULAR_FOODS,
  FOOD_EMOJIS,
  DEFAULT_RATING_CATEGORIES,
} from "@/lib/constants";

describe("POPULAR_FOODS", () => {
  it("has entries with required fields", () => {
    POPULAR_FOODS.forEach((food) => {
      expect(food.name).toBeTruthy();
      expect(food.theme).toBeTruthy();
      expect(food.emoji).toBeTruthy();
    });
  });

  it("has a matching FOOD_EMOJIS entry for each theme", () => {
    POPULAR_FOODS.forEach((food) => {
      expect(FOOD_EMOJIS[food.theme]).toBe(food.emoji);
    });
  });
});

describe("FOOD_EMOJIS", () => {
  it("has a generic fallback", () => {
    expect(FOOD_EMOJIS.generic).toBeDefined();
  });
});

describe("DEFAULT_RATING_CATEGORIES", () => {
  it("has weights that sum to approximately 1", () => {
    const total = DEFAULT_RATING_CATEGORIES.reduce(
      (sum, cat) => sum + cat.weight,
      0
    );
    expect(total).toBeCloseTo(1, 2);
  });

  it("has 5 categories", () => {
    expect(DEFAULT_RATING_CATEGORIES.length).toBe(5);
  });

  it("has positive weights", () => {
    DEFAULT_RATING_CATEGORIES.forEach((cat) => {
      expect(cat.weight).toBeGreaterThan(0);
    });
  });

  it("includes the expected category names", () => {
    const names = DEFAULT_RATING_CATEGORIES.map((c) => c.name);
    expect(names).toContain("Taste");
    expect(names).toContain("Quality");
    expect(names).toContain("Value");
  });
});
