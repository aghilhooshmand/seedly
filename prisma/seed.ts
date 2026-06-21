import {
  PrismaClient,
  SeedStatus,
  StageStatus,
  NotificationType,
  ActivityType,
} from "@prisma/client";
import { syncSeedTaskFieldsFromTheme, backfillFieldCompletion } from "../src/lib/migrate-stage-fields";
import { refreshSeedProgress } from "../src/lib/seeds";
import { SYSTEM_GARDENS } from "./garden-templates";
import { syncSystemGarden } from "./ensure-garden";

const prisma = new PrismaClient();

async function plantSeedFromTheme(
  ownerId: string,
  themeId: string,
  title: string,
  fieldData: Record<string, string>,
  taskOverrides?: { stageOrder: number; taskIndex: number; completed: boolean; deadline?: Date }[],
) {
  const theme = await prisma.theme.findUniqueOrThrow({
    where: { id: themeId },
    include: {
      fieldDefs: { orderBy: { order: "asc" } },
      stageDefs: {
        orderBy: { order: "asc" },
        include: {
          taskDefs: {
            orderBy: { order: "asc" },
            include: { fieldDefs: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });

  async function createTasks(
    stageId: string,
    taskDefs: typeof theme.stageDefs[number]["taskDefs"],
    parentDefId: string | null,
    parentTaskId: string | null,
  ) {
    const defs = taskDefs
      .filter((d) => (d.parentId ?? null) === parentDefId)
      .sort((a, b) => a.order - b.order);

    for (const td of defs) {
      const task = await prisma.task.create({
        data: {
          stageId,
          parentId: parentTaskId,
          titleEn: td.titleEn,
          titleFa: td.titleFa,
          order: td.order,
          priority: td.defaultPriority,
          recurrence: td.recurrence,
          fieldValues: {
            create: td.fieldDefs.map((fd) => ({
              labelEn: fd.labelEn,
              labelFa: fd.labelFa,
              fieldType: fd.fieldType,
              countsTowardProgress: fd.countsTowardProgress,
              order: fd.order,
            })),
          },
        },
      });
      await createTasks(stageId, taskDefs, td.id, task.id);
    }
  }

  const seed = await prisma.seed.create({
    data: {
      title,
      ownerId,
      themeId,
      status: SeedStatus.ACTIVE,
      fieldValues: {
        create: theme.fieldDefs.map((fd) => ({
          fieldDefId: fd.id,
          value: fieldData[fd.key] ?? null,
          order: fd.order,
        })),
      },
      stages: {
        create: theme.stageDefs.map((sd, si) => ({
          nameEn: sd.nameEn,
          nameFa: sd.nameFa,
          descriptionEn: sd.descriptionEn,
          descriptionFa: sd.descriptionFa,
          order: sd.order,
          status:
            si === 0 ? StageStatus.COMPLETED : si === 1 ? StageStatus.IN_PROGRESS : StageStatus.PENDING,
        })),
      },
    },
  });

  const createdStages = await prisma.stage.findMany({
    where: { seedId: seed.id },
    orderBy: { order: "asc" },
  });

  for (let si = 0; si < theme.stageDefs.length; si++) {
    const sd = theme.stageDefs[si];
    const stageId = createdStages[si].id;
    await createTasks(stageId, sd.taskDefs, null, null);

    const stageTasks = await prisma.task.findMany({ where: { stageId } });
    for (const override of taskOverrides?.filter((o) => o.stageOrder === si) ?? []) {
      const task = stageTasks[override.taskIndex];
      if (!task) continue;
      if (override.completed) {
        const fields = await prisma.taskFieldValue.findMany({ where: { taskId: task.id } });
        for (const field of fields) {
          await prisma.taskFieldValue.update({
            where: { id: field.id },
            data: { completed: true },
          });
        }
      }
      if (override.deadline) {
        await prisma.task.update({
          where: { id: task.id },
          data: { deadline: override.deadline },
        });
      }
    }
  }

  await refreshSeedProgress(seed.id);
  return seed;
}

async function main() {
  const userA = await prisma.user.upsert({
    where: { email: "partner@seedly.local" },
    update: {},
    create: { name: "Partner", email: "partner@seedly.local", locale: "fa" },
  });
  const userB = await prisma.user.upsert({
    where: { email: "you@seedly.local" },
    update: {},
    create: { name: "You", email: "you@seedly.local", locale: "en" },
  });

  for (const garden of SYSTEM_GARDENS) {
    await syncSystemGarden(prisma, garden);
  }

  await syncSeedTaskFieldsFromTheme();
  await backfillFieldCompletion();

  const jobTheme = await prisma.theme.findUniqueOrThrow({ where: { slug: "job-application" } });

  const existing = await prisma.seed.findFirst({
    where: { title: "Senior Engineer — Acme Corp" },
  });
  if (existing) {
    console.log(`Synced ${SYSTEM_GARDENS.length} system gardens. Sample seed exists.`);
    return;
  }

  const seed = await plantSeedFromTheme(userA.id, jobTheme.id, "Senior Engineer — Acme Corp", {
    company: "Acme Corp",
    role: "Senior Software Engineer",
    job_url: "https://example.com/jobs/senior-engineer",
    salary: "€70k–€85k",
    location: "Remote (EU)",
    applied_date: new Date().toISOString().slice(0, 10),
    contact: "Sara — former colleague",
    notes: "Stack: TypeScript, React, Node. Referred by former colleague.",
  }, [
    { stageOrder: 0, taskIndex: 0, completed: true },
    { stageOrder: 0, taskIndex: 1, completed: true },
    { stageOrder: 1, taskIndex: 0, completed: true },
    { stageOrder: 1, taskIndex: 1, completed: true },
    { stageOrder: 1, taskIndex: 2, completed: false, deadline: new Date(Date.now() + 2 * 86400000) },
    { stageOrder: 2, taskIndex: 0, completed: false, deadline: new Date(Date.now() + 5 * 86400000) },
  ]);

  await prisma.activity.createMany({
    data: [
      {
        seedId: seed.id,
        titleEn: "Tailored CV for Acme role",
        titleFa: "شخصی‌سازی رزومه برای آکمه",
        type: ActivityType.MILESTONE,
        createdAt: new Date(Date.now() - 5 * 86400000),
      },
      {
        seedId: seed.id,
        titleEn: "Phone screen scheduled",
        titleFa: "مصاحبه تلفنی برنامه‌ریزی شد",
        detail: "Next Tuesday 10:00",
        type: ActivityType.GENERAL,
        createdAt: new Date(Date.now() - 1 * 86400000),
      },
    ],
  });

  await prisma.seedShare.create({
    data: { seedId: seed.id, sharedWithId: userB.id },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: userA.id,
        seedId: seed.id,
        titleEn: "Task due soon",
        titleFa: "کار نزدیک به موعد",
        messageEn: "Portfolio prep is due in 2 days",
        messageFa: "آماده‌سازی نمونه‌کار تا ۲ روز دیگر",
        type: NotificationType.TASK_DUE,
      },
    ],
  });

  console.log(`Seeded ${SYSTEM_GARDENS.length} gardens + sample: ${seed.title}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
