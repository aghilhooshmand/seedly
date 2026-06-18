import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, updateStage, deleteStage } from "@/lib/stages";

type Params = { params: Promise<{ id: string; stageId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, stageId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const stage = await updateStage(stageId, body);
  return NextResponse.json(stage);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, stageId } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteStage(stageId, id);
  return NextResponse.json({ ok: true });
}
