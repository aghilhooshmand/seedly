# ADR 001: Tech stack and database

**Status:** Accepted  
**Date:** 2026-06-17

## Context

Seedly needs a modern web app with a persistent database, good documentation story, and room to grow from a personal job-search tool to a general life-goals platform.

## Decision

- **Next.js** (App Router) for frontend and API
- **PostgreSQL** as the production database target
- **SQLite** for local development (zero setup)
- **Prisma** as ORM
- **Tailwind CSS** for styling

## Alternatives considered

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| MongoDB | Flexible schema | Weak relations for goal lifecycle | Rejected |
| Separate FastAPI + React | Clear separation | Two deployables, more ops | Rejected for MVP |
| Supabase only | Auth + DB built-in | Vendor coupling early | Deferred to Phase 3 |

## Consequences

- Single repo, single deploy target (Vercel)
- `DATABASE_URL` switches SQLite ↔ Postgres without code changes
- All queries go through Prisma for type safety
