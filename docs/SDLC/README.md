# Software Development Lifecycle (SDLC)

This folder tracks how Seedly is built over time — decisions, releases, and process.

## Documents

| File | Purpose |
|------|---------|
| [CHANGELOG.md](./CHANGELOG.md) | What shipped in each version |
| [decisions/](./decisions/) | Architecture Decision Records (ADRs) |

## Workflow

1. **Plan** — Update `ROADMAP.md` and create an issue or task note
2. **Decide** — Non-obvious choices get an ADR in `decisions/`
3. **Build** — Feature branch → PR → review
4. **Document** — Update CHANGELOG and relevant docs
5. **Release** — Tag version, deploy

## Versioning

Semantic versioning: `MAJOR.MINOR.PATCH`

- **0.x** — Pre-release, breaking changes allowed
- **1.0** — First stable MVP for daily use

## Quality gates (MVP)

- `npm run lint` passes
- `npm run build` succeeds
- Manual smoke test: create goal → add activity → view dashboard
