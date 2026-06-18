import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, reorderStages } from "@/lib/stages";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { orderedIds, parentId } = body;
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds required" }, { status: 400 });
  }

  await reorderStages(id, orderedIds, parentId ?? null);
  return NextResponse.json({ ok: true });
}
