import type { Recurrence } from "@prisma/client";

/** Stable key for the current recurrence period (day / ISO week / month). */
export function currentPeriodKey(recurrence: Recurrence, date = new Date()): string | null {
  if (recurrence === "NONE") return null;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  if (recurrence === "DAILY") return `${y}-${m}-${d}`;
  if (recurrence === "MONTHLY") return `${y}-${m}`;
  if (recurrence === "WEEKLY") {
    const jan1 = new Date(y, 0, 1);
    const days = Math.floor((date.getTime() - jan1.getTime()) / 86400000);
    const week = Math.ceil((days + jan1.getDay() + 1) / 7);
    return `${y}-W${String(week).padStart(2, "0")}`;
  }
  return null;
}

export function isRecurringComplete(
  recurrence: Recurrence,
  periodCompletedKey: string | null | undefined,
  date = new Date(),
): boolean {
  const key = currentPeriodKey(recurrence, date);
  if (!key) return false;
  return periodCompletedKey === key;
}
