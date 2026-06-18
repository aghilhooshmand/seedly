import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertTaskOwner, updateTaskField } from "@/lib/tasks";
import { saveTaskFile } from "@/lib/uploads";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; fieldId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const task = await assertTaskOwner(id, userId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const field = await db.taskFieldValue.findFirst({
    where: { id: fieldId, taskId: id },
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
    const saved = await saveTaskFile(task.stage.seedId, id, file);
    const updated = await updateTaskField(fieldId, saved);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload failed" },
      { status: 400 },
    );
  }
}
