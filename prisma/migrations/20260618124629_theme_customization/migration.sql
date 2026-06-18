-- CreateTable
CREATE TABLE "ThemeStageFieldDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stageDefId" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "labelFa" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT',
    "options" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ThemeStageFieldDef_stageDefId_fkey" FOREIGN KEY ("stageDefId") REFERENCES "ThemeStageDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Theme" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionFa" TEXT,
    "icon" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Theme_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Theme" ("color", "createdAt", "descriptionEn", "descriptionFa", "icon", "id", "isSystem", "nameEn", "nameFa", "slug") SELECT "color", "createdAt", "descriptionEn", "descriptionFa", "icon", "id", "isSystem", "nameEn", "nameFa", "slug" FROM "Theme";
DROP TABLE "Theme";
ALTER TABLE "new_Theme" RENAME TO "Theme";
CREATE UNIQUE INDEX "Theme_slug_key" ON "Theme"("slug");
CREATE TABLE "new_ThemeStageDef" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "themeId" TEXT NOT NULL,
    "parentId" TEXT,
    "nameEn" TEXT NOT NULL,
    "nameFa" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionFa" TEXT,
    "order" INTEGER NOT NULL,
    CONSTRAINT "ThemeStageDef_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ThemeStageDef_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ThemeStageDef" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ThemeStageDef" ("descriptionEn", "descriptionFa", "id", "nameEn", "nameFa", "order", "themeId") SELECT "descriptionEn", "descriptionFa", "id", "nameEn", "nameFa", "order", "themeId" FROM "ThemeStageDef";
DROP TABLE "ThemeStageDef";
ALTER TABLE "new_ThemeStageDef" RENAME TO "ThemeStageDef";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
