import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, updateStageField, deleteStageField } from "@/lib/stages";
import { saveStageFile } from "@/lib/uploads";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; stageId: string; fieldId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const field = await updateStageField(fieldId, body);
  return NextResponse.json(field);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteStageField(fieldId);
  return NextResponse.json({ ok: true });
}
