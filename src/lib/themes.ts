export interface FoodTheme {
  primary: string;
  primaryLight: string;
  tint: string;
  chart: string[];
}

export const FOOD_THEMES: Record<string, FoodTheme> = {
  pizza: {
    primary: "#DC2626",
    primaryLight: "#EF4444",
    tint: "#FEF2F2",
    chart: ["#DC2626", "#EF4444", "#F87171", "#FCA5A5", "#FECACA"],
  },
  burritos: {
    primary: "#EA580C",
    primaryLight: "#F97316",
    tint: "#FFF7ED",
    chart: ["#EA580C", "#F97316", "#FB923C", "#FDBA74", "#FED7AA"],
  },
  tacos: {
    primary: "#CA8A04",
    primaryLight: "#EAB308",
    tint: "#FEFCE8",
    chart: ["#CA8A04", "#EAB308", "#FACC15", "#FDE047", "#FEF08A"],
  },
  coffee: {
    primary: "#92400E",
    primaryLight: "#B45309",
    tint: "#FDF8F0",
    chart: ["#78350F", "#92400E", "#B45309", "#D97706", "#F59E0B"],
  },
  sushi: {
    primary: "#0891B2",
    primaryLight: "#06B6D4",
    tint: "#ECFEFF",
    chart: ["#0E7490", "#0891B2", "#06B6D4", "#22D3EE", "#67E8F9"],
  },
  ramen: {
    primary: "#B91C1C",
    primaryLight: "#DC2626",
    tint: "#FEF2F2",
    chart: ["#991B1B", "#B91C1C", "#DC2626", "#EF4444", "#F87171"],
  },
  burgers: {
    primary: "#92400E",
    primaryLight: "#B45309",
    tint: "#FFFBEB",
    chart: ["#78350F", "#92400E", "#B45309", "#D97706", "#F59E0B"],
  },
  icecream: {
    primary: "#DB2777",
    primaryLight: "#EC4899",
    tint: "#FDF2F8",
    chart: ["#BE185D", "#DB2777", "#EC4899", "#F472B6", "#F9A8D4"],
  },
  cheese: {
    primary: "#CA8A04",
    primaryLight: "#EAB308",
    tint: "#FEFCE8",
    chart: ["#A16207", "#CA8A04", "#EAB308", "#FACC15", "#FDE047"],
  },
  pasta: {
    primary: "#B45309",
    primaryLight: "#D97706",
    tint: "#FFFBEB",
    chart: ["#92400E", "#B45309", "#D97706", "#F59E0B", "#FBBF24"],
  },
  wine: {
    primary: "#7C2D12",
    primaryLight: "#9A3412",
    tint: "#FDF2F8",
    chart: ["#7C2D12", "#9A3412", "#B91C1C", "#DC2626", "#EF4444"],
  },
  sandwiches: {
    primary: "#B45309",
    primaryLight: "#D97706",
    tint: "#FFF7ED",
    chart: ["#92400E", "#B45309", "#D97706", "#F59E0B", "#FBBF24"],
  },
  hotdogs: {
    primary: "#DC2626",
    primaryLight: "#EF4444",
    tint: "#FFFBEB",
    chart: ["#B91C1C", "#DC2626", "#EF4444", "#F87171", "#FCA5A5"],
  },
  wings: {
    primary: "#EA580C",
    primaryLight: "#F97316",
    tint: "#FFF7ED",
    chart: ["#C2410C", "#EA580C", "#F97316", "#FB923C", "#FDBA74"],
  },
  pho: {
    primary: "#059669",
    primaryLight: "#10B981",
    tint: "#ECFDF5",
    chart: ["#047857", "#059669", "#10B981", "#34D399", "#6EE7B7"],
  },
  generic: {
    primary: "#059669",
    primaryLight: "#10B981",
    tint: "#ECFDF5",
    chart: ["#047857", "#059669", "#10B981", "#34D399", "#6EE7B7"],
  },
};

export function getFoodTheme(themeKey: string): FoodTheme {
  return FOOD_THEMES[themeKey] ?? FOOD_THEMES.generic;
}
