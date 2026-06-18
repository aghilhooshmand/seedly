import { getThemesForUser } from "@/lib/themes";
import { getCurrentUserId, getAllUsers } from "@/lib/user";
import { NewSeedForm } from "./new-seed-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ theme?: string }> };

export default async function NewSeedPage({ searchParams }: Props) {
  const { theme: defaultThemeId } = await searchParams;
  const userId = await getCurrentUserId();
  const users = await getAllUsers();
  const themes = await getThemesForUser(userId);

  return (
    <NewSeedForm
      themes={themes}
      users={users}
      currentUserId={userId}
      defaultThemeId={defaultThemeId}
    />
  );
}
