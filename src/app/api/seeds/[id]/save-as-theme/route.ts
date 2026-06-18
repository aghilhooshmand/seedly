import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { saveSeedAsTheme } from "@/lib/themes";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (!body.nameEn) {
    return NextResponse.json({ error: "nameEn required" }, { status: 400 });
  }

  const theme = await saveSeedAsTheme(id, userId, {
    nameEn: body.nameEn,
    nameFa: body.nameFa,
    slug: body.slug,
  });

  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(theme, { status: 201 });
}
