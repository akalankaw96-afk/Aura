# Aura — Vikasitha matrimony platform

| Folder | What | Stack |
|---|---|---|
| [`DatingApp.APP`](./DatingApp.APP) | Web app (front end), built from the Figma design | Next.js 15 · React 19 · TypeScript · Tailwind 3 |
| [`DatingApp.API`](./DatingApp.API) | Back end, clean architecture (Domain · Application · Infrastructure · WebApi) + `DatingApp.Tests` | .NET 9 · EF Core 9 · SQL Server · SignalR |

**Design source of truth:** Figma file *AI-Learning-2*: https://www.figma.com/design/jyoGCUqvQuZsoUp2uUi95W/AI-Learning-2

## Start here
- **Rules for people and AI assistants:** [`CLAUDE.md`](./CLAUDE.md)
- **Where the project stands:** [`docs/PROGRESS.md`](./docs/PROGRESS.md) · plan: [`docs/SPRINT_PLAN.md`](./docs/SPRINT_PLAN.md)
- Known bugs and debt: [`docs/BUG_TRACKER.md`](./docs/BUG_TRACKER.md) · [`docs/TECHNICAL_DEBT.md`](./docs/TECHNICAL_DEBT.md)
- How the pieces fit: [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) · API rules: [`docs/API_GUIDELINES.md`](./docs/API_GUIDELINES.md)
- Front end details: [`DatingApp.APP/README.md`](./DatingApp.APP/README.md)

## Run it locally (Windows)
Needs .NET 9 SDK, Node.js 20+ and SQL Server Express (`localhost\SQLEXPRESS`).

**API** — once, set the secrets (they never go in Git):
```powershell
cd DatingApp.API
dotnet user-secrets set "JwtSettings:Secret" "<64 random characters>" --project DatingApp.WebApi
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost\SQLEXPRESS;Database=AuraMatrimonyDb;Trusted_Connection=True;TrustServerCertificate=True" --project DatingApp.WebApi
dotnet run --project DatingApp.WebApi      # http://localhost:5000, Swagger at /swagger
```
The database is created and migrated on start. In Development, SMS / e-mail codes are written to the API console (no SMS provider yet).

**Web app:**
```powershell
cd DatingApp.APP
npm.cmd install
npm.cmd run dev                            # http://localhost:3001
```

**Checks** (the same ones CI runs on every push — `.github/workflows/ci.yml`):
```powershell
cd DatingApp.API;  dotnet build; dotnet test
cd DatingApp.APP;  npm.cmd run lint; npm.cmd run check
```

## Status
Sprint 01 (security & foundations) — code complete, waiting for verification on a real machine. Details per task in [`docs/PROGRESS.md`](./docs/PROGRESS.md).
- ✅ Real accounts: phone + password registration, SMS code, login, Google sign-in, forgot password, sessions with rotating refresh cookie
- ✅ Profiles are saved in SQL Server; no demo data anywhere
- ✅ Chat is for signed-in, matched members only
- ⏳ Next: KYC documents & admin review (Sprint 02), plans & payments (Sprint 03)
