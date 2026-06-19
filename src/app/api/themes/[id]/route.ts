import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { deleteTheme, getThemeDetail } from "@/lib/themes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const theme = await getThemeDetail(id, userId);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(theme);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const result = await deleteTheme(id, userId);
  if (result.error === "forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (result.error === "has_seeds") {
    return NextResponse.json({ error: "Theme has seeds" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
