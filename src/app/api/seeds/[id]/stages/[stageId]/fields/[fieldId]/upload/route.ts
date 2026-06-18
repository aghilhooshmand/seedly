import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, updateStageField } from "@/lib/stages";
import { saveStageFile } from "@/lib/uploads";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; stageId: string; fieldId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, stageId, fieldId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const field = await db.stageFieldValue.findFirst({
    where: { id: fieldId, stageId },
  });
  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });
  if (field.fieldType !== "FILE") {
    return NextResponse.json({ error: "Not a file field" }, { status: 400 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }

  try {
    const saved = await saveStageFile(id, stageId, file);
    const updated = await updateStageField(fieldId, saved);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
