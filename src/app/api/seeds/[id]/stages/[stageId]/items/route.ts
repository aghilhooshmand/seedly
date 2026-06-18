import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, addStageField, createTaskForStage } from "@/lib/stages";
import type { FieldType, Priority } from "@prisma/client";

type Params = { params: Promise<{ id: string; stageId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, stageId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();

  if (body.kind === "field") {
    if (!body.labelEn) {
      return NextResponse.json({ error: "labelEn required" }, { status: 400 });
    }
    const field = await addStageField(stageId, {
      labelEn: body.labelEn,
      labelFa: body.labelFa,
      fieldType: (body.fieldType ?? "TEXT") as FieldType,
      value: body.value,
    });
    return NextResponse.json(field, { status: 201 });
  }

  if (!body.titleEn) {
    return NextResponse.json({ error: "titleEn required" }, { status: 400 });
  }
  const task = await createTaskForStage(stageId, {
    titleEn: body.titleEn,
    titleFa: body.titleFa,
    deadline: body.deadline,
    priority: body.priority as Priority,
  });
  return NextResponse.json(task, { status: 201 });
}
