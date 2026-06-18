"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { label, type Locale } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type ScopedField = {
  id: string;
  labelEn: string;
  labelFa: string | null;
  fieldType: string;
  value: string | null;
  fileName: string | null;
  completed?: boolean;
  countsTowardProgress?: boolean;
};

export function ScopedFieldInputs({
  fields,
  locale,
  readOnly,
  compact,
  patchUrl,
  uploadUrl,
  progressCheckboxMode = "auto",
}: {
  fields: ScopedField[];
  locale: Locale;
  readOnly?: boolean;
  compact?: boolean;
  patchUrl: (fieldId: string) => string;
  uploadUrl?: (fieldId: string) => string;
  /** never = stage info fields; auto = task fields (respect countsTowardProgress). */
  progressCheckboxMode?: "never" | "auto";
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pendingCompleted, setPendingCompleted] = useState<Record<string, boolean>>({});

  const normalizedFields = fields.map((f) => ({
    ...f,
    value: f.value ?? null,
    fileName: f.fileName ?? null,
    completed: f.completed === true,
    countsTowardProgress: f.countsTowardProgress !== false,
  }));

  function tracksProgressFor(f: (typeof normalizedFields)[number]) {
    if (progressCheckboxMode === "never") return false;
    const raw = fields.find((x) => x.id === f.id);
    return raw?.countsTowardProgress !== false;
  }

  const serverCompletedKey = normalizedFields
    .map((f) => `${f.id}:${f.completed}`)
    .join("|");

  useEffect(() => {
    setPendingCompleted((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      let next: Record<string, boolean> | null = null;
      for (const f of normalizedFields) {
        if (!(f.id in prev)) continue;
        if (prev[f.id] === f.completed) {
          next ??= { ...prev };
          delete next[f.id];
        }
      }
      return next ?? prev;
    });
  }, [serverCompletedKey]);

  if (normalizedFields.length === 0) return null;

  function isChecked(f: ScopedField) {
    if (f.id in pendingCompleted) return pendingCompleted[f.id] === true;
    return f.completed === true;
  }

  async function patchField(fieldId: string, body: Record<string, unknown>) {
    const res = await fetch(patchUrl(fieldId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      return;
    }
    const updated = (await res.json()) as { completed?: boolean };
    if (typeof updated.completed === "boolean") {
      const completed = updated.completed;
      setPendingCompleted((prev) => ({ ...prev, [fieldId]: completed }));
    }
    router.refresh();
  }

  async function uploadFile(fieldId: string, file: File) {
    if (!uploadUrl) return;
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(uploadUrl(fieldId), { method: "POST", body: form });
    if (res.ok) router.refresh();
  }

  function valuePatch(value: string, tracksProgress: boolean) {
    const body: Record<string, unknown> = { value };
    if (tracksProgress) body.completed = value.trim().length > 0;
    return body;
  }

  return (
    <dl className={compact ? "mt-2 grid gap-2 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
      {normalizedFields.map((f) => {
        const tracksProgress = tracksProgressFor(f);
        const checked = tracksProgress && isChecked(f);
        return (
          <div
            key={f.id}
            className={cn(
              compact ? "rounded-lg p-2" : "rounded-xl border p-3",
              !tracksProgress && "border-slate-100 bg-slate-50/40",
              tracksProgress && checked && "border-emerald-200 bg-emerald-50/60",
              tracksProgress && !checked && "border-emerald-50 bg-emerald-50/30",
            )}
          >
            <div className={cn("flex items-start gap-2", !tracksProgress && "gap-0")}>
              {tracksProgress ? (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={readOnly}
                  title={t("seed.fieldComplete")}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-emerald-300"
                  onChange={(e) => {
                    const next = e.target.checked;
                    setPendingCompleted((prev) => ({ ...prev, [f.id]: next }));
                    void patchField(f.id, { completed: next });
                  }}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <dt className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-emerald-700/70">
                  <span className={cn(tracksProgress && checked && "line-through opacity-60")}>
                    {label(locale, f.labelEn, f.labelFa)}
                  </span>
                  {!tracksProgress && (
                    <span className="rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-normal text-slate-600">
                      {t("customize.fieldInfoBadge")}
                    </span>
                  )}
                </dt>
                <dd className="mt-1">
                  {readOnly ? (
                    <FieldReadOnly type={f.fieldType} value={f.value} fileName={f.fileName} />
                  ) : f.fieldType === "FILE" ? (
                    <div className="space-y-1">
                      {f.value && (
                        <a
                          href={f.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-emerald-700 underline"
                        >
                          {f.fileName ?? f.value}
                        </a>
                      )}
                      {uploadUrl && (
                        <label className="flex cursor-pointer items-center gap-1.5 text-sm text-emerald-800">
                          <Upload className="h-3.5 w-3.5" />
                          {f.value ? t("seed.replaceFile") : t("seed.uploadFile")}
                          <input
                            type="file"
                            className="sr-only"
                            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) uploadFile(f.id, file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  ) : f.fieldType === "TEXTAREA" ? (
                    <textarea
                      defaultValue={f.value ?? ""}
                      rows={2}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm"
                      onBlur={(e) => {
                        if (e.target.value !== (f.value ?? "")) {
                          void patchField(f.id, valuePatch(e.target.value, tracksProgress));
                        }
                      }}
                    />
                  ) : f.fieldType === "CHECKBOX" ? (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={f.value === "true"}
                        onChange={(e) => {
                          const on = e.target.checked;
                          void patchField(
                            f.id,
                            tracksProgress
                              ? { value: on ? "true" : "false", completed: on }
                              : { value: on ? "true" : "false" },
                          );
                        }}
                      />
                      {t("seed.checkboxValue")}
                    </label>
                  ) : (
                    <input
                      type={
                        f.fieldType === "DATE"
                          ? "date"
                          : f.fieldType === "URL"
                            ? "url"
                            : f.fieldType === "NUMBER"
                              ? "number"
                              : "text"
                      }
                      defaultValue={f.value ?? ""}
                      className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm"
                      onBlur={(e) => {
                        if (e.target.value !== (f.value ?? "")) {
                          void patchField(f.id, valuePatch(e.target.value, tracksProgress));
                        }
                      }}
                    />
                  )}
                </dd>
              </div>
            </div>
          </div>
        );
      })}
    </dl>
  );
}

function FieldReadOnly({
  type,
  value,
  fileName,
}: {
  type: string;
  value: string | null;
  fileName: string | null;
}) {
  if (!value) return <span className="text-sm text-emerald-700/40">—</span>;
  if (type === "FILE") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 underline">
        {fileName ?? value}
      </a>
    );
  }
  if (type === "URL") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-700 underline">
        {value}
      </a>
    );
  }
  return <span className="text-sm whitespace-pre-wrap">{value}</span>;
}
