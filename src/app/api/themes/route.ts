import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { getThemesForUser, createTheme, cloneTheme } from "@/lib/themes";

export async function GET() {
  const userId = await getCurrentUserId();
  const themes = await getThemesForUser(userId);
  return NextResponse.json(themes);
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (!body.nameEn?.trim()) {
    return NextResponse.json({ error: "nameEn required" }, { status: 400 });
  }

  const nameEn = body.nameEn.trim();

  if (body.sourceThemeId) {
    const theme = await cloneTheme(body.sourceThemeId, userId, nameEn);
    if (!theme) return NextResponse.json({ error: "Template not found" }, { status: 404 });
    return NextResponse.json(theme, { status: 201 });
  }

  const theme = await createTheme(userId, {
    nameEn,
    nameFa: body.nameFa,
    color: body.color,
    descriptionEn: body.descriptionEn,
  });
  return NextResponse.json(theme, { status: 201 });
}
