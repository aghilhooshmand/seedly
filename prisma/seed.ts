import {
  PrismaClient,
  FieldType,
  Priority,
  SeedStatus,
  StageStatus,
  NotificationType,
  ActivityType,
} from "@prisma/client";
import { syncSeedTaskFieldsFromTheme, backfillFieldCompletion } from "../src/lib/migrate-stage-fields";
import { refreshSeedProgress } from "../src/lib/seeds";

const prisma = new PrismaClient();

const JOB_THEME = {
  slug: "job-application",
  nameEn: "Job Application",
  nameFa: "درخواست شغل",
  descriptionEn: "One seed = one job at one company",
  descriptionFa: "یک بذر = یک شغل در یک شرکت",
  icon: "briefcase",
  color: "#2d6a4f",
  fields: [
    { key: "company", labelEn: "Company", labelFa: "شرکت", fieldType: FieldType.TEXT, required: true, order: 0 },
    { key: "role", labelEn: "Role / Title", labelFa: "سمت", fieldType: FieldType.TEXT, required: true, order: 1 },
    { key: "job_url", labelEn: "Job posting link", labelFa: "لینک آگهی", fieldType: FieldType.URL, order: 2 },
    { key: "salary", labelEn: "Salary range", labelFa: "حقوق", fieldType: FieldType.TEXT, order: 3 },
    { key: "location", labelEn: "Location", labelFa: "مکان", fieldType: FieldType.TEXT, order: 4 },
    { key: "applied_date", labelEn: "Applied date", labelFa: "تاریخ درخواست", fieldType: FieldType.DATE, order: 5 },
    { key: "notes", labelEn: "Notes about the role", labelFa: "یادداشت", fieldType: FieldType.TEXTAREA, order: 6 },
  ],
  stages: [
    {
      nameEn: "Research",
      nameFa: "تحقیق",
      descriptionEn: "Learn about the company and role",
      descriptionFa: "آشنایی با شرکت و موقعیت",
      order: 0,
      tasks: [
        { titleEn: "Read job description carefully", titleFa: "خواندن دقیق شرح شغل", priority: Priority.MEDIUM },
        { titleEn: "Research company culture", titleFa: "تحقیق درباره فرهنگ شرکت", priority: Priority.LOW },
      ],
    },
    {
      nameEn: "Prepare",
      nameFa: "آماده‌سازی",
      descriptionEn: "CV, cover letter, portfolio",
      descriptionFa: "رزومه، نامه انگیزشی، نمونه‌کار",
      order: 1,
      tasks: [
        { titleEn: "Tailor CV for this role", titleFa: "شخصی‌سازی رزومه", priority: Priority.HIGH, fields: [
          { labelEn: "CV file", labelFa: "فایل رزومه", fieldType: FieldType.FILE, order: 0 },
          { labelEn: "Reviewed", labelFa: "بازبینی شد", fieldType: FieldType.CHECKBOX, order: 1 },
        ]},
        { titleEn: "Write cover letter", titleFa: "نوشتن نامه انگیزشی", priority: Priority.HIGH, fields: [
          { labelEn: "Draft link", labelFa: "لینک پیش‌نویس", fieldType: FieldType.URL, order: 0 },
        ]},
        { titleEn: "Upload documents", titleFa: "آپلود مدارک", priority: Priority.MEDIUM, fields: [
          { labelEn: "Documents", labelFa: "مدارک", fieldType: FieldType.FILE, order: 0 },
        ]},
      ],
    },
    {
      nameEn: "Apply",
      nameFa: "درخواست",
      order: 2,
      tasks: [
        { titleEn: "Submit application", titleFa: "ارسال درخواست", priority: Priority.URGENT },
        { titleEn: "Connect with recruiter on LinkedIn", titleFa: "ارتباط با recruiter در لینکدین", priority: Priority.MEDIUM },
      ],
    },
    {
      nameEn: "Interview",
      nameFa: "مصاحبه",
      order: 3,
      tasks: [
        { titleEn: "Prepare for phone screen", titleFa: "آماده‌سازی مصاحبه تلفنی", priority: Priority.HIGH, fields: [
          { labelEn: "Interview date", labelFa: "تاریخ مصاحبه", fieldType: FieldType.DATE, order: 0 },
          { labelEn: "Notes", labelFa: "یادداشت", fieldType: FieldType.TEXTAREA, order: 1 },
        ]},
        { titleEn: "Prepare for technical round", titleFa: "آماده‌سازی مصاحبه فنی", priority: Priority.HIGH },
      ],
    },
    {
      nameEn: "Decision",
      nameFa: "تصمیم",
      order: 4,
      tasks: [
        { titleEn: "Evaluate offer", titleFa: "بررسی پیشنهاد", priority: Priority.HIGH },
        { titleEn: "Negotiate terms", titleFa: "مذاکره شرایط", priority: Priority.MEDIUM },
      ],
    },
  ],
};

const HEALTH_THEME = {
  slug: "healthy-lifestyle",
  nameEn: "Healthy Lifestyle",
  nameFa: "سبک زندگی سالم",
  icon: "heart",
  color: "#e76f51",
  fields: [
    { key: "focus", labelEn: "Focus area", labelFa: "حوزه تمرکز", fieldType: FieldType.SELECT, options: '["Nutrition","Sleep","Exercise","Mental health"]', order: 0 },
    { key: "start_date", labelEn: "Start date", labelFa: "تاریخ شروع", fieldType: FieldType.DATE, order: 1 },
    { key: "target", labelEn: "Target outcome", labelFa: "نتیجه هدف", fieldType: FieldType.TEXTAREA, order: 2 },
  ],
  stages: [
    {
      nameEn: "Plan",
      nameFa: "برنامه‌ریزی",
      order: 0,
      tasks: [
        { titleEn: "Define weekly routine", titleFa: "تعریف برنامه هفتگی", priority: Priority.HIGH },
      ],
    },
    {
      nameEn: "Build habit",
      nameFa: "ساخت عادت",
      order: 1,
      tasks: [
        { titleEn: "Track daily progress", titleFa: "پیگیری روزانه", priority: Priority.MEDIUM },
      ],
    },
  ],
};

async function ensureTheme(def: {
  slug: string;
  nameEn: string;
  nameFa: string;
  descriptionEn?: string;
  descriptionFa?: string;
  icon: string;
  color: string;
  fields: Array<{
    key: string;
    labelEn: string;
    labelFa: string;
    fieldType: FieldType;
    options?: string;
    required?: boolean;
    order: number;
  }>;
  stages: Array<{
    nameEn: string;
    nameFa: string;
    descriptionEn?: string;
    descriptionFa?: string;
    order: number;
    tasks: Array<{
      titleEn: string;
      titleFa: string;
      priority: Priority;
      fields?: Array<{ labelEn: string; labelFa: string; fieldType: FieldType; order: number }>;
    }>;
  }>;
}) {
  const existing = await prisma.theme.findUnique({
    where: { slug: def.slug },
    include: {
      stageDefs: {
        orderBy: { order: "asc" },
        include: {
          taskDefs: {
            orderBy: { order: "asc" },
            include: { fieldDefs: true },
          },
        },
      },
    },
  });

  if (!existing) {
    return prisma.theme.create({
      data: {
        slug: def.slug,
        nameEn: def.nameEn,
        nameFa: def.nameFa,
        descriptionEn: def.descriptionEn ?? null,
        descriptionFa: def.descriptionFa ?? null,
        icon: def.icon,
        color: def.color,
        fieldDefs: {
          create: def.fields.map((f) => ({
            key: f.key,
            labelEn: f.labelEn,
            labelFa: f.labelFa,
            fieldType: f.fieldType,
            options: f.options ?? null,
            required: f.required ?? false,
            order: f.order,
          })),
        },
        stageDefs: {
          create: def.stages.map((s) => ({
            nameEn: s.nameEn,
            nameFa: s.nameFa,
            descriptionEn: s.descriptionEn ?? null,
            descriptionFa: s.descriptionFa ?? null,
            order: s.order,
            taskDefs: {
              create: s.tasks.map((t, i) => ({
                titleEn: t.titleEn,
                titleFa: t.titleFa,
                order: i,
                defaultPriority: t.priority,
                fieldDefs: t.fields
                  ? {
                      create: t.fields.map((f) => ({
                        labelEn: f.labelEn,
                        labelFa: f.labelFa,
                        fieldType: f.fieldType,
                        order: f.order,
                      })),
                    }
                  : undefined,
              })),
            },
          })),
        },
      },
      include: { fieldDefs: true, stageDefs: { include: { taskDefs: true } } },
    });
  }

  if (!existing.isSystem) return existing;

  for (const stageTemplate of def.stages) {
    const stageDef = existing.stageDefs.find((s) => s.order === stageTemplate.order);
    if (!stageDef) continue;

    for (const [i, taskTemplate] of stageTemplate.tasks.entries()) {
      const taskDef = stageDef.taskDefs.find((t) => t.order === i && !t.parentId);
      if (!taskDef || !taskTemplate.fields) continue;

      for (const f of taskTemplate.fields) {
        const has = taskDef.fieldDefs.some((fd) => fd.labelEn === f.labelEn);
        if (has) continue;
        await prisma.themeTaskFieldDef.create({
          data: {
            taskDefId: taskDef.id,
            labelEn: f.labelEn,
            labelFa: f.labelFa,
            fieldType: f.fieldType,
            order: f.order,
          },
        });
      }
    }
  }

  return existing;
}

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
        create: await Promise.all(
          theme.stageDefs.map(async (sd, si) => {
            const stage = {
              nameEn: sd.nameEn,
              nameFa: sd.nameFa,
              descriptionEn: sd.descriptionEn,
              descriptionFa: sd.descriptionFa,
              order: sd.order,
              status:
                si === 0 ? StageStatus.COMPLETED : si === 1 ? StageStatus.IN_PROGRESS : StageStatus.PENDING,
            };
            return stage;
          }),
        ),
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

  const jobTheme = await ensureTheme(JOB_THEME);
  await ensureTheme(HEALTH_THEME);

  await syncSeedTaskFieldsFromTheme();
  await backfillFieldCompletion();

  const existing = await prisma.seed.findFirst({
    where: { title: "Senior Engineer — Acme Corp" },
  });
  if (existing) {
    console.log("Seed data exists, skipping.");
    return;
  }

  const seed = await plantSeedFromTheme(userA.id, jobTheme.id, "Senior Engineer — Acme Corp", {
    company: "Acme Corp",
    role: "Senior Software Engineer",
    job_url: "https://example.com/jobs/senior-engineer",
    salary: "€70k–€85k",
    location: "Remote (EU)",
    applied_date: new Date().toISOString().slice(0, 10),
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
        messageEn: "Upload documents is due in 2 days",
        messageFa: "آپلود مدارک تا ۲ روز دیگر",
        type: NotificationType.TASK_DUE,
      },
      {
        userId: userA.id,
        seedId: seed.id,
        titleEn: "Keep growing",
        titleFa: "به رشد ادامه بده",
        messageEn: "Submit application after documents are ready",
        messageFa: "بعد از آماده شدن مدارک، درخواست را ارسال کن",
        type: NotificationType.GENERAL,
      },
    ],
  });

  // Extra custom field only on this seed
  await prisma.seedFieldValue.create({
    data: {
      seedId: seed.id,
      labelEn: "Referral contact",
      labelFa: "معرف",
      fieldType: FieldType.TEXT,
      value: "Sara — former colleague",
      order: 100,
    },
  });

  console.log(`Seeded: ${seed.title}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
