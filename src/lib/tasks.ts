import { db } from "@/lib/db";
import { refreshSeedProgress } from "@/lib/seeds";
import { resolveCompletedAfterUpdate } from "@/lib/field-progress";
import type { FieldType, Priority } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function assertTaskOwner(taskId: string, userId: string) {
  return db.task.findFirst({
    where: { id: taskId, stage: { seed: { ownerId: userId } } },
    include: { stage: true },
  });
}

export async function addTaskField(
  taskId: string,
  data: {
    labelEn: string;
    labelFa?: string;
    fieldType: FieldType;
    value?: string;
    countsTowardProgress?: boolean;
  },
) {
  const max = await db.taskFieldValue.aggregate({
    where: { taskId },
    _max: { order: true },
  });
  const field = await db.taskFieldValue.create({
    data: {
      taskId,
      labelEn: data.labelEn,
      labelFa: data.labelFa ?? data.labelEn,
      fieldType: data.fieldType,
      value: data.value ?? null,
      countsTowardProgress: data.countsTowardProgress ?? true,
      order: (max._max.order ?? 0) + 1,
    },
    include: { task: { include: { stage: true } } },
  });
  await refreshSeedProgress(field.task.stage.seedId);
  return field;
}

export async function updateTaskField(
  fieldId: string,
  data: {
    value?: string | null;
    fileName?: string | null;
    labelEn?: string;
    fieldType?: FieldType;
    completed?: boolean;
  },
) {
  const existing = await db.taskFieldValue.findUniqueOrThrow({ where: { id: fieldId } });
  const tracksProgress = existing.countsTowardProgress !== false;
  const completed = tracksProgress
    ? resolveCompletedAfterUpdate(existing, data)
    : data.completed !== undefined
      ? data.completed
      : undefined;

  const field = await db.taskFieldValue.update({
    where: { id: fieldId },
    data: {
      ...(data.value !== undefined && { value: data.value }),
      ...(data.fileName !== undefined && { fileName: data.fileName }),
      ...(data.labelEn !== undefined && { labelEn: data.labelEn }),
      ...(data.fieldType !== undefined && { fieldType: data.fieldType }),
      ...(completed !== undefined && { completed }),
    },
    include: { task: { include: { stage: true } } },
  });
  await refreshSeedProgress(field.task.stage.seedId);
  revalidatePath(`/seeds/${field.task.stage.seedId}`);
  return field;
}

export async function deleteTaskField(fieldId: string) {
  const field = await db.taskFieldValue.delete({
    where: { id: fieldId },
    include: { task: { include: { stage: true } } },
  });
  await refreshSeedProgress(field.task.stage.seedId);
  return field;
}

export async function createSubtask(
  parentTaskId: string,
  data: { titleEn: string; titleFa?: string; priority?: Priority },
) {
  const parent = await db.task.findUniqueOrThrow({
    where: { id: parentTaskId },
    include: { subtasks: true, stage: true },
  });
  const task = await db.task.create({
    data: {
      stageId: parent.stageId,
      parentId: parentTaskId,
      titleEn: data.titleEn,
      titleFa: data.titleFa ?? data.titleEn,
      priority: data.priority ?? parent.priority,
      order: parent.subtasks.length,
    },
  });
  await refreshSeedProgress(parent.stage.seedId);
  return task;
}

export async function addThemeTaskFieldDef(
  taskDefId: string,
  data: {
    labelEn: string;
    labelFa?: string;
    fieldType: FieldType;
    countsTowardProgress?: boolean;
  },
) {
  const max = await db.themeTaskFieldDef.aggregate({
    where: { taskDefId },
    _max: { order: true },
  });
  return db.themeTaskFieldDef.create({
    data: {
      taskDefId,
      labelEn: data.labelEn,
      labelFa: data.labelFa ?? data.labelEn,
      fieldType: data.fieldType,
      countsTowardProgress: data.countsTowardProgress ?? true,
      order: (max._max.order ?? 0) + 1,
    },
  });
}

export async function createThemeSubtaskDef(
  parentTaskDefId: string,
  data: { titleEn: string; titleFa?: string; priority?: Priority },
) {
  const parent = await db.themeTaskDef.findUniqueOrThrow({
    where: { id: parentTaskDefId },
    include: { children: true },
  });
  return db.themeTaskDef.create({
    data: {
      stageDefId: parent.stageDefId,
      parentId: parentTaskDefId,
      titleEn: data.titleEn,
      titleFa: data.titleFa ?? data.titleEn,
      order: parent.children.length,
      defaultPriority: data.priority ?? parent.defaultPriority,
    },
  });
}
