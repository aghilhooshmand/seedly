import Link from "next/link";
import { Plus, Share2, Sprout } from "lucide-react";
import { label, type Locale } from "@/lib/labels";
import { SeedSprout } from "@/components/seed-sprout";
import type { SeedStatus } from "@prisma/client";

export type GardenSeed = {
  id: string;
  title: string;
  progress: number;
  status: SeedStatus;
  statusLabel: string;
};

export type GardenPlotData = {
  id: string;
  nameEn: string;
  nameFa: string;
  color: string;
  isSystem: boolean;
  seeds: GardenSeed[];
  plantLabel: string;
  emptyLabel: string;
  summary?: string;
};

export function GardenPlot({
  garden,
  locale,
  shared,
}: {
  garden: GardenPlotData;
  locale: Locale;
  shared?: boolean;
}) {
  const name = label(locale, garden.nameEn, garden.nameFa);

  return (
    <article
      className="overflow-hidden rounded-3xl border border-emerald-100/90 bg-white shadow-sm"
      style={{
        backgroundImage: `linear-gradient(165deg, ${garden.color}18 0%, #ffffff 42%, #f6f9f4 100%)`,
      }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-100/60 px-5 py-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
              style={{ backgroundColor: garden.color }}
            >
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-emerald-950">{name}</h2>
              {garden.seeds.length > 0 ? (
                <p className="text-xs text-emerald-800/55">{garden.summary}</p>
              ) : (
                <p className="text-xs text-emerald-800/55">{garden.emptyLabel}</p>
              )}
            </div>
          </div>
        </div>
        {!shared && (
          <Link
            href={`/seeds/new?theme=${garden.id}`}
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-50"
          >
            <Plus className="h-3.5 w-3.5" />
            {garden.plantLabel}
          </Link>
        )}
      </header>

      <div className="relative px-5 py-6">
        {/* Decorative soil line */}
        <div
          className="pointer-events-none absolute inset-x-5 bottom-4 h-3 rounded-full opacity-40"
          style={{ background: `linear-gradient(90deg, transparent, ${garden.color}55, transparent)` }}
        />

        {garden.seeds.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-emerald-200 bg-emerald-50/50">
              <Sprout className="h-7 w-7 text-emerald-300" />
            </div>
            <p className="mt-3 max-w-xs text-sm text-emerald-800/50">{garden.emptyLabel}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-6">
            {garden.seeds.map((seed) => (
              <SeedSprout
                key={seed.id}
                id={seed.id}
                title={seed.title}
                progress={seed.progress}
                status={seed.status}
                statusLabel={seed.statusLabel}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function SharedGardenSection({
  title,
  gardens,
  locale,
}: {
  title: string;
  gardens: (GardenPlotData & { ownerName?: string })[];
  locale: Locale;
}) {
  if (gardens.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-emerald-950">
        <Share2 className="h-5 w-5 text-blue-500" />
        {title}
      </h2>
      <div className="space-y-6">
        {gardens.map((garden) => (
          <div key={garden.id}>
            {garden.ownerName && (
              <p className="mb-2 text-xs font-medium text-blue-700/80">from {garden.ownerName}</p>
            )}
            <GardenPlot garden={garden} locale={locale} shared />
          </div>
        ))}
      </div>
    </section>
  );
}
