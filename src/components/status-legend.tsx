import type { SeedStatus } from "@prisma/client";
import { SEED_STATUS_VISUAL } from "@/lib/seed-status";

const LEGEND_STATUSES: SeedStatus[] = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED"];

export function StatusLegend({
  labels,
  legendLabel,
}: {
  labels: Record<SeedStatus, string>;
  legendLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 text-xs">
      <span className="font-medium text-emerald-900/70">{legendLabel}</span>
      {LEGEND_STATUSES.map((status) => {
        const v = SEED_STATUS_VISUAL[status];
        return (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-1 ring-white" style={{ backgroundColor: v.dot }} />
            <span className="text-emerald-800/75">{labels[status]}</span>
          </span>
        );
      })}
    </div>
  );
}
