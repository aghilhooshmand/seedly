"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteThemeButton({
  themeId,
  seedCount,
  redirectTo = "/themes",
  className,
}: {
  themeId: string;
  seedCount: number;
  redirectTo?: string;
  className?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (seedCount > 0) return null;

  async function handleDelete() {
    if (!confirm(t("themes.deleteConfirm"))) return;
    setDeleting(true);
    const res = await fetch(`/api/themes/${themeId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    } else if (res.status === 409) {
      alert(t("themes.deleteBlocked"));
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
      }
    >
      <Trash2 className="h-4 w-4" />
      {t("themes.delete")}
    </button>
  );
}
