import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight, Settings2 } from "lucide-react";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { getSeedDetail, isReadOnly } from "@/lib/seeds";
import { AppShell } from "@/components/app-shell";
import { EditableSeedFields } from "@/components/seed-field-form";
import { StageTaskTimeline, FollowUpSummary } from "@/components/stage-task-timeline";
import { ActivityFeed } from "@/components/activity-feed";
import { SeedActions } from "./seed-actions";
import { label, type Locale } from "@/lib/labels";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function SeedDetailPage({ params }: Params) {
  const { id } = await params;
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const seed = await getSeedDetail(id, userId);

  if (!seed) notFound();

  const readOnly = isReadOnly(seed, userId);
  const BackArrow = locale === "fa" ? ArrowRight : ArrowLeft;

  return (
    <AppShell users={users} currentUserId={userId}>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-900"
      >
        <BackArrow className="h-4 w-4" />
        {t("seed.back")}
      </Link>

      <header className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seed.theme.color }} />
          <span className="text-xs font-medium uppercase text-emerald-700/70">
            {label(locale, seed.theme.nameEn, seed.theme.nameFa)}
          </span>
          {readOnly && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{t("seed.share")}</span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-semibold text-emerald-950 sm:text-3xl">{seed.title}</h1>
        {!readOnly && (
          <Link
            href={`/seeds/${seed.id}/customize`}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-50"
          >
            <Settings2 className="h-4 w-4" />
            {t("customize.title")}
          </Link>
        )}
        <div className="mt-6">
          <div className="mb-1 flex justify-between text-sm">
            <span>{t("seed.progress")}</span>
            <span>{seed.progress}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-emerald-100">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${seed.progress}%` }} />
          </div>
        </div>
      </header>

      <div className="mt-6">
        <FollowUpSummary stages={seed.stages} locale={locale} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3 space-y-8">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-emerald-950">{t("seed.info")}</h2>
            <EditableSeedFields
              seedId={seed.id}
              fields={seed.fieldValues}
              readOnly={readOnly}
            />
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-emerald-950">{t("seed.stages")}</h2>
            <StageTaskTimeline stages={seed.stages} seedId={seed.id} locale={locale} readOnly={readOnly} />
          </div>
        </section>

        <section className="lg:col-span-2 space-y-8">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
            <SeedActions seedId={seed.id} readOnly={readOnly} />
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold text-emerald-950">{t("seed.activity")}</h2>
            <ActivityFeed activities={seed.activities} locale={locale} />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
