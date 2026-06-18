# Seedly

**Grow your goals to completion.** Seedly tracks the full lifecycle of meaningful goals — from a job search to learning, health, or anything else in life — with stages, milestones, activities, and notes.

## Quick start

```bash
# Install dependencies
npm install

# Create database and seed sample job-search goal
cp .env.example .env
npm run db:migrate
npm run db:seed

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## What you get (v0.1)

- **Dashboard** — active goals with progress and current stage
- **Goal detail** — lifecycle timeline, activity log, notes
- **Templates** — job search (5 stages) or generic 3-stage goal
- **REST API** — `/api/goals`, activities, notes
- **Documentation** — product vision, architecture, roadmap, SDLC in `docs/`

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js Route Handlers |
| Database | SQLite (dev) / PostgreSQL (prod) via Prisma |
| Language | TypeScript |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Project docs

| Document | Description |
|----------|-------------|
| [docs/PRODUCT_VISION.md](docs/PRODUCT_VISION.md) | Why Seedly exists and MVP scope |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, data model, API conventions |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Planned phases |
| [docs/SDLC/](docs/SDLC/) | Changelog, ADRs, release process |

## PostgreSQL (optional)

For production-like local dev:

```bash
docker compose up -d
# Set DATABASE_URL in .env to postgresql://seedly:seedly@localhost:5432/seedly
# Change provider in prisma/schema.prisma to "postgresql"
npm run db:migrate
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed life areas + sample goal |
| `npm run db:studio` | Open Prisma Studio |

## License

Private — personal project.
