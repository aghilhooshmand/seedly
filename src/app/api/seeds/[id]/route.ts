import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { getSeedDetail } from "@/lib/seeds";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await getSeedDetail(id, userId);

  if (!seed) {
    return NextResponse.json({ error: "Seed not found" }, { status: 404 });
  }

  return NextResponse.json(seed);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await db.seed.findFirst({ where: { id, ownerId: userId } });
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const updated = await db.seed.update({
    where: { id },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.status !== undefined && { status: body.status }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await db.seed.findFirst({ where: { id, ownerId: userId } });
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.seed.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
