-- CreateTable
CREATE TABLE "ThemeTaskFieldDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskDefId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ThemeTaskFieldDef_taskDefId_fkey" FOREIGN KEY ("taskDefId") REFERENCES "ThemeTaskDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskFieldValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "value" TEXT,
    "fileName" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "TaskFieldValue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageId" TEXT NOT NULL,
    "parentId" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleFa" TEXT NOT NULL,
    "description" TEXT,
    "deadline" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completed", "completedAt", "createdAt", "deadline", "description", "id", "order", "priority", "stageId", "titleEn", "titleFa") SELECT "completed", "completedAt", "createdAt", "deadline", "description", "id", "order", "priority", "stageId", "titleEn", "titleFa" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
CREATE TABLE "new_ThemeTaskDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageDefId" TEXT NOT NULL,
    "parentId" TEXT,
    "titleEn" TEXT NOT NULL,
    "titleFa" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "defaultPriority" TEXT NOT NULL DEFAULT 'MEDIUM',
    CONSTRAINT "ThemeTaskDef_stageDefId_fkey" FOREIGN KEY ("stageDefId") REFERENCES "ThemeStageDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThemeTaskDef_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ThemeTaskDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ThemeTaskDef" ("defaultPriority", "id", "order", "stageDefId", "titleEn", "titleFa") SELECT "defaultPriority", "id", "order", "stageDefId", "titleEn", "titleFa" FROM "ThemeTaskDef";
DROP TABLE "ThemeTaskDef";
ALTER TABLE "new_ThemeTaskDef" RENAME TO "ThemeTaskDef";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
