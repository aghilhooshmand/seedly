import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { getThemesForUser } from "@/lib/themes";
import { AppShell } from "@/components/app-shell";
import { ThemesList } from "./themes-list";

export const dynamic = "force-dynamic";

export default async function ThemesPage() {
  const t = await getTranslations();
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const themes = await getThemesForUser(userId);

  return (
    <AppShell
      title={t("themes.title")}
      subtitle={t("themes.subtitle")}
      users={users}
      currentUserId={userId}
    >
      <ThemesList themes={themes.map((th) => ({
        id: th.id,
        nameEn: th.nameEn,
        nameFa: th.nameFa,
        isSystem: th.isSystem,
        color: th.color,
        seedCount: th._count.seeds,
        fieldCount: th.fieldDefs.length,
      }))} />
    </AppShell>
  );
}
