export type TaskFieldLike = {
  completed: boolean;
};

export type TaskNodeLike = {
  id: string;
  parentId?: string | null;
  fieldValues: TaskFieldLike[];
  subtasks?: TaskNodeLike[];
};

export type TaskTreeNode<T> = T & { subtasks: TaskTreeNode<T>[] };

export function buildTaskTree<
  T extends { id: string; parentId?: string | null; order: number },
>(flat: T[]): TaskTreeNode<T>[] {
  const byParent = new Map<string | null, T[]>();
  for (const t of flat) {
    const key = t.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.order - b.order);
  }

  function attach(parentId: string | null): TaskTreeNode<T>[] {
    return (byParent.get(parentId) ?? []).map((t) => ({
      ...t,
      subtasks: attach(t.id),
    }));
  }

  return attach(null);
}
