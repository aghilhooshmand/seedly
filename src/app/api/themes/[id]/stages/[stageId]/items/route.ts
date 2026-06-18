import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { addThemeStageField, addThemeTaskDef } from "@/lib/themes";
import { db } from "@/lib/db";
import type { FieldType, Priority } from "@prisma/client";

type Params = { params: Promise<{ id: string; stageId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, stageId } = await params;
  const userId = await getCurrentUserId();
  const theme = await db.theme.findFirst({
    where: { id, isSystem: false, ownerId: userId },
  });
  if (!theme) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();

  if (body.kind === "field") {
    if (!body.labelEn) {
      return NextResponse.json({ error: "labelEn required" }, { status: 400 });
    }
    const field = await addThemeStageField(stageId, {
      labelEn: body.labelEn,
      labelFa: body.labelFa,
      fieldType: (body.fieldType ?? "TEXT") as FieldType,
    });
    return NextResponse.json(field, { status: 201 });
  }

  const task = await addThemeTaskDef(stageId, {
    titleEn: body.titleEn,
    titleFa: body.titleFa,
    priority: body.priority as Priority,
  });
  return NextResponse.json(task, { status: 201 });
}
