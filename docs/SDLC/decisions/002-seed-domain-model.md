# ADR 002: Seed model — themes, fields, stages, tasks

**Status:** Accepted  
**Date:** 2026-06-18

## Context

Product owner clarified the domain model:

1. **One seed = one specific thing** (e.g. one job at one company)
2. **Themes** group similar seeds (job application, healthy lifestyle) with reusable field and stage templates
3. **Seed info** uses custom fields per theme; each seed can add/remove/extra fields beyond the theme
4. **Stages + tasks** with deadlines, priority, completion tracking
5. **Follow-up**: overdue, due soon, progress %, activity log, in-app notifications
6. **Per-user seeds**, shareable read-only with another person
7. **English + Farsi** UI

## Decision

Replace `Goal` / `LifeArea` / `Milestone` with:

| Concept | Model |
|---------|--------|
| Theme | `Theme` + `ThemeFieldDef` + `ThemeStageDef` + `ThemeTaskDef` |
| Seed | `Seed` (owner, theme, progress) |
| Seed info | `SeedFieldValue` (from theme + custom per seed) |
| Stages & tasks | `Stage` + `Task` (deadline, priority, completed) |
| Sharing | `SeedShare` (VIEW only) |
| Follow-up | computed from tasks + `Notification` + `Activity` |
| Users | `User` (auth deferred; dev user switcher for now) |

## Consequences

- Job search = many seeds (one per company), not one big goal
- Themes are extensible without code changes (seed data / future admin UI)
- i18n labels stored as `*En` / `*Fa` on themes, stages, tasks, notifications
- Real auth (NextAuth/Clerk) planned for Phase 3
