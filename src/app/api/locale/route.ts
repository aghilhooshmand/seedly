import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { locales } from "@/i18n/config";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.locale || !locales.includes(body.locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }
  const cookieStore = await cookies();
  cookieStore.set("seedly_locale", body.locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  return NextResponse.json({ ok: true });
}
