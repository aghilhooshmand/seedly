"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Upload, Trash2 } from "lucide-react";

const FIELD_TYPES = ["TEXT", "TEXTAREA", "DATE", "URL", "NUMBER", "CHECKBOX", "FILE"] as const;

export function AddCustomFieldForm({ seedId }: { seedId: string }) {
  const t = useTranslations();
  const router = useRouter();
  const [labelEn, setLabelEn] = useState("");
  const [labelFa, setLabelFa] = useState("");
  const [fieldType, setFieldType] = useState<(typeof FIELD_TYPES)[number]>("TEXT");
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (fieldType === "FILE") {
        if (!file) {
          setError(t("seed.fileRequired"));
          setLoading(false);
          return;
        }
        const form = new FormData();
        form.append("labelEn", labelEn);
        form.append("labelFa", labelFa || labelEn);
        form.append("fieldType", "FILE");
        form.append("file", file);
        const res = await fetch(`/api/seeds/${seedId}/fields`, { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed");
        }
      } else {
        const res = await fetch(`/api/seeds/${seedId}/fields`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            labelEn,
            labelFa: labelFa || labelEn,
            fieldType,
            value:
              fieldType === "CHECKBOX"
                ? value === "true"
                  ? "true"
                  : "false"
                : value || null,
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Failed");
        }
      }

      setLabelEn("");
      setLabelFa("");
      setValue("");
      setFile(null);
      setFieldType("TEXT");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
      <h3 className="text-sm font-semibold text-emerald-900">{t("seed.addField")}</h3>

      <input
        required
        value={labelEn ?? ""}
        onChange={(e) => setLabelEn(e.target.value)}
        placeholder={t("seed.fieldLabelEn")}
        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
      />
      <input
        value={labelFa ?? ""}
        onChange={(e) => setLabelFa(e.target.value)}
        placeholder={t("seed.fieldLabelFa")}
        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
      />

      <select
        value={fieldType}
        onChange={(e) => setFieldType(e.target.value as (typeof FIELD_TYPES)[number])}
        className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
      >
        {FIELD_TYPES.map((ft) => (
          <option key={ft} value={ft}>
            {t(`fieldTypes.${ft}`)}
          </option>
        ))}
      </select>

      {fieldType === "FILE" ? (
        <div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-white px-3 py-4 text-sm text-emerald-800 hover:bg-emerald-50">
            <Upload className="h-4 w-4 shrink-0" />
            <span>{file ? file.name : t("seed.chooseFile")}</span>
            <input
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <p className="mt-1 text-xs text-emerald-700/60">{t("seed.fileHint")}</p>
        </div>
      ) : fieldType === "TEXTAREA" ? (
        <textarea
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
        />
      ) : fieldType === "CHECKBOX" ? (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value === "true"}
            onChange={(e) => setValue(e.target.checked ? "true" : "false")}
          />
          {t("seed.checkboxValue")}
        </label>
      ) : (
        <input
          type={fieldType === "DATE" ? "date" : fieldType === "URL" ? "url" : fieldType === "NUMBER" ? "number" : "text"}
          value={value ?? ""}
          onChange={(e) => setValue(e.target.value)}
          className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading ? t("common.loading") : t("common.save")}
      </button>
    </form>
  );
}

export function EditableSeedFields({
  seedId,
  fields,
  readOnly,
}: {
  seedId: string;
  fields: Array<{
    id: string;
    value: string | null;
    fileName: string | null;
    labelEn: string | null;
    labelFa: string | null;
    fieldType: string | null;
    fieldDef: { labelEn: string; labelFa: string; fieldType: string } | null;
  }>;
  readOnly?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();

  async function updateValue(fieldId: string, value: string) {
    await fetch(`/api/seeds/${seedId}/fields/${fieldId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    router.refresh();
  }

  async function uploadFile(fieldId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    await fetch(`/api/seeds/${seedId}/fields/${fieldId}/upload`, { method: "POST", body: form });
    router.refresh();
  }

  async function removeField(fieldId: string) {
    if (!confirm(t("seed.deleteFieldConfirm"))) return;
    await fetch(`/api/seeds/${seedId}/fields/${fieldId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const type = f.fieldDef?.fieldType ?? f.fieldType ?? "TEXT";
        const isCustom = !f.fieldDef;

        return (
          <div key={f.id} className="rounded-xl border border-emerald-50 bg-emerald-50/30 p-3">
            <dt className="flex items-center justify-between gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700/60">
              <span>
                {f.fieldDef
                  ? f.fieldDef.labelEn
                  : f.labelEn}
              </span>
              {!readOnly && isCustom && (
                <button
                  type="button"
                  onClick={() => removeField(f.id)}
                  className="text-red-500 hover:text-red-700"
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </dt>
            <dd className="mt-2">
              {readOnly ? (
                <FieldReadOnly type={type} value={f.value} fileName={f.fileName} />
              ) : type === "FILE" ? (
                <div className="space-y-2">
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
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-emerald-800">
                    <Upload className="h-4 w-4" />
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
                </div>
              ) : type === "TEXTAREA" ? (
                <textarea
                  defaultValue={f.value ?? ""}
                  rows={3}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm"
                  onBlur={(e) => {
                    if (e.target.value !== (f.value ?? "")) updateValue(f.id, e.target.value);
                  }}
                />
              ) : type === "CHECKBOX" ? (
                <input
                  type="checkbox"
                  defaultChecked={f.value === "true"}
                  onChange={(e) => updateValue(f.id, e.target.checked ? "true" : "false")}
                />
              ) : (
                <input
                  type={type === "DATE" ? "date" : type === "URL" ? "url" : type === "NUMBER" ? "number" : "text"}
                  defaultValue={f.value ?? ""}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-sm"
                  onBlur={(e) => {
                    if (e.target.value !== (f.value ?? "")) updateValue(f.id, e.target.value);
                  }}
                />
              )}
            </dd>
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
