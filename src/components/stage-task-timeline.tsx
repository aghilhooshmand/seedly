"use client";

import { useTranslations } from "next-intl";
import { label, type Locale } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { AlertTriangle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { stageProgressPercent, taskProgressPercent } from "@/lib/progress";
import { TaskFieldInputs, type TaskField } from "@/components/task-field-inputs";
import { StageFieldInputs, type StageField } from "@/components/stage-field-inputs";

type Task = {
  id: string;
  titleEn: string;
  titleFa: string;
  deadline: Date | string | null;
  priority: string;
  fieldValues: TaskField[];
  subtasks?: Task[];
};

type Stage = {
  id: string;
  parentId?: string | null;
  order?: number;
  nameEn: string;
  nameFa: string;
  descriptionEn: string | null;
  descriptionFa: string | null;
  status: string;
  fieldValues: StageField[];
  tasks: Task[];
};

function isOverdue(deadline: Date | string | null, progress: number) {
  if (!deadline || progress >= 100) return false;
  return new Date(deadline) < new Date();
}

function isDueSoon(deadline: Date | string | null, progress: number) {
  if (!deadline || progress >= 100) return false;
  const d = new Date(deadline);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  return diff > 0 && diff < 3 * 86400000;
}

const priorityColors: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-emerald-100 text-emerald-700",
  HIGH: "bg-amber-100 text-amber-700",
  URGENT: "bg-red-100 text-red-700",
};

function flattenTasks(tasks: Task[]): Task[] {
  return tasks.flatMap((t) => [t, ...(t.subtasks ? flattenTasks(t.subtasks) : [])]);
}

export function StageTaskTimeline({
  seedId,
  stages,
  locale,
  readOnly,
}: {
  seedId: string;
  stages: Stage[];
  locale: Locale;
  readOnly?: boolean;
}) {
  const t = useTranslations();
  const roots = stages
    .filter((s) => !s.parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  function renderStage(stage: Stage, depth: number, isLastAmongSiblings: boolean) {
    const children = stages.filter((s) => s.parentId === stage.id);
    const progress = stageProgressPercent(stage);

    return (
      <li key={stage.id} className={cn("relative flex gap-4", depth === 0 ? "pb-8" : "pb-4")}>
        {depth === 0 && !isLastAmongSiblings && (
          <span
            className={cn(
              "absolute start-[15px] top-8 h-[calc(100%-2rem)] w-0.5",
              progress >= 100 ? "bg-emerald-400" : "bg-emerald-100",
            )}
          />
        )}
        <div
          className={cn(
            "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold",
            depth > 0 && "h-6 w-6 text-[10px]",
            progress >= 100 && "border-emerald-500 bg-emerald-500 text-white",
            progress > 0 && progress < 100 && "border-emerald-500 bg-white text-emerald-600",
            progress === 0 && "border-emerald-200 bg-white text-emerald-400",
          )}
        >
          {progress}%
        </div>
        <div className="min-w-0 flex-1 pt-0.5" style={{ marginInlineStart: depth > 0 ? 8 : 0 }}>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cn("font-semibold text-emerald-950", depth > 0 && "text-sm")}>
              {label(locale, stage.nameEn, stage.nameFa)}
            </h3>
            {depth > 0 && (
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] text-emerald-600">
                {t("customize.subStage")}
              </span>
            )}
          </div>
          {(stage.descriptionEn || stage.descriptionFa) && (
            <p className="mt-1 text-sm text-emerald-800/60">
              {label(locale, stage.descriptionEn ?? "", stage.descriptionFa)}
            </p>
          )}

          {stage.fieldValues.length > 0 && (
            <StageFieldInputs
              seedId={seedId}
              stageId={stage.id}
              fields={stage.fieldValues}
              locale={locale}
              readOnly={readOnly}
              compact
            />
          )}

          <ul className="mt-3 space-y-2">
            {stage.tasks.map((task) => (
              <TaskRow key={task.id} task={task} locale={locale} readOnly={readOnly} t={t} depth={0} />
            ))}
          </ul>
          {children.length > 0 && (
            <ul className="mt-3 space-y-0 border-s-2 border-emerald-100 ps-4">
              {children.map((child, i) => renderStage(child, depth + 1, i === children.length - 1))}
            </ul>
          )}
        </div>
      </li>
    );
  }

  return (
    <ol className="space-y-0">
      {roots.map((stage, index) => renderStage(stage, 0, index === roots.length - 1))}
    </ol>
  );
}

function TaskRow({
  task,
  locale,
  readOnly,
  t,
  depth,
}: {
  task: Task;
  locale: Locale;
  readOnly?: boolean;
  t: ReturnType<typeof useTranslations>;
  depth: number;
}) {
  const progress = taskProgressPercent(task);
  const overdue = isOverdue(task.deadline, progress);
  const dueSoon = isDueSoon(task.deadline, progress);
  const hasSubtasks = (task.subtasks?.length ?? 0) > 0;

  return (
    <li
      className={cn(
        "rounded-xl border p-3",
        depth > 0 && "ms-4 border-emerald-100 bg-emerald-50/20",
        overdue ? "border-red-200 bg-red-50/50" : "border-emerald-50 bg-white",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
            progress >= 100 ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-700",
          )}
          title={t("seed.progress")}
        >
          {progress}%
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-emerald-950">
            {label(locale, task.titleEn, task.titleFa)}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                priorityColors[task.priority],
              )}
            >
              {t(`priority.${task.priority}` as "priority.LOW")}
            </span>
            {task.deadline && (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-700/60">
                {overdue ? (
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                ) : dueSoon ? (
                  <Clock className="h-3 w-3 text-amber-500" />
                ) : null}
                {formatDate(task.deadline)}
                {overdue && <span className="font-medium text-red-600">{t("seed.overdue")}</span>}
                {dueSoon && !overdue && <span className="text-amber-600">{t("seed.dueSoon")}</span>}
              </span>
            )}
          </div>

          {!hasSubtasks && (
            <TaskFieldInputs
              taskId={task.id}
              fields={task.fieldValues}
              locale={locale}
              readOnly={readOnly}
              compact
            />
          )}

          {hasSubtasks && (
            <ul className="mt-2 space-y-2 border-s border-emerald-100 ps-3">
              {task.subtasks!.map((sub) => (
                <TaskRow key={sub.id} task={sub} locale={locale} readOnly={readOnly} t={t} depth={depth + 1} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function FollowUpSummary({
  stages,
  locale,
}: {
  stages: Stage[];
  locale: Locale;
}) {
  const t = useTranslations();
  const allTasks = flattenTasks(stages.flatMap((s) => s.tasks));
  const overdue = allTasks.filter((tk) => isOverdue(tk.deadline, taskProgressPercent(tk)));
  const dueSoon = allTasks.filter((tk) => isDueSoon(tk.deadline, taskProgressPercent(tk)));
  const pending = allTasks.filter((tk) => taskProgressPercent(tk) < 100);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <SummaryBox label={t("seed.overdue")} count={overdue.length} tone="red" />
      <SummaryBox label={t("seed.dueSoon")} count={dueSoon.length} tone="amber" />
      <SummaryBox label={locale === "fa" ? "باقی‌مانده" : "Remaining"} count={pending.length} tone="emerald" />
    </div>
  );
}

function SummaryBox({
  label: lbl,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "red" | "amber" | "emerald";
}) {
  const tones = {
    red: "border-red-100 bg-red-50 text-red-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-800",
  };
  return (
    <div className={cn("rounded-xl border p-4", tones[tone])}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm opacity-80">{lbl}</p>
    </div>
  );
}
