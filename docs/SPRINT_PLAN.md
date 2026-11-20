# Sprint Plan

One sprint at a time. A sprint starts only after the owner approves its scope. Sprints follow the four phases of the
API spec (join → approved → match & talk → earn), with security first and cleanup/QA after.
Suggested length: 1–2 weeks each; adjust here when scope changes (and note why).

| Sprint | Goal | Status |
|---|---|---|
| 01 | Foundation & critical security | **Completed** 2026-11-14 |
| 02 | Join & get approved (profile, photos, KYC, moderator queue) | **Completed** 2026-11-14 |
| **03** | Match & talk (search, views, interests, chat, dashboard summary) | **Approved** 2026-11-14 — branch `S03-match` |
| 04 | Earn (plans, payments, subscriptions, boosts, admin) | Planned |
| 05 | Cleanup & front-end debt | Planned |
| 06 | Quality: test coverage, E2E, performance, accessibility, launch prep | Planned |

---

## Sprint 01 — Foundation & critical security
**Goal:** no known critical/high security holes in what already exists; a safe base (migrations, errors, CI) to build on.
**Dependencies:** none. **Risk:** auth changes touch login/registration screens — re-test all auth flows.

| ID | Task | Fixes | Acceptance criteria |
|---|---|---|---|
| S01-T01 | Secrets out of source; fail fast; rotate JWT key | BUG-007 | No secret in any committed file; app refuses to start without `Jwt:Key`; README explains user-secrets |
| S01-T02 | CORS allow-list per environment | BUG-006 | Only configured origins get CORS headers; credentials only for them |
| S01-T03 | OTP hardening: hashed, expiry, attempts, throttle, no master code, not echoed; `ISmsSender` (dev = log) | BUG-001 | Integration tests: wrong code fails, 6th attempt locked, response has no code |
| S01-T04 | Verify Google ID token server-side; remove client fake session | BUG-002, BUG-003 | Forged token → 401; API down → UI error, no session |
| S01-T05 | Access + refresh tokens, logout, revoke; refresh in httpOnly cookie; token out of localStorage | BUG-008, BUG-017 | 15-min access, rotating refresh, logout invalidates; web refreshes once on 401 |
| S01-T06 | Chat auth: `[Authorize]` controller + hub, identity from claims, match check, `IChatService` | BUG-004, BUG-005, TD-03 | Anonymous → 401; non-participant → 403; sender always the caller |
| S01-T07 | Profile save no longer sets `Verified` | BUG-009 | Saving a profile leaves KYC status unchanged (test) |
| S01-T08 | Hide admin link; `/admin` requires Admin role claim | BUG-010 | Member never sees link; direct `/admin` → redirect |
| S01-T09 | Guest guard on `/dashboard`; `KycGuard` default = not submitted | BUG-012 | Guest → `/login?next=/dashboard` |
| S01-T10 | EF migrations baseline, SQL by default, demo seed Development-only | BUG-013, BUG-015, TD-10 | `InitialCreate` applies on empty DB; prod config seeds no members |
| S01-T11 | Global exception handler + ProblemDetails + validation | TD-12 | Errors match `API_GUIDELINES.md` §4 |
| S01-T12 | Typed fetch helper with timeout + ApiError; remove mock fallbacks in auth calls | TD-04, TD-14 (part) | All auth calls go through it |
| S01-T13 | Password hashing upgrade with rehash-on-login | BUG-018 | Old hashes still log in and are upgraded |
| S01-T14 | Tooling: ESLint config, test projects (xUnit, Vitest, Playwright), GitHub Actions CI; export `SegmentedTabs`/`PhotoSlot`/`ButtonLink` | BUG-020, TD-13, TD-09 | CI green on lint, typecheck, build, tests |
| S01-T15 | Update root README to point at `CLAUDE.md` / `docs/` | BUG-022 | README status matches `PROGRESS.md` |
| S01-T16 | Forgot password: Email or Mobile → 6-digit code → new password; 3 endpoints; revoke sessions + "password changed" alert | TD-18 | Same response for unknown accounts; code 5 min / 5 tries / 60 s resend / 3 resends; reset token single use 10 min; all refresh tokens revoked |

## Sprint 02 — Join & get approved (spec groups A rest, P/K, AD-KYC, N basic)
**Goal:** a new member can register, upload photos and ID, submit for review, and a moderator can approve them or ask
for changes — all on the API, nothing decided in the browser.
**Dependencies:** Sprint 01. **Decisions (owner, 2026-11-14):** local-disk storage behind `IFileStorage`; first Admin
from user-secrets; branch `S02-kyc`. **Risk:** ID documents are sensitive — private storage, staff-only access, audit trail.

| ID | Task | Fixes | Acceptance criteria |
|---|---|---|---|
| S02-T01 | `CandidateProfile.Status` (Draft · Submitted · ChangesRequested · Resubmitted · Approved · Suspended) replaces `Verified`; migration maps existing rows | BUG-011 (part) | Only moderators change status; old `Verified = 1` rows become Approved |
| S02-T02 | Profile API: save draft, submit for review, `GET /profiles/me/status` (status, flagged fields with reasons) | — | Submit needs required fields + main photo + ID; status comes only from the server |
| S02-T03 | `IFileStorage` + local-disk implementation (private folder outside web root), type/size checks, random names | — | Only JPEG/PNG/WebP/PDF; ≤ 8 MB; files never served by a public static path |
| S02-T04 | Photos: upload (≤ 6), set main, reorder, delete; each photo pending until approved; served through an authorised endpoint | — | Others see approved photos only; guests see none |
| S02-T05 | KYC documents: NIC / passport (front, back) + selfie; owner can upload/replace while not approved; staff can view | — | Documents readable only by the owner and staff; every staff view logged |
| S02-T06 | Moderator queue (`Staff` policy): list submitted / resubmitted, open a profile with photos + documents, approve, request changes per field (reason), reject a photo | BUG-010 (back office) | Members get 403; decisions recorded with moderator + time |
| S02-T07 | Changes requested → member edits the flagged fields → resubmit | — | Only flagged fields need changes; resubmitted profiles return to the queue |
| S02-T08 | Admin bootstrap from user-secrets (`Seed:AdminPhone`, `Seed:AdminPassword`); Admin can promote/demote moderators | — | No admin created without secrets; role changes need `Admin` policy |
| S02-T09 | Web: registration photo step uploads to the API (real photos + avatars); KYC step uploads documents | TD-01 (part) | Photos survive reload / other device; no image data in localStorage |
| S02-T10 | Web: dashboard review panel, review-status page, edit profile and "fix flagged fields" use the API | BUG-011 (part) | No `vk-kyc` / review state in localStorage |
| S02-T11 | Web: staff back office at `/admin` (queue, review screen with photos + documents, decisions) | BUG-010 | Works only for Admin / Moderator |
| S02-T12 | Notifications (basic): stored in-app notifications + SMS on approve / changes requested; `GET /notifications` | — | Member sees the decision on the dashboard and by SMS |
| S02-T13 | Tests (status rules, file checks, access to documents, queue) + docs | TD-13 | `dotnet test` green; docs updated |

## Sprint 03 — Match & talk (S, M/C, D, W)
**Goal:** approved members find each other, send interests and chat — with the free-plan limits enforced by the server
(and changeable by the admin), not by the browser.
**Dependencies:** Sprint 02 (only approved profiles are visible). **Decisions (owner, 2026-11-14):** starting Free limits per month — 3 searches, 5 profile views, 3 interests, 2 new chats (Gold / Platinum unlimited), all changeable by the admin; branch `S03-match`. **Risk:** limits touch search, profile views,
interests and chat at once — one shared usage service, tested.

| ID | Task | Fixes | Acceptance criteria |
|---|---|---|---|
| S03-T01 | Paged server search: filters (gender, age, religion, district, profession, height…), sort, paging, indexes; hide self, blocked and suspended | BUG-016 | 20 per page; filters run in SQL; response has total count |
| S03-T02 | Plan limits set by the admin (`PlanLimit`: searches / profile views / interests / new chats per month per plan) + admin screen | owner decision 2026-11-14 | Admin changes a number → applies at once; defaults seeded |
| S03-T03 | `UsageCounter` service: counts per member per month; 402 `LIMIT_REACHED` with limit + reset date; `GET /me/usage` | BUG-011 (part) | Web counters come from the API; localStorage counters removed |
| S03-T04 | Profile views: record a view, "who viewed me" (paid), recently viewed | — | Viewing your own profile isn't counted; paid gate on the server |
| S03-T05 | Interests lifecycle: send (limited), withdraw, accept / decline, list sent / received / matched; notifications | BUG-014 (part) | Friends screen fully on the API |
| S03-T06 | Shortlist (favourites) and saved searches on the API | — | Survive reload / other device; no localStorage |
| S03-T07 | Chat: plan limit on starting conversations, contact share decline / cancel on the hub, block / report persisted | TD-20, TD-24 | Blocked members can't message; reports reach the staff area |
| S03-T08 | Staff: reports queue (view, dismiss, suspend) | — | Moderator handles a report end-to-end |
| S03-T09 | Dashboard summary endpoint (counts: interests, views, matches, unread messages, usage) | — | Dashboard stats from one call |
| S03-T10 | Web wiring: Search, profile page, Friends, Messages, Dashboard on these APIs; remove remaining mock fallbacks | BUG-014 | No sample data or browser-only state for these features |
| S03-T11 | Tests (search filters, limits, interests, block) + docs | TD-13 | `dotnet test` green; docs updated |

## Sprint 04 — Earn (B/U/X, AD) — completed 2026-11-17
**Goal:** members can pay for Gold / Platinum and boosts, the server decides who is paid (no more client-trusted plan
or boost), and staff can see and manage members and payments.
**Dependencies:** Sprint 03 (plan limits read the member's plan). **Decisions (owner, 2026-11-16):** payment by **bank
transfer only for now** — the member gets an order reference and the bank details, uploads the slip, staff approve it
(an online gateway such as PayHere comes later, TD-31); **prices as on the Plans page**, stored in the database and
editable by the admin: Gold LKR 2,500 / 6,375 / 11,250 and Platinum 6,500 / 16,575 / 29,250 for 1 / 3 / 6 months,
boost LKR 500 for 7 days; **no auto-renew** — a reminder 3 days before the end, renewing early adds to the end date;
branch **`S04-pay`**. Roles & staff (custom roles, staff usernames) postponed to a later sprint (owner, 2026-11-16). **Risk:** money and entitlements — amounts in cents, every approval audited, idempotent decisions.

| ID | Task | Fixes | Acceptance criteria |
|---|---|---|---|
| S04-T01 | Plans and prices in the database (`PlanPrice`: plan, months, amount in cents, LKR; boost product); `GET /api/plans`; admin edits prices (staff area) | TD-11 | Plans page shows prices from the API; admin change shows at once; money never stored as text |
| S04-T02 | Subscriptions (`Subscription`: plan, starts, ends, status, payment); the plan comes from the active subscription (replaces `Premium`); expiry; reminder (in-app + SMS) 3 days before; `GET /api/me/subscription` | BUG-011 (plan) | Gold ends on its date → back to Free limits; early renewal extends; reminder sent once |
| S04-T03 | Bank-transfer orders (`Payment`: product, plan / months or boost, amount, reference `VK-G3-XXXXXX` made by the server, status, slip); create order, upload slip (JPEG / PNG / WebP / PDF ≤ 10 MB to match the Payment page, `IFileStorage`), my payments; bank details from configuration | — | Member sees the amount, reference and bank details; slip upload is private (owner + staff) |
| S04-T04 | Staff payments queue: awaiting review, view slip (logged), approve → starts / extends the plan or boost, reject with a reason; member notified (in-app + SMS) | — | Approval is one-time (no double plan); every decision recorded with staff + time |
| S04-T05 | Boosts on the server (`Boost`: profile, starts, ends, payment); paid + approved members; extend by 7 days; promoted profiles first in search with a "Promoted" flag; `GET /api/boosts/me` | BUG-011 (boost) | Boost shows only after approval and ends on its date |
| S04-T06 | Web: Plans → "Pay by bank transfer" (order → bank details + reference → upload slip → waiting), payment history, dashboard plan card and expiry from the API, boost flow from the API; remove localStorage plan / boost; Plans copy matches the real Free limits | BUG-011 | Editing localStorage gives nothing; whole flow works in the browser |
| S04-T07 | Admin back office: members list / search (mobile, code, name), member detail (plan, payments, reports, review history, role), payments list + CSV export, audit log | — | Admin finds a member and sees their full history in one place |
| S04-T08 | Account: deactivate (hidden, can come back) and delete request (data anonymised after 30 days); retention rules documented | — | Deactivated members vanish from search / lists; deletion runs after 30 days |
| S04-T09 | Tests (prices, subscription dates, approve once, expiry, boost order in search) + docs | TD-13 | `dotnet test` green; docs updated |

## Sprint 05 — Cleanup & front-end debt
**Status:** completed 2026-11-19 — all 10 tasks owner checked; web tests 40 / 40 (see `PROGRESS.md`).
**Goal:** no behaviour changes for members — make the web app easier and safer to change: one shared dialog, one
storage helper, no silent errors, smaller route files, one icon set, colours that actually render, first web tests.
**Branch:** `S05-Cleanup-&-front-end-debt` (from `main` after Sprint 04, 2026-11-17).
**Decisions (owner, 2026-11-17):** `/components` showcase stays for development only (404 in production builds); admin
member detail + payments CSV (TD-32) move to Sprint 06; add web tests with Vitest + Testing Library (owner runs one
`npm install`).
**Measured 2026-11-17:** legacy demo stubs (TD-01) already deleted; old staff console wrapper still in use by the
admin pages (TD-29); 14 hand-built dialogs; 6 classes from a missing palette (`amber`) + ~18 opacity modifiers on
CSS-variable colours that render nothing (BUG-019); 19 empty `catch {}`, 11 `console` calls, 66 direct
localStorage / sessionStorage calls in 25 files; `messages/page.tsx` 1,033 lines, `search/page.tsx` 790;
`lucide-react` in 4 files; 48 `<img>` tags.

| ID | Task | Fixes | Acceptance criteria |
|---|---|---|---|
| S05-T01 | Dead code: move the parts of `sections/admin/StaffConsole.tsx` used by `/admin/*` into `components/admin/`, delete `AdminScreen` + the tabbed wrapper; `/components` page dev-only; remove unused exports / files found by a search | TD-01 (close), TD-29 | Every admin page works as before; deleted files listed in CHANGELOG; `tsc` + build green |
| S05-T02 | Colours: replace the `amber` classes with warning tokens; make opacity modifiers work (alpha-ready colour tokens or scrim tokens) for black / white / brand / surface / error | BUG-019 | No class from a missing palette; every `/NN` modifier renders (checked in light + dark) |
| S05-T03 | Shared `ui/Modal` (portal, focus trap, Esc, click-outside option, scroll lock, `aria-modal`, labelled title, mobile sheet style) + `ConfirmDialog` | TD-02 | Keyboard: Tab stays inside, Esc closes, focus returns to the opener; screen-reader title |
| S05-T04 | Move the member dialogs to `Modal`: login required, upgrade, edit profile, promote, profile view, share profile, chat safety, account settings, feedback, guided tour | TD-02 | Same look and steps as now; no hand-built overlay left in member screens |
| S05-T05 | Move the admin dialogs to `Modal` / `ConfirmDialog` (members, roles, mobile sidebar drawer) | TD-02 | Same as T04 for the staff area |
| S05-T06 | `lib/storage.ts` (typed keys, safe read / write / remove, session + local) and replace direct storage calls; no empty `catch {}` (log once in dev or show an error); remove stray `console` calls; chat REST helpers throw `ApiError` instead of returning `[]` | TD-05, BUG-021, BUG-014 (rest) | 0 empty catches, 0 `console` outside `lib/log.ts`, storage keys in one file; chat shows an error state when the API fails |
| S05-T07 | Split `messages/page.tsx` and `search/page.tsx` into hooks + components (`components/sections/messages/*`, `…/search/*`); each file ≤ 400 lines | TD-07 | Chat and search behave the same (send, read, typing, contact share, block; filters, paging, saved searches, promoted row) |
| S05-T08 | One icon set: replace `lucide-react` (4 files) with iconsax; remove the dependency | TD-08 | `lucide-react` gone from `package.json` and `src` |
| S05-T09 | `next/image` for static images (brand, illustrations, avatars); member photos keep `useApiImage` (private files need the token) | TD-15 | No `<img>` for files under `public/`; layout unchanged |
| S05-T10 | Web tests (Vitest + Testing Library + jsdom): `Modal` (focus, Esc), `ConfirmDialog`, `lib/storage`, `lib/http` error mapping; `npm test` script; docs | TD-13 (web) | `npm test` green; `tsc`, `npm run lint`, `next build` green; docs updated |

## Sprint 06 — Quality & launch prep
Coverage on services and endpoints, E2E journeys at 1440/390, accessibility audit, performance (bundle, LCP),
security review against `SECURITY_GUIDELINES.md` checklist, staging + production setup, backups, monitoring,
Terms/Privacy content, Sinhala completion / Tamil plan (TD-16).

## Carry-over rule
Unfinished tasks keep their ID, move to the next sprint with "done / remaining / blockers" recorded in `PROGRESS.md`.
