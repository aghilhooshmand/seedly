-- CreateTable
CREATE TABLE "StageFieldValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "value" TEXT,
    "fileName" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "StageFieldValue_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "seedId" TEXT NOT NULL,
    "parentId" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionFa" TEXT,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Stage_seedId_fkey" FOREIGN KEY ("seedId") REFERENCES "Seed" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Stage_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Stage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Stage" ("createdAt", "descriptionEn", "descriptionFa", "id", "nameEn", "nameFa", "order", "seedId", "status", "updatedAt") SELECT "createdAt", "descriptionEn", "descriptionFa", "id", "nameEn", "nameFa", "order", "seedId", "status", "updatedAt" FROM "Stage";
DROP TABLE "Stage";
ALTER TABLE "new_Stage" RENAME TO "Stage";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
