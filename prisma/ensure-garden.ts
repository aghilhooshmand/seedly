import type { PrismaClient } from "@prisma/client";
import type { GardenTemplate } from "./garden-templates";

export async function syncSystemGarden(prisma: PrismaClient, def: GardenTemplate) {
  const existing = await prisma.theme.findUnique({
    where: { slug: def.slug },
    include: {
      fieldDefs: true,
      stageDefs: {
        orderBy: { order: "asc" },
        include: {
          taskDefs: {
            orderBy: { order: "asc" },
            include: { fieldDefs: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  if (!existing) {
    return prisma.theme.create({
      data: {
        slug: def.slug,
        nameEn: def.nameEn,
        nameFa: def.nameFa,
        descriptionEn: def.descriptionEn,
        descriptionFa: def.descriptionFa,
        icon: def.icon,
        color: def.color,
        isSystem: true,
        fieldDefs: {
          create: def.fields.map((f) => ({
            key: f.key,
            labelEn: f.labelEn,
            labelFa: f.labelFa,
            fieldType: f.fieldType,
            options: f.options ?? null,
            required: f.required ?? false,
            order: f.order,
          })),
        },
        stageDefs: {
          create: def.stages.map((s) => ({
            nameEn: s.nameEn,
            nameFa: s.nameFa,
            descriptionEn: s.descriptionEn ?? null,
            descriptionFa: s.descriptionFa ?? null,
            order: s.order,
            taskDefs: {
              create: s.tasks.map((t, i) => ({
                titleEn: t.titleEn,
                titleFa: t.titleFa,
                order: i,
                defaultPriority: t.priority,
                recurrence: t.recurrence ?? "NONE",
                fieldDefs: t.fields
                  ? {
                      create: t.fields.map((f) => ({
                        labelEn: f.labelEn,
                        labelFa: f.labelFa,
                        fieldType: f.fieldType,
                        options: f.options ?? null,
                        countsTowardProgress: f.countsTowardProgress ?? true,
                        order: f.order,
                      })),
                    }
                  : undefined,
              })),
            },
          })),
        },
      },
    });
  }

  if (!existing.isSystem) return existing;

  await prisma.theme.update({
    where: { id: existing.id },
    data: {
      nameEn: def.nameEn,
      nameFa: def.nameFa,
      descriptionEn: def.descriptionEn,
      descriptionFa: def.descriptionFa,
      icon: def.icon,
      color: def.color,
    },
  });

  for (const f of def.fields) {
    const has = existing.fieldDefs.some((fd) => fd.key === f.key);
    if (!has) {
      await prisma.themeFieldDef.create({
        data: {
          themeId: existing.id,
          key: f.key,
          labelEn: f.labelEn,
          labelFa: f.labelFa,
          fieldType: f.fieldType,
          options: f.options ?? null,
          required: f.required ?? false,
          order: f.order,
        },
      });
    }
  }

  for (const stageTemplate of def.stages) {
    let stageDef = existing.stageDefs.find((s) => s.order === stageTemplate.order);
    if (!stageDef) {
      stageDef = await prisma.themeStageDef.create({
        data: {
          themeId: existing.id,
          nameEn: stageTemplate.nameEn,
          nameFa: stageTemplate.nameFa,
          descriptionEn: stageTemplate.descriptionEn ?? null,
          descriptionFa: stageTemplate.descriptionFa ?? null,
          order: stageTemplate.order,
        },
        include: {
          taskDefs: { include: { fieldDefs: true } },
        },
      });
      existing.stageDefs.push(stageDef);
    } else {
      await prisma.themeStageDef.update({
        where: { id: stageDef.id },
        data: {
          nameEn: stageTemplate.nameEn,
          nameFa: stageTemplate.nameFa,
          descriptionEn: stageTemplate.descriptionEn ?? null,
          descriptionFa: stageTemplate.descriptionFa ?? null,
        },
      });
    }

    for (const [i, taskTemplate] of stageTemplate.tasks.entries()) {
      let taskDef = stageDef.taskDefs.find((t) => t.order === i && !t.parentId);
      if (!taskDef) {
        taskDef = await prisma.themeTaskDef.create({
          data: {
            stageDefId: stageDef.id,
            titleEn: taskTemplate.titleEn,
            titleFa: taskTemplate.titleFa,
            order: i,
            defaultPriority: taskTemplate.priority,
            recurrence: taskTemplate.recurrence ?? "NONE",
            fieldDefs: taskTemplate.fields
              ? {
                  create: taskTemplate.fields.map((f) => ({
                    labelEn: f.labelEn,
                    labelFa: f.labelFa,
                    fieldType: f.fieldType,
                    options: f.options ?? null,
                    countsTowardProgress: f.countsTowardProgress ?? true,
                    order: f.order,
                  })),
                }
              : undefined,
          },
          include: { fieldDefs: true },
        });
        stageDef.taskDefs.push(taskDef);
      } else {
        await prisma.themeTaskDef.update({
          where: { id: taskDef.id },
          data: {
            titleEn: taskTemplate.titleEn,
            titleFa: taskTemplate.titleFa,
            defaultPriority: taskTemplate.priority,
            recurrence: taskTemplate.recurrence ?? "NONE",
          },
        });
        if (taskTemplate.fields) {
          for (const f of taskTemplate.fields) {
            const has = taskDef.fieldDefs.some((fd) => fd.labelEn === f.labelEn);
            if (!has) {
              await prisma.themeTaskFieldDef.create({
                data: {
                  taskDefId: taskDef.id,
                  labelEn: f.labelEn,
                  labelFa: f.labelFa,
                  fieldType: f.fieldType,
                  options: f.options ?? null,
                  countsTowardProgress: f.countsTowardProgress ?? true,
                  order: f.order,
                },
              });
            }
          }
        }
      }
    }
  }

  return existing;
}
