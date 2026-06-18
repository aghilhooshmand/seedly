# Architecture

## Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | Next.js 16 (App Router) + React 19 | Full-stack TypeScript, great DX, SSR for fast loads |
| Styling | Tailwind CSS 4 | Utility-first, consistent design system |
| Backend | Next.js Route Handlers | Co-located API, no separate server to deploy |
| Database | SQLite (dev) → PostgreSQL (prod) | Relational model fits goals ↔ stages ↔ activities; Prisma abstracts both |
| ORM | Prisma | Type-safe queries, migrations, seeding |

## Why SQL (not NoSQL)?

Goals have **clear relationships**: a goal has many stages, stages have milestones, activities belong to goals. Queries like *"all active career goals with incomplete interview stage"* are natural in SQL. Document stores would push that structure into nested JSON and complicate reporting.

## Project structure

```
seedly/
├── docs/                 # Product & engineering documentation
│   ├── PRODUCT_VISION.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── SDLC/             # Software lifecycle tracking
├── prisma/
│   ├── schema.prisma     # Data model
│   └── seed.ts           # Demo / job-search sample data
├── src/
│   ├── app/              # Pages & API routes (App Router)
│   ├── components/       # UI components
│   └── lib/              # DB client, types, helpers
└── docker-compose.yml    # Optional PostgreSQL for production-like dev
```

## Data model (summary)

```
LifeArea ──< Goal ──< Stage ──< Milestone
                  ├──< Activity
                  └──< Note
```

- **Goal**: title, description, target date, status, progress %
- **Stage**: ordered lifecycle phase (e.g. "Interviewing")
- **Milestone**: checkpoint within a stage
- **Activity**: timestamped event (applied, interview, rejection, offer)
- **Note**: free-form journal entry

## API conventions

- REST-style route handlers under `src/app/api/`
- JSON request/response bodies
- Errors: `{ error: string }` with appropriate HTTP status

## Deployment (future)

- **Vercel** for Next.js
- **Neon** or **Supabase** for managed PostgreSQL
- Environment: `DATABASE_URL` for Prisma
