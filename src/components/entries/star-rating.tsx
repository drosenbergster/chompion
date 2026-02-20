"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  weight?: number;
}

export function StarRating({ value, onChange, label, weight }: StarRatingProps) {
  const [justClicked, setJustClicked] = useState<number | null>(null);

  function handleClick(star: number) {
    onChange(star);
    setJustClicked(star);
    setTimeout(() => setJustClicked(null), 300);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {weight !== undefined && (
          <span className="text-xs text-gray-400 ml-1.5">
            ({Math.round(weight * 100)}%)
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleClick(star)}
            className="p-1.5 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={26}
              className={cn(
                "transition-colors",
                star <= value
                  ? "fill-amber-400 text-amber-400"
                  : "fill-none text-gray-300",
                justClicked === star && "animate-scale-pop"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
