import type { FieldType } from "@prisma/client";

type FieldLike = {
  fieldType?: FieldType | string;
  value?: string | null;
  fileName?: string | null;
  completed: boolean;
};

export function hasFieldContent(field: Pick<FieldLike, "fieldType" | "value" | "fileName">): boolean {
  if (field.fieldType === "FILE") return !!field.value;
  if (field.fieldType === "CHECKBOX") return field.value === "true";
  return !!(field.value?.trim());
}

export function resolveCompletedAfterUpdate(
  existing: FieldLike,
  data: { value?: string | null; fileName?: string | null; completed?: boolean },
): boolean | undefined {
  if (data.completed !== undefined) return data.completed;
  if (data.value !== undefined || data.fileName !== undefined) {
    const next = {
      fieldType: existing.fieldType,
      value: data.value !== undefined ? data.value : existing.value,
      fileName: data.fileName !== undefined ? data.fileName : existing.fileName,
    };
    return hasFieldContent(next);
  }
  return undefined;
}
