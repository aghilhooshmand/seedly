import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; taskId: string; fieldId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, taskId, fieldId } = await params;
  const userId = await getCurrentUserId();
  const theme = await db.theme.findFirst({
    where: { id, isSystem: false, ownerId: userId },
  });
  if (!theme) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const field = await db.themeTaskFieldDef.findFirst({
    where: { id: fieldId, taskDefId: taskId, taskDef: { stageDef: { themeId: id } } },
  });
  if (!field) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.themeTaskFieldDef.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
