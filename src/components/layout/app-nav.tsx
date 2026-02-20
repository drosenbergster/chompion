"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Home, UtensilsCrossed, BarChart3, Users, Settings, Plus } from "lucide-react";
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
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const mobileLeftItems = navItems.slice(0, 2);
const mobileRightItems = navItems.slice(2);

export function AppNav({ profile }: AppNavProps) {
  const pathname = usePathname();
  const isOnNewEntry = pathname === "/entries/new";

  return (
    <>
      {/* Desktop top nav */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
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
                      ? "bg-emerald-100 text-emerald-700"
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
              className={cn(
                "hidden md:inline-flex items-center gap-2 font-semibold px-5 py-2.5 rounded-xl transition-colors",
                isOnNewEntry
                  ? "bg-emerald-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              )}
            >
              <Plus size={18} strokeWidth={2.5} />
              Log Chomp
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

      {/* Mobile bottom nav with center FAB */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-emerald-100 z-50 safe-area-pb">
        <div className="flex items-center justify-around h-16 relative">
          {mobileLeftItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-emerald-700"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/entries/new"
            className={cn(
              "flex flex-col items-center justify-center -mt-7 w-16 h-16 rounded-full shadow-lg transition-all active:scale-95",
              isOnNewEntry
                ? "bg-emerald-700 shadow-emerald-300"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200"
            )}
          >
            <Plus size={28} className="text-white" strokeWidth={2.5} />
          </Link>

          {mobileRightItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-emerald-700"
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Icon size={20} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
