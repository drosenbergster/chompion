"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface ProfileEditorProps {
  userId: string;
  email: string;
  displayName: string;
  username: string;
}

export function ProfileEditor({
  userId,
  email,
  displayName: initialDisplayName,
  username: initialUsername,
}: ProfileEditorProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasChanges =
    displayName !== initialDisplayName || username !== initialUsername;

  async function handleSave() {
    if (!displayName.trim() || !username.trim()) {
      setError("Display name and username are required");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        username: username.trim().toLowerCase(),
      })
      .eq("id", userId);

    if (updateError) {
      if (updateError.message.includes("unique")) {
        setError("That username is already taken");
      } else {
        setError(updateError.message);
      }
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
      <div className="flex items-center gap-2 mb-4">
        <User size={18} className="text-emerald-600" />
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-gray-900"
          />
          <p className="text-xs text-gray-400 mt-1">
            Lowercase letters, numbers, and underscores only
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-500 text-sm">
            {email}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5">
            {error}
          </div>
        )}

        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2.5 px-5 rounded-xl transition-colors text-sm"
          >
            {saving ? "Saving..." : saved ? (
              <>
                <Check size={16} />
                Saved
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        )}

        {saved && !hasChanges && (
          <div className="inline-flex items-center gap-1.5 text-sm text-green-600">
            <Check size={14} />
            Saved
          </div>
        )}
      </div>
    </div>
  );
}
