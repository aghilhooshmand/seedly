import { db, prismaSupportsTaskFieldProgressFlag } from "@/lib/db";
import {
  computeSeedProgressFromStages,
  buildStageTreesForProgress,
} from "@/lib/progress-calc";

export {
  fieldsProgressPercent,
  taskProgressPercent,
  stageProgressPercent,
  computeSeedProgressFromStages,
} from "@/lib/progress-calc";

export async function syncSeedProgress(seedId: string) {
  const fieldSelect = prismaSupportsTaskFieldProgressFlag()
    ? ({ completed: true, countsTowardProgress: true } as const)
    : ({ completed: true } as const);

  const stages = await db.stage.findMany({
    where: { seedId },
    select: {
      parentId: true,
      tasks: {
        select: {
          id: true,
          parentId: true,
          order: true,
          fieldValues: { select: fieldSelect },
        },
      },
    },
  });

  const progress = computeSeedProgressFromStages(buildStageTreesForProgress(stages));
  await db.seed.update({ where: { id: seedId }, data: { progress } });
  return progress;
}
