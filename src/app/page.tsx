import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Sprout } from "lucide-react";
import type { SeedStatus } from "@prisma/client";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { getUniverseDashboard } from "@/lib/universe";
import { AppShell } from "@/components/app-shell";
import { GardenPlot, SharedGardenSection } from "@/components/garden-plot";
import { StatusLegend } from "@/components/status-legend";
import { type Locale } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const { ownedGardens, sharedGardens, totalSeeds, growing, completed } =
    await getUniverseDashboard(userId);

  const statusLabels = {
    PLANNED: t("dashboard.status.PLANNED"),
    ACTIVE: t("dashboard.status.ACTIVE"),
    PAUSED: t("dashboard.status.PAUSED"),
    COMPLETED: t("dashboard.status.COMPLETED"),
    ABANDONED: t("dashboard.status.ABANDONED"),
  } satisfies Record<SeedStatus, string>;

  const plantLabel = t("dashboard.plantInGarden");
  const emptyLabel = t("dashboard.gardenEmpty");
  const showUniverseEmpty = ownedGardens.length === 0 && sharedGardens.length === 0;
  const hasSeeds =
    ownedGardens.some((g) => g.seeds.length > 0) || sharedGardens.some((g) => g.seeds.length > 0);

  function gardenSummary(seeds: { status: SeedStatus }[]) {
    const parts = [`${seeds.length} ${t("dashboard.totalSeeds")}`];
    const growing = seeds.filter((s) => s.status === "ACTIVE").length;
    const done = seeds.filter((s) => s.status === "COMPLETED").length;
    if (growing > 0) parts.push(`${growing} ${t("dashboard.growingNow")}`);
    if (done > 0) parts.push(`${done} ${t("dashboard.harvested")}`);
    return parts.join(" · ");
  }

  return (
    <AppShell
      title={t("dashboard.title")}
      subtitle={t("dashboard.subtitle")}
      users={users}
      currentUserId={userId}
    >
      {hasSeeds && (
        <div className="mb-6 space-y-4">
          <StatusLegend labels={statusLabels} legendLabel={t("dashboard.legend")} />
          {totalSeeds > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <SummaryChip label={t("dashboard.totalSeeds")} value={String(totalSeeds)} />
              {growing > 0 && (
                <SummaryChip label={t("dashboard.growingNow")} value={String(growing)} accent="emerald" />
              )}
              {completed > 0 && (
                <SummaryChip label={t("dashboard.harvested")} value={String(completed)} accent="green" />
              )}
            </div>
          )}
        </div>
      )}

      {showUniverseEmpty ? (
        <EmptyState
          title={t("dashboard.emptyTitle")}
          body={t("dashboard.emptyBody")}
          cta={t("dashboard.plantSeed")}
        />
      ) : (
        <div className="space-y-8">
          <section className="space-y-5">
            <h2 className="text-lg font-semibold text-emerald-950">{t("dashboard.yourGardens")}</h2>
            {ownedGardens.length === 0 ? (
              <p className="text-sm text-emerald-800/60">{t("dashboard.noGardensYet")}</p>
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                {ownedGardens.map((garden) => (
                  <GardenPlot
                    key={garden.id}
                    locale={locale}
                    garden={{
                      ...garden,
                      plantLabel,
                      emptyLabel,
                      summary: garden.seeds.length > 0 ? gardenSummary(garden.seeds) : undefined,
                      seeds: garden.seeds.map((seed) => ({
                        id: seed.id,
                        title: seed.title,
                        progress: seed.progress,
                        status: seed.status,
                        statusLabel: statusLabels[seed.status],
                      })),
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          <SharedGardenSection
            title={t("dashboard.sharedWithYou")}
            locale={locale}
            gardens={sharedGardens.map((garden) => ({
              ...garden,
              plantLabel,
              emptyLabel,
              summary: garden.seeds.length > 0 ? gardenSummary(garden.seeds) : undefined,
              ownerName: garden.ownerName,
              seeds: garden.seeds.map((seed) => ({
                id: seed.id,
                title: seed.title,
                progress: seed.progress,
                status: seed.status,
                statusLabel: statusLabels[seed.status],
              })),
            }))}
          />
        </div>
      )}
    </AppShell>
  );
}

function SummaryChip({
  label,
  value,
  accent = "neutral",
}: {
  label: string;
  value: string;
  accent?: "neutral" | "emerald" | "green";
}) {
  const colors = {
    neutral: "border-emerald-100 bg-white text-emerald-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    green: "border-green-200 bg-green-50 text-green-800",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 ${colors[accent]}`}>
      <span className="font-semibold">{value}</span>
      <span className="opacity-70">{label}</span>
    </span>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white px-6 py-16 text-center">
      <Sprout className="mx-auto h-12 w-12 text-emerald-400" />
      <h2 className="mt-4 text-lg font-semibold text-emerald-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-emerald-800/60">{body}</p>
      <Link
        href="/seeds/new"
        className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
      >
        {cta}
      </Link>
    </div>
  );
}
