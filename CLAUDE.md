# CLAUDE.md — Aura / Vikasitha (master instructions)

Read this file before any work. Then read the docs for the area you touch (table at the end).
`DatingApp.APP/CLAUDE.md` + `DatingApp.APP/AGENTS.md` still apply to all front-end work — this file adds the
project-wide rules, the sprint workflow and the backend.

## 1. What this is
**Vikasitha (විකසිත්)** — a Sri Lankan matrimony website. Members register, pass KYC (ID check), search
verified profiles, send interests, chat after acceptance, and pay for Gold / Platinum plans and 7-day profile boosts.
Free members have monthly limits (searches, profile views, interests, chats).

## 2. Stack
| Part | Folder | Stack |
|---|---|---|
| Web app | `DatingApp.APP/` | Next.js 15 (App Router) · React 19 · TypeScript 5 · Tailwind 3 (token-only theme) · iconsax-react · @microsoft/signalr |
| API | `DatingApp.API/` | .NET 9 · ASP.NET Core Web API · EF Core 9 (SQL Server / InMemory) · SignalR · JWT · Swagger |
| Design | Figma `jyoGCUqvQuZsoUp2uUi95W` (AI-Learning-2) | **Source of truth** for every colour, size, copy |

## 3. Architecture in one minute
- **API** = Clean Architecture: `Domain` (entities, enums) → `Application` (DTOs, services, interfaces) →
  `Infrastructure` (EF DbContext, JWT, hashing, DI) → `WebApi` (controllers, `ChatHub`, `Program.cs`).
- **Web app** layers point one way: `app/` (routes) → `components/sections|auth` (screens) → `cards`/`layout` →
  `ui/` (Figma kit) → `styles/tokens.css`. Business state that should be server-side currently lives in
  `src/lib/*.ts` (localStorage) — see `docs/ARCHITECTURE.md` §4 "Client-side state registry".
- Only ~19 of 102 needed endpoints exist; most features run on demo data. Full list: `docs/API_GUIDELINES.md`.

## 4. Rules you must follow
**Code**
1. Inspect existing code and reuse it before creating anything. Check `src/components/ui/index.ts` first.
2. Design tokens only (no hex, no Tailwind default palette — `emerald-*`, `purple-*`, `amber-*` do **not** exist
   here and render unstyled). Opacity modifiers on token colours (`bg-ink/40`) don't work — use `rgba()` arbitrary values.
3. Use the shared building blocks: `Button`/`ButtonLink`, `SegmentedTabs`, `Select`, `Field`, `Textarea`, `Badge`,
   `Alert`, `PhotoSlot`, `BackButton`, `useToast`, `requireMember()`, `consume()` / `consumeProfileView()`.
4. Strong TypeScript types; no `any`. Keep files < ~400 lines — split screens into components.
5. Copy lives in `src/content/*.ts` (+ Sinhala in `translations.ts`), not scattered through JSX.
6. Backend: business rules in `Application/Services`, never in controllers or the hub. Identity always from the JWT
   (`User` claims), never from a request parameter.

**Feedback & errors** — field error inline · action needed `<Alert>` · confirmation `useToast()` ·
guest action → login popup (`requireMember`) · limit → upgrade popup (`consume`). No empty `catch {}` except
around `localStorage` access, and those must go through a helper. Never show stack traces to users.

**Security** — never commit secrets (`appsettings*.json` secrets → user-secrets / env). Never trust the browser for
plan, KYC, usage, boost or identity. See `docs/SECURITY_GUIDELINES.md`.

## 5. Verify before you say "done"
- Web: `npm run typecheck` and `npm run check` (typecheck + production build) in `DatingApp.APP`.
- API: `dotnet build DatingApp.API/DatingApp.sln` (and tests once they exist).
- Check the screen at **1440px and 390px**, light **and** dark, keyboard focus visible.
- Re-test the flows you touched (guest, pending KYC, rejected, Free, Gold). `DashboardDemo` switches states.
- Never mark a task completed in `docs/PROGRESS.md` until its acceptance criteria pass.
- **Update the docs after every piece of development — no exceptions, even for small UI tweaks.** At minimum:
  `docs/PROGRESS.md` (status + notes) and `docs/CHANGELOG.md` (what changed, files). Also update `BUG_TRACKER.md`,
  `TECHNICAL_DEBT.md`, `API_GUIDELINES.md`, `DATABASE_GUIDELINES.md`, `COMPONENT_GUIDELINES.md` or `ARCHITECTURE.md`
  when the change touches them. A task is not done until its docs are updated.

## 6. Sprint workflow
1. Read `docs/SPRINT_PLAN.md` → work only on the **current sprint**; never start the next sprint without approval.
2. Per task: read docs → inspect code → plan → implement → verify → update docs → update `PROGRESS.md`.
3. Bugs found → `docs/BUG_TRACKER.md`. Shortcuts taken → `docs/TECHNICAL_DEBT.md`. Shipped changes → `docs/CHANGELOG.md`.
4. Unfinished task: keep it, record done / remaining / blockers, move it to the next sprint (handover section in `PROGRESS.md`).
5. End every task with a report: implemented · files created/modified · bugs fixed · tests + results · remaining issues · docs updated · next tasks.

## 7. Never
- Rewrite or restructure working code without a reason recorded in the sprint plan.
- Delete working features, or "unused" files without checking imports (`grep -rlw Name src`).
- Change the DB schema without a migration and an impact note in `docs/DATABASE_GUIDELINES.md`.
- Add a library without a clear reason (record it in `ARCHITECTURE.md` decisions).
- Expose/commit API keys, passwords, tokens, `.env` files, or seed real member data.
- Bypass authentication/authorization, or add new "demo fallback" logins.
- Run destructive commands (drop DB, `git reset --hard`, delete folders) without explicit approval.
- Overwrite a file someone else changed — re-read it first (the team edits in parallel; files are CRLF on Windows).
- Mark untested work completed, or work on several sprints at once.

## 8. Where to read more
| Topic | File |
|---|---|
| What the product is, users, flows | `docs/PROJECT_OVERVIEW.md` |
| Current state, findings, feature inventory | `docs/PROJECT_ANALYSIS.md` |
| Structure, layers, client-state registry, decisions | `docs/ARCHITECTURE.md` |
| Code style (TS + C#) | `docs/CODING_STANDARDS.md` |
| Visual + interaction rules | `docs/UI_UX_GUIDELINES.md` (+ `DatingApp.APP/AGENTS.md`) |
| Component inventory + when to create one | `docs/COMPONENT_GUIDELINES.md` |
| Entities, relationships, migrations | `docs/DATABASE_GUIDELINES.md` |
| Endpoint list, conventions, error codes | `docs/API_GUIDELINES.md` |
| Security rules + open vulnerabilities | `docs/SECURITY_GUIDELINES.md` |
| Error handling patterns | `docs/ERROR_HANDLING.md` |
| How to test | `docs/TESTING_GUIDELINES.md` |
| Day-to-day workflow, Git, environments | `docs/DEVELOPMENT_WORKFLOW.md` |
| Sprints · progress · bugs · debt · changes | `docs/SPRINT_PLAN.md` · `PROGRESS.md` · `BUG_TRACKER.md` · `TECHNICAL_DEBT.md` · `CHANGELOG.md` |
| Figma ↔ code map | `DatingApp.APP/docs/FIGMA_MAP.md` |
