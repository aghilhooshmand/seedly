import type { CSSProperties } from "react";
import type { SeedStatus } from "@prisma/client";

export type SeedStatusVisual = {
  ring: string;
  fill: string;
  dot: string;
  text: string;
  labelKey: `dashboard.status.${SeedStatus}`;
};

/** Growth-stage colors: planned → growing → done (habit-tracker / kanban pattern). */
export const SEED_STATUS_VISUAL: Record<SeedStatus, SeedStatusVisual> = {
  PLANNED: {
    ring: "#fcd34d",
    fill: "#fffbeb",
    dot: "#f59e0b",
    text: "text-amber-800",
    labelKey: "dashboard.status.PLANNED",
  },
  ACTIVE: {
    ring: "#6ee7b7",
    fill: "#ecfdf5",
    dot: "#34d399",
    text: "text-emerald-800",
    labelKey: "dashboard.status.ACTIVE",
  },
  PAUSED: {
    ring: "#cbd5e1",
    fill: "#f8fafc",
    dot: "#94a3b8",
    text: "text-slate-600",
    labelKey: "dashboard.status.PAUSED",
  },
  COMPLETED: {
    ring: "#059669",
    fill: "#047857",
    dot: "#10b981",
    text: "text-white",
    labelKey: "dashboard.status.COMPLETED",
  },
  ABANDONED: {
    ring: "#d6d3d1",
    fill: "#f5f5f4",
    dot: "#a8a29e",
    text: "text-stone-500",
    labelKey: "dashboard.status.ABANDONED",
  },
};

export function seedProgressRing(progress: number, status: SeedStatus): CSSProperties {
  const visual = SEED_STATUS_VISUAL[status];
  if (status === "COMPLETED") return { background: visual.fill };
  if (status === "PLANNED" && progress === 0) return { background: visual.fill };
  const p = Math.min(100, Math.max(0, progress));
  return {
    background: `conic-gradient(${visual.ring} ${p * 3.6}deg, ${visual.fill} 0deg)`,
  };
}
