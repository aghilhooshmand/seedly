import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { Sprout } from "lucide-react";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { getSeedsForUser } from "@/lib/seeds";
import { AppShell } from "@/components/app-shell";
import { SeedCard } from "@/components/seed-card";
import { label, type Locale } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const { owned, shared } = await getSeedsForUser(userId);

  const avgProgress =
    owned.length > 0
      ? Math.round(owned.reduce((sum, s) => sum + s.progress, 0) / owned.length)
      : 0;

  return (
    <AppShell
      title={t("dashboard.title")}
      subtitle={t("dashboard.subtitle")}
      users={users}
      currentUserId={userId}
    >
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label={t("dashboard.activeSeeds")} value={String(owned.length)} />
        <StatCard label={t("dashboard.sharedWithYou")} value={String(shared.length)} />
        <StatCard label={t("dashboard.avgProgress")} value={`${avgProgress}%`} />
      </div>

      {owned.length === 0 && shared.length === 0 ? (
        <EmptyState
          title={t("dashboard.emptyTitle")}
          body={t("dashboard.emptyBody")}
          cta={t("dashboard.plantSeed")}
        />
      ) : (
        <div className="space-y-10">
          {owned.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-emerald-950">{t("dashboard.activeSeeds")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {owned.map((seed) => {
                  const current = seed.stages.find((s) => s.status === "IN_PROGRESS");
                  return (
                    <SeedCard
                      key={seed.id}
                      id={seed.id}
                      title={seed.title}
                      progress={seed.progress}
                      status={seed.status}
                      theme={seed.theme}
                      currentStage={current ? label(locale, current.nameEn, current.nameFa) : null}
                      locale={locale}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {shared.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-emerald-950">{t("dashboard.sharedWithYou")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {shared.map((seed) => (
                  <SeedCard
                    key={seed.id}
                    id={seed.id}
                    title={seed.title}
                    progress={seed.progress}
                    status={seed.status}
                    theme={seed.theme}
                    shared
                    ownerName={seed.owner.name}
                    locale={locale}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </AppShell>
  );
}

function StatCard({ label: lbl, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
      <p className="text-2xl font-semibold text-emerald-950">{value}</p>
      <p className="text-sm text-emerald-800/60">{lbl}</p>
    </div>
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
