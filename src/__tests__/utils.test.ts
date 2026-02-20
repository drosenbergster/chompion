import { describe, it, expect } from "vitest";
import { generateMapsLink, calculateCompositeScore } from "@/lib/utils";

describe("generateMapsLink", () => {
  it("encodes restaurant name and city into a Google Maps search URL", () => {
    const link = generateMapsLink("Blue Bottle", "San Francisco");
    expect(link).toBe(
      "https://www.google.com/maps/search/?api=1&query=Blue%20Bottle%20San%20Francisco"
    );
  });

  it("handles special characters", () => {
    const link = generateMapsLink("Joe's Pizza", "New York");
    expect(link).toContain("Joe's%20Pizza%20New%20York");
  });
});

describe("calculateCompositeScore", () => {
  it("returns 0 for empty ratings", () => {
    expect(calculateCompositeScore([])).toBe(0);
  });

  it("computes weighted average correctly", () => {
    const ratings = [
      { score: 5, weight: 0.5 },
      { score: 3, weight: 0.5 },
    ];
    expect(calculateCompositeScore(ratings)).toBe(4);
  });

  it("handles uneven weights", () => {
    const ratings = [
      { score: 5, weight: 0.7 },
      { score: 1, weight: 0.3 },
    ];
    // 5*0.7 + 1*0.3 = 3.5 + 0.3 = 3.8
    expect(calculateCompositeScore(ratings)).toBe(3.8);
  });

  it("rounds to two decimal places", () => {
    const ratings = [
      { score: 4, weight: 0.34 },
      { score: 3, weight: 0.33 },
      { score: 5, weight: 0.33 },
    ];
    // 4*0.34 + 3*0.33 + 5*0.33 = 1.36 + 0.99 + 1.65 = 4.0
    const result = calculateCompositeScore(ratings);
    expect(result).toBe(4);
  });
});
