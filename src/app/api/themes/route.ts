import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { getThemesForUser } from "@/lib/themes";

export async function GET() {
  const userId = await getCurrentUserId();
  const themes = await getThemesForUser(userId);
  return NextResponse.json(themes);
}
