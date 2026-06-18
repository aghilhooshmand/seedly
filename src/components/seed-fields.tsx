import { label, type Locale } from "@/lib/labels";
import type { FieldType } from "@prisma/client";

type FieldValue = {
  id: string;
  value: string | null;
  fileName: string | null;
  labelEn: string | null;
  labelFa: string | null;
  fieldType: FieldType | null;
  fieldDef: {
    labelEn: string;
    labelFa: string;
    fieldType: FieldType;
    options: string | null;
  } | null;
};

export function SeedFields({
  fields,
  locale,
}: {
  fields: FieldValue[];
  locale: Locale;
}) {
  if (fields.length === 0) {
    return (
      <p className="text-sm text-emerald-800/50">—</p>
    );
  }

  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const fieldLabel = f.fieldDef
          ? label(locale, f.fieldDef.labelEn, f.fieldDef.labelFa)
          : label(locale, f.labelEn ?? "", f.labelFa);
        const type = f.fieldDef?.fieldType ?? f.fieldType ?? "TEXT";

        return (
          <div key={f.id} className="rounded-xl border border-emerald-50 bg-emerald-50/30 p-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-emerald-700/60">{fieldLabel}</dt>
            <dd className="mt-1 text-sm text-emerald-950 break-words">
              <FieldDisplay type={type} value={f.value} locale={locale} />
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

function FieldDisplay({
  type,
  value,
  locale,
}: {
  type: FieldType | string;
  value: string | null;
  locale: Locale;
}) {
  if (!value) return <span className="text-emerald-700/40">—</span>;
  if (type === "URL") {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">
        {value}
      </a>
    );
  }
  if (type === "DATE") {
    return <>{new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : "en-GB").format(new Date(value))}</>;
  }
  if (type === "CHECKBOX") {
    return <>{value === "true" ? (locale === "fa" ? "بله" : "Yes") : locale === "fa" ? "خیر" : "No"}</>;
  }
  return <span className="whitespace-pre-wrap">{value}</span>;
}
