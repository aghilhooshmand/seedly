import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { deleteThemeStageDef, reorderThemeStages } from "@/lib/themes";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; stageId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const { id, stageId } = await params;
  const userId = await getCurrentUserId();
  const theme = await db.theme.findFirst({
    where: { id, isSystem: false, ownerId: userId },
  });
  if (!theme) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await deleteThemeStageDef(stageId);
  return NextResponse.json({ ok: true });
}
