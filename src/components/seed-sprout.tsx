import Link from "next/link";
import { Check, Pause, Sprout, X } from "lucide-react";
import type { SeedStatus } from "@prisma/client";
import { SEED_STATUS_VISUAL, seedProgressRing } from "@/lib/seed-status";

type SeedSproutProps = {
  id: string;
  title: string;
  progress: number;
  status: SeedStatus;
  statusLabel: string;
  completed?: boolean;
};

export function SeedSprout({ id, title, progress, status, statusLabel }: SeedSproutProps) {
  const visual = SEED_STATUS_VISUAL[status];
  const isDone = status === "COMPLETED";

  return (
    <Link
      href={`/seeds/${id}`}
      className="group flex w-[5.5rem] flex-col items-center gap-2 sm:w-[6.25rem]"
      title={`${title} — ${statusLabel} (${progress}%)`}
    >
      <div className="relative">
        <div
          className="flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full p-[3px] shadow-sm transition group-hover:scale-105 group-hover:shadow-md sm:h-[4.75rem] sm:w-[4.75rem]"
          style={seedProgressRing(progress, status)}
        >
          <div
            className={`flex h-full w-full flex-col items-center justify-center rounded-full border-2 bg-white/95 ${
              status === "PLANNED" ? "border-dashed border-amber-300/80" : "border-white/90"
            } ${isDone ? "!border-emerald-700/30 !bg-emerald-600" : ""}`}
          >
            {isDone ? (
              <Check className={`h-6 w-6 ${visual.text}`} strokeWidth={2.5} />
            ) : status === "PAUSED" ? (
              <Pause className={`h-5 w-5 ${visual.text}`} />
            ) : status === "ABANDONED" ? (
              <X className={`h-5 w-5 ${visual.text}`} />
            ) : (
              <>
                <Sprout className={`h-5 w-5 ${visual.text} ${status === "ACTIVE" ? "opacity-90" : "opacity-70"}`} />
                <span className={`text-[10px] font-bold leading-none ${visual.text}`}>{progress}%</span>
              </>
            )}
          </div>
        </div>
        <span
          className="absolute -bottom-0.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full ring-2 ring-white"
          style={{ backgroundColor: visual.dot }}
          aria-hidden
        />
      </div>
      <div className="w-full text-center">
        <p className="line-clamp-2 text-xs font-medium leading-tight text-emerald-950 group-hover:text-emerald-700">
          {title}
        </p>
        <p className={`mt-0.5 text-[10px] font-medium ${visual.text}`}>{statusLabel}</p>
      </div>
    </Link>
  );
}
