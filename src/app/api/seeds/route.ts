import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { getSeedsForUser, plantSeed } from "@/lib/seeds";

export async function GET() {
  const userId = await getCurrentUserId();
  const { owned, shared } = await getSeedsForUser(userId);
  return NextResponse.json({ owned, shared });
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const { title, themeId, fieldData } = body;

  if (!title || !themeId) {
    return NextResponse.json({ error: "title and themeId are required" }, { status: 400 });
  }

  const seed = await plantSeed({ ownerId: userId, themeId, title, fieldData });
  return NextResponse.json(seed, { status: 201 });
}
