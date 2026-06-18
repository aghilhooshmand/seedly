import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { getThemeDetail } from "@/lib/themes";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const theme = await getThemeDetail(id, userId);
  if (!theme) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(theme);
}
