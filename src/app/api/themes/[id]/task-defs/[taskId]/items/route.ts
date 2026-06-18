import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { addThemeTaskFieldDef, createThemeSubtaskDef } from "@/lib/tasks";
import { db } from "@/lib/db";
import type { FieldType, Priority } from "@prisma/client";

type Params = { params: Promise<{ id: string; taskId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, taskId } = await params;
  const userId = await getCurrentUserId();
  const theme = await db.theme.findFirst({
    where: { id, isSystem: false, ownerId: userId },
  });
  if (!theme) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const taskDef = await db.themeTaskDef.findFirst({
    where: { id: taskId, stageDef: { themeId: id } },
  });
  if (!taskDef) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  if (body.kind === "field") {
    if (!body.labelEn) {
      return NextResponse.json({ error: "labelEn required" }, { status: 400 });
    }
    const field = await addThemeTaskFieldDef(taskId, {
      labelEn: body.labelEn,
      labelFa: body.labelFa,
      fieldType: (body.fieldType ?? "TEXT") as FieldType,
      countsTowardProgress: body.countsTowardProgress,
    });
    return NextResponse.json(field, { status: 201 });
  }

  if (!body.titleEn) {
    return NextResponse.json({ error: "titleEn required" }, { status: 400 });
  }

  const subtask = await createThemeSubtaskDef(taskId, {
    titleEn: body.titleEn,
    titleFa: body.titleFa,
    priority: body.priority as Priority,
  });
  return NextResponse.json(subtask, { status: 201 });
}
