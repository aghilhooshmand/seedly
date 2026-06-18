"use client";

import { ScopedFieldInputs, type ScopedField } from "@/components/scoped-field-inputs";
import type { Locale } from "@/lib/labels";

export type TaskField = ScopedField;

export function TaskFieldInputs({
  taskId,
  fields,
  locale,
  readOnly,
  compact,
}: {
  taskId: string;
  fields: TaskField[];
  locale: Locale;
  readOnly?: boolean;
  compact?: boolean;
}) {
  return (
    <ScopedFieldInputs
      fields={fields}
      locale={locale}
      readOnly={readOnly}
      compact={compact}
      progressCheckboxMode="auto"
      patchUrl={(fieldId) => `/api/tasks/${taskId}/fields/${fieldId}`}
      uploadUrl={(fieldId) => `/api/tasks/${taskId}/fields/${fieldId}/upload`}
    />
  );
}
