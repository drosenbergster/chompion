"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, ChevronRight, ChevronLeft, X, AtSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { POPULAR_FOODS, DEFAULT_RATING_CATEGORIES } from "@/lib/constants";

const TOTAL_STEPS = 5;

export function WelcomeTutorial({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [closing, setClosing] = useState(false);

  const [selectedFood, setSelectedFood] = useState<string | null>(null);
  const [customFood, setCustomFood] = useState("");
  const [createdFoodName, setCreatedFoodName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [username, setUsername] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken" | "invalid">("idle");

  const foodName = selectedFood ?? customFood.trim();
  const isLast = step === TOTAL_STEPS - 1;

  function dismiss() {
    setClosing(true);
    onComplete?.();
  }

  async function createPassionFood(): Promise<boolean> {
    if (!foodName) {
      setError("Pick a food or type your own to continue");
      return false;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return false;
    }

    const matchedTheme =
      POPULAR_FOODS.find(
        (f) => f.name.toLowerCase() === foodName.toLowerCase()
      )?.theme ?? "generic";

    const { data: passionFood, error: createError } = await supabase
      .from("passion_foods")
      .insert({
        user_id: user.id,
        name: foodName,
        theme_key: matchedTheme,
        is_default: true,
      })
      .select()
      .single();

    if (createError || !passionFood) {
      setError(createError?.message ?? "Something went wrong. Try again.");
      setLoading(false);
      return false;
    }

    const categories = DEFAULT_RATING_CATEGORIES.map((cat, i) => ({
      passion_food_id: passionFood.id,
      name: cat.name,
      weight: cat.weight,
      sort_order: i,
    }));

    const { error: catError } = await supabase
      .from("rating_categories")
      .insert(categories);

    if (catError) {
      setError(catError.message);
      setLoading(false);
      return false;
    }

    setCreatedFoodName(foodName);
    setLoading(false);
    return true;
  }

  async function checkUsername(value: string) {
    const cleaned = value.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(cleaned);

    if (cleaned.length < 3) {
      setUsernameStatus(cleaned.length > 0 ? "invalid" : "idle");
      return;
    }

    setUsernameStatus("checking");
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleaned)
      .maybeSingle();

    const { data: { user } } = await supabase.auth.getUser();
    if (data && data.id !== user?.id) {
      setUsernameStatus("taken");
    } else {
      setUsernameStatus("available");
    }
  }

  async function saveUsername(): Promise<boolean> {
    if (!username || username.length < 3) return true;
    if (usernameStatus === "taken" || usernameStatus === "invalid") {
      setError("Pick a valid, available username to continue");
      return false;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return true; }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.message.includes("unique")) {
        setUsernameStatus("taken");
        setError("That username is already taken");
      } else {
        setError(updateError.message);
      }
      setLoading(false);
      return false;
    }

    setLoading(false);
    return true;
  }

  async function handleNext() {
    if (step === 1) {
      const ok = await createPassionFood();
      if (!ok) return;
    }
    if (step === 3) {
      const ok = await saveUsername();
      if (!ok) return;
    }
    setStep(step + 1);
  }

  function handleFinish() {
    dismiss();
    router.refresh();
  }

  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const handleSelectFood = useCallback(
    (name: string) => {
      setSelectedFood(name);
      setCustomFood("");
      setError(null);

      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        handleNextRef.current();
      }, 600);
    },
    []
  );

  const handleNextRef = useRef(handleNext);
  handleNextRef.current = handleNext;

  function handleCustomInput(value: string) {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setCustomFood(value);
    setSelectedFood(null);
    setError(null);
  }

  if (closing) return null;

  const canAdvance =
    step === 0 ||
    step === 2 ||
    step === 4 ||
    (step === 1 && !!foodName) ||
    (step === 3 && (username.length === 0 || usernameStatus === "available"));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col animate-fade-in">
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 transition-colors z-10"
          aria-label="Skip tutorial"
        >
          <X size={20} />
        </button>

        <div className="relative flex-1 min-h-0">
          <div className="overflow-y-auto h-full">
            {step === 0 && <StepWelcome />}
            {step === 1 && (
              <StepPickFood
                selectedFood={selectedFood}
                customFood={customFood}
                onSelectFood={handleSelectFood}
                onCustomInput={handleCustomInput}
                error={error}
              />
            )}
            {step === 2 && <StepRankings />}
            {step === 3 && (
              <StepClaimProfile
                username={username}
                usernameStatus={usernameStatus}
                onChangeUsername={checkUsername}
                error={error}
              />
            )}
            {step === 4 && <StepReady foodName={createdFoodName} />}
          </div>
          {step === 1 && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 pb-5 pt-3 flex-shrink-0">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-orange-500"
                  : i < step
                    ? "w-1.5 bg-orange-300"
                    : "w-1.5 bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex border-t border-gray-100 flex-shrink-0">
          {step > 0 && step < TOTAL_STEPS - 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              disabled={loading || step === 2}
              className="flex-1 flex items-center justify-center gap-1 py-4 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={16} />
              Back
            </button>
          ) : step === 0 ? (
            <button
              onClick={dismiss}
              className="flex-1 py-4 text-sm font-medium text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip
            </button>
          ) : (
            <div className="flex-1" />
          )}

          <div className="w-px bg-gray-100" />

          <button
            onClick={isLast ? handleFinish : handleNext}
            disabled={!canAdvance || loading}
            className="flex-1 flex items-center justify-center gap-1 py-4 text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors disabled:text-orange-300"
          >
            {loading ? (
              "Setting up..."
            ) : isLast ? (
              "Let's Chomp!"
            ) : (
              <>
                Next
                <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepWelcome() {
  return (
    <div className="px-8 pt-10 pb-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-orange-100 text-orange-600">
        <span className="text-3xl">🎉</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Welcome to Chompion!
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        Track, rate, and rank your favorite foods. Let&apos;s get you set up in
        seconds.
      </p>
    </div>
  );
}

function StepPickFood({
  selectedFood,
  customFood,
  onSelectFood,
  onCustomInput,
  error,
}: {
  selectedFood: string | null;
  customFood: string;
  onSelectFood: (name: string) => void;
  onCustomInput: (value: string) => void;
  error: string | null;
}) {
  return (
    <div className="px-6 pt-8 pb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">
        What could you eat every day?
      </h2>
      <p className="text-gray-400 text-xs text-center mb-4">
        Pick one to start. You can always add more later.
      </p>

      <input
        type="text"
        value={customFood}
        onChange={(e) => onCustomInput(e.target.value)}
        placeholder="Type your own — Donuts, Pho, anything..."
        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-300 text-sm mb-3"
      />

      {error && (
        <div className="bg-red-50 text-red-600 text-xs rounded-xl px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="relative mb-3">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-[11px]">
          <span className="bg-white px-3 text-gray-300">or pick a popular one</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {POPULAR_FOODS.map((food) => (
          <button
            key={food.name}
            onClick={() => onSelectFood(food.name)}
            className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl border-2 transition-all ${
              selectedFood === food.name
                ? "border-orange-400 bg-orange-50 scale-[1.03] shadow-sm"
                : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
            }`}
          >
            <span className="text-2xl">{food.emoji}</span>
            <span
              className={`text-[11px] font-medium leading-tight ${
                selectedFood === food.name ? "text-orange-700" : "text-gray-600"
              }`}
            >
              {food.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepRankings() {
  return (
    <div className="px-8 pt-10 pb-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-blue-100 text-blue-600">
        <SlidersHorizontal size={28} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Make Rankings Yours
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        We set up five rating categories&mdash;Taste, Quality, Ambiance,
        Presentation, and Value. You can customize these anytime in Settings.
      </p>
    </div>
  );
}

function StepClaimProfile({
  username,
  usernameStatus,
  onChangeUsername,
  error,
}: {
  username: string;
  usernameStatus: "idle" | "checking" | "available" | "taken" | "invalid";
  onChangeUsername: (value: string) => void;
  error: string | null;
}) {
  return (
    <div className="px-8 pt-10 pb-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-purple-100 text-purple-600">
        <AtSign size={28} />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Claim Your Profile
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed mb-5">
        Pick a username so friends can find you and see your public profile.
      </p>

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
        <input
          type="text"
          value={username}
          onChange={(e) => onChangeUsername(e.target.value)}
          placeholder="your_username"
          maxLength={30}
          className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all text-gray-900 placeholder-gray-300 text-sm"
        />
      </div>

      <div className="mt-2 h-5 text-xs">
        {usernameStatus === "checking" && (
          <span className="text-gray-400">Checking...</span>
        )}
        {usernameStatus === "available" && (
          <span className="text-green-600">Available!</span>
        )}
        {usernameStatus === "taken" && (
          <span className="text-red-500">Already taken</span>
        )}
        {usernameStatus === "invalid" && (
          <span className="text-amber-600">At least 3 characters, letters, numbers, underscores</span>
        )}
      </div>

      {error && (
        <div className="mt-2 bg-red-50 text-red-600 text-xs rounded-xl px-3 py-2">
          {error}
        </div>
      )}

      <p className="mt-3 text-[11px] text-gray-300">
        You can skip this and change it later in Settings.
      </p>
    </div>
  );
}

function StepReady({ foodName }: { foodName: string }) {
  return (
    <div className="px-8 pt-10 pb-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-emerald-100 text-emerald-600">
        <span className="text-3xl">🚀</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        You&apos;re all set!
      </h2>
      <p className="text-gray-500 text-sm leading-relaxed">
        Tap the <span className="text-orange-500 font-semibold">+</span> button
        anytime to log what you ate. Your{" "}
        <span className="font-semibold">{foodName}</span> dashboard is ready.
      </p>
    </div>
  );
}
