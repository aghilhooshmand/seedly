import { FieldType, Priority, Recurrence } from "@prisma/client";

export type GardenFieldTemplate = {
  key: string;
  labelEn: string;
  labelFa: string;
  fieldType: FieldType;
  options?: string;
  required?: boolean;
  order: number;
};

export type GardenTaskFieldTemplate = {
  labelEn: string;
  labelFa: string;
  fieldType: FieldType;
  order: number;
  countsTowardProgress?: boolean;
  options?: string;
};

export type GardenTaskTemplate = {
  titleEn: string;
  titleFa: string;
  priority: Priority;
  recurrence?: Recurrence;
  fields?: GardenTaskFieldTemplate[];
};

export type GardenStageTemplate = {
  nameEn: string;
  nameFa: string;
  descriptionEn?: string;
  descriptionFa?: string;
  order: number;
  tasks: GardenTaskTemplate[];
};

export type GardenTemplate = {
  slug: string;
  nameEn: string;
  nameFa: string;
  descriptionEn: string;
  descriptionFa: string;
  icon: string;
  color: string;
  fields: GardenFieldTemplate[];
  stages: GardenStageTemplate[];
};

function periodDoneField(recurrence: Recurrence, order = 0): GardenTaskFieldTemplate {
  const map: Record<Recurrence, { en: string; fa: string }> = {
    NONE: { en: "Done", fa: "انجام شد" },
    DAILY: { en: "Done today", fa: "امروز انجام شد" },
    WEEKLY: { en: "Done this week", fa: "این هفته انجام شد" },
    MONTHLY: { en: "Done this month", fa: "این ماه انجام شد" },
  };
  const l = map[recurrence];
  return {
    labelEn: l.en,
    labelFa: l.fa,
    fieldType: FieldType.CHECKBOX,
    order,
    countsTowardProgress: true,
  };
}

function daily(
  titleEn: string,
  titleFa: string,
  priority: Priority = Priority.MEDIUM,
  extra?: GardenTaskFieldTemplate[],
): GardenTaskTemplate {
  const fields = [periodDoneField(Recurrence.DAILY)];
  if (extra) fields.push(...extra.map((f, i) => ({ ...f, order: i + 1 })));
  return { titleEn, titleFa, priority, recurrence: Recurrence.DAILY, fields };
}

function weekly(
  titleEn: string,
  titleFa: string,
  priority: Priority = Priority.MEDIUM,
  extra?: GardenTaskFieldTemplate[],
): GardenTaskTemplate {
  const fields = [periodDoneField(Recurrence.WEEKLY)];
  if (extra) fields.push(...extra.map((f, i) => ({ ...f, order: i + 1 })));
  return { titleEn, titleFa, priority, recurrence: Recurrence.WEEKLY, fields };
}

function monthly(
  titleEn: string,
  titleFa: string,
  priority: Priority = Priority.MEDIUM,
  extra?: GardenTaskFieldTemplate[],
): GardenTaskTemplate {
  const fields = [periodDoneField(Recurrence.MONTHLY)];
  if (extra) fields.push(...extra.map((f, i) => ({ ...f, order: i + 1 })));
  return { titleEn, titleFa, priority, recurrence: Recurrence.MONTHLY, fields };
}

function once(
  titleEn: string,
  titleFa: string,
  priority: Priority = Priority.MEDIUM,
  fields?: GardenTaskFieldTemplate[],
): GardenTaskTemplate {
  return { titleEn, titleFa, priority, recurrence: Recurrence.NONE, fields };
}

/** Built-in gardens — aligned with Wheel of Life / 8–12 life-area frameworks. */
export const SYSTEM_GARDENS: GardenTemplate[] = [
  {
    slug: "job-application",
    nameEn: "Career & Job Search",
    nameFa: "شغل و جستجوی کار",
    descriptionEn: "One seed = one role at one company. Decide → prepare → apply → interview → decide.",
    descriptionFa: "یک بذر = یک موقعیت در یک شرکت.",
    icon: "briefcase",
    color: "#2d6a4f",
    fields: [
      { key: "company", labelEn: "Company", labelFa: "شرکت", fieldType: FieldType.TEXT, required: true, order: 0 },
      { key: "role", labelEn: "Role / title", labelFa: "سمت", fieldType: FieldType.TEXT, required: true, order: 1 },
      { key: "job_url", labelEn: "Job posting link", labelFa: "لینک آگهی", fieldType: FieldType.URL, order: 2 },
      { key: "salary", labelEn: "Salary range", labelFa: "حقوق", fieldType: FieldType.TEXT, order: 3 },
      { key: "location", labelEn: "Location / remote", labelFa: "مکان", fieldType: FieldType.TEXT, order: 4 },
      { key: "applied_date", labelEn: "Applied date", labelFa: "تاریخ درخواست", fieldType: FieldType.DATE, order: 5 },
      { key: "contact", labelEn: "Recruiter / referral", labelFa: "مسئول جذب / معرف", fieldType: FieldType.TEXT, order: 6 },
      { key: "notes", labelEn: "Notes", labelFa: "یادداشت", fieldType: FieldType.TEXTAREA, order: 7 },
    ],
    stages: [
      {
        nameEn: "Research",
        nameFa: "تحقیق",
        descriptionEn: "Understand the role, team, and company fit",
        order: 0,
        tasks: [
          once("Read job description & requirements", "خواندن شرح شغل و نیازمندی‌ها", Priority.HIGH),
          once("Research company culture & product", "تحقیق درباره فرهنگ و محصول شرکت", Priority.MEDIUM),
          once("List your fit — skills & gaps", "فهرست تناسب — مهارت‌ها و کمبودها", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Prepare",
        nameFa: "آماده‌سازی",
        order: 1,
        tasks: [
          once("Tailor CV for this role", "شخصی‌سازی رزومه", Priority.HIGH, [
            { labelEn: "CV file", labelFa: "فایل رزومه", fieldType: FieldType.FILE, order: 0 },
            { labelEn: "Reviewed", labelFa: "بازبینی شد", fieldType: FieldType.CHECKBOX, order: 1 },
          ]),
          once("Write cover letter", "نوشتن نامه انگیزشی", Priority.HIGH, [
            { labelEn: "Draft link", labelFa: "لینک پیش‌نویس", fieldType: FieldType.URL, order: 0 },
          ]),
          once("Prepare portfolio / work samples", "آماده‌سازی نمونه‌کار", Priority.MEDIUM, [
            { labelEn: "Portfolio link", labelFa: "لینک نمونه‌کار", fieldType: FieldType.URL, order: 0 },
          ]),
        ],
      },
      {
        nameEn: "Apply & follow up",
        nameFa: "درخواست و پیگیری",
        order: 2,
        tasks: [
          once("Submit application", "ارسال درخواست", Priority.URGENT),
          once("Message recruiter or hiring manager", "پیام به مسئول جذب", Priority.MEDIUM),
          weekly("Follow up on application status", "پیگیری وضعیت درخواست", Priority.MEDIUM, [
            { labelEn: "Notes", labelFa: "یادداشت", fieldType: FieldType.TEXTAREA, order: 1, countsTowardProgress: false },
          ]),
        ],
      },
      {
        nameEn: "Interview",
        nameFa: "مصاحبه",
        order: 3,
        tasks: [
          once("Prepare for screening call", "آماده‌سازی مصاحبه اولیه", Priority.HIGH, [
            { labelEn: "Interview date", labelFa: "تاریخ مصاحبه", fieldType: FieldType.DATE, order: 0 },
          ]),
          once("Prepare for technical / case round", "آماده‌سازی مصاحبه فنی", Priority.HIGH),
          once("Prepare questions for them", "آماده‌سازی سوالات برای آن‌ها", Priority.MEDIUM),
          once("Send thank-you note", "ارسال پیام تشکر", Priority.LOW),
        ],
      },
      {
        nameEn: "Decision",
        nameFa: "تصمیم",
        order: 4,
        tasks: [
          once("Compare offer to your goals", "مقایسه پیشنهاد با اهداف", Priority.HIGH),
          once("Negotiate salary & terms", "مذاکره حقوق و شرایط", Priority.MEDIUM),
          once("Accept or decline", "پذیرش یا رد", Priority.URGENT),
        ],
      },
    ],
  },
  {
    slug: "healthy-lifestyle",
    nameEn: "Health & Wellness",
    nameFa: "سلامت و تندرستی",
    descriptionEn: "Fitness, nutrition, sleep, mental health — with daily habits that compound.",
    descriptionFa: "تناسب اندام، تغذیه، خواب، سلامت روان — با عادت‌های روزانه.",
    icon: "heart",
    color: "#e76f51",
    fields: [
      {
        key: "focus",
        labelEn: "Primary focus",
        labelFa: "تمرکز اصلی",
        fieldType: FieldType.SELECT,
        options: '["Fitness","Nutrition","Sleep","Weight","Mental health","General wellness"]',
        order: 0,
      },
      { key: "target", labelEn: "Target outcome (SMART)", labelFa: "نتیجه هدف", fieldType: FieldType.TEXTAREA, order: 1 },
      { key: "start_date", labelEn: "Start date", labelFa: "تاریخ شروع", fieldType: FieldType.DATE, order: 2 },
      { key: "target_date", labelEn: "Target date", labelFa: "تاریخ هدف", fieldType: FieldType.DATE, order: 3 },
      { key: "baseline", labelEn: "Baseline metric (e.g. weight, steps)", labelFa: "معیار پایه", fieldType: FieldType.TEXT, order: 4 },
    ],
    stages: [
      {
        nameEn: "Plan",
        nameFa: "برنامه‌ریزی",
        order: 0,
        tasks: [
          once("Define SMART health goal", "تعریف هدف سلامت SMART", Priority.HIGH),
          once("Consult doctor if needed", "مشورت با پزشک در صورت نیاز", Priority.MEDIUM),
          once("Design weekly routine", "طراحی برنامه هفتگی", Priority.HIGH),
        ],
      },
      {
        nameEn: "Daily habits",
        nameFa: "عادت‌های روزانه",
        descriptionEn: "Check off each day — resets automatically tomorrow",
        descriptionFa: "هر روز تیک بزنید — فردا خودکار ریست می‌شود",
        order: 1,
        tasks: [
          daily("Drink enough water (8 glasses)", "نوشیدن آب کافی", Priority.MEDIUM),
          daily("Move 30 minutes (walk, sport, gym)", "۳۰ دقیقه فعالیت بدنی", Priority.HIGH),
          daily("Eat vegetables with 2 meals", "سبزیجات در ۲ وعده", Priority.MEDIUM),
          daily("Sleep 7–8 hours", "۷–۸ ساعت خواب", Priority.HIGH),
          daily("5 min mindfulness or breathing", "۵ دقیقه ذهن‌آگاهی", Priority.LOW),
        ],
      },
      {
        nameEn: "Weekly rhythm",
        nameFa: "ریتم هفتگی",
        order: 2,
        tasks: [
          weekly("Weigh in / track metric", "توزین / ثبت معیار", Priority.MEDIUM, [
            { labelEn: "This week's value", labelFa: "مقدار این هفته", fieldType: FieldType.TEXT, order: 1, countsTowardProgress: false },
          ]),
          weekly("Meal prep or plan groceries", "برنامه غذا یا خرید", Priority.MEDIUM),
          weekly("Review what worked", "مرور آنچه جواب داد", Priority.LOW, [
            { labelEn: "Reflection", labelFa: "بازتاب", fieldType: FieldType.TEXTAREA, order: 1, countsTowardProgress: false },
          ]),
        ],
      },
      {
        nameEn: "Milestones",
        nameFa: "نقاط عطف",
        order: 3,
        tasks: [
          monthly("Monthly health check-in", "بررسی ماهانه سلامت", Priority.MEDIUM, [
            { labelEn: "Progress notes", labelFa: "یادداشت پیشرفت", fieldType: FieldType.TEXTAREA, order: 1, countsTowardProgress: false },
          ]),
          once("Celebrate a milestone", "جشن گرفتن یک دستاورد", Priority.LOW),
        ],
      },
    ],
  },
  {
    slug: "learning-study",
    nameEn: "Learning & Study",
    nameFa: "یادگیری و تحصیل",
    descriptionEn: "Courses, certifications, languages, exams — structured study with daily blocks.",
    descriptionFa: "دوره‌ها، گواهینامه‌ها، زبان، امتحان — مطالعه ساختاریافته.",
    icon: "book-open",
    color: "#457b9d",
    fields: [
      { key: "subject", labelEn: "Subject / skill", labelFa: "موضوع / مهارت", fieldType: FieldType.TEXT, required: true, order: 0 },
      {
        key: "level",
        labelEn: "Current level",
        labelFa: "سطح فعلی",
        fieldType: FieldType.SELECT,
        options: '["Beginner","Intermediate","Advanced"]',
        order: 1,
      },
      { key: "target_level", labelEn: "Target level", labelFa: "سطح هدف", fieldType: FieldType.TEXT, order: 2 },
      { key: "exam_date", labelEn: "Exam / deadline", labelFa: "تاریخ امتحان", fieldType: FieldType.DATE, order: 3 },
      { key: "resources", labelEn: "Main resources (book, course URL)", labelFa: "منابع اصلی", fieldType: FieldType.URL, order: 4 },
      { key: "hours_week", labelEn: "Study hours per week goal", labelFa: "ساعت مطالعه در هفته", fieldType: FieldType.NUMBER, order: 5 },
    ],
    stages: [
      {
        nameEn: "Plan curriculum",
        nameFa: "برنامه درسی",
        order: 0,
        tasks: [
          once("Break topic into modules", "تقسیم موضوع به ماژول‌ها", Priority.HIGH),
          once("Gather materials & schedule", "جمع‌آوری منابع و زمان‌بندی", Priority.HIGH),
          once("Set exam or project deadline", "تعیین مهلت امتحان یا پروژه", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Daily study",
        nameFa: "مطالعه روزانه",
        order: 1,
        tasks: [
          daily("Focused study block (45–60 min)", "بلوک مطالعه متمرکز", Priority.HIGH, [
            { labelEn: "Topic covered", labelFa: "موضوع پوشش‌داده‌شده", fieldType: FieldType.TEXT, order: 1, countsTowardProgress: false },
          ]),
          daily("Review notes or flashcards (15 min)", "مرور یادداشت یا فلش‌کارت", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Practice",
        nameFa: "تمرین",
        order: 2,
        tasks: [
          weekly("Practice problems or exercises", "تمرین مسائل", Priority.HIGH),
          weekly("Teach or explain what you learned", "توضیح مطلب به دیگران", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Assess & apply",
        nameFa: "ارزیابی و کاربرد",
        order: 3,
        tasks: [
          once("Take practice test", "آزمون آزمایشی", Priority.HIGH),
          once("Build a small project using the skill", "پروژه کوچک با مهارت", Priority.MEDIUM),
          monthly("Progress review — adjust plan", "مرور پیشرفت — تنظیم برنامه", Priority.MEDIUM),
        ],
      },
    ],
  },
  {
    slug: "finance-money",
    nameEn: "Finance & Money",
    nameFa: "مالی و پول",
    descriptionEn: "Budget, savings, debt payoff, emergency fund — weekly money habits.",
    descriptionFa: "بودجه، پس‌انداز، بدهی، صندوق اضطراری.",
    icon: "wallet",
    color: "#f4a261",
    fields: [
      { key: "goal_type", labelEn: "Money goal", labelFa: "هدف مالی", fieldType: FieldType.SELECT, options: '["Save","Pay debt","Invest","Budget control","Emergency fund"]', order: 0 },
      { key: "target_amount", labelEn: "Target amount", labelFa: "مبلغ هدف", fieldType: FieldType.TEXT, order: 1 },
      { key: "deadline", labelEn: "Target date", labelFa: "تاریخ هدف", fieldType: FieldType.DATE, order: 2 },
      { key: "monthly_income", labelEn: "Monthly income (approx)", labelFa: "درآمد ماهانه", fieldType: FieldType.TEXT, order: 3 },
      { key: "notes", labelEn: "Notes", labelFa: "یادداشت", fieldType: FieldType.TEXTAREA, order: 4 },
    ],
    stages: [
      {
        nameEn: "Understand",
        nameFa: "درک وضعیت",
        order: 0,
        tasks: [
          once("List all income sources", "فهرست منابع درآمد", Priority.HIGH),
          once("List debts & subscriptions", "فهرست بدهی‌ها و اشتراک‌ها", Priority.HIGH),
          once("Track spending for 2 weeks", "ردیابی هزینه ۲ هفته", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Plan",
        nameFa: "برنامه‌ریزی",
        order: 1,
        tasks: [
          once("Create monthly budget", "ساخت بودجه ماهانه", Priority.HIGH),
          once("Set automatic savings transfer", "انتقال خودکار پس‌انداز", Priority.HIGH),
          once("Define debt payoff order", "ترتیب پرداخت بدهی", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Weekly money habits",
        nameFa: "عادت‌های مالی هفتگی",
        order: 2,
        tasks: [
          weekly("Review transactions & budget", "بررسی تراکنش‌ها و بودجه", Priority.HIGH),
          weekly("No-spend day or limit discretionary", "روز بدون خرید اضافی", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Monthly close",
        nameFa: "جمع‌بندی ماهانه",
        order: 3,
        tasks: [
          monthly("Net worth / savings snapshot", "عکس وضعیت پس‌انداز", Priority.MEDIUM, [
            { labelEn: "Amount saved this month", labelFa: "پس‌انداز این ماه", fieldType: FieldType.TEXT, order: 1, countsTowardProgress: false },
          ]),
          monthly("Adjust budget for next month", "تنظیم بودجه ماه بعد", Priority.MEDIUM),
        ],
      },
    ],
  },
  {
    slug: "relationships",
    nameEn: "Relationships & Family",
    nameFa: "روابط و خانواده",
    descriptionEn: "Nurture partner, family, friends — intentional connection beats drift.",
    descriptionFa: "همسر، خانواده، دوستان — ارتباط آگاهانه.",
    icon: "users",
    color: "#e9c46a",
    fields: [
      { key: "who", labelEn: "Who (person or group)", labelFa: "چه کسی", fieldType: FieldType.TEXT, required: true, order: 0 },
      {
        key: "relationship",
        labelEn: "Relationship type",
        labelFa: "نوع رابطه",
        fieldType: FieldType.SELECT,
        options: '["Partner","Parent","Child","Sibling","Friend","Colleague","Community"]',
        order: 1,
      },
      { key: "goal", labelEn: "What you want to improve", labelFa: "چه چیزی را بهبود دهید", fieldType: FieldType.TEXTAREA, order: 2 },
      { key: "last_contact", labelEn: "Last meaningful contact", labelFa: "آخرین ارتباط معنادار", fieldType: FieldType.DATE, order: 3 },
    ],
    stages: [
      {
        nameEn: "Reflect",
        nameFa: "بازتاب",
        order: 0,
        tasks: [
          once("Write what matters in this relationship", "نوشتن اهمیت این رابطه", Priority.HIGH),
          once("Identify one pain point to address", "شناسایی یک نقطه درد", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Plan touchpoints",
        nameFa: "برنامه ارتباط",
        order: 1,
        tasks: [
          once("Schedule regular call or meetup", "برنامه تماس یا دیدار منظم", Priority.HIGH),
          once("Plan one meaningful activity together", "برنامه یک فعالیت معنادار", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Ongoing care",
        nameFa: "مراقبت مستمر",
        order: 2,
        tasks: [
          weekly("Reach out — call, message, or visit", "تماس، پیام یا دیدار", Priority.HIGH, [
            { labelEn: "How it went", labelFa: "چطور بود", fieldType: FieldType.TEXTAREA, order: 1, countsTowardProgress: false },
          ]),
          daily("Small act of appreciation", "یک کار کوچک قدردانی", Priority.LOW),
        ],
      },
      {
        nameEn: "Deepen",
        nameFa: "عمیق‌تر کردن",
        order: 3,
        tasks: [
          monthly("Quality time without phones", "وقت باکیفیت بدون موبایل", Priority.MEDIUM),
          once("Have a difficult conversation if needed", "گفتگوی دشوار در صورت نیاز", Priority.MEDIUM),
        ],
      },
    ],
  },
  {
    slug: "personal-growth",
    nameEn: "Personal Growth & Mindset",
    nameFa: "رشد فردی و ذهنیت",
    descriptionEn: "Habits, journaling, boundaries, confidence — foundation for all other gardens.",
    descriptionFa: "عادت، ژورنال، مرزها، اعتمادبه‌نفس.",
    icon: "sparkles",
    color: "#9b5de5",
    fields: [
      {
        key: "area",
        labelEn: "Growth area",
        labelFa: "حوزه رشد",
        fieldType: FieldType.SELECT,
        options: '["Mindset","Confidence","Productivity","Emotional health","Spirituality","Boundaries"]',
        order: 0,
      },
      { key: "vision", labelEn: "Who you want to become", labelFa: "کسی که می‌خواهید بشوید", fieldType: FieldType.TEXTAREA, order: 1 },
      { key: "book_course", labelEn: "Book / course / coach", labelFa: "کتاب / دوره / مربی", fieldType: FieldType.TEXT, order: 2 },
    ],
    stages: [
      {
        nameEn: "Clarify",
        nameFa: "روشن‌سازی",
        order: 0,
        tasks: [
          once("Write your why — 3 sentences", "نوشتن چرایی — ۳ جمله", Priority.HIGH),
          once("Pick one skill or habit to build", "انتخاب یک مهارت یا عادت", Priority.HIGH),
        ],
      },
      {
        nameEn: "Daily practices",
        nameFa: "تمرین‌های روزانه",
        order: 1,
        tasks: [
          daily("Journal 10 minutes", "ژورنال ۱۰ دقیقه", Priority.MEDIUM),
          daily("Read or listen 15 min (growth content)", "خواندن یا شنیدن ۱۵ دقیقه", Priority.MEDIUM),
          daily("One uncomfortable-but-good action", "یک کار خوب اما ناراحت‌کننده", Priority.LOW),
        ],
      },
      {
        nameEn: "Weekly reflection",
        nameFa: "بازتاب هفتگی",
        order: 2,
        tasks: [
          weekly("Review wins and lessons", "مرور بردها و درس‌ها", Priority.HIGH, [
            { labelEn: "Notes", labelFa: "یادداشت", fieldType: FieldType.TEXTAREA, order: 1, countsTowardProgress: false },
          ]),
          weekly("Plan next week's focus", "تمرکز هفته بعد", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Level up",
        nameFa: "ارتقا",
        order: 3,
        tasks: [
          once("Set a boundary you've avoided", "گذاشتن مرزی که اجتناب کرده‌اید", Priority.MEDIUM),
          monthly("Measure progress on growth goal", "سنجش پیشرفت هدف رشد", Priority.MEDIUM),
        ],
      },
    ],
  },
  {
    slug: "home-environment",
    nameEn: "Home & Environment",
    nameFa: "خانه و محیط",
    descriptionEn: "Declutter, organize, move, renovate — your space supports your life.",
    descriptionFa: "مرتب‌سازی، اسباب‌کشی، نوسازی — فضایی که از زندگی حمایت کند.",
    icon: "home",
    color: "#6d6875",
    fields: [
      { key: "space", labelEn: "Space / room / project", labelFa: "فضا / اتاق / پروژه", fieldType: FieldType.TEXT, required: true, order: 0 },
      {
        key: "project_type",
        labelEn: "Type",
        labelFa: "نوع",
        fieldType: FieldType.SELECT,
        options: '["Declutter","Organize","Clean","Move","Renovate","Decorate"]',
        order: 1,
      },
      { key: "budget", labelEn: "Budget", labelFa: "بودجه", fieldType: FieldType.TEXT, order: 2 },
      { key: "deadline", labelEn: "Target date", labelFa: "تاریخ هدف", fieldType: FieldType.DATE, order: 3 },
    ],
    stages: [
      {
        nameEn: "Vision & plan",
        nameFa: "چشم‌انداز و برنامه",
        order: 0,
        tasks: [
          once("Define done — what does finished look like?", "تعریف تمام‌شدن — پایان چگونه است؟", Priority.HIGH),
          once("List materials & steps", "فهرست مواد و مراحل", Priority.MEDIUM),
          once("Set budget limit", "تعیین سقف بودجه", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Weekly upkeep",
        nameFa: "نگهداری هفتگی",
        order: 1,
        tasks: [
          weekly("Deep clean one zone", "نظافت عمیق یک ناحیه", Priority.MEDIUM),
          weekly("Declutter 1 box or drawer", "مرتب‌سازی یک جعبه یا کشو", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Project work",
        nameFa: "کار پروژه",
        order: 2,
        tasks: [
          once("Complete main project milestone", "تکمیل نقطه عطف اصلی", Priority.HIGH),
          once("Donate or discard unused items", "اهدا یا دور انداختن اقلام", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Maintain",
        nameFa: "حفظ",
        order: 3,
        tasks: [
          monthly("Home walk-through & fix list", "بازرسی خانه و لیست تعمیر", Priority.LOW),
          daily("5-minute tidy before bed", "۵ دقیقه مرتب‌کردن قبل خواب", Priority.LOW),
        ],
      },
    ],
  },
  {
    slug: "creative-project",
    nameEn: "Creative & Side Project",
    nameFa: "پروژه خلاقانه و جانبی",
    descriptionEn: "Build an app, write a book, launch a shop — ship in small weekly steps.",
    descriptionFa: "ساخت اپ، نوشتن کتاب، راه‌اندازی — قدم‌های هفتگی کوچک.",
    icon: "palette",
    color: "#06d6a0",
    fields: [
      { key: "project_name", labelEn: "Project name", labelFa: "نام پروژه", fieldType: FieldType.TEXT, required: true, order: 0 },
      { key: "audience", labelEn: "Who it's for", labelFa: "برای چه کسی", fieldType: FieldType.TEXT, order: 1 },
      { key: "launch_date", labelEn: "Launch / ship date", labelFa: "تاریخ انتشار", fieldType: FieldType.DATE, order: 2 },
      { key: "link", labelEn: "Repo / draft link", labelFa: "لینک مخزن / پیش‌نویس", fieldType: FieldType.URL, order: 3 },
    ],
    stages: [
      {
        nameEn: "Ideate",
        nameFa: "ایده",
        order: 0,
        tasks: [
          once("Write one-page project brief", "نوشتن خلاصه یک‌صفحه‌ای پروژه", Priority.HIGH),
          once("Validate with 3 people", "اعتبارسنجی با ۳ نفر", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Build",
        nameFa: "ساخت",
        order: 1,
        tasks: [
          weekly("Ship one visible improvement", "تحویل یک بهبود قابل‌مشاهده", Priority.HIGH, [
            { labelEn: "What shipped", labelFa: "چه چیزی تحویل شد", fieldType: FieldType.TEXT, order: 1, countsTowardProgress: false },
          ]),
          daily("Work on project (30+ min)", "کار روی پروژه (۳۰+ دقیقه)", Priority.HIGH),
        ],
      },
      {
        nameEn: "Launch",
        nameFa: "انتشار",
        order: 2,
        tasks: [
          once("Publish v1 (good enough)", "انتشار نسخه ۱", Priority.URGENT),
          once("Share with audience", "اشتراک با مخاطب", Priority.HIGH),
          once("Collect feedback", "جمع‌آوری بازخورد", Priority.MEDIUM),
        ],
      },
      {
        nameEn: "Grow",
        nameFa: "رشد",
        order: 3,
        tasks: [
          monthly("Review metrics & next priorities", "مرور معیارها و اولویت‌ها", Priority.MEDIUM),
          weekly("Iterate based on feedback", "بهبود بر اساس بازخورد", Priority.MEDIUM),
        ],
      },
    ],
  },
];
