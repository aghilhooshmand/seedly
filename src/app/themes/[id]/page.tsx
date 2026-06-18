import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { getThemeDetail } from "@/lib/themes";
import { buildTaskTree } from "@/lib/task-tree";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { StructureTreeEditor } from "@/components/structure-tree-editor";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export default async function ThemeEditorPage({ params }: Params) {
  const { id } = await params;
  const t = await getTranslations();
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const theme = await getThemeDetail(id, userId);

  if (!theme) notFound();

  const readOnly = theme.isSystem;

  const stageDefs = await db.themeStageDef.findMany({
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

  const stages = stageDefs.map((s) => ({
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
        fieldValues: td.fieldDefs.map((f) => ({
          id: f.id,
          labelEn: f.labelEn,
          labelFa: f.labelFa,
          fieldType: f.fieldType,
          countsTowardProgress: f.countsTowardProgress,
        })),
      })),
    ),
  }));

  return (
    <AppShell
      title={theme.nameEn}
      subtitle={readOnly ? t("themes.systemReadOnly") : t("themes.editSubtitle")}
      users={users}
      currentUserId={userId}
    >
      <Link href="/themes" className="mb-6 inline-block text-sm text-emerald-700 hover:underline">
        ← {t("themes.back")}
      </Link>

      {readOnly ? (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">{t("themes.systemHint")}</p>
      ) : null}

      <StructureTreeEditor
        mode="theme"
        entityId={id}
        stages={stages}
        readOnly={readOnly}
      />
    </AppShell>
  );
}
