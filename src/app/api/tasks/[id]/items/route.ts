import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertTaskOwner, addTaskField, createSubtask } from "@/lib/tasks";
import type { FieldType, Priority } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const task = await assertTaskOwner(id, userId);
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  if (body.kind === "field") {
    if (!body.labelEn) {
      return NextResponse.json({ error: "labelEn required" }, { status: 400 });
    }
    const field = await addTaskField(id, {
      labelEn: body.labelEn,
      labelFa: body.labelFa,
      fieldType: (body.fieldType ?? "TEXT") as FieldType,
      value: body.value,
      countsTowardProgress: body.countsTowardProgress,
    });
    return NextResponse.json(field, { status: 201 });
  }

  if (!body.titleEn) {
    return NextResponse.json({ error: "titleEn required" }, { status: 400 });
  }

  const subtask = await createSubtask(id, {
    titleEn: body.titleEn,
    titleFa: body.titleFa,
    priority: body.priority as Priority,
  });
  return NextResponse.json(subtask, { status: 201 });
}
