"use client";

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
  completed: boolean;
};

export function ScopedFieldInputs({
  fields,
  locale,
  readOnly,
  compact,
  patchUrl,
  uploadUrl,
}: {
  fields: ScopedField[];
  locale: Locale;
  readOnly?: boolean;
  compact?: boolean;
  patchUrl: (fieldId: string) => string;
  uploadUrl?: (fieldId: string) => string;
}) {
  const t = useTranslations();
  const router = useRouter();

  if (fields.length === 0) return null;

  async function patchField(fieldId: string, body: Record<string, unknown>) {
    await fetch(patchUrl(fieldId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    router.refresh();
  }

  async function uploadFile(fieldId: string, file: File) {
    if (!uploadUrl) return;
    const form = new FormData();
    form.append("file", file);
    await fetch(uploadUrl(fieldId), { method: "POST", body: form });
    router.refresh();
  }

  return (
    <dl className={compact ? "mt-2 grid gap-2 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2"}>
      {fields.map((f) => (
        <div
          key={f.id}
          className={cn(
            compact ? "rounded-lg p-2" : "rounded-xl border p-3",
            f.completed ? "border-emerald-200 bg-emerald-50/60" : "border-emerald-50 bg-emerald-50/30",
          )}
        >
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={f.completed}
              disabled={readOnly}
              title={t("seed.fieldComplete")}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-emerald-300"
              onChange={(e) => patchField(f.id, { completed: e.target.checked })}
            />
            <div className="min-w-0 flex-1">
              <dt
                className={cn(
                  "text-xs font-medium text-emerald-700/70",
                  f.completed && "line-through opacity-60",
                )}
              >
                {label(locale, f.labelEn, f.labelFa)}
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
                      if (e.target.value !== (f.value ?? "")) patchField(f.id, { value: e.target.value });
                    }}
                  />
                ) : f.fieldType === "CHECKBOX" ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      defaultChecked={f.value === "true"}
                      onChange={(e) => patchField(f.id, { value: e.target.checked ? "true" : "false" })}
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
                      if (e.target.value !== (f.value ?? "")) patchField(f.id, { value: e.target.value });
                    }}
                  />
                )}
              </dd>
            </div>
          </div>
        </div>
      ))}
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
