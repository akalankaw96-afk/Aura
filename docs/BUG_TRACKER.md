# Bug Tracker

Every confirmed defect lives here. One row per bug; details below the table.
**Severity:** Critical (security hole or data loss) · High (feature broken / serious risk) · Medium (wrong behaviour,
workaround exists) · Low (cosmetic, tooling, hygiene).
**Status:** Open · In Progress · Fixed (awaiting verification) · Verified · Won't fix (reason required).

Rules
- New bug → next free ID, add it to the table **and** a detail block. Never reuse or renumber IDs.
- A bug is only **Verified** after the reproduction steps no longer reproduce and the fix is in `CHANGELOG.md`.
- Never paste secret values (keys, passwords, tokens) into this file — describe where they are, not what they are.

Baseline: 22 issues found during the analysis on 2026-11-11 (5 critical · 6 high · 6 medium · 5 low).

| ID | Severity | Area | Title | Status | Sprint |
|---|---|---|---|---|---|
| BUG-001 | Critical | API · Auth | OTP master code accepted for any phone; OTP returned in the response | Fixed (awaiting verification) | 01 |
| BUG-002 | Critical | API · Auth | Google login trusts the e-mail without verifying the ID token | Fixed (awaiting verification) | 01 |
| BUG-003 | Critical | Web · Auth | `googleLogin` creates a fake local session when the API fails | Fixed (awaiting verification) | 01 |
| BUG-004 | Critical | API · Chat | `ChatController` has no `[Authorize]`; identity taken from the query string | Open | 01 |
| BUG-005 | Critical | API · Chat | `ChatHub` has no auth; sender id supplied by the client | Open | 01 |
| BUG-006 | High | API · Config | CORS allows any origin together with credentials | Fixed (awaiting verification) | 01 |
| BUG-007 | High | API · Config | Secrets committed in `appsettings.json` + hard-coded JWT fallback in `Program.cs` | Fixed (awaiting verification) | 01 |
| BUG-008 | High | API · Auth | 7-day JWT with no refresh, logout or revocation | Fixed (awaiting verification) | 01 |
| BUG-009 | High | API · Profiles | `CreateOrUpdateProfile` sets `Verified = true` (KYC bypass) | Open | 01 |
| BUG-010 | High | Web · Admin | "Staff Admin Panel" link shown to every member; `/admin` accepts any password | Open | 01 |
| BUG-011 | High | Web · Business | Plan, KYC, usage and boost state trusted from localStorage (self-upgrade) | Open | 02–04 |
| BUG-012 | Medium | Web · Routing | `/dashboard` has no guest guard; `KycGuard` treats missing state as approved | Open | 01 |
| BUG-013 | Medium | API · DB | InMemory DB is the default (config key missing); `EnsureCreated`, no migrations | Fixed (awaiting verification) | 01 |
| BUG-014 | Medium | API + Web | Services/clients swallow errors and serve fallback or mock data | Open | 03 |
| BUG-015 | Medium | API · DB | Demo user with a known password seeded in every environment | Fixed (awaiting verification) | 01 |
| BUG-016 | Medium | API · Search | Profile search loads the whole table; no paging | Open | 03 |
| BUG-017 | Medium | Web · Auth | JWT stored in localStorage (readable by any XSS) | In Progress | 01 |
| BUG-018 | Low | API · Auth | PBKDF2 with 10,000 iterations (below current guidance) | Fixed (awaiting verification) | 01 |
| BUG-019 | Low | Web · UI | ~380 classes from non-existent palettes + 8 opacity modifiers render unstyled | Open | 05 |
| BUG-020 | Low | Web · Tooling | `npm run lint` unusable — no ESLint config | Open | 01 |
| BUG-021 | Low | Web · Errors | `fetch` without timeout; ~31 empty `catch {}`; ~31 stray `console` calls | Open | 05 |
| BUG-022 | Low | Docs | Root `README.md` status section is out of date | Open | 01 |

**2026-11-13 — branch `S01-api-auth`:** fixes for BUG-001/002/003/006/007/008/013/015/018 are in the code
(see `CHANGELOG.md`). They move to **Verified** once `dotnet build`, the `InitialCreate` migration and the auth
walk-through in `PROGRESS.md` pass. BUG-017: API side done (refresh token only in an httpOnly cookie); the web app
still keeps the 15-minute access token in localStorage until the S01-T05 web part. BUG-007: the old JWT key and the
Google client secret are still in Git history — rotate both.

---

## Details

### BUG-001 — OTP master code + OTP echoed (Critical)
- **Where:** `DatingApp.Application/Services/AuthService.cs` → `SendOtpAsync` / `VerifyOtpAsync`.
- **What:** a fixed master code is accepted for any phone number, and the generated OTP is returned to the caller
  as `DemoOtp`. Anyone can pass phone verification for any number.
- **Repro:** `POST /api/auth/send-otp` → response contains the code; or `POST /api/auth/verify-otp` with the master code.
- **Expected:** OTP sent only by SMS, stored hashed with expiry + attempt limit; no master code; never in the response.
- **Fix plan:** SMS provider behind `ISmsSender` (dev implementation logs to console only in Development).

### BUG-002 — Google ID token not verified (Critical)
- **Where:** `AuthService.GoogleLoginAsync`, `AuthController` `google-login`.
- **What:** the server logs in (or creates) the user from the e-mail in the request body. Anyone can sign in as anyone.
- **Expected:** validate the ID token signature, `aud` = our client id, `iss`, expiry (`Google.Apis.Auth` `ValidateAsync`).

### BUG-003 — Fake session on Google failure (Critical)
- **Where:** `DatingApp.APP/src/services/api.ts` → `googleLogin` (catch branch).
- **What:** if the API call fails the client invents a local session and treats the user as signed in.
- **Expected:** show the error; no session without a server-issued token. Remove every "demo fallback" login.

### BUG-004 — Chat REST endpoints unauthenticated (Critical)
- **Where:** `WebApi/Controllers/ChatController.cs`.
- **What:** no `[Authorize]`; `profileId` / `currentProfileId` come from the query, so anyone can read anyone's chats.
- **Expected:** `[Authorize]`, profile id from JWT claims, membership check on the conversation.

### BUG-005 — ChatHub unauthenticated (Critical)
- **Where:** `WebApi/Hubs/ChatHub.cs` (`SendMessage`, `RequestContactShare`, `AcceptContactShare`, `JoinConversation`).
- **What:** no `[Authorize]`; the sender profile id is a method argument; an unknown sender becomes a random GUID.
- **Expected:** `[Authorize]` hub, JWT via `access_token` query for WebSockets, sender = caller; only an accepted
  match may message; persistence through a service (see TD-03).

### BUG-006 — CORS wide open (High)
- **Where:** `WebApi/Program.cs`. `SetIsOriginAllowed(_ => true)` + `AllowCredentials()`.
- **Expected:** explicit origin list from configuration per environment.

### BUG-007 — Secrets in source (High)
- **Where:** `WebApi/appsettings.json` (JWT signing key, Google client secret placeholder), `Program.cs` (fallback key).
- **Expected:** secrets from user-secrets (dev) / environment or vault (deployed); app fails to start if missing.
  **Rotate** the committed JWT key — treat it as leaked.

### BUG-008 — Long-lived token, no logout (High)
- **Where:** `Infrastructure/Services/JwtTokenGenerator.cs` (7-day expiry); no refresh/logout endpoints.
- **Expected:** short access token (≈15 min) + rotating refresh token (httpOnly cookie), `POST /auth/logout` revokes.

### BUG-009 — Profile save marks the member verified (High)
- **Where:** `ProfileService.CreateOrUpdateProfileAsync` sets `Verified = true`.
- **Expected:** `Verified` changes only through the KYC review workflow (moderator approve).

### BUG-010 — Admin panel exposed (High)
- **Where:** member menu link "Staff Admin Panel"; `src/app/admin` client mock login accepts any password.
- **Expected:** no link for members; admin area behind server role check (`Role = Admin/Moderator`). Until the
  back office exists, hide the link and gate `/admin` behind a real role claim.

### BUG-011 — Client-trusted entitlements (High)
- **Where:** `src/lib/session.ts` (plan), `verification.ts` (KYC), `usage.ts` (limits), `promotion.ts` (boost).
- **What:** editing localStorage gives Gold, approved KYC, unlimited usage or a free boost.
- **Expected:** server is the source of truth; client values are a cache only. Fixed feature by feature in Sprints 02–04.

### BUG-012 — Dashboard guards (Medium)
- **Where:** `src/app/dashboard`, `KycGuard`.
- **What:** guests can open `/dashboard`; a missing `vk-kyc` key counts as approved.
- **Expected:** guest → `/login?next=…`; unknown KYC → treat as not submitted.

### BUG-013 — InMemory DB default (Medium)
- **Where:** `Infrastructure/DependencyInjection.cs`, `ApplicationDbContextInitialiser.cs`.
- **What:** `UseInMemoryDatabase` missing from config → InMemory; `EnsureCreated` instead of migrations.
- **Expected:** SQL Server by default outside tests; EF migrations; InMemory only when explicitly set (tests).

### BUG-014 — Swallowed errors / fallback data (Medium)
- **Where:** `ProfileService` (fallback profiles on DB error; empty catch in `GetProfileByIdAsync`); web `api.ts`
  returning mock data on failure.
- **Expected:** log and surface the error (ProblemDetails); UI shows an error/empty state with retry.

### BUG-015 — Seeded demo user (Medium)
- **Where:** `ApplicationDbContextInitialiser`. Seed runs in every environment with a known password.
- **Expected:** demo seed only in Development, password from user-secrets; no member seed in production.

### BUG-016 — Unpaged search (Medium)
- **Where:** `ProfileService` search / `GET /api/profiles`.
- **Expected:** server-side filters, sort, `page`/`pageSize` (max 50), total count, indexes.

### BUG-017 — Token in localStorage (Medium)
- **Where:** `src/lib/session.ts` / `api.ts`.
- **Expected:** refresh token in httpOnly Secure SameSite cookie; access token in memory. Done with BUG-008.

### BUG-018 — Weak PBKDF2 cost (Low)
- **Where:** `Infrastructure/Services/PasswordHasher.cs`.
- **Expected:** ≥ 600,000 iterations (SHA-256) or ASP.NET `PasswordHasher<T>`; rehash on next login.

### BUG-019 — Unstyled palette classes (Low)
- **Where:** legacy files (see TD-01), `/admin` (39), messages (12), `Navbar` (6), plus 8 `token/NN` modifiers.
- **Expected:** token classes only. Most disappear with the dead-code removal (TD-01).

### BUG-020 — Lint unusable (Low)
- **Where:** `DatingApp.APP` — `next lint` prompts for setup.
- **Expected:** `eslint.config.mjs` with `next/core-web-vitals` + TypeScript rules; `npm run lint` in CI.

### BUG-021 — Error-handling hygiene (Low)
- **Expected:** typed fetch helper with timeout (TD-04); storage helper (TD-05); no empty catches; no `console.*` in UI code.

### BUG-022 — Stale README (Low)
- **Expected:** root `README.md` points to `CLAUDE.md` and `docs/`; status reflects `PROGRESS.md`.
