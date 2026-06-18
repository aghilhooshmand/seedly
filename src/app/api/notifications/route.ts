import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { db } from "@/lib/db";

export async function GET() {
  const userId = await getCurrentUserId();
  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { seed: { select: { id: true, title: true } } },
  });
  const unread = notifications.filter((n) => !n.read).length;
  return NextResponse.json({ notifications, unread });
}

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();

  if (body.markAllRead) {
    await db.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (body.id) {
    await db.notification.updateMany({
      where: { id: body.id, userId },
      data: { read: true },
    });
  }
  return NextResponse.json({ ok: true });
}
