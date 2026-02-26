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

export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
