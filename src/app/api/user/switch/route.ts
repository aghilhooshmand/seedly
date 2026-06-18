import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const USER_COOKIE = "seedly_user_id";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, body.userId, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true });
}
