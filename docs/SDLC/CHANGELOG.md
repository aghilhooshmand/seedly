# Changelog

All notable changes to Seedly are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [0.2.0] - 2026-06-18

### Added

- **Theme** system: reusable templates (Job Application, Healthy Lifestyle) with default fields, stages, tasks
- **Seed** model: one seed = one specific thing (e.g. one job at one company)
- **Dynamic seed info**: `SeedFieldValue` from theme + custom fields per seed
- **Tasks** with deadline, priority, completion; progress auto-calculated
- **Follow-up** panel: overdue, due soon, remaining counts
- **Per-user seeds** with read-only sharing (`SeedShare`)
- **In-app notifications** (email deferred)
- **English + Farsi** UI with RTL support (`next-intl`)
- Dev user switcher (Partner / You) until real auth

### Changed

- Renamed goals → seeds throughout app and API
- Replaced milestones with tasks inside stages

## [0.1.0] - 2026-06-17

### Added

- Initial project scaffold (Next.js 16, TypeScript, Tailwind CSS 4)
- Product vision, architecture, roadmap, and SDLC documentation
- Prisma data model: goals, stages, milestones, activities, notes, life areas
- SQLite database for local development
- Seed script with sample "Software Engineer job search" goal
- Dashboard showing active goals and progress
- Goal detail page with lifecycle stages, timeline, and notes
- REST API for goals, activities, and notes
