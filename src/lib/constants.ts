export const POPULAR_FOODS = [
  { name: "Pizza", theme: "pizza", emoji: "🍕" },
  { name: "Burgers", theme: "burgers", emoji: "🍔" },
  { name: "Coffee", theme: "coffee", emoji: "☕" },
  { name: "Tacos", theme: "tacos", emoji: "🌮" },
  { name: "Sushi", theme: "sushi", emoji: "🍣" },
  { name: "Cheese", theme: "cheese", emoji: "🧀" },
  { name: "Pasta", theme: "pasta", emoji: "🍝" },
  { name: "Ice Cream", theme: "icecream", emoji: "🍦" },
  { name: "Ramen", theme: "ramen", emoji: "🍜" },
  { name: "Burritos", theme: "burritos", emoji: "🌯" },
  { name: "Wine", theme: "wine", emoji: "🍷" },
  { name: "Sandwiches", theme: "sandwiches", emoji: "🥪" },
] as const;

export const FOOD_EMOJIS: Record<string, string> = {
  pizza: "🍕",
  burgers: "🍔",
  coffee: "☕",
  tacos: "🌮",
  sushi: "🍣",
  cheese: "🧀",
  pasta: "🍝",
  icecream: "🍦",
  ramen: "🍜",
  burritos: "🌯",
  wine: "🍷",
  sandwiches: "🥪",
  hotdogs: "🌭",
  wings: "🍗",
  pho: "🍲",
  generic: "🍽️",
};

export const DEFAULT_RATING_CATEGORIES = [
  { name: "Taste", weight: 0.34 },
  { name: "Value", weight: 0.33 },
  { name: "Presentation", weight: 0.33 },
] as const;
