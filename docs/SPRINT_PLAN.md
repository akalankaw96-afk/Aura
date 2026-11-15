# Sprint Plan

One sprint at a time. A sprint starts only after the owner approves its scope. Sprints follow the four phases of the
API spec (join → approved → match & talk → earn), with security first and cleanup/QA after.
Suggested length: 1–2 weeks each; adjust here when scope changes (and note why).

| Sprint | Goal | Status |
|---|---|---|
| 01 | Foundation & critical security | **Completed** 2026-11-14 |
| **02** | Join & get approved (profile, photos, KYC, moderator queue) | **Approved** 2026-11-14 — branch `S02-kyc` |
| 03 | Match & talk (search, views, interests, chat, dashboard summary) | Planned |
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
Includes **contact sharing API**: request (Gold only), accept, decline, cancel; phone numbers returned only to the two
members after acceptance; hidden again on block (front end done 2026-11-11, `ContactShare.tsx`).
Paged server search with filters/sort and indexes (BUG-016); metered profile views/searches/interests/chats via
`UsageCounter` (BUG-011 part); shortlist, recently viewed, saved searches; interests lifecycle wired; conversations +
messages on the secured hub; block/report persisted; dashboard summary endpoint; remove mock fallbacks (BUG-014); TD-17.

## Sprint 04 — Earn (B/U/X, AD)
Plans from DB with money in cents (TD-11); hosted payment gateway checkout + webhook (idempotent); subscriptions and
expiry; boosts (LKR 500 / 7 days, extend) server-side (BUG-011 done); admin back office: members, payments, reports,
audit log; account deactivate/delete and retention.

## Sprint 05 — Cleanup & front-end debt
Remove dead legacy UI (TD-01) and remaining palette violations (BUG-019); shared `Modal` and migrate 9 dialogs (TD-02);
storage helper (TD-05) and remaining empty catches/console calls (BUG-021); split large route files (TD-07);
single icon set (TD-08); `next/image` (TD-15).

## Sprint 06 — Quality & launch prep
Coverage on services and endpoints, E2E journeys at 1440/390, accessibility audit, performance (bundle, LCP),
security review against `SECURITY_GUIDELINES.md` checklist, staging + production setup, backups, monitoring,
Terms/Privacy content, Sinhala completion / Tamil plan (TD-16).

## Carry-over rule
Unfinished tasks keep their ID, move to the next sprint with "done / remaining / blockers" recorded in `PROGRESS.md`.
