import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { assertSeedOwner, createStage, getStagesForSeed } from "@/lib/stages";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const stages = await getStagesForSeed(id);
  return NextResponse.json(stages);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertSeedOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  if (!body.nameEn) {
    return NextResponse.json({ error: "nameEn is required" }, { status: 400 });
  }

  const stage = await createStage(id, {
    nameEn: body.nameEn,
    nameFa: body.nameFa,
    descriptionEn: body.descriptionEn,
    descriptionFa: body.descriptionFa,
    parentId: body.parentId ?? null,
  });
  return NextResponse.json(stage, { status: 201 });
}
