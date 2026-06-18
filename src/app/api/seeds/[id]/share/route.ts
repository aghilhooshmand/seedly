import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { shareSeed } from "@/lib/seeds";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (!body.email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const share = await shareSeed(id, body.email, userId);
  if (!share) {
    return NextResponse.json({ error: "Could not share with that user" }, { status: 400 });
  }
  return NextResponse.json(share, { status: 201 });
}
