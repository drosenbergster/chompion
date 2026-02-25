import { getFoodTheme } from "@/lib/themes";

interface FoodThemeProviderProps {
  themeKey: string;
  children: React.ReactNode;
  className?: string;
}

export function FoodThemeProvider({
  themeKey,
  children,
  className,
}: FoodThemeProviderProps) {
  const theme = getFoodTheme(themeKey);

  return (
    <div
      className={className}
      style={
        {
          "--food-primary": theme.primary,
          "--food-primary-light": theme.primaryLight,
          "--food-tint": theme.tint,
          "--food-chart-1": theme.chart[0],
          "--food-chart-2": theme.chart[1],
          "--food-chart-3": theme.chart[2],
          "--food-chart-4": theme.chart[3],
          "--food-chart-5": theme.chart[4],
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
