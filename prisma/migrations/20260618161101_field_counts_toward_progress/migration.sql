-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskFieldValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "value" TEXT,
    "fileName" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "countsTowardProgress" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TaskFieldValue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskFieldValue" ("completed", "fieldType", "fileName", "id", "labelEn", "labelFa", "order", "taskId", "value") SELECT "completed", "fieldType", "fileName", "id", "labelEn", "labelFa", "order", "taskId", "value" FROM "TaskFieldValue";
DROP TABLE "TaskFieldValue";
ALTER TABLE "new_TaskFieldValue" RENAME TO "TaskFieldValue";
CREATE TABLE "new_ThemeTaskFieldDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskDefId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "countsTowardProgress" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ThemeTaskFieldDef_taskDefId_fkey" FOREIGN KEY ("taskDefId") REFERENCES "ThemeTaskDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ThemeTaskFieldDef" ("fieldType", "id", "labelEn", "labelFa", "options", "order", "taskDefId") SELECT "fieldType", "id", "labelEn", "labelFa", "options", "order", "taskDefId" FROM "ThemeTaskFieldDef";
DROP TABLE "ThemeTaskFieldDef";
ALTER TABLE "new_ThemeTaskFieldDef" RENAME TO "ThemeTaskFieldDef";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
