import { db } from "@/lib/db";
import { getThemesForUser } from "@/lib/themes";
import type { SeedStatus } from "@prisma/client";

const DASHBOARD_STATUSES: SeedStatus[] = ["PLANNED", "ACTIVE", "PAUSED", "COMPLETED"];

const STATUS_SORT: Record<SeedStatus, number> = {
  ACTIVE: 0,
  PLANNED: 1,
  PAUSED: 2,
  COMPLETED: 3,
  ABANDONED: 4,
};

export async function getUniverseDashboard(userId: string) {
  const themes = await getThemesForUser(userId);

  const ownedSeeds = await db.seed.findMany({
    where: { ownerId: userId, status: { in: DASHBOARD_STATUSES } },
    orderBy: { updatedAt: "desc" },
    include: {
      theme: true,
      stages: { orderBy: { order: "asc" } },
    },
  });

  const sharedSeeds = await db.seed.findMany({
    where: {
      shares: { some: { sharedWithId: userId } },
      status: { in: DASHBOARD_STATUSES },
    },
    include: {
      theme: true,
      owner: { select: { name: true } },
      stages: { orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const ownedByGarden = new Map<string, typeof ownedSeeds>();
  for (const seed of ownedSeeds) {
    const list = ownedByGarden.get(seed.themeId) ?? [];
    list.push(seed);
    ownedByGarden.set(seed.themeId, list);
  }

  const sharedByGarden = new Map<string, typeof sharedSeeds>();
  for (const seed of sharedSeeds) {
    const list = sharedByGarden.get(seed.themeId) ?? [];
    list.push(seed);
    sharedByGarden.set(seed.themeId, list);
  }

  function sortSeeds<T extends { status: SeedStatus; updatedAt: Date }>(seeds: T[]) {
    return [...seeds].sort((a, b) => {
      const sd = STATUS_SORT[a.status] - STATUS_SORT[b.status];
      if (sd !== 0) return sd;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  const ownedGardens = themes
    .filter((th) => ownedByGarden.has(th.id) || (!th.isSystem && th.ownerId === userId))
    .map((th) => ({
      id: th.id,
      nameEn: th.nameEn,
      nameFa: th.nameFa,
      color: th.color,
      isSystem: th.isSystem,
      seeds: sortSeeds(ownedByGarden.get(th.id) ?? []),
    }))
    .sort((a, b) => {
      if (a.seeds.length !== b.seeds.length) return b.seeds.length - a.seeds.length;
      return a.nameEn.localeCompare(b.nameEn);
    });

  const sharedGardenIds = [...sharedByGarden.keys()];
  const sharedGardens = themes
    .filter((th) => sharedGardenIds.includes(th.id))
    .map((th) => ({
      id: th.id,
      nameEn: th.nameEn,
      nameFa: th.nameFa,
      color: th.color,
      isSystem: th.isSystem,
      seeds: sortSeeds(sharedByGarden.get(th.id) ?? []),
      ownerName: sharedByGarden.get(th.id)?.[0]?.owner.name,
    }))
    .sort((a, b) => b.seeds.length - a.seeds.length);

  const totalSeeds = ownedSeeds.length;
  const growing = ownedSeeds.filter((s) => s.status === "ACTIVE").length;
  const completed = ownedSeeds.filter((s) => s.status === "COMPLETED").length;

  return { ownedGardens, sharedGardens, totalSeeds, growing, completed };
}
