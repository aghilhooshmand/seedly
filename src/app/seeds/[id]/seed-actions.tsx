"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AddCustomFieldForm } from "@/components/seed-field-form";

export function SeedActions({
  seedId,
  readOnly,
}: {
  seedId: string;
  readOnly?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [shareEmail, setShareEmail] = useState("");
  const [activityTitle, setActivityTitle] = useState("");

  if (readOnly) {
    return (
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
        {t("seed.share")} — view only
      </p>
    );
  }

  async function share() {
    if (!shareEmail) return;
    await fetch(`/api/seeds/${seedId}/share`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: shareEmail }),
    });
    setShareEmail("");
    router.refresh();
  }

  async function logActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!activityTitle) return;
    await fetch(`/api/seeds/${seedId}/activities`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleEn: activityTitle }),
    });
    setActivityTitle("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <AddCustomFieldForm seedId={seedId} />

      <form onSubmit={logActivity} className="space-y-2">
        <h3 className="text-sm font-semibold text-emerald-900">{t("seed.addActivity")}</h3>
        <input
          value={activityTitle}
          onChange={(e) => setActivityTitle(e.target.value)}
          placeholder="…"
          className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white">
          {t("common.save")}
        </button>
      </form>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-emerald-900">{t("seed.share")}</h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={shareEmail}
            onChange={(e) => setShareEmail(e.target.value)}
            placeholder="you@seedly.local"
            className="min-w-0 flex-1 rounded-lg border border-emerald-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={share}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white"
          >
            {t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
