import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await db.seed.findFirst({
    where: {
      id,
      OR: [{ ownerId: userId }, { shares: { some: { sharedWithId: userId } } }],
    },
  });
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (seed.ownerId !== userId) {
    return NextResponse.json({ error: "Read-only access" }, { status: 403 });
  }

  const body = await request.json();
  const activity = await db.activity.create({
    data: {
      seedId: id,
      titleEn: body.titleEn ?? body.title,
      titleFa: body.titleFa,
      detail: body.detail ?? null,
      type: body.type ?? "GENERAL",
    },
  });
  return NextResponse.json(activity, { status: 201 });
}
