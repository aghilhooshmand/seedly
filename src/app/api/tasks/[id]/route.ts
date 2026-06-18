import { NextResponse } from "next/server";
import { addTask, toggleTask } from "@/lib/seeds";
import { deleteTask } from "@/lib/stages";
import { getCurrentUserId } from "@/lib/user";
import { db } from "@/lib/db";
import type { Priority } from "@prisma/client";

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  const body = await request.json();
  const { stageId, titleEn, titleFa, deadline, priority } = body;

  if (!stageId || !titleEn) {
    return NextResponse.json({ error: "stageId and titleEn required" }, { status: 400 });
  }

  const stage = await db.stage.findFirst({
    where: { id: stageId, seed: { ownerId: userId } },
  });
  if (!stage) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const task = await addTask(stageId, { titleEn, titleFa, deadline, priority: priority as Priority });
  return NextResponse.json(task, { status: 201 });
}

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const task = await db.task.findFirst({
    where: { id, stage: { seed: { ownerId: userId } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  if (body.completed !== undefined) {
    const updated = await toggleTask(id, body.completed);
    return NextResponse.json(updated);
  }

  const updated = await db.task.update({
    where: { id },
    data: {
      ...(body.titleEn !== undefined && { titleEn: body.titleEn }),
      ...(body.deadline !== undefined && {
        deadline: body.deadline ? new Date(body.deadline) : null,
      }),
      ...(body.priority !== undefined && { priority: body.priority }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const task = await db.task.findFirst({
    where: { id, stage: { seed: { ownerId: userId } } },
  });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await deleteTask(id);
  return NextResponse.json({ ok: true });
}
