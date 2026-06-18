import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertTaskOwner, updateTaskField, deleteTaskField } from "@/lib/tasks";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; fieldId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const task = await assertTaskOwner(id, userId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const field = await db.taskFieldValue.findFirst({
    where: { id: fieldId, taskId: id },
  });
  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

  const body = await request.json();
  const updated = await updateTaskField(fieldId, body);
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const task = await assertTaskOwner(id, userId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const field = await db.taskFieldValue.findFirst({
    where: { id: fieldId, taskId: id },
  });
  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

  await deleteTaskField(fieldId);
  return NextResponse.json({ ok: true });
}
