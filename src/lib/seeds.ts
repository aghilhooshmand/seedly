import { Prisma, FieldType, Priority, StageStatus, SeedStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { syncSeedProgress } from "@/lib/progress";
import { buildTaskTree } from "@/lib/task-tree";

export async function getThemeWithDefs(themeId: string) {
  return db.theme.findUniqueOrThrow({
    where: { id: themeId },
    include: {
      fieldDefs: { orderBy: { order: "asc" } },
      stageDefs: {
        orderBy: { order: "asc" },
        include: {
          taskDefs: {
            orderBy: { order: "asc" },
            include: { fieldDefs: { orderBy: { order: "asc" } } },
          },
          fieldDefs: { orderBy: { order: "asc" } },
        },
      },
    },
  });
}

async function createTasksFromThemeDefs(
  stageId: string,
  taskDefs: Awaited<ReturnType<typeof getThemeWithDefs>>["stageDefs"][number]["taskDefs"],
  parentDefId: string | null,
  parentTaskId: string | null,
) {
  const defs = taskDefs
    .filter((d) => (d.parentId ?? null) === parentDefId)
    .sort((a, b) => a.order - b.order);

  for (const td of defs) {
    const task = await db.task.create({
      data: {
        stageId,
        parentId: parentTaskId,
        titleEn: td.titleEn,
        titleFa: td.titleFa,
        order: td.order,
        priority: td.defaultPriority,
        fieldValues: {
          create: td.fieldDefs.map((fd) => ({
            labelEn: fd.labelEn,
            labelFa: fd.labelFa,
            fieldType: fd.fieldType,
            order: fd.order,
          })),
        },
      },
    });
    await createTasksFromThemeDefs(stageId, taskDefs, td.id, task.id);
  }
}

async function createStagesFromTheme(
  seedId: string,
  stageDefs: Awaited<ReturnType<typeof getThemeWithDefs>>["stageDefs"],
  parentDefId: string | null,
  parentStageId: string | null,
  rootIndex: { value: number },
) {
  const defs = stageDefs
    .filter((d) => (d.parentId ?? null) === parentDefId)
    .sort((a, b) => a.order - b.order);

  for (const sd of defs) {
    const isRoot = parentDefId === null;
    const status =
      isRoot && rootIndex.value === 0
        ? StageStatus.IN_PROGRESS
        : StageStatus.PENDING;
    if (isRoot) rootIndex.value += 1;

    const stage = await db.stage.create({
      data: {
        seedId,
        parentId: parentStageId,
        nameEn: sd.nameEn,
        nameFa: sd.nameFa,
        descriptionEn: sd.descriptionEn,
        descriptionFa: sd.descriptionFa,
        order: sd.order,
        status,
        fieldValues: {
          create: sd.fieldDefs.map((fd) => ({
            labelEn: fd.labelEn,
            labelFa: fd.labelFa,
            fieldType: fd.fieldType,
            order: fd.order,
          })),
        },
      },
    });

    await createTasksFromThemeDefs(stage.id, sd.taskDefs, null, null);
    await createStagesFromTheme(seedId, stageDefs, sd.id, stage.id, rootIndex);
  }
}

export async function plantSeed(params: {
  ownerId: string;
  themeId: string;
  title: string;
  fieldData?: Record<string, string>;
}) {
  const theme = await getThemeWithDefs(params.themeId);

  const seed = await db.seed.create({
    data: {
      title: params.title,
      ownerId: params.ownerId,
      themeId: params.themeId,
      status: SeedStatus.ACTIVE,
      fieldValues: {
        create: theme.fieldDefs.map((fd) => ({
          fieldDefId: fd.id,
          value: params.fieldData?.[fd.key] ?? null,
          order: fd.order,
        })),
      },
    },
  });

  await createStagesFromTheme(seed.id, theme.stageDefs, null, null, { value: 0 });

  await syncSeedProgress(seed.id);

  return db.seed.findUniqueOrThrow({
    where: { id: seed.id },
    include: {
      theme: true,
      fieldValues: { include: { fieldDef: true } },
      stages: { include: { tasks: true }, orderBy: { order: "asc" } },
    },
  });
}

export async function getSeedsForUser(userId: string) {
  const owned = await db.seed.findMany({
    where: { ownerId: userId, status: { in: ["ACTIVE", "PLANNED", "PAUSED"] } },
    orderBy: { updatedAt: "desc" },
    include: {
      theme: true,
      stages: { orderBy: { order: "asc" }, include: { tasks: true } },
    },
  });

  const shared = await db.seed.findMany({
    where: {
      shares: { some: { sharedWithId: userId } },
      status: { in: ["ACTIVE", "PLANNED", "PAUSED"] },
    },
    include: {
      theme: true,
      owner: { select: { name: true } },
      stages: { orderBy: { order: "asc" }, include: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return { owned, shared };
}

export async function getSeedDetail(seedId: string, userId: string) {
  const seed = await db.seed.findFirst({
    where: {
      id: seedId,
      OR: [{ ownerId: userId }, { shares: { some: { sharedWithId: userId } } }],
    },
    include: {
      theme: true,
      owner: { select: { id: true, name: true } },
      fieldValues: {
        orderBy: { order: "asc" },
        include: { fieldDef: true },
      },
      stages: {
        orderBy: { order: "asc" },
        include: {
          fieldValues: { orderBy: { order: "asc" } },
          tasks: {
            orderBy: { order: "asc" },
            include: { fieldValues: { orderBy: { order: "asc" } } },
          },
        },
      },
      activities: { orderBy: { createdAt: "desc" } },
      shares: { include: { sharedWith: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!seed) return null;

  return {
    ...seed,
    stages: seed.stages.map((stage) => ({
      ...stage,
      tasks: buildTaskTree(stage.tasks),
    })),
  };
}

export function isReadOnly(seed: { ownerId: string }, userId: string) {
  return seed.ownerId !== userId;
}

export async function refreshSeedProgress(seedId: string) {
  return syncSeedProgress(seedId);
}

export async function addCustomField(
  seedId: string,
  data: {
    labelEn: string;
    labelFa?: string;
    fieldType: FieldType;
    value?: string;
    fileName?: string;
  },
) {
  const maxOrder = await db.seedFieldValue.aggregate({
    where: { seedId },
    _max: { order: true },
  });
  return db.seedFieldValue.create({
    data: {
      seedId,
      labelEn: data.labelEn,
      labelFa: data.labelFa ?? data.labelEn,
      fieldType: data.fieldType,
      value: data.value ?? null,
      fileName: data.fileName ?? null,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });
}

export async function addTask(
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
      priority: data.priority ?? Priority.MEDIUM,
      order: stage.tasks.length,
    },
  });
  await refreshSeedProgress(stage.seedId);
  return task;
}

export async function toggleTask(taskId: string, completed: boolean) {
  const task = await db.task.update({
    where: { id: taskId },
    data: { completed, completedAt: completed ? new Date() : null },
    include: { stage: true },
  });
  await refreshSeedProgress(task.stage.seedId);
  return task;
}

export async function shareSeed(seedId: string, sharedWithEmail: string, ownerId: string) {
  const seed = await db.seed.findFirst({ where: { id: seedId, ownerId } });
  if (!seed) return null;
  const user = await db.user.findUnique({ where: { email: sharedWithEmail } });
  if (!user || user.id === ownerId) return null;
  return db.seedShare.upsert({
    where: { seedId_sharedWithId: { seedId, sharedWithId: user.id } },
    update: {},
    create: { seedId, sharedWithId: user.id },
  });
}

export type SeedWithRelations = Prisma.PromiseReturnType<typeof getSeedDetail>;
