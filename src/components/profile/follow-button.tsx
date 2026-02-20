"use client";

import { useState } from "react";
import { UserPlus, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId: string | null;
  isFollowing: boolean;
}

export function FollowButton({
  targetUserId,
  currentUserId,
  isFollowing: initialIsFollowing,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  if (!currentUserId || currentUserId === targetUserId) {
    return null;
  }

  async function handleToggle() {
    setLoading(true);
    const supabase = createClient();

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", currentUserId!)
        .eq("following_id", targetUserId);
      setIsFollowing(false);
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUserId!,
        following_id: targetUserId,
      });
      setIsFollowing(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        isFollowing
          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
          : "bg-emerald-600 text-white hover:bg-emerald-700"
      }`}
    >
      {isFollowing ? (
        <>
          <UserCheck size={16} />
          Following
        </>
      ) : (
        <>
          <UserPlus size={16} />
          Follow
        </>
      )}
    </button>
  );
}
