import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { createThemeStageDef } from "@/lib/themes";
import { buildTaskTree } from "@/lib/task-tree";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

async function canEditTheme(themeId: string, userId: string) {
  return db.theme.findFirst({
    where: { id: themeId, isSystem: false, ownerId: userId },
  });
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const stages = await db.themeStageDef.findMany({
    where: { themeId: id },
    orderBy: { order: "asc" },
    include: {
      taskDefs: {
        orderBy: { order: "asc" },
        include: { fieldDefs: { orderBy: { order: "asc" } } },
      },
      fieldDefs: { orderBy: { order: "asc" } },
    },
  });

  const mapped = stages.map((s) => ({
    id: s.id,
    parentId: s.parentId,
    nameEn: s.nameEn,
    nameFa: s.nameFa,
    order: s.order,
    fieldValues: s.fieldDefs.map((f) => ({
      id: f.id,
      labelEn: f.labelEn,
      labelFa: f.labelFa,
      fieldType: f.fieldType,
    })),
    tasks: buildTaskTree(
      s.taskDefs.map((td) => ({
        id: td.id,
        parentId: td.parentId,
        order: td.order,
        titleEn: td.titleEn,
        titleFa: td.titleFa,
        fieldValues: td.fieldDefs.map((fd) => ({
          id: fd.id,
          labelEn: fd.labelEn,
          labelFa: fd.labelFa,
          fieldType: fd.fieldType,
        })),
      })),
    ),
  }));

  return NextResponse.json(mapped);
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const theme = await canEditTheme(id, userId);
  if (!theme) return NextResponse.json({ error: "Cannot edit system theme" }, { status: 403 });

  const body = await request.json();
  if (!body.nameEn) return NextResponse.json({ error: "nameEn required" }, { status: 400 });

  const stage = await createThemeStageDef(id, {
    nameEn: body.nameEn,
    nameFa: body.nameFa,
    parentId: body.parentId ?? null,
  });
  return NextResponse.json(stage, { status: 201 });
}
