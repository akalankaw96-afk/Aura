# Development Workflow

## 1. Environments
| Env | Web | API | DB |
|---|---|---|---|
| Local | `npm run dev` (port 3000/3001) in `DatingApp.APP` | `dotnet run --project DatingApp.API/DatingApp.WebApi` | LocalDB (InMemory only for tests) |
| Staging | (to set up, Sprint 01–02) | | SQL Server |
| Production | (to set up before launch) | | SQL Server, backups |

Web → API base URL from `NEXT_PUBLIC_API_URL` (`.env.local`, never committed). API secrets via `dotnet user-secrets`
(`SECURITY_GUIDELINES.md` §2).

## 2. Git
- Main branch: `main` (always buildable). Work on branches: `feature/S01-otp-hardening`, `fix/BUG-004-chat-auth`,
  `chore/TD-01-remove-legacy-ui`.
- Commits: small, present tense, reference the ID — `fix(auth): verify Google ID token (BUG-002)`.
- The team commits with GitHub Desktop and edits in parallel: **pull before you start, re-read any file before you change
  it**, never overwrite someone else's change. Files are CRLF on Windows — keep the existing line endings.
- Never commit: `.env*`, `appsettings.*.json` with secrets, `node_modules`, `bin/obj`, build output, real member data.
- PR (or reviewed commit) per task; description = the task report (§4). Merge only with green checks.

## 3. Per-task workflow
1. Read `CLAUDE.md`, `SPRINT_PLAN.md` (current sprint only), `PROGRESS.md` handover, and the docs for the area.
2. Inspect the related code and existing components; confirm the task's acceptance criteria.
3. Plan the smallest change; note any schema/API/breaking change and its impact before starting.
4. Implement following `CODING_STANDARDS.md`, `COMPONENT_GUIDELINES.md`, `SECURITY_GUIDELINES.md`.
5. Verify (`TESTING_GUIDELINES.md` §4–§6).
6. Update docs: `PROGRESS.md`, `CHANGELOG.md`, and as needed `BUG_TRACKER.md`, `TECHNICAL_DEBT.md`, `API_GUIDELINES.md`,
   `DATABASE_GUIDELINES.md`, `ARCHITECTURE.md`.
7. Report (§4).

## 4. Task report format
```
Task: S01-T03 Chat authentication
Implemented: …
Files created: … | Files modified: …
Bugs fixed: BUG-004, BUG-005
Tests: added … | results: … (commands + pass/fail)
Remaining issues / risks: …
Docs updated: PROGRESS, CHANGELOG, BUG_TRACKER, API_GUIDELINES
Next: …
```

## 5. Sprint rhythm
- A sprint starts only after approval of its scope in `SPRINT_PLAN.md`; one sprint at a time.
- During: tasks move Not Started → In Progress → Testing → Completed (statuses in `PROGRESS.md`).
- End: sprint review in `PROGRESS.md` (done, carried over with reasons, new bugs/debt), `CHANGELOG.md` release entry,
  then propose the next sprint and wait for approval.

## 6. Approvals needed (ask first)
Schema changes on shared DBs · deleting files/features · new dependencies · destructive commands · changing auth,
payments or data retention · any breaking API change · touching another developer's in-progress area.

## 7. Useful commands
```
# Web (DatingApp.APP)
npm install · npm run dev · npm run typecheck · npm run check · npm run build
# API
dotnet build DatingApp.API/DatingApp.sln · dotnet run --project DatingApp.API/DatingApp.WebApi
dotnet ef migrations add <Name> -p DatingApp.API/DatingApp.Infrastructure -s DatingApp.API/DatingApp.WebApi
dotnet user-secrets set "Jwt:Key" "<value>" --project DatingApp.API/DatingApp.WebApi
```
