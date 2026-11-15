# Progress

**Status values:** Not Started · In Progress · Testing · Completed · Blocked · Deferred.
"Completed" only when acceptance criteria pass and tests/manual checks are recorded (`TESTING_GUIDELINES.md` §6).

_Last updated: 2026-11-14 — Sprint 02 **completed** (owner verified: register → photos → ID → submit, request changes → fix → resubmit, approve → live, edit-profile photos → New photos queue). Sprint 03 approved (branch `S03-match`)._

## Overall
| Area | State |
|---|---|
| Web UI (screens, design system) | Largely built against Figma; most screens run on demo/localStorage data |
| API | Auth group (#1–14), profiles, interests, secured chat — built and verified 2026-11-14 |
| Security | Sprint 01 critical/high issues closed; BUG-011 (client-trusted plan/usage) remains for Sprints 02–04 |
| Tests / CI | `DatingApp.Tests` (xUnit, 25 tests) + CI workflow (owner adds `.github/workflows/ci.yml`) |
| Current sprint | **03 — Match & talk** (approved 2026-11-14, branch `S03-match`) · 02 completed on `S02-kyc` |

## Sprint 01 — Foundation & critical security
| Task | Status | Notes |
|---|---|---|
| S01-T01 Secrets out of source | Completed | Secrets removed from appsettings; app refuses to start without `JwtSettings:Secret` (≥32 bytes); user-secrets id added. **Rotate** the old JWT key + Google client secret (in Git history) |
| S01-T02 CORS allow-list | Completed | `Cors:AllowedOrigins` allow-list (dev: localhost:3001/3000); production list empty until set |
| S01-T03 OTP hardening | Completed | Hashed codes, 5 min, 5 tries, 60 s resend, 3 resends/hour, per-IP limit; no master code; never in response. `ISmsSender` logs in dev only (TD-21: real provider) |
| S01-T04 Google token verification + no fake session | Completed | Google ID token (One Tap) + access token (popup) verified with Google; web fake sessions removed (register, Google, OTP, profile auto-session) |
| S01-T05 Refresh / logout / token storage | Completed | API: 15-min access token, rotating refresh token in httpOnly `vk_refresh` cookie, reuse detection. Web (2026-11-14): access token in memory only (`lib/http.ts`), restored with `/auth/refresh` after reload, old `aura_token` removed (BUG-017) |
| S01-T06 Chat authentication | Completed | Hub + chat API `[Authorize]`; identity from the JWT (`?access_token=` on the WebSocket); only matched members can chat; outsiders get 404; contact share needs the other member's accept (`ChatService`, BUG-004/005, TD-03) |
| S01-T07 Stop auto-verify on profile save | Completed | New profiles saved with `Verified = false` (2026-11-13). Existing-profile updates leave the flag unchanged |
| S01-T08 Admin link + role gate | Completed | Admin links stay out of the menu (also after merging `main`); `/admin` needs Admin/Moderator (`RequireMember role`); API policies `Admin` / `Staff` |
| S01-T09 Dashboard guest guard / KycGuard default | Completed | Guests on Dashboard / Friends / Messages → `/login?next=…` (`RequireMember`); `KycGuard` only acts for signed-in members; KYC default is "pending" |
| S01-T10 Migrations, SQL default, dev-only seed | Completed | `Migrate()` on start, SQL Server default, `InitialCreate` migration generated (2026-11-14), content seed only (no demo member) |
| S01-T11 Global ProblemDetails handler | Completed | All controllers throw `AppException` → ProblemDetails (`code`, `traceId`); match requests: 400 / 403 `PROFILE_REQUIRED` / 404 / 409; content no longer swallows DB errors |
| S01-T12 Typed fetch helper | Completed | `lib/http.ts`: `apiRequest` / `apiJson`, 15 s timeout, refresh-once on 401, `ApiError`; used by `api.ts`, `passwordReset.ts`, chat REST (TD-04) |
| S01-T13 Password hashing upgrade | Completed | PBKDF2-SHA256 600k (`v2.` format); old hashes verify and are upgraded at login |
| S01-T14 Lint, tests, CI, ui exports | Completed | `eslint.config.mjs` (+ devDeps — run `npm install`); `DatingApp.Tests` (xUnit, 17 tests: OTP, sessions, chat, interests); `.github/workflows/ci.yml` (owner to add — tool can't write `.github`); `SegmentedTabs`, `PhotoSlot`, `ButtonLink` exported |
| S01-T15 README update | Completed | Root README: start-here links to CLAUDE.md / docs, run + check commands, status |
| S01-T16 Forgot password journey | Completed | API endpoints #9–11 + change password #12 built; `services/passwordReset.ts` now calls them. Password rule aligned web ↔ API: 8+ chars, letter + number |

## Sprint 03 — Match & talk
Decisions (owner, 2026-11-14): Free plan starts at 3 searches · 5 profile views · 3 interests · 2 new chats per month
(Gold / Platinum unlimited), changeable by the admin; branch **`S03-match`**.

| Task | Status | Notes |
|---|---|---|
| S03-T01 Paged server search | Not Started | |
| S03-T02 Admin-set plan limits | Not Started | |
| S03-T03 Usage counters + LIMIT_REACHED | Not Started | |
| S03-T04 Profile views | Not Started | |
| S03-T05 Interests lifecycle | Not Started | |
| S03-T06 Shortlist + saved searches | Not Started | |
| S03-T07 Chat limits, contact share, block / report | Not Started | |
| S03-T08 Staff reports queue | Not Started | |
| S03-T09 Dashboard summary | Not Started | |
| S03-T10 Web wiring (Search, Friends, Messages, Dashboard) | Not Started | |
| S03-T11 Tests + docs | Not Started | |

## Sprint 02 — Join & get approved
Decisions (owner, 2026-11-14): files on **local disk** behind `IFileStorage` (cloud later); first **Admin from user-secrets**,
admins promote moderators; branch **`S02-kyc`** (from merged `S01-api-auth`).

| Task | Status | Notes |
|---|---|---|
| S02-T01 Profile status replaces `Verified` | Completed | `ProfileStatus` enum on `CandidateProfile` (Verified removed); only approved profiles in search / profile pages; session returns `profileStatus` |
| S02-T02 Profile draft / submit / status API | Completed | `GET /profiles/me/status`, `POST /profiles/me/submit` (`ReviewService`); new profiles start as Draft |
| S02-T03 File storage (`IFileStorage`, local disk) | Completed | `IFileStorage` + `LocalDiskFileStorage` (`App_Data/uploads`, `Storage:Root`); type by file signature, ≤ 8 MB (`FileRules`) |
| S02-T04 Photo upload API | Completed | `/api/photos` upload · mine · main · order · delete · `{id}/file` (`MediaService`); max 6; pending until approved |
| S02-T05 KYC document upload API | Completed | `/api/kyc/documents` upload (NicFront · NicBack · Passport · Selfie) · list · `{id}/file`; owner + staff only; staff views logged |
| S02-T06 Moderator review queue API | Completed | `/api/moderation` queue · profile · approve · request-changes · suspend · reinstate · pending photos · approve / reject photo (`Staff` policy, `ModerationService`, review log) |
| S02-T07 Changes-requested → resubmit flow | Completed | Resubmit after changes resolves the flags and returns the profile to the queue |
| S02-T08 Admin bootstrap + staff roles API | Completed | First Admin from `Seed:AdminPhone` / `Seed:AdminPassword`; `/api/admin` staff · find user · change role (Member / Moderator), sessions revoked on change |
| S02-T09 Web: registration photos + KYC steps on the API | Completed | Step 3 saves the profile (`POST /profiles`); step 4 uploads photos to `/api/photos` (main, extra, replace, remove, in-review badges via `useApiImage`) or picks an avatar; new step 5 "Identity" uploads NIC / passport + selfie and submits (`lib/media.ts`); stepper has 5 steps |
| S02-T10 Web: dashboard review states + edit profile on the API | Completed | Dashboard panel from `GET /profiles/me/status` (Draft checklist, flagged fields with Fix links); `/profile/complete` (details → photos → ID & selfie → submit); Edit profile: About → `PATCH /profiles/me/about` (≥ 50 chars, no phone / e-mail / link), Photos → `/api/photos` straight away (new photos go to the staff New photos queue); no `vk-profile` localStorage |
| S02-T11 Web: staff back office (queue + review) | Completed | `/admin` (`StaffConsole`): review queue → profile review (photos with approve / reject, ID documents shown in-page or in a new tab — each view logged, details, history) → Approve · Request changes (tick fields + reasons) · Suspend / Reinstate; New photos tab; Staff tab (Admin): find by mobile, make / remove moderator. "Staff area" in the account menu for Admin / Moderator (`lib/staff.ts`) |
| S02-T12 Basic notifications for KYC decisions | Completed | `Notifications` table + `/api/notifications` (list, unread count, read, read all); SMS on approve / changes / suspend |
| S02-T13 Tests + docs | Completed | `ReviewFlowTests` (7), registration + profile tests; owner verified the full flow on 2026-11-14 |

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
| Profile details redesign (square photo + thumbs, sections, blurred locked fields) | Completed | Tested 1440/390, member + guest, no overflow; build passes |
| Forgot password back button (all 3 steps) | Completed | Tested 1440/390: each step goes back one step, step 1 → /login; build passes |
| Hero search bar: Sinhala text wrapping fixed | Completed | Checked SI/EN 1440, 1024, 768, 390 light/dark |
| Feedback popup for paid members (rating, review, private feedback, success story) | Completed (front end) | Tested 1440 light/dark + 390: all 5 steps, validation, auto-open rules (free, day 2, shown 5 d ago, report 2 d ago → no popup; clean → popup; Not now → none), Free toast; `tsc` clean. API pending |
| Dashboard: active promotion card under hero | Completed | Checked 1440 dark, Gold + active boost; `tsc` clean |
| Dashboard: Promote + plan cards moved above Best matches (paid states) | Completed | Checked 1440 dark, Gold state |
| Remove em dashes from all UI text | Completed | 0 left outside code comments; `tsc` clean; 8 main pages load (200). How to use screenshots need re-capture |
| Search list card: match pill removed | Completed | Checked 1440 dark; `tsc` clean |
| Search list card: About me (KYC) + Created by | Completed | Checked 1440 light/dark + 390; `tsc` clean. Real API must return the KYC `about` text as `bio` |
| Chat header ⋯ button styled as round outline button | Completed | Checked 1440 light + dark, default + hover |
| Dark mode colour pass (tokens, focus ring, photo badges, pinned notes, gold band) + focus/hover fix | Testing | Checked in dark at 1440: home, login focus, dashboard, search, profile, friends, How to use; light unchanged; `tsc` clean. Needs 390 px + real-device review |

## Owner requests
| Change | Status | Notes |
|---|---|---|
| Remove all demo data from the app (owner request) | Testing | 2026-11-14: tsc clean in a harness (React types from the project, stubs for Next/icons); needs `npm run check` + walk-through on the owner machine. Files: CHANGELOG "All demo data removed" |

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
2026-11-13 later: build + `InitialCreate` migration succeeded on the owner's machine (SQL Express); API serves seeded
content. Registration wired to the API (see CHANGELOG "Registration now saves to the database"). The built-in test
browser can't make cross-port calls, so the end-to-end registration check runs in the owner's browser.
Blockers: none. Files: see CHANGELOG 2026-11-13.

### S01 completion + merge of `main` (2026-11-14)
- Sprint 01 code is complete; every S01 task is **Testing** until the owner runs `dotnet build`, `dotnet test`,
  `npm.cmd install`, `npm.cmd run lint`, `npm.cmd run check` and a manual pass (register → login → reload → chat between two matched members).
- `main` merged into `S01-api-auth`; 15 conflicts resolved (13 web, 2 docs). Rule used: keep main's new features (feedback
  popup, promote card placement, styling) and keep this branch wherever main brought back demo data (sample stories, fake
  "100+ couples", sample requests / conversations, hard-coded phone, Demo tips, staff links, client-side plan/KYC switching).
  Retired demo files that main had edited are back to empty stubs (TD-01).
- 2026-11-14 registration data fix (BUG-023): owner must run `dotnet ef migrations add RegistrationDataFix -p DatingApp.Infrastructure -s DatingApp.WebApi` before starting the API.
- Not verified here: C# was reviewed by hand only (no .NET in the assistant's workspace); web passes `tsc`.

Template for an unfinished task:
```
### S0X-T0Y <title>
Done: … | Remaining: … | Blockers: … | Files touched: … | Moved to sprint: …
```

## Sprint reviews
_(added at the end of each sprint)_
