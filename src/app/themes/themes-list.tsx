"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, Pencil, Sprout } from "lucide-react";

type Theme = {
  id: string;
  nameEn: string;
  nameFa: string;
  isSystem: boolean;
  color: string;
  seedCount: number;
  fieldCount: number;
};

export function ThemesList({ themes }: { themes: Theme[] }) {
  const t = useTranslations();
  const router = useRouter();

  async function duplicate(themeId: string, name: string) {
    const nameEn = prompt(t("themes.cloneNamePrompt"), `${name} (copy)`);
    if (!nameEn?.trim()) return;
    const res = await fetch("/api/themes/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceThemeId: themeId, nameEn: nameEn.trim() }),
    });
    if (res.ok) {
      const theme = await res.json();
      router.push(`/themes/${theme.id}`);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {themes.map((th) => (
        <div
          key={th.id}
          className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <span className="mt-1 h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: th.color }} />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-emerald-950">{th.nameEn}</h2>
              <p className="text-sm text-emerald-800/60">{th.nameFa}</p>
              <p className="mt-2 text-xs text-emerald-700/50">
                {th.fieldCount} {t("themes.fields")} · {th.seedCount} {t("themes.seedsPlanted")}
              </p>
              {th.isSystem && (
                <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {t("themes.system")}
                </span>
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {th.isSystem ? (
              <button
                type="button"
                onClick={() => duplicate(th.id, th.nameEn)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
              >
                <Copy className="h-4 w-4" />
                {t("themes.duplicateToEdit")}
              </button>
            ) : (
              <Link
                href={`/themes/${th.id}`}
                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <Pencil className="h-4 w-4" />
                {t("themes.edit")}
              </Link>
            )}
            <Link
              href={`/seeds/new?theme=${th.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
            >
              <Sprout className="h-4 w-4" />
              {t("themes.plantSeed")}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
