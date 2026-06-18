"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AppShell } from "@/components/app-shell";
import { label, type Locale } from "@/lib/labels";
import { useLocale } from "next-intl";

type Theme = {
  id: string;
  nameEn: string;
  nameFa: string;
  descriptionEn: string | null;
  descriptionFa: string | null;
  color: string;
  fieldDefs: {
    key: string;
    labelEn: string;
    labelFa: string;
    fieldType: string;
    required: boolean;
  }[];
};

export function NewSeedForm({
  themes,
  users,
  currentUserId,
  defaultThemeId,
}: {
  themes: Theme[];
  users: { id: string; name: string }[];
  currentUserId: string;
  defaultThemeId?: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [themeId, setThemeId] = useState(defaultThemeId ?? themes[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [fieldData, setFieldData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const theme = themes.find((th) => th.id === themeId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, themeId, fieldData }),
    });
    if (res.ok) {
      const seed = await res.json();
      router.push(`/seeds/${seed.id}`);
    }
    setLoading(false);
  }

  return (
    <AppShell
      title={t("newSeed.title")}
      subtitle={t("newSeed.subtitle")}
      users={users}
      currentUserId={currentUserId}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        <section>
          <h2 className="text-sm font-semibold uppercase text-emerald-800/70">{t("newSeed.theme")}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {themes.map((th) => (
              <button
                key={th.id}
                type="button"
                onClick={() => setThemeId(th.id)}
                className={`rounded-2xl border p-4 text-start transition ${
                  themeId === th.id
                    ? "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20"
                    : "border-emerald-100 bg-white hover:border-emerald-200"
                }`}
              >
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: th.color }} />
                <h3 className="mt-2 font-semibold text-emerald-950">
                  {label(locale, th.nameEn, th.nameFa)}
                </h3>
                {th.descriptionEn && (
                  <p className="mt-1 text-sm text-emerald-800/60">
                    {label(locale, th.descriptionEn, th.descriptionFa)}
                  </p>
                )}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-emerald-900">{t("newSeed.seedTitle")}</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("newSeed.seedTitlePlaceholder")}
              className="mt-1.5 w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>

          {theme?.fieldDefs.map((fd) => (
            <div key={fd.key}>
              <label className="block text-sm font-medium text-emerald-900">
                {label(locale, fd.labelEn, fd.labelFa)}
                {fd.required && " *"}
              </label>
              {fd.fieldType === "TEXTAREA" ? (
                <textarea
                  required={fd.required}
                  rows={3}
                  value={fieldData[fd.key] ?? ""}
                  onChange={(e) => setFieldData({ ...fieldData, [fd.key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm"
                />
              ) : (
                <input
                  required={fd.required}
                  type={fd.fieldType === "DATE" ? "date" : fd.fieldType === "URL" ? "url" : "text"}
                  value={fieldData[fd.key] ?? ""}
                  onChange={(e) => setFieldData({ ...fieldData, [fd.key]: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-emerald-200 px-4 py-2.5 text-sm"
                />
              )}
            </div>
          ))}
        </section>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? t("common.loading") : t("newSeed.create")}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl border border-emerald-200 px-6 py-2.5 text-sm text-emerald-800"
          >
            {t("newSeed.cancel")}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
