import { buildTaskTree, type TaskNodeLike } from "@/lib/task-tree";

export type FieldWithCompleted = { completed: boolean };

export function fieldsProgressPercent(fields: FieldWithCompleted[]): number {
  if (fields.length === 0) return 100;
  const done = fields.filter((f) => f.completed).length;
  return Math.round((done / fields.length) * 100);
}

/** Task: average of sub-tasks, else % of fields marked complete (checkbox only). */
export function taskProgressPercent(task: TaskNodeLike): number {
  const children = task.subtasks ?? [];
  if (children.length > 0) {
    const sum = children.reduce((acc, c) => acc + taskProgressPercent(c), 0);
    return Math.round(sum / children.length);
  }
  return fieldsProgressPercent(task.fieldValues);
}

/** Stage: 100% when all root tasks are 100%. */
export function stageProgressPercent(stage: { tasks: TaskNodeLike[] }): number {
  const roots = stage.tasks;
  if (roots.length === 0) return 0;
  const sum = roots.reduce((acc, t) => acc + taskProgressPercent(t), 0);
  return Math.round(sum / roots.length);
}

export function computeSeedProgressFromStages(
  stages: Array<{ parentId?: string | null; tasks: TaskNodeLike[] }>,
): number {
  const roots = stages.filter((s) => !s.parentId);
  if (roots.length === 0) return 0;
  const sum = roots.reduce((acc, s) => acc + stageProgressPercent(s), 0);
  return Math.round(sum / roots.length);
}

export function buildStageTreesForProgress(
  stages: Array<{
    parentId: string | null;
    tasks: Array<{
      id: string;
      parentId: string | null;
      order: number;
      fieldValues: FieldWithCompleted[];
    }>;
  }>,
) {
  return stages.map((s) => ({
    parentId: s.parentId,
    tasks: buildTaskTree(s.tasks),
  }));
}
