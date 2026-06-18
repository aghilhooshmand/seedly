import { db } from "@/lib/db";
import type { FieldType, Priority } from "@prisma/client";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "theme"
  );
}

export async function getThemesForUser(userId: string) {
  return db.theme.findMany({
    where: { OR: [{ isSystem: true }, { ownerId: userId }] },
    orderBy: [{ isSystem: "desc" }, { nameEn: "asc" }],
    include: {
      fieldDefs: { orderBy: { order: "asc" } },
      _count: { select: { seeds: true } },
    },
  });
}

export async function getThemeDetail(themeId: string, userId: string) {
  return db.theme.findFirst({
    where: {
      id: themeId,
      OR: [{ isSystem: true }, { ownerId: userId }],
    },
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

export async function assertThemeEditable(themeId: string, userId: string) {
  const theme = await db.theme.findFirst({
    where: { id: themeId, OR: [{ ownerId: userId }, { isSystem: false, ownerId: userId }] },
  });
  if (theme?.isSystem) return null;
  return theme;
}

export async function reorderThemeStages(themeId: string, orderedIds: string[], parentId: string | null) {
  await db.$transaction(
    orderedIds.map((id, order) =>
      db.themeStageDef.updateMany({
        where: { id, themeId, parentId },
        data: { order },
      }),
    ),
  );
}

export async function createThemeStageDef(
  themeId: string,
  data: { nameEn: string; nameFa?: string; parentId?: string | null },
) {
  const siblings = await db.themeStageDef.findMany({
    where: { themeId, parentId: data.parentId ?? null },
  });
  return db.themeStageDef.create({
    data: {
      themeId,
      parentId: data.parentId ?? null,
      nameEn: data.nameEn,
      nameFa: data.nameFa ?? data.nameEn,
      order: siblings.length,
    },
    include: { taskDefs: true, fieldDefs: true },
  });
}

export async function deleteThemeStageDef(stageDefId: string) {
  return db.themeStageDef.delete({ where: { id: stageDefId } });
}

export async function addThemeStageField(
  stageDefId: string,
  data: { labelEn: string; labelFa?: string; fieldType: FieldType; options?: string },
) {
  const max = await db.themeStageFieldDef.aggregate({
    where: { stageDefId },
    _max: { order: true },
  });
  return db.themeStageFieldDef.create({
    data: {
      stageDefId,
      labelEn: data.labelEn,
      labelFa: data.labelFa ?? data.labelEn,
      fieldType: data.fieldType,
      options: data.options ?? null,
      order: (max._max.order ?? 0) + 1,
    },
  });
}

export async function addThemeTaskDef(
  stageDefId: string,
  data: { titleEn: string; titleFa?: string; priority?: Priority; parentId?: string | null },
) {
  const siblings = await db.themeTaskDef.findMany({
    where: { stageDefId, parentId: data.parentId ?? null },
  });
  return db.themeTaskDef.create({
    data: {
      stageDefId,
      parentId: data.parentId ?? null,
      titleEn: data.titleEn,
      titleFa: data.titleFa ?? data.titleEn,
      order: siblings.length,
      defaultPriority: data.priority ?? "MEDIUM",
    },
  });
}

export async function saveSeedAsTheme(
  seedId: string,
  userId: string,
  data: { nameEn: string; nameFa?: string; slug?: string },
) {
  const seed = await db.seed.findFirst({
    where: { id: seedId, ownerId: userId },
    include: {
      theme: true,
      fieldValues: { include: { fieldDef: true } },
      stages: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            orderBy: { order: "asc" },
            include: { fieldValues: { orderBy: { order: "asc" } } },
          },
          fieldValues: { orderBy: { order: "asc" } },
        },
      },
    },
  });
  if (!seed) return null;

  let slug = data.slug ?? slugify(data.nameEn);
  const existing = await db.theme.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const theme = await db.theme.create({
    data: {
      slug,
      nameEn: data.nameEn,
      nameFa: data.nameFa ?? data.nameEn,
      descriptionEn: `Saved from seed: ${seed.title}`,
      icon: seed.theme.icon,
      color: seed.theme.color,
      isSystem: false,
      ownerId: userId,
      fieldDefs: {
        create: seed.fieldValues
          .filter((fv) => fv.fieldDef)
          .map((fv, i) => ({
            key: fv.fieldDef!.key,
            labelEn: fv.fieldDef!.labelEn,
            labelFa: fv.fieldDef!.labelFa,
            fieldType: fv.fieldDef!.fieldType,
            options: fv.fieldDef!.options,
            required: fv.fieldDef!.required,
            order: i,
          })),
      },
    },
  });

  // Also copy custom seed fields as theme field defs
  const customFields = seed.fieldValues.filter((fv) => !fv.fieldDef);
  for (const [i, fv] of customFields.entries()) {
    await db.themeFieldDef.create({
      data: {
        themeId: theme.id,
        key: `custom_${i}_${slugify(fv.labelEn ?? "field")}`,
        labelEn: fv.labelEn ?? "Field",
        labelFa: fv.labelFa ?? fv.labelEn ?? "Field",
        fieldType: fv.fieldType ?? "TEXT",
        order: seed.fieldValues.filter((f) => f.fieldDef).length + i,
      },
    });
  }

  async function copyTaskTree(
    stageId: string,
    tasks: NonNullable<typeof seed>["stages"][number]["tasks"],
    parentId: string | null,
    themeParentTaskDefId: string | null,
    themeStageDefId: string,
  ) {
    const roots = tasks
      .filter((t) => (t.parentId ?? null) === parentId)
      .sort((a, b) => a.order - b.order);

    for (const task of roots) {
      const taskDef = await db.themeTaskDef.create({
        data: {
          stageDefId: themeStageDefId,
          parentId: themeParentTaskDefId,
          titleEn: task.titleEn,
          titleFa: task.titleFa,
          order: task.order,
          defaultPriority: task.priority,
          fieldDefs: {
            create: task.fieldValues.map((f) => ({
              labelEn: f.labelEn,
              labelFa: f.labelFa ?? f.labelEn,
              fieldType: f.fieldType,
              order: f.order,
            })),
          },
        },
      });
      await copyTaskTree(stageId, tasks, task.id, taskDef.id, themeStageDefId);
    }
  }

  async function copyStageTree(parentId: string | null, themeParentId: string | null) {
    const stages = seed!.stages
      .filter((s) => (s.parentId ?? null) === parentId)
      .sort((a, b) => a.order - b.order);

    for (const stage of stages) {
      const stageDef = await db.themeStageDef.create({
        data: {
          themeId: theme.id,
          parentId: themeParentId,
          nameEn: stage.nameEn,
          nameFa: stage.nameFa,
          descriptionEn: stage.descriptionEn,
          descriptionFa: stage.descriptionFa,
          order: stage.order,
        },
      });
      await copyTaskTree(stage.id, stage.tasks, null, null, stageDef.id);
      await copyStageTree(stage.id, stageDef.id);
    }
  }

  await copyStageTree(null, null);
  return theme;
}

export type ThemeStageDefNode = {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameFa: string;
  descriptionEn: string | null;
  order: number;
  taskDefs: { id: string; titleEn: string; titleFa: string; order: number; defaultPriority: string }[];
  fieldDefs: { id: string; labelEn: string; labelFa: string; fieldType: string; order: number }[];
};

export function buildThemeStageTree(stageDefs: ThemeStageDefNode[]) {
  return stageDefs.filter((s) => !s.parentId).sort((a, b) => a.order - b.order);
}

export async function cloneTheme(sourceThemeId: string, userId: string, nameEn: string) {
  const source = await getThemeDetail(sourceThemeId, userId);
  if (!source) return null;

  let slug = slugify(nameEn);
  if (await db.theme.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

  const theme = await db.theme.create({
    data: {
      slug,
      nameEn,
      nameFa: nameEn,
      descriptionEn: source.descriptionEn,
      descriptionFa: source.descriptionFa,
      icon: source.icon,
      color: source.color,
      isSystem: false,
      ownerId: userId,
      fieldDefs: {
        create: source.fieldDefs.map((fd) => ({
          key: fd.key,
          labelEn: fd.labelEn,
          labelFa: fd.labelFa,
          fieldType: fd.fieldType,
          options: fd.options,
          required: fd.required,
          order: fd.order,
        })),
      },
    },
  });

  async function copyThemeTaskTree(
    taskDefs: NonNullable<typeof source>["stageDefs"][number]["taskDefs"],
    parentSourceId: string | null,
    parentNewId: string | null,
    newStageDefId: string,
  ) {
    const defs = taskDefs
      .filter((d) => (d.parentId ?? null) === parentSourceId)
      .sort((a, b) => a.order - b.order);

    for (const td of defs) {
      const created = await db.themeTaskDef.create({
        data: {
          stageDefId: newStageDefId,
          parentId: parentNewId,
          titleEn: td.titleEn,
          titleFa: td.titleFa,
          order: td.order,
          defaultPriority: td.defaultPriority,
          fieldDefs: {
            create: td.fieldDefs.map((fd) => ({
              labelEn: fd.labelEn,
              labelFa: fd.labelFa,
              fieldType: fd.fieldType,
              options: fd.options,
              countsTowardProgress: fd.countsTowardProgress,
              order: fd.order,
            })),
          },
        },
      });
      await copyThemeTaskTree(taskDefs, td.id, created.id, newStageDefId);
    }
  }

  async function copyStageTree(parentSourceId: string | null, parentNewId: string | null) {
    const defs = source!.stageDefs
      .filter((d) => (d.parentId ?? null) === parentSourceId)
      .sort((a, b) => a.order - b.order);

    for (const sd of defs) {
      const created = await db.themeStageDef.create({
        data: {
          themeId: theme.id,
          parentId: parentNewId,
          nameEn: sd.nameEn,
          nameFa: sd.nameFa,
          descriptionEn: sd.descriptionEn,
          descriptionFa: sd.descriptionFa,
          order: sd.order,
          fieldDefs: {
            create: sd.fieldDefs.map((fd) => ({
              labelEn: fd.labelEn,
              labelFa: fd.labelFa,
              fieldType: fd.fieldType,
              options: fd.options,
              order: fd.order,
            })),
          },
        },
      });
      await copyThemeTaskTree(sd.taskDefs, null, null, created.id);
      await copyStageTree(sd.id, created.id);
    }
  }

  await copyStageTree(null, null);
  return theme;
}
