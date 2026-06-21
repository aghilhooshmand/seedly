import { db } from "@/lib/db";
import { currentPeriodKey } from "@/lib/recurrence";
import { taskProgressPercent } from "@/lib/progress-calc";
import type { Recurrence } from "@prisma/client";

/** Reset recurring task checkboxes when a new day/week/month starts. */
export async function resetExpiredRecurringTasks(seedId: string) {
  const tasks = await db.task.findMany({
    where: { stage: { seedId }, recurrence: { not: "NONE" } },
    include: { fieldValues: true },
  });

  for (const task of tasks) {
    const periodKey = currentPeriodKey(task.recurrence as Recurrence);
    if (!periodKey || task.periodCompletedKey === periodKey) continue;

    const progressFields = task.fieldValues.filter((f) => f.countsTowardProgress !== false);
    const anyDone = progressFields.some((f) => f.completed);
    if (!anyDone && !task.periodCompletedKey) continue;

    await db.$transaction([
      ...progressFields.map((f) =>
        db.taskFieldValue.update({
          where: { id: f.id },
          data: { completed: false, ...(f.fieldType === "CHECKBOX" ? { value: null } : {}) },
        }),
      ),
      db.task.update({
        where: { id: task.id },
        data: { periodCompletedKey: null, completed: false, completedAt: null },
      }),
    ]);
  }
}

export async function markRecurringPeriodIfDone(taskId: string) {
  const task = await db.task.findUniqueOrThrow({
    where: { id: taskId },
    include: { fieldValues: true },
  });
  if (task.recurrence === "NONE") return;

  const progress = taskProgressPercent({
    id: task.id,
    fieldValues: task.fieldValues,
    subtasks: [],
  });
  if (progress < 100) return;

  const periodKey = currentPeriodKey(task.recurrence);
  if (!periodKey) return;

  await db.task.update({
    where: { id: taskId },
    data: { periodCompletedKey: periodKey, completed: true, completedAt: new Date() },
  });
}
