import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/user";
import { saveSeedFile } from "@/lib/uploads";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string; fieldId: string }> };

export async function POST(request: Request, { params }: Params) {
  const { id, fieldId } = await params;
  const userId = await getCurrentUserId();
  const seed = await db.seed.findFirst({ where: { id, ownerId: userId } });
  if (!seed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const field = await db.seedFieldValue.findFirst({ where: { id: fieldId, seedId: id } });
  if (!field) return NextResponse.json({ error: "Field not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  try {
    const saved = await saveSeedFile(id, file);
    const updated = await db.seedFieldValue.update({
      where: { id: fieldId },
      data: { value: saved.value, fileName: saved.fileName, fieldType: "FILE" },
    });
    return NextResponse.json(updated);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Upload failed" },
      { status: 400 },
    );
  }
}
