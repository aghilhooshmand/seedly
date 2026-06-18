import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { cloneTheme } from "@/lib/themes";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  if (!body.sourceThemeId || !body.nameEn) {
    return NextResponse.json({ error: "sourceThemeId and nameEn required" }, { status: 400 });
  }
  const theme = await cloneTheme(body.sourceThemeId, userId, body.nameEn);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(theme, { status: 201 });
}
