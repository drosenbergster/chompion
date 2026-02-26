"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  actor_id: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
  actor?: { display_name: string; username: string };
}

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, actor_id, data, read, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) return;

    const actorIds = [...new Set(data.map((n) => n.actor_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", actorIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p])
    );

    const items: NotificationItem[] = data.map((n) => ({
      ...n,
      data: (n.data ?? {}) as Record<string, unknown>,
      actor: profileMap.get(n.actor_id) ?? undefined,
    }));

    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.read).length);
    setLoaded(true);
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markAllRead() {
    const supabase = createClient();
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  function getNotificationText(n: NotificationItem): string {
    const name = n.actor?.display_name ?? "Someone";
    if (n.type === "new_follower") return `${name} started following you`;
    if (n.type === "friend_entry") {
      const restaurant = (n.data?.restaurant_name as string) ?? "a spot";
      return `${name} logged a chomp at ${restaurant}`;
    }
    return `${name} did something`;
  }

  function getNotificationHref(n: NotificationItem): string {
    const username = n.actor?.username ?? "";
    if (n.type === "new_follower") return `/u/${username}`;
    if (n.type === "friend_entry") {
      const entryId = n.data?.entry_id as string;
      return entryId ? `/u/${username}/entry/${entryId}` : `/u/${username}`;
    }
    return "/notifications";
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen(!open);
          if (!open && unreadCount > 0) markAllRead();
        }}
        className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-900">
              Notifications
            </span>
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
            >
              See all
            </Link>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {!loaded ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={getNotificationHref(n)}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                    !n.read ? "bg-emerald-50/40" : ""
                  }`}
                >
                  <div className="text-sm text-gray-800">
                    {getNotificationText(n)}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {timeAgo(n.created_at)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
