"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { Palette, Sprout, LayoutDashboard, Plus, Bell } from "lucide-react";
import { useEffect, useState } from "react";

type User = { id: string; name: string };

export function AppShell({
  children,
  title,
  subtitle,
  users,
  currentUserId,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  users: User[];
  currentUserId: string;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setUnread(d.unread ?? 0))
      .catch(() => {});
  }, []);

  async function switchUser(userId: string) {
    await fetch("/api/user/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.refresh();
  }

  async function switchLocale(next: string) {
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="min-h-full bg-[#f6f9f4]">
      <header className="border-b border-emerald-100/80 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <span className="text-lg font-semibold text-emerald-950">{t("app.name")}</span>
              <p className="text-xs text-emerald-700/70 hidden sm:block">{t("app.tagline")}</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={currentUserId}
              onChange={(e) => switchUser(e.target.value)}
              className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-emerald-900"
              aria-label={t("common.user")}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>

            <select
              value={locale}
              onChange={(e) => switchLocale(e.target.value)}
              className="rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs text-emerald-900"
              aria-label={t("common.language")}
            >
              <option value="en">English</option>
              <option value="fa">فارسی</option>
            </select>

            <Link
              href="/notifications"
              className="relative inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm text-emerald-800 hover:bg-emerald-50"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>

            <Link
              href="/themes"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-emerald-800 hover:bg-emerald-50"
            >
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.themes")}</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm text-emerald-800 hover:bg-emerald-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.dashboard")}</span>
            </Link>
            <Link
              href="/seeds/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">{t("nav.newSeed")}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {(title || subtitle) && (
          <div className="mb-8">
            {title && <h1 className="text-2xl font-semibold text-emerald-950 sm:text-3xl">{title}</h1>}
            {subtitle && <p className="mt-1 text-emerald-800/70">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
