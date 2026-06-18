"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  Settings2,
  GripVertical,
  Save,
} from "lucide-react";
import { label, type Locale } from "@/lib/labels";
import Link from "next/link";

const FIELD_TYPES = ["TEXT", "TEXTAREA", "DATE", "URL", "NUMBER", "CHECKBOX", "FILE"] as const;

type StageField = {
  id: string;
  labelEn: string;
  labelFa?: string | null;
  fieldType: string;
};

type TaskField = {
  id: string;
  labelEn: string;
  labelFa?: string | null;
  fieldType: string;
};

type Task = {
  id: string;
  titleEn: string;
  titleFa: string;
  fieldValues: TaskField[];
  subtasks?: Task[];
};

export type StructureStage = {
  id: string;
  parentId: string | null;
  nameEn: string;
  nameFa: string;
  order: number;
  fieldValues: StageField[];
  tasks: Task[];
};

type EditorMode = "seed" | "theme";

function apiBase(mode: EditorMode, entityId: string) {
  return mode === "seed" ? `/api/seeds/${entityId}` : `/api/themes/${entityId}`;
}

export function StructureTreeEditor({
  mode,
  entityId,
  stages: initialStages,
  readOnly,
  showSaveAsTheme,
}: {
  mode: EditorMode;
  entityId: string;
  stages: StructureStage[];
  readOnly?: boolean;
  showSaveAsTheme?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [stages, setStages] = useState(initialStages);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(initialStages.map((s) => s.id)));
  const [savingTheme, setSavingTheme] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const roots = stages.filter((s) => !s.parentId).sort((a, b) => a.order - b.order);

  function childrenOf(parentId: string) {
    return stages.filter((s) => s.parentId === parentId).sort((a, b) => a.order - b.order);
  }

  async function refresh() {
    router.refresh();
    if (mode === "seed") {
      const res = await fetch(`${apiBase(mode, entityId)}/stages`);
      if (res.ok) setStages(await res.json());
    } else {
      const res = await fetch(`${apiBase(mode, entityId)}/stages`);
      if (res.ok) setStages(await res.json());
    }
  }

  async function reorder(parentId: string | null, orderedIds: string[]) {
    const siblings = stages
      .filter((s) => (s.parentId ?? null) === parentId)
      .sort((a, b) => a.order - b.order);
    const reordered = orderedIds.map((id, order) => {
      const s = siblings.find((x) => x.id === id)!;
      return { ...s, order };
    });
    setStages((prev) => {
      const others = prev.filter((s) => (s.parentId ?? null) !== parentId);
      return [...others, ...reordered];
    });
    await fetch(`${apiBase(mode, entityId)}/stages/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds, parentId }),
    });
  }

  function handleDragEnd(parentId: string | null, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const siblings = parentId ? childrenOf(parentId) : roots;
    const ids = siblings.map((s) => s.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void reorder(parentId, arrayMove(ids, oldIndex, newIndex));
  }

  async function addStage(parentId?: string) {
    const nameEn = prompt(t("customize.stageNamePrompt"));
    if (!nameEn?.trim()) return;
    await fetch(`${apiBase(mode, entityId)}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEn: nameEn.trim(), parentId: parentId ?? null }),
    });
    await refresh();
  }

  async function removeStage(stageId: string) {
    if (!confirm(t("customize.deleteStageConfirm"))) return;
    await fetch(`${apiBase(mode, entityId)}/stages/${stageId}`, { method: "DELETE" });
    await refresh();
  }

  async function addTask(stageId: string) {
    const titleEn = prompt(t("customize.taskNamePrompt"));
    if (!titleEn?.trim()) return;
    await fetch(`${apiBase(mode, entityId)}/stages/${stageId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titleEn: titleEn.trim() }),
    });
    await refresh();
  }

  async function addSubtask(parentTaskId: string) {
    const titleEn = prompt(t("customize.taskNamePrompt"));
    if (!titleEn?.trim()) return;
    if (mode === "seed") {
      await fetch(`/api/tasks/${parentTaskId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "subtask", titleEn: titleEn.trim() }),
      });
    } else {
      await fetch(`/api/themes/${entityId}/task-defs/${parentTaskId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "subtask", titleEn: titleEn.trim() }),
      });
    }
    await refresh();
  }

  async function removeTask(taskId: string) {
    if (mode === "seed") {
      await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/themes/${entityId}/task-defs/${taskId}`, { method: "DELETE" });
    }
    await refresh();
  }

  async function saveAsTheme() {
    const nameEn = prompt(t("themes.saveAsNamePrompt"));
    if (!nameEn?.trim()) return;
    setSavingTheme(true);
    const res = await fetch(`/api/seeds/${entityId}/save-as-theme`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nameEn: nameEn.trim() }),
    });
    setSavingTheme(false);
    if (res.ok) {
      const theme = await res.json();
      router.push(`/themes/${theme.id}`);
    }
  }

  function renderStageList(parentId: string | null, depth: number) {
    const list = parentId ? childrenOf(parentId) : roots;
    if (list.length === 0) return null;

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(parentId, e)}>
        <SortableContext items={list.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {list.map((stage) => (
            <SortableStageRow
              key={stage.id}
              stage={stage}
              depth={depth}
              locale={locale}
              readOnly={readOnly}
              expanded={expanded.has(stage.id)}
              onToggle={() =>
                setExpanded((prev) => {
                  const n = new Set(prev);
                  if (n.has(stage.id)) n.delete(stage.id);
                  else n.add(stage.id);
                  return n;
                })
              }
              onAddSubStage={() => addStage(stage.id)}
              onAddTask={() => addTask(stage.id)}
              onAddSubtask={addSubtask}
              onRemoveStage={() => removeStage(stage.id)}
              onRemoveTask={removeTask}
              mode={mode}
              entityId={entityId}
              onRefresh={refresh}
              t={t}
            >
              {expanded.has(stage.id) && renderStageList(stage.id, depth + 1)}
            </SortableStageRow>
          ))}
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-emerald-600" />
          <h2 className="font-semibold text-emerald-950">{t("customize.title")}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {showSaveAsTheme && !readOnly && (
            <button
              type="button"
              disabled={savingTheme}
              onClick={saveAsTheme}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-3 py-1.5 text-sm text-emerald-800 hover:bg-emerald-50"
            >
              <Save className="h-4 w-4" />
              {t("themes.saveAsTheme")}
            </button>
          )}
          {!readOnly && (
            <button
              type="button"
              onClick={() => addStage()}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              {t("customize.addStage")}
            </button>
          )}
        </div>
      </div>

      <p className="border-b border-emerald-50 px-5 py-3 text-sm text-emerald-800/60">{t("customize.hintDnD")}</p>

      {roots.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-emerald-700/50">{t("customize.empty")}</p>
      ) : (
        <div className="px-3 py-2">{renderStageList(null, 0)}</div>
      )}
    </div>
  );
}

function SortableStageRow({
  stage,
  depth,
  locale,
  readOnly,
  expanded,
  onToggle,
  onAddSubStage,
  onAddTask,
  onAddSubtask,
  onRemoveStage,
  onRemoveTask,
  mode,
  entityId,
  onRefresh,
  t,
  children,
}: {
  stage: StructureStage;
  depth: number;
  locale: Locale;
  readOnly?: boolean;
  expanded: boolean;
  onToggle: () => void;
  onAddSubStage: () => void;
  onAddTask: () => void;
  onAddSubtask: (parentTaskId: string) => void;
  onRemoveStage: () => void;
  onRemoveTask: (id: string) => void;
  mode: EditorMode;
  entityId: string;
  onRefresh: () => void;
  t: ReturnType<typeof useTranslations>;
  children?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    disabled: readOnly,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const padding = depth * 20;

  return (
    <div ref={setNodeRef} style={style} className="border-b border-emerald-50 last:border-0">
      <div className="flex flex-wrap items-center gap-2 py-3" style={{ paddingInlineStart: padding }}>
        {!readOnly && (
          <button type="button" className="cursor-grab text-emerald-400 hover:text-emerald-600" {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <button type="button" onClick={onToggle} className="text-emerald-600">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <span className="font-semibold text-emerald-950">{label(locale, stage.nameEn, stage.nameFa)}</span>
        {depth > 0 && (
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] uppercase text-emerald-700">
            {t("customize.subStage")}
          </span>
        )}
        {!readOnly && (
          <div className="ms-auto flex flex-wrap gap-1">
            <button type="button" onClick={onAddSubStage} className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">
              <Plus className="inline h-3 w-3" /> {t("customize.subStage")}
            </button>
            <button type="button" onClick={onAddTask} className="rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50">
              + {t("seed.addTask")}
            </button>
            <button type="button" onClick={onRemoveStage} className="rounded p-1 text-red-500 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {expanded && (
        <div style={{ paddingInlineStart: padding + 28 }} className="space-y-3 pb-4">
          <StageFieldDefSection
            stageId={stage.id}
            fields={stage.fieldValues}
            readOnly={readOnly}
            mode={mode}
            entityId={entityId}
            onRefresh={onRefresh}
            t={t}
          />

          {stage.tasks.length > 0 && (
            <ul className="space-y-2">
              <p className="text-xs font-medium uppercase text-emerald-700/60">{t("customize.tasks")}</p>
              {stage.tasks.map((task) => (
                <TaskStructureRow
                  key={task.id}
                  task={task}
                  locale={locale}
                  readOnly={readOnly}
                  mode={mode}
                  entityId={entityId}
                  onRefresh={onRefresh}
                  onRemoveTask={onRemoveTask}
                  onAddSubtask={onAddSubtask}
                  t={t}
                  depth={0}
                />
              ))}
            </ul>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

function StageFieldDefSection({
  stageId,
  fields,
  readOnly,
  mode,
  entityId,
  onRefresh,
  t,
}: {
  stageId: string;
  fields: StageField[];
  readOnly?: boolean;
  mode: EditorMode;
  entityId: string;
  onRefresh: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [labelEn, setLabelEn] = useState("");
  const [fieldType, setFieldType] = useState<(typeof FIELD_TYPES)[number]>("TEXT");
  const [open, setOpen] = useState(false);

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    if (!labelEn.trim()) return;

    const url =
      mode === "seed"
        ? `/api/seeds/${entityId}/stages/${stageId}/items`
        : `/api/themes/${entityId}/stages/${stageId}/items`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "field", labelEn, fieldType }),
    });

    setLabelEn("");
    setFieldType("TEXT");
    setOpen(false);
    onRefresh();
  }

  async function removeField(fieldId: string) {
    if (mode === "seed") {
      await fetch(`/api/seeds/${entityId}/stages/${stageId}/fields/${fieldId}`, { method: "DELETE" });
    }
    onRefresh();
  }

  return (
    <div className="space-y-1">
      {fields.length > 0 && (
        <ul className="space-y-1 rounded bg-emerald-50/50 p-2">
          <p className="text-xs font-medium uppercase text-emerald-700/60">{t("customize.stageFields")}</p>
          {fields.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-xs text-emerald-800">
              <span>
                {f.labelEn}
                <span className="mx-1 text-emerald-500">·</span>
                <span className="text-emerald-600">{t(`fieldTypes.${f.fieldType}` as "fieldTypes.TEXT")}</span>
              </span>
              {!readOnly && mode === "seed" && (
                <button type="button" onClick={() => removeField(f.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!readOnly && (
        <>
          {!open ? (
            <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-emerald-700 hover:underline">
              + {t("customize.stageField")}
            </button>
          ) : (
            <form onSubmit={addField} className="space-y-2 rounded border border-emerald-100 p-2">
              <input
                required
                value={labelEn ?? ""}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder={t("customize.fieldNamePrompt")}
                className="w-full rounded border border-emerald-200 px-2 py-1 text-xs"
              />
              <select
                value={fieldType ?? "TEXT"}
                onChange={(e) => setFieldType(e.target.value as (typeof FIELD_TYPES)[number])}
                className="w-full rounded border border-emerald-200 px-2 py-1 text-xs"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {t(`fieldTypes.${ft}`)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">
                  {t("common.save")}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-emerald-700">
                  {t("newSeed.cancel")}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

function TaskStructureRow({
  task,
  locale,
  readOnly,
  mode,
  entityId,
  onRefresh,
  onRemoveTask,
  onAddSubtask,
  t,
  depth,
}: {
  task: Task;
  locale: Locale;
  readOnly?: boolean;
  mode: EditorMode;
  entityId: string;
  onRefresh: () => void;
  onRemoveTask: (id: string) => void;
  onAddSubtask: (parentTaskId: string) => void;
  t: ReturnType<typeof useTranslations>;
  depth: number;
}) {
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;

  return (
    <li
      className="rounded-lg border border-emerald-100 bg-white px-3 py-2"
      style={{ marginInlineStart: depth * 16 }}
    >
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-emerald-900">{label(locale, task.titleEn, task.titleFa)}</span>
        {!readOnly && (
          <div className="flex items-center gap-1">
            {!hasSubtasks && (
              <button
                type="button"
                onClick={() => onAddSubtask(task.id)}
                className="rounded px-2 py-0.5 text-xs text-emerald-700 hover:bg-emerald-50"
              >
                + {t("customize.subTask")}
              </button>
            )}
            <button type="button" onClick={() => onRemoveTask(task.id)} className="text-red-400 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {!hasSubtasks && (
        <TaskFieldDefSection
          taskId={task.id}
          fields={task.fieldValues}
          readOnly={readOnly}
          mode={mode}
          entityId={entityId}
          onRefresh={onRefresh}
          t={t}
        />
      )}

      {hasSubtasks && (
        <ul className="mt-2 space-y-2 border-s border-emerald-100 ps-3">
          {task.subtasks!.map((sub) => (
            <TaskStructureRow
              key={sub.id}
              task={sub}
              locale={locale}
              readOnly={readOnly}
              mode={mode}
              entityId={entityId}
              onRefresh={onRefresh}
              onRemoveTask={onRemoveTask}
              onAddSubtask={onAddSubtask}
              t={t}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function TaskFieldDefSection({
  taskId,
  fields,
  readOnly,
  mode,
  entityId,
  onRefresh,
  t,
}: {
  taskId: string;
  fields: TaskField[];
  readOnly?: boolean;
  mode: EditorMode;
  entityId: string;
  onRefresh: () => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const [labelEn, setLabelEn] = useState("");
  const [fieldType, setFieldType] = useState<(typeof FIELD_TYPES)[number]>("TEXT");
  const [open, setOpen] = useState(false);

  async function addField(e: React.FormEvent) {
    e.preventDefault();
    if (!labelEn.trim()) return;

    const url =
      mode === "seed"
        ? `/api/tasks/${taskId}/items`
        : `/api/themes/${entityId}/task-defs/${taskId}/items`;

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "field", labelEn, fieldType }),
    });

    setLabelEn("");
    setFieldType("TEXT");
    setOpen(false);
    onRefresh();
  }

  async function removeField(fieldId: string) {
    if (mode === "seed") {
      await fetch(`/api/tasks/${taskId}/fields/${fieldId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/themes/${entityId}/task-defs/${taskId}/fields/${fieldId}`, { method: "DELETE" });
    }
    onRefresh();
  }

  return (
    <div className="mt-2 space-y-1">
      {fields.length > 0 && (
        <ul className="space-y-1 rounded bg-emerald-50/50 p-2">
          {fields.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-xs text-emerald-800">
              <span>
                {f.labelEn}
                <span className="mx-1 text-emerald-500">·</span>
                <span className="text-emerald-600">{t(`fieldTypes.${f.fieldType}` as "fieldTypes.TEXT")}</span>
              </span>
              {!readOnly && (
                <button type="button" onClick={() => removeField(f.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <>
          {!open ? (
            <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-emerald-700 hover:underline">
              + {t("customize.taskField")}
            </button>
          ) : (
            <form onSubmit={addField} className="space-y-2 rounded border border-emerald-100 p-2">
              <input
                required
                value={labelEn ?? ""}
                onChange={(e) => setLabelEn(e.target.value)}
                placeholder={t("customize.fieldNamePrompt")}
                className="w-full rounded border border-emerald-200 px-2 py-1 text-xs"
              />
              <select
                value={fieldType ?? "TEXT"}
                onChange={(e) => setFieldType(e.target.value as (typeof FIELD_TYPES)[number])}
                className="w-full rounded border border-emerald-200 px-2 py-1 text-xs"
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft} value={ft}>
                    {t(`fieldTypes.${ft}`)}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-xs text-white">
                  {t("common.save")}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-xs text-emerald-700">
                  {t("newSeed.cancel")}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

export function ThemesListLink() {
  const t = useTranslations();
  return (
    <Link href="/themes" className="text-sm font-medium text-emerald-700 hover:text-emerald-900">
      {t("themes.manage")}
    </Link>
  );
}
