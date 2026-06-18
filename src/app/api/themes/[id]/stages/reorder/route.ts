import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { reorderThemeStages } from "@/lib/themes";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const theme = await db.theme.findFirst({
    where: { id, isSystem: false, ownerId: userId },
  });
  if (!theme) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  await reorderThemeStages(id, body.orderedIds, body.parentId ?? null);
  return NextResponse.json({ ok: true });
}
