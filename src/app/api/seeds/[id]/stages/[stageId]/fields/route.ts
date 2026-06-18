import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, addStageField, updateStageField } from "@/lib/stages";
import { saveStageFile } from "@/lib/uploads";
import type { FieldType } from "@prisma/client";

type Params = { params: Promise<{ id: string; stageId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, stageId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const fieldId = String(form.get("fieldId") ?? "");
    const file = form.get("file");
    if (!(file instanceof File) || !fieldId) {
      return NextResponse.json({ error: "fieldId and file required" }, { status: 400 });
    }
    try {
      const saved = await saveStageFile(id, stageId, file);
      const field = await updateStageField(fieldId, {
        value: saved.value,
        fileName: saved.fileName,
        fieldType: "FILE",
      });
      return NextResponse.json(field);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Upload failed" },
        { status: 400 },
      );
    }
  }

  const body = await request.json();
  if (body.kind === "field") {
    const field = await addStageField(stageId, {
      labelEn: body.labelEn,
      labelFa: body.labelFa,
      fieldType: (body.fieldType ?? "TEXT") as FieldType,
      value: body.value,
    });
    return NextResponse.json(field, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}
