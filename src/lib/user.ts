import { cookies } from "next/headers";
import { db } from "@/lib/db";

const USER_COOKIE = "seedly_user_id";

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(USER_COOKIE)?.value;

  if (fromCookie) {
    const exists = await db.user.findUnique({ where: { id: fromCookie }, select: { id: true } });
    if (exists) return fromCookie;
  }

  const first = await db.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!first) throw new Error("No users in database. Run npm run db:seed");
  return first.id;
}

export async function getCurrentUser() {
  const id = await getCurrentUserId();
  return db.user.findUniqueOrThrow({ where: { id } });
}

export async function getAllUsers() {
  return db.user.findMany({ orderBy: { name: "asc" } });
}
