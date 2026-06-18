import { db } from "@/lib/db";
import { refreshSeedProgress } from "@/lib/seeds";
import { buildTaskTree } from "@/lib/task-tree";
import type { FieldType, Priority, StageStatus } from "@prisma/client";

export async function assertSeedOwner(seedId: string, userId: string) {
  return db.seed.findFirst({ where: { id: seedId, ownerId: userId } });
}

const taskInclude = {
  fieldValues: { orderBy: { order: "asc" as const } },
};

export async function getStagesForSeed(seedId: string) {
  const stages = await db.stage.findMany({
    where: { seedId },
    orderBy: [{ parentId: "asc" }, { order: "asc" }],
    include: {
      fieldValues: { orderBy: { order: "asc" } },
      tasks: {
        orderBy: { order: "asc" },
        include: taskInclude,
      },
    },
  });

  return stages.map((stage) => ({
    ...stage,
    tasks: buildTaskTree(stage.tasks),
  }));
}

export async function createStage(
  seedId: string,
  data: {
    nameEn: string;
    nameFa?: string;
    descriptionEn?: string;
    descriptionFa?: string;
    parentId?: string | null;
  },
) {
  const siblings = await db.stage.findMany({
    where: { seedId, parentId: data.parentId ?? null },
  });

  return db.stage.create({
    data: {
      seedId,
      parentId: data.parentId ?? null,
      nameEn: data.nameEn,
      nameFa: data.nameFa ?? data.nameEn,
      descriptionEn: data.descriptionEn ?? null,
      descriptionFa: data.descriptionFa ?? null,
      order: siblings.length,
      status: "PENDING",
    },
    include: { fieldValues: true, tasks: true },
  });
}

export async function updateStage(
  stageId: string,
  data: Partial<{
    nameEn: string;
    nameFa: string;
    descriptionEn: string;
    descriptionFa: string;
    status: StageStatus;
    order: number;
  }>,
) {
  return db.stage.update({
    where: { id: stageId },
    data,
    include: { fieldValues: true, tasks: true },
  });
}

export async function reorderStages(
  seedId: string,
  orderedIds: string[],
  parentId: string | null,
) {
  await db.$transaction(
    orderedIds.map((id, order) =>
      db.stage.updateMany({
        where: { id, seedId, parentId },
        data: { order },
      }),
    ),
  );
}

export async function updateStageField(
  fieldId: string,
  data: {
    value?: string | null;
    fileName?: string | null;
    labelEn?: string;
    fieldType?: FieldType;
    completed?: boolean;
  },
) {
  const field = await db.stageFieldValue.update({
    where: { id: fieldId },
    data,
    include: { stage: true },
  });
  await refreshSeedProgress(field.stage.seedId);
  return field;
}

export async function deleteStageField(fieldId: string) {
  const field = await db.stageFieldValue.delete({
    where: { id: fieldId },
    include: { stage: true },
  });
  await refreshSeedProgress(field.stage.seedId);
  return field;
}

export async function deleteStage(stageId: string, seedId: string) {
  await db.stage.delete({ where: { id: stageId, seedId } });
  await refreshSeedProgress(seedId);
}

export async function addStageField(
  stageId: string,
  data: { labelEn: string; labelFa?: string; fieldType: FieldType; value?: string },
) {
  const max = await db.stageFieldValue.aggregate({
    where: { stageId },
    _max: { order: true },
  });
  const field = await db.stageFieldValue.create({
    data: {
      stageId,
      labelEn: data.labelEn,
      labelFa: data.labelFa ?? data.labelEn,
      fieldType: data.fieldType,
      value: data.value ?? null,
      order: (max._max.order ?? 0) + 1,
    },
    include: { stage: true },
  });
  await refreshSeedProgress(field.stage.seedId);
  return field;
}

export async function createTaskForStage(
  stageId: string,
  data: {
    titleEn: string;
    titleFa?: string;
    deadline?: string | null;
    priority?: Priority;
  },
) {
  const stage = await db.stage.findUniqueOrThrow({
    where: { id: stageId },
    include: { tasks: { where: { parentId: null } } },
  });
  const task = await db.task.create({
    data: {
      stageId,
      titleEn: data.titleEn,
      titleFa: data.titleFa ?? data.titleEn,
      deadline: data.deadline ? new Date(data.deadline) : null,
      priority: data.priority ?? "MEDIUM",
      order: stage.tasks.length,
    },
  });
  await refreshSeedProgress(stage.seedId);
  return task;
}

export async function deleteTask(taskId: string) {
  const task = await db.task.delete({
    where: { id: taskId },
    include: { stage: true },
  });
  await refreshSeedProgress(task.stage.seedId);
  return task;
}

export type StageNode = Awaited<ReturnType<typeof getStagesForSeed>>[number];

export function buildStageTree(stages: StageNode[]) {
  const byParent = new Map<string | null, StageNode[]>();
  for (const s of stages) {
    const key = s.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(s);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.order - b.order);
  }
  return byParent.get(null) ?? [];
}
