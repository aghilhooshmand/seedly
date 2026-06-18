import { db } from "@/lib/db";
import { refreshSeedProgress } from "@/lib/seeds";

/** Move legacy stage-level fields onto the first task in each stage. */
export async function migrateStageFieldsToTasks(seedId?: string) {
  const stages = await db.stage.findMany({
    where: seedId ? { seedId } : undefined,
    include: {
      fieldValues: { orderBy: { order: "asc" } },
      tasks: {
        where: { parentId: null },
        orderBy: { order: "asc" },
      },
    },
  });

  const affectedSeedIds = new Set<string>();

  for (const stage of stages) {
    if (stage.fieldValues.length === 0) continue;

    affectedSeedIds.add(stage.seedId);

    let targetTask = stage.tasks[0];
    if (!targetTask) {
      targetTask = await db.task.create({
        data: {
          stageId: stage.id,
          titleEn: "Details",
          titleFa: "جزئیات",
          order: 0,
          priority: "MEDIUM",
        },
      });
    }

    const maxOrder = await db.taskFieldValue.aggregate({
      where: { taskId: targetTask.id },
      _max: { order: true },
    });
    let nextOrder = (maxOrder._max.order ?? -1) + 1;

    for (const sf of stage.fieldValues) {
      const duplicate = await db.taskFieldValue.findFirst({
        where: { taskId: targetTask.id, labelEn: sf.labelEn },
      });
      if (duplicate) continue;

      await db.taskFieldValue.create({
        data: {
          taskId: targetTask.id,
          labelEn: sf.labelEn,
          labelFa: sf.labelFa,
          fieldType: sf.fieldType,
          value: sf.value,
          fileName: sf.fileName,
          order: nextOrder++,
        },
      });
    }

    await db.stageFieldValue.deleteMany({ where: { stageId: stage.id } });
  }

  for (const id of affectedSeedIds) {
    await refreshSeedProgress(id);
  }

  return affectedSeedIds.size;
}

/** Ensure planted seeds have task fields that exist on their theme template. */
export async function syncSeedTaskFieldsFromTheme(seedId?: string) {
  const seeds = await db.seed.findMany({
    where: seedId ? { id: seedId } : undefined,
    include: {
      theme: {
        include: {
          stageDefs: {
            orderBy: { order: "asc" },
            include: {
              fieldDefs: { orderBy: { order: "asc" } },
              taskDefs: {
                orderBy: { order: "asc" },
                include: { fieldDefs: { orderBy: { order: "asc" } } },
              },
            },
          },
        },
      },
      stages: {
        orderBy: { order: "asc" },
        include: {
          fieldValues: true,
          tasks: {
            orderBy: { order: "asc" },
            include: { fieldValues: true },
          },
        },
      },
    },
  });

  for (const seed of seeds) {
    let changed = false;

    for (const stage of seed.stages) {
      const stageDef = seed.theme.stageDefs.find((sd) => sd.order === stage.order);
      if (!stageDef) continue;

      for (const fd of stageDef.fieldDefs) {
        const exists = stage.fieldValues.some((fv) => fv.labelEn === fd.labelEn);
        if (exists) continue;
        await db.stageFieldValue.create({
          data: {
            stageId: stage.id,
            labelEn: fd.labelEn,
            labelFa: fd.labelFa,
            fieldType: fd.fieldType,
            order: fd.order,
          },
        });
        changed = true;
      }

      const rootTasks = stage.tasks.filter((t) => !t.parentId);
      const rootTaskDefs = stageDef.taskDefs.filter((t) => !t.parentId);

      for (let i = 0; i < rootTaskDefs.length; i++) {
        const taskDef = rootTaskDefs[i];
        const task = rootTasks[i];
        if (!task) continue;

        for (const fd of taskDef.fieldDefs) {
          const exists = task.fieldValues.some((fv) => fv.labelEn === fd.labelEn);
          if (exists) continue;

          await db.taskFieldValue.create({
            data: {
              taskId: task.id,
              labelEn: fd.labelEn,
              labelFa: fd.labelFa,
              fieldType: fd.fieldType,
              order: fd.order,
            },
          });
          changed = true;
        }
      }
    }

    if (changed) await refreshSeedProgress(seed.id);
  }
}
