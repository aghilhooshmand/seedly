-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_StageFieldValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "value" TEXT,
    "fileName" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StageFieldValue_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_StageFieldValue" ("fieldType", "fileName", "id", "labelEn", "labelFa", "order", "stageId", "value") SELECT "fieldType", "fileName", "id", "labelEn", "labelFa", "order", "stageId", "value" FROM "StageFieldValue";
DROP TABLE "StageFieldValue";
ALTER TABLE "new_StageFieldValue" RENAME TO "StageFieldValue";
CREATE TABLE "new_TaskFieldValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "value" TEXT,
    "fileName" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TaskFieldValue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskFieldValue" ("fieldType", "fileName", "id", "labelEn", "labelFa", "order", "taskId", "value") SELECT "fieldType", "fileName", "id", "labelEn", "labelFa", "order", "taskId", "value" FROM "TaskFieldValue";
DROP TABLE "TaskFieldValue";
ALTER TABLE "new_TaskFieldValue" RENAME TO "TaskFieldValue";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
