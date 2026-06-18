# Roadmap

Strategy: **nail the Job Application theme first** (inspired by purpose-built tools like [Huntr](https://huntr.co/)), then **generalize the same primitives** to other seed types.

---

## Huntr → Seedly mapping (job focus)

[Huntr](https://huntr.co/) is a CRM built only for job search. What makes it work:

| Huntr feature | What it solves | Seedly today | Job theme next |
|---------------|----------------|--------------|----------------|
| **Job Tracker** (kanban pipeline) | See all applications by stage at once | List of seeds on dashboard | Pipeline board: Wishlist → Applied → Interview → Offer |
| **One card per job** | Company, role, salary, location, link | ✅ One seed = one company | Add status column + richer fields |
| **Save job from web** (Chrome clipper) | No copy-paste; posting won't vanish | Manual entry | Later: browser extension or paste URL |
| **Interview tracker** | Dates, rounds, don't double-book | Tasks in Interview stage | Interview sub-activities with date/time |
| **Contact tracker** | Recruiter / hiring manager | Custom text field only | Linked contacts per seed |
| **Private notes** | Context per job | Notes field + activity log | ✅ Mostly there |
| **Documents** | Tailored CV, cover letter per job | Custom FILE fields | Default CV + cover letter file slots on theme |
| **Job search metrics** | How many applied, response rate | Progress % per seed | Garden-level stats for all job seeds |
| **AI resume / autofill** | Speed + tailoring | Out of scope for now | Optional far future |

**What we should NOT copy early:** AI resume builder, autofill, keyword scanners — heavy product surface. Huntr's **organizational model** (one job card, pipeline, contacts, interviews, documents) is the lesson.

---

## Phase A — Job Application theme (current focus)

Make the job seed feel as natural as Huntr for your wife's search:

- [ ] **Pipeline dashboard** — kanban by stage (Applied, Interviewing, Offer, Rejected, Archived)
- [ ] **Default file fields** on theme: CV, Cover letter, Tailored resume
- [ ] **Interview events** — date/time, round type (phone, technical, onsite), notes
- [ ] **Contacts** linked to seed (name, role, email, LinkedIn)
- [ ] **Duplicate seed** from previous application (same theme, copy fields/tasks)
- [ ] **Reject / archive** seed with reason (activity log)
- [ ] **Job garden metrics** — active applications, interviews this week, overdue tasks
- [ ] **Seed status** aligned to pipeline (not just generic ACTIVE/COMPLETED)

## Phase B — Generalize (same engine, different themes)

Once job works daily, other seeds reuse the **same building blocks**:

| Primitive | Job seed | Health seed | Learning seed |
|-----------|----------|-------------|---------------|
| Theme | Job Application | Healthy Lifestyle | Learn a Skill |
| Seed info fields | company, salary, link… | focus, target weight… | course, platform… |
| Stages | Research → Apply → Interview | Plan → Build habit → Maintain | Choose → Study → Practice → Apply |
| Tasks | Tailor CV, submit form | Weekly meal prep, gym 3× | Finish module 1 |
| Follow-up | Overdue apply, interview tomorrow | Missed workout streak | Module deadline |
| Contacts | Recruiter | Trainer, doctor | Mentor, study partner |
| Documents | CV, cover letter | Meal plan PDF | Certificate |
| Pipeline view | Application stages | Habit phases | Learning path |

**Rule:** Job theme gets **extra UI** (pipeline board, contacts) only where it helps; the data model stays generic (`Seed`, `Stage`, `Task`, `SeedFieldValue`, `Activity`).

## Phase C — Collaboration & polish

- [ ] Real auth (replace dev user switcher)
- [ ] Share seed read-only (✅ started)
- [ ] Email reminders
- [ ] EN/FA complete (✅ started)

## Phase D — Optional power features

- [ ] Browser clipper (save job URL → new seed)
- [ ] Calendar sync for interviews
- [ ] AI assist (keyword hints, cover letter draft) — only if needed

---

## Version history

| Version | Focus |
|---------|--------|
| 0.1 | Generic goals scaffold |
| 0.2 | Seeds, themes, tasks, fields, share, i18n |
| **0.3** | **Job theme depth (Huntr-inspired pipeline)** |
| 0.4 | Generalize contacts + documents pattern to other themes |
