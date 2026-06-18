import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { getSeedDetail, isReadOnly } from "@/lib/seeds";
import { getStagesForSeed } from "@/lib/stages";
import { AppShell } from "@/components/app-shell";
import { StructureTreeEditor } from "@/components/structure-tree-editor";
import type { Locale } from "@/lib/labels";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function CustomizeSeedPage({ params }: Params) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const seed = await getSeedDetail(id, userId);

  if (!seed) notFound();
  if (isReadOnly(seed, userId)) notFound();

  const stages = await getStagesForSeed(id);
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;

  return (
    <AppShell
      title={t("customize.pageTitle")}
      subtitle={seed.title}
      users={users}
      currentUserId={userId}
    >
      <Link
        href={`/seeds/${id}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900"
      >
        <BackArrow className="h-4 w-4" />
        {t("customize.backToSeed")}
      </Link>

      <StructureTreeEditor
        mode="seed"
        entityId={id}
        stages={stages}
        showSaveAsTheme
      />
    </AppShell>
  );
}
