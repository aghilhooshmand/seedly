import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export async function saveTaskFile(seedId: string, taskId: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("File too large (max 10 MB)");
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("File type not allowed");
  }

  const dir = path.join(UPLOAD_ROOT, seedId, "tasks", taskId);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const absolutePath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    value: `/uploads/${seedId}/tasks/${taskId}/${storedName}`,
    fileName: file.name,
  };
}

export async function saveStageFile(seedId: string, stageId: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("File too large (max 10 MB)");
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("File type not allowed");
  }

  const dir = path.join(UPLOAD_ROOT, seedId, "stages", stageId);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const absolutePath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    value: `/uploads/${seedId}/stages/${stageId}/${storedName}`,
    fileName: file.name,
  };
}

export async function saveSeedFile(seedId: string, file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("File too large (max 10 MB)");
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    throw new Error("File type not allowed");
  }

  const dir = path.join(UPLOAD_ROOT, seedId);
  await mkdir(dir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storedName = `${randomUUID()}-${safeName}`;
  const absolutePath = path.join(dir, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    value: `/uploads/${seedId}/${storedName}`,
    fileName: file.name,
  };
}
