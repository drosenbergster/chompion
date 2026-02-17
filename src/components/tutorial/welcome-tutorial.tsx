"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  UtensilsCrossed,
  BarChart3,
  Settings,
  Share2,
  ChevronRight,
  ChevronLeft,
  X,
} from "lucide-react";

const STEPS = [
  {
    icon: "🎉",
    title: "Welcome to Chompion!",
    body: "Your personal food tracker. Here's a quick look at how it works.",
    accent: "bg-orange-100 text-orange-600",
  },
  {
    Icon: Plus,
    title: "Log a Chomp",
    body: "Tap the orange + button anytime to log what you ate, where, and how it was. That's the core of Chompion.",
    accent: "bg-orange-100 text-orange-600",
  },
  {
    Icon: UtensilsCrossed,
    title: "Browse Your Chomps",
    body: "All your entries live under Chomps. Filter, search, and tap any entry to see details or log it again.",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    Icon: Settings,
    title: "Customize Your Ratings",
    body: "Head to Settings to set up rating categories (like Taste, Value, Presentation) and adjust their weights for each food.",
    accent: "bg-blue-100 text-blue-600",
  },
  {
    Icon: BarChart3,
    title: "Track Your Trends",
    body: "Insights shows your rating trends, top spots, spending patterns, and more — all in charts.",
    accent: "bg-emerald-100 text-emerald-600",
  },
  {
    Icon: Share2,
    title: "Share Your Profile",
    body: "Set a username in Settings and share your public profile link with friends so they can see your top-rated spots.",
    accent: "bg-purple-100 text-purple-600",
  },
];

export function WelcomeTutorial({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  async function dismiss() {
    setClosing(true);
    const supabase = createClient();
    await supabase
      .from("profiles")
      .update({ has_seen_tutorial: true })
      .eq(
        "id",
        (await supabase.auth.getUser()).data.user?.id ?? ""
      );
    onComplete?.();
  }

  if (closing) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in">
        {/* Skip / Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors z-10"
          aria-label="Skip tutorial"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="px-8 pt-10 pb-6 text-center">
          {/* Icon */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${current.accent}`}
          >
            {current.icon ? (
              <span className="text-3xl">{current.icon}</span>
            ) : current.Icon ? (
              <current.Icon size={28} />
            ) : null}
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {current.title}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            {current.body}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-5">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-orange-500"
                  : "w-1.5 bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex border-t border-gray-100">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 flex items-center justify-center gap-1 py-4 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : (
            <button
              onClick={dismiss}
              className="flex-1 py-4 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>
          )}

          <div className="w-px bg-gray-100" />

          <button
            onClick={isLast ? dismiss : () => setStep(step + 1)}
            className="flex-1 flex items-center justify-center gap-1 py-4 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors"
          >
            {isLast ? "Let's Chomp!" : "Next"}
            {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
