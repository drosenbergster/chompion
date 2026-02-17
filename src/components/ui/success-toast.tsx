"use client";

import { useEffect, useState } from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  duration?: number;
}

export function SuccessToast({ message, duration = 4000 }: SuccessToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, duration);

    // Clean up the ?success=1 from the URL without a page reload
    const url = new URL(window.location.href);
    url.searchParams.delete("success");
    window.history.replaceState({}, "", url.pathname);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  return (
    <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 animate-slide-down-in">
      <CheckCircle size={18} className="flex-shrink-0 text-green-500" />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
}
