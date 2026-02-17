import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateMapsLink(restaurantName: string, city: string): string {
  const query = encodeURIComponent(`${restaurantName} ${city}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function calculateCompositeScore(
  ratings: { score: number; weight: number }[]
): number {
  if (ratings.length === 0) return 0;
  const weightedSum = ratings.reduce(
    (sum, r) => sum + r.score * r.weight,
    0
  );
  return Math.round(weightedSum * 100) / 100;
}
