# Progress

**Status values:** Not Started · In Progress · Testing · Completed · Blocked · Deferred.
"Completed" only when acceptance criteria pass and tests/manual checks are recorded (`TESTING_GUIDELINES.md` §6).

_Last updated: 2026-11-13 — Auth API (endpoints #1–14) on branch `S01-api-auth`, awaiting build + test._

## Overall
| Area | State |
|---|---|
| Web UI (screens, design system) | Largely built against Figma; most screens run on demo/localStorage data |
| API | 27 of ~103 endpoints (auth group rebuilt 2026-11-13, not yet built/tested); chat still insecure (BUG-004/005) |
| Security | 5 critical + 6 high open issues |
| Tests / CI | None |
| Current sprint | **01 — Foundation & critical security** (started 2026-11-13, branch `S01-api-auth`) |

## Sprint 01 — Foundation & critical security
| Task | Status | Notes |
|---|---|---|
| S01-T01 Secrets out of source | Testing | Secrets removed from appsettings; app refuses to start without `JwtSettings:Secret` (≥32 bytes); user-secrets id added. **Rotate** the old JWT key + Google client secret (in Git history) |
| S01-T02 CORS allow-list | Testing | `Cors:AllowedOrigins` allow-list (dev: localhost:3001/3000); production list empty until set |
| S01-T03 OTP hardening | Testing | Hashed codes, 5 min, 5 tries, 60 s resend, 3 resends/hour, per-IP limit; no master code; never in response. `ISmsSender` logs in dev only (TD-21: real provider) |
| S01-T04 Google token verification + no fake session | Testing | Google ID token (One Tap) + access token (popup) verified with Google; web fake sessions removed (register, Google, OTP, profile auto-session) |
| S01-T05 Refresh / logout / token storage | In Progress | API done: 15-min access token, rotating refresh token in httpOnly `vk_refresh` cookie, reuse detection, refresh/logout/sessions. Web: login/register/Google send cookies, logout calls API. Remaining: access token out of localStorage + refresh-on-401 (BUG-017) |
| S01-T06 Chat authentication | Not Started | |
| S01-T07 Stop auto-verify on profile save | Not Started | |
| S01-T08 Admin link + role gate | Not Started | |
| S01-T09 Dashboard guest guard / KycGuard default | Not Started | |
| S01-T10 Migrations, SQL default, dev-only seed | In Progress | Startup runs `Migrate()`, SQL Server default, demo member only in Development with password from user-secrets. Remaining: generate `InitialCreate` (needs `dotnet ef`) |
| S01-T11 Global ProblemDetails handler | In Progress | `AppExceptionHandler` + ProblemDetails (`code`, `traceId`) and model validation; auth endpoints use it. Remaining: other controllers |
| S01-T12 Typed fetch helper | Not Started | |
| S01-T13 Password hashing upgrade | Testing | PBKDF2-SHA256 600k (`v2.` format); old hashes verify and are upgraded at login |
| S01-T14 Lint, tests, CI, ui exports | Not Started | |
| S01-T15 README update | Not Started | |
| S01-T16 Forgot password journey | Testing | API endpoints #9–11 + change password #12 built; `services/passwordReset.ts` now calls them. Password rule aligned web ↔ API: 8+ chars, letter + number |

## Small UI changes (outside sprint tasks)
| Change | Status | Notes |
|---|---|---|
| Free-limit popup can't be closed (Upgrade · Back to Dashboard) | Completed | Tested 1440/390: Esc keeps it open, no X, Back → /dashboard, build passes. Limits still client-side (BUG-011) |
| Share dialog Copy button radius | Completed | Checked 1440/390 |
| Upgrade popup: limit = hard stop, Gold feature = closable | Completed | Tested 1440/390: Message + Send interest → closable Gold popup, stays on page; searches used up → hard stop → /dashboard; build passes |
| Rename Requests → Friends (route `/friends`, redirect from `/requests`) | Completed | Tested 1440/390: menu + tab bar → /friends, `/requests?tab=sent` → `/friends?tab=sent`, title/breadcrumb; build passes. Sinhala label needs a native check |
| Best matches cards → profile page, Back → dashboard | Completed | Tested 1440/390; build passes |
| Share contact details flow (front end) | Completed (UI) | Tested 1440/390: request → sent card, incoming → Accept & share / Not now, accepted card + header chip, declined note, cancel; ⋯ menu on mobile; build passes. API in Sprint 03 (TD-20) |
| Sinhala font trial — Noto Sans Sinhala | Testing | Owner reviewing look & feel vs Yaldevi (Figma). Build passes. Decide, then align Figma or switch back |
| Responsive fixes (container 391–767, profile card, search toolbar, plans) | Completed | Automated overflow scan 9 pages × 8 widths × EN/SI: 0 cut-offs; screenshots checked; build passes |
| Sinhala home title −8 px | Completed | Checked 1440/390 SI + EN unchanged; build passes |
| How to use page `/how-to-use` + menu links (journey 50/50 list + phone, pinned-note tour, 2 screens per feature, 31 screens) | Completed | Tested 1440/390, EN/SI, light/dark, no overflow, member menu → page; build passes. SI tour details + screenshots in SI pending |
| Contact-share card buttons on phones | Completed | Fixed squashed buttons; checked 390 |
| Forgot password back button (all 3 steps) | Completed | Tested 1440/390: each step goes back one step, step 1 → /login; build passes |

## Documentation
| Item | Status |
|---|---|
| `CLAUDE.md` + 17 docs in `docs/` | Completed (2026-11-11) |

## Handover
### S01-T16 Forgot password journey
Done: 3-step UI (Email/Mobile → code → new password), shared `IdentifierTabs` (also on Login), `services/passwordReset.ts`
demo adapter with the planned endpoint contract, privacy-neutral messages. Tested: typecheck + production build pass;
Playwright walk-through at 1440 and 390 px (empty/invalid input, email + mobile, wrong code with tries left, 5-try lock,
password errors, success → /login with toast); dark theme checked on step 1. Follow-up: selected Email/Mobile option now brand colour via shared `SegmentedSwitch`
(Login, Forgot password, Registration photo switch) — checked at 1440/390, light + dark; build passes.
Remaining: API endpoints + code storage/limits + SMS/e-mail providers; then replace the 3 adapter functions.
Blockers: none (needs S01-T03 code service). Files: see CHANGELOG.

### S01 Auth API (branch `S01-api-auth`, 2026-11-13)
Done (code): endpoints #1–14 (register, login, Google, send/verify OTP, me, refresh, logout, forgot/verify/reset,
change password, sessions list/revoke); entities `RefreshToken`, `OtpCode`, `PasswordResetToken`; ProblemDetails
errors; CORS allow-list; per-IP rate limits; secrets out of config; migrations on start; dev-only demo member; web
client without fake sessions; forgot-password wired to the API.
**Not verified:** written without a .NET SDK in the editing environment — nothing has been compiled or run yet.
Remaining before "Completed":
1. `dotnet user-secrets set "JwtSettings:Secret" "<64 random chars>" --project DatingApp.API/DatingApp.WebApi`
   (optional: `Seed:DemoMemberPassword`)
2. Drop the old dev DB once (it was made by `EnsureCreated`), then
   `dotnet ef migrations add InitialCreate -p DatingApp.API/DatingApp.Infrastructure -s DatingApp.API/DatingApp.WebApi`
3. `dotnet build DatingApp.API/DatingApp.sln`; `npm run check` in `DatingApp.APP`
4. Walk-through (Swagger or the web app): register → login → wrong password ×5 = 429 locked → refresh → logout →
   refresh fails; send-otp twice < 60 s = 429; verify wrong code ×5; forgot → verify → reset → old sessions gone;
   Google One Tap + popup; sessions list + revoke; response never contains a code.
Blockers: none. Files: see CHANGELOG 2026-11-13. Next: S01-T05 web part (BUG-017), then chat auth (S01-T06) on its own branch.

Template for an unfinished task:
```
### S0X-T0Y <title>
Done: … | Remaining: … | Blockers: … | Files touched: … | Moved to sprint: …
```

## Sprint reviews
_(added at the end of each sprint)_
