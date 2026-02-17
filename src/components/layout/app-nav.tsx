"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Home, UtensilsCrossed, BarChart3, Settings, Plus } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { cn } from "@/lib/utils";
import type { Profile } from "@/lib/supabase/types";

interface AppNavProps {
  user: { id: string; email: string };
  profile: Profile | null;
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/entries", label: "Chomps", icon: UtensilsCrossed },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppNav({ profile }: AppNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop top nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">
              Chompion
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors",
                    isActive
                      ? "bg-orange-100 text-orange-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/entries/new"
              className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl transition-colors"
              title="Log a Chomp"
            >
              <Plus size={20} />
            </Link>

            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {profile?.display_name ?? "User"}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Log out"
                >
                  <LogOut size={18} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-orange-100 z-50 safe-area-pb">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
                  isActive
                    ? "text-orange-600"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon size={22} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
