"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DeleteEntryButtonProps {
  entryId: string;
}

export function DeleteEntryButton({ entryId }: DeleteEntryButtonProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    const supabase = createClient();

    await supabase.from("entry_ratings").delete().eq("entry_id", entryId);
    const { error: deleteError } = await supabase
      .from("entries")
      .delete()
      .eq("id", entryId);

    if (deleteError) {
      setError("Failed to delete: " + deleteError.message);
      setDeleting(false);
      setConfirming(false);
      return;
    }

    router.push("/entries?success=deleted");
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors text-sm"
        >
          {deleting ? "Deleting..." : "Confirm Delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="inline-flex items-center justify-center px-4 py-3 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5 mb-2">
          {error}
        </div>
      )}
      <button
        onClick={() => setConfirming(true)}
        className="inline-flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 font-medium py-3 px-4 rounded-xl transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </>
  );
}
