import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Bell } from "lucide-react";
import { timeAgo } from "@/lib/utils";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, actor_id, data, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = notifications ?? [];

  const actorIds = [...new Set(items.map((n) => n.actor_id))];
  const { data: profiles } = actorIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, display_name, username")
        .in("id", actorIds)
    : { data: [] };

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p])
  );

  // Mark all unread as read
  const unreadIds = items.filter((n) => !n.read).map((n) => n.id);
  if (unreadIds.length > 0) {
    await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);
  }

  function getText(n: typeof items[0]): string {
    const actor = profileMap.get(n.actor_id);
    const name = actor?.display_name ?? "Someone";
    if (n.type === "new_follower") return `${name} started following you`;
    if (n.type === "friend_entry") {
      const data = (n.data ?? {}) as Record<string, unknown>;
      const restaurant = (data.restaurant_name as string) ?? "a spot";
      return `${name} logged a chomp at ${restaurant}`;
    }
    return `${name} did something`;
  }

  function getHref(n: typeof items[0]): string {
    const actor = profileMap.get(n.actor_id);
    const username = actor?.username ?? "";
    if (n.type === "new_follower") return `/u/${username}`;
    if (n.type === "friend_entry") {
      const data = (n.data ?? {}) as Record<string, unknown>;
      const entryId = data.entry_id as string;
      return entryId ? `/u/${username}/entry/${entryId}` : `/u/${username}`;
    }
    return "#";
  }

  return (
    <div className="pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Notifications</h1>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 p-12 text-center animate-fade-in">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="text-emerald-600" size={28} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            All caught up
          </h3>
          <p className="text-gray-500 max-w-sm mx-auto">
            When people follow you or your friends log chomps, you&apos;ll see
            it here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
          {items.map((n, i) => (
            <Link
              key={n.id}
              href={getHref(n)}
              className={`flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors ${
                i < items.length - 1 ? "border-b border-gray-50" : ""
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800">{getText(n)}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {timeAgo(n.created_at)}
                </div>
              </div>
              {!n.read && unreadIds.includes(n.id) && (
                <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 ml-3" />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
