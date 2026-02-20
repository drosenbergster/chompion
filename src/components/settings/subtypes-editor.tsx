"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tag, Plus, X, Check, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Subtype } from "@/lib/supabase/types";

interface SubtypesEditorProps {
  passionFoodId: string;
  passionFoodName: string;
  subtypes: Subtype[];
}

export function SubtypesEditor({
  passionFoodId,
  passionFoodName,
  subtypes: initialSubtypes,
}: SubtypesEditorProps) {
  const router = useRouter();
  const [subtypes, setSubtypes] = useState(initialSubtypes);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;

    setAdding(true);
    setError(null);
    const supabase = createClient();

    const { data, error: insertError } = await supabase
      .from("subtypes")
      .insert({
        passion_food_id: passionFoodId,
        name: newName.trim(),
        sort_order: subtypes.length,
      })
      .select()
      .single();

    if (insertError || !data) {
      setError(insertError?.message ?? "Failed to add subtype");
      setAdding(false);
      return;
    }

    setSubtypes([...subtypes, data]);
    setNewName("");
    setAdding(false);
    router.refresh();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;

    setError(null);
    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("subtypes")
      .update({ name: editName.trim() })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSubtypes(
      subtypes.map((s) =>
        s.id === id ? { ...s, name: editName.trim() } : s
      )
    );
    setEditingId(null);
    setEditName("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError(null);
    const supabase = createClient();

    const { error: deleteError } = await supabase
      .from("subtypes")
      .delete()
      .eq("id", id);

    if (deleteError) {
      if (deleteError.message.includes("foreign key") || deleteError.message.includes("violates")) {
        setError("Can't delete — this subtype is used by existing entries. Remove it from those entries first.");
      } else {
        setError(deleteError.message);
      }
      return;
    }

    setSubtypes(subtypes.filter((s) => s.id !== id));
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag size={18} className="text-emerald-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Types / Variants
          </h2>
        </div>
        <span className="text-xs text-gray-400">
          {passionFoodName}
        </span>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Manage the types of {passionFoodName.toLowerCase()} you track
        (e.g., Carne Asada, Al Pastor, California).
      </p>

      {subtypes.length === 0 ? (
        <div className="text-sm text-gray-400 italic mb-4">
          No subtypes yet. Add your first one below.
        </div>
      ) : (
        <div className="space-y-2 mb-4">
          {subtypes.map((subtype) => (
            <div
              key={subtype.id}
              className="flex items-center gap-2 group"
            >
              {editingId === subtype.id ? (
                <>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(subtype.id);
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setEditName("");
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm text-gray-900"
                    autoFocus
                  />
                  <button
                    onClick={() => handleRename(subtype.id)}
                    className="p-2 text-green-500 hover:text-green-600 transition-colors"
                  >
                    <Check size={15} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setEditName("");
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </>
              ) : (
                <>
                  <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-900">
                    {subtype.name}
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(subtype.id);
                      setEditName(subtype.name);
                    }}
                    className="p-2 text-gray-300 hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(subtype.id)}
                    className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={15} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new subtype */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="Add new type..."
          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none transition-all text-sm text-gray-900 placeholder-gray-400"
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newName.trim()}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium py-2 px-4 rounded-xl transition-colors text-sm"
        >
          <Plus size={15} />
          {adding ? "Adding..." : "Add"}
        </button>
      </div>

      {error && (
        <div className="mt-3 bg-red-50 text-red-600 text-sm rounded-xl px-4 py-2.5">
          {error}
        </div>
      )}
    </div>
  );
}
