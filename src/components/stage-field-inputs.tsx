"use client";

import { ScopedFieldInputs, type ScopedField } from "@/components/scoped-field-inputs";
import type { Locale } from "@/lib/labels";

export type StageField = ScopedField;

export function StageFieldInputs({
  seedId,
  stageId,
  fields,
  locale,
  readOnly,
}: {
  seedId: string;
  stageId: string;
  fields: StageField[];
  locale: Locale;
  readOnly?: boolean;
}) {
  return (
    <ScopedFieldInputs
      fields={fields}
      locale={locale}
      readOnly={readOnly}
      progressCheckboxMode="never"
      patchUrl={(fieldId) => `/api/seeds/${seedId}/stages/${stageId}/fields/${fieldId}`}
      uploadUrl={(fieldId) => `/api/seeds/${seedId}/stages/${stageId}/fields/${fieldId}/upload`}
    />
  );
}
