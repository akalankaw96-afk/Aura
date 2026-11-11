# Sprint Plan

One sprint at a time. A sprint starts only after the owner approves its scope. Sprints follow the four phases of the
API spec (join → approved → match & talk → earn), with security first and cleanup/QA after.
Suggested length: 1–2 weeks each; adjust here when scope changes (and note why).

| Sprint | Goal | Status |
|---|---|---|
| **01** | Foundation & critical security | **Proposed — awaiting approval** |
| 02 | Join & get approved (profile, photos, KYC, moderator queue) | Planned |
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

## Sprint 02 — Join & get approved (spec groups A rest, P/K, AD-KYC, N basic)
Profile draft + submit API; photo upload/storage/moderation; KYC submission with ID documents (private storage);
rejected-field resubmit; moderator KYC + photo queue (role-protected); `CandidateProfile.Status` replaces `Verified`;
registration, edit-profile and KYC dashboard states wired to the API; KYC from the server (BUG-011 part); basic
notifications for KYC decisions; forgot/reset password.

## Sprint 03 — Match & talk (S, M/C, D, W)
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
