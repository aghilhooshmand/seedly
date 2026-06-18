import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { addCustomField } from "@/lib/seeds";
import { saveSeedFile } from "@/lib/uploads";
import { db } from "@/lib/db";
import type { FieldType } from "@prisma/client";

type Params = { params: Promise<{ id: string }> };

async function assertOwner(seedId: string, userId: string) {
  return db.seed.findFirst({ where: { id: seedId, ownerId: userId } });
}

export async function POST(request: Request, { params }: Params) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const seed = await assertOwner(id, userId);
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const labelEn = String(form.get("labelEn") ?? "");
    const labelFa = String(form.get("labelFa") ?? labelEn);
    const fieldType = String(form.get("fieldType") ?? "FILE") as FieldType;
    const file = form.get("file");

    if (!labelEn) {
      return NextResponse.json({ error: "labelEn is required" }, { status: 400 });
    }
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    try {
      const saved = await saveSeedFile(id, file);
      const field = await addCustomField(id, {
        labelEn,
        labelFa,
        fieldType: fieldType === "FILE" ? fieldType : "FILE",
        value: saved.value,
        fileName: saved.fileName,
      });
      return NextResponse.json(field, { status: 201 });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Upload failed" },
        { status: 400 },
      );
    }
  }

  const body = await request.json();
  const field = await addCustomField(id, {
    labelEn: body.labelEn,
    labelFa: body.labelFa,
    fieldType: body.fieldType as FieldType,
    value: body.value,
    fileName: body.fileName,
  });
  return NextResponse.json(field, { status: 201 });
}
