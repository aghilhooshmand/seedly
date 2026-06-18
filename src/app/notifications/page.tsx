import { getTranslations, getLocale } from "next-intl/server";
import Link from "next/link";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { label, type Locale } from "@/lib/labels";
import { NotificationsList } from "./notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const t = await getTranslations();
  const locale = (await getLocale()) as Locale;
  const userId = await getCurrentUserId();
  const users = await getAllUsers();

  const notifications = await db.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { seed: { select: { id: true, title: true } } },
  });

  return (
    <AppShell
      title={t("nav.notifications")}
      users={users}
      currentUserId={userId}
    >
      <NotificationsList
        notifications={notifications.map((n) => ({
          id: n.id,
          title: label(locale, n.titleEn, n.titleFa),
          message: label(locale, n.messageEn, n.messageFa ?? n.messageEn),
          read: n.read,
          seedId: n.seedId,
          seedTitle: n.seed?.title,
        }))}
      />
    </AppShell>
  );
}
