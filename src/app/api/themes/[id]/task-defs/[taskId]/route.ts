import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; taskId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, taskId } = await params;
  const userId = await getCurrentUserId();
  const theme = await db.theme.findFirst({
    where: { id, isSystem: false, ownerId: userId },
  });
  if (!theme) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await db.themeTaskDef.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
