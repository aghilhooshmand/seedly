import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; fieldId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const seed = await db.seed.findFirst({ where: { id, ownerId: userId } });
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const field = await db.seedFieldValue.update({
    where: { id: fieldId, seedId: id },
    data: {
      ...(body.value !== undefined && { value: body.value }),
      ...(body.fileName !== undefined && { fileName: body.fileName }),
    },
  });
  return NextResponse.json(field);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const seed = await db.seed.findFirst({ where: { id, ownerId: userId } });
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.seedFieldValue.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
