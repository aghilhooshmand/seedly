"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { useState } from "react";

export function DeleteSeedButton({
  seedId,
  redirectTo = "/",
  className,
}: {
  seedId: string;
  redirectTo?: string;
  className?: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(t("seed.deleteConfirm"))) return;
    setDeleting(true);
    const res = await fetch(`/api/seeds/${seedId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push(redirectTo);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
      }
    >
      <Trash2 className="h-4 w-4" />
      {t("seed.delete")}
    </button>
  );
}
