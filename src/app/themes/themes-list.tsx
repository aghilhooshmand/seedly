"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Copy, Pencil, Plus, Sprout } from "lucide-react";

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
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [saving, setSaving] = useState(false);

  async function duplicate(themeId: string, nameEn: string) {
    const copyName = prompt(t("themes.cloneNamePrompt"), `${nameEn} (copy)`);
    if (!copyName?.trim()) return;
    const res = await fetch("/api/themes/clone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceThemeId: themeId, nameEn: copyName.trim() }),
    });
    if (res.ok) {
      const theme = await res.json();
      router.push(`/themes/${theme.id}`);
    }
  }

  async function createTheme(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/themes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameEn: name.trim(),
        ...(templateId ? { sourceThemeId: templateId } : {}),
      }),
    });
    setSaving(false);
    if (res.ok) {
      const theme = await res.json();
      router.push(`/themes/${theme.id}`);
    }
  }

  const userThemes = themes.filter((th) => !th.isSystem);
  const templates = themes;

  return (
    <div className="space-y-6">
      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          {t("themes.create")}
        </button>
      ) : (
        <form
          onSubmit={createTheme}
          className="max-w-md space-y-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
        >
          <h2 className="text-sm font-semibold text-emerald-950">{t("themes.create")}</h2>
          <input
            required
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("themes.createNamePrompt")}
            className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
          />
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
          >
            <option value="">{t("themes.startBlank")}</option>
            {templates.map((th) => (
              <option key={th.id} value={th.id}>
                {th.nameEn}
                {th.isSystem ? ` (${t("themes.system")})` : ""}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {t("common.save")}
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setName("");
                setTemplateId("");
              }}
              className="text-sm text-emerald-700"
            >
              {t("newSeed.cancel")}
            </button>
          </div>
        </form>
      )}

      {userThemes.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-emerald-800/70">{t("themes.yours")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {userThemes.map((th) => (
              <ThemeCard key={th.id} theme={th} t={t} onDuplicate={duplicate} editable />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-emerald-800/70">{t("themes.builtIn")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {themes
            .filter((th) => th.isSystem)
            .map((th) => (
              <ThemeCard key={th.id} theme={th} t={t} onDuplicate={duplicate} editable={false} />
            ))}
        </div>
      </section>
    </div>
  );
}

function ThemeCard({
  theme: th,
  t,
  onDuplicate,
  editable,
}: {
  theme: Theme;
  t: ReturnType<typeof useTranslations>;
  onDuplicate: (id: string, name: string) => void;
  editable: boolean;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: th.color }} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-emerald-950">{th.nameEn}</h3>
          <p className="text-sm text-emerald-800/60">{th.nameFa}</p>
          <p className="mt-2 text-xs text-emerald-700/50">
            {th.fieldCount} {t("themes.fields")} · {th.seedCount} {t("themes.seedsPlanted")}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {editable ? (
          <Link
            href={`/themes/${th.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Pencil className="h-4 w-4" />
            {t("themes.edit")}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onDuplicate(th.id, th.nameEn)}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
          >
            <Copy className="h-4 w-4" />
            {t("themes.duplicateToEdit")}
          </button>
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
  );
}
