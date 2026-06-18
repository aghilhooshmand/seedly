"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  seedId: string | null;
  seedTitle?: string;
};

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  if (notifications.length === 0) {
    return <p className="text-sm text-emerald-800/60">—</p>;
  }

  return (
    <ul className="space-y-3">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`rounded-xl border p-4 ${n.read ? "border-emerald-50 bg-white" : "border-emerald-200 bg-emerald-50"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-emerald-950">{n.title}</p>
              <p className="mt-1 text-sm text-emerald-800/70">{n.message}</p>
              {n.seedId && n.seedTitle && (
                <Link href={`/seeds/${n.seedId}`} className="mt-2 inline-block text-sm text-emerald-600 underline">
                  {n.seedTitle}
                </Link>
              )}
            </div>
            {!n.read && (
              <button
                type="button"
                onClick={() => markRead(n.id)}
                className="shrink-0 text-xs text-emerald-700 hover:underline"
              >
                ✓
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
