# Progress

**Status values:** Not Started · In Progress · Testing · Completed · Blocked · Deferred.
"Completed" only when acceptance criteria pass and tests/manual checks are recorded (`TESTING_GUIDELINES.md` §6).

_Last updated: 2026-11-11 — forgot password journey (front end)._

## Overall
| Area | State |
|---|---|
| Web UI (screens, design system) | Largely built against Figma; most screens run on demo/localStorage data |
| API | 19 of ~102 endpoints; several insecure (see `BUG_TRACKER.md`) |
| Security | 5 critical + 6 high open issues |
| Tests / CI | None |
| Current sprint | **01 — Foundation & critical security (awaiting approval)** |

## Sprint 01 — Foundation & critical security
| Task | Status | Notes |
|---|---|---|
| S01-T01 Secrets out of source | Not Started | |
| S01-T02 CORS allow-list | Not Started | |
| S01-T03 OTP hardening | Not Started | |
| S01-T04 Google token verification + no fake session | Not Started | |
| S01-T05 Refresh / logout / token storage | Not Started | |
| S01-T06 Chat authentication | Not Started | |
| S01-T07 Stop auto-verify on profile save | Not Started | |
| S01-T08 Admin link + role gate | Not Started | |
| S01-T09 Dashboard guest guard / KycGuard default | Not Started | |
| S01-T10 Migrations, SQL default, dev-only seed | Not Started | |
| S01-T11 Global ProblemDetails handler | Not Started | |
| S01-T12 Typed fetch helper | Not Started | |
| S01-T13 Password hashing upgrade | Not Started | |
| S01-T14 Lint, tests, CI, ui exports | Not Started | |
| S01-T15 README update | Not Started | |
| S01-T16 Forgot password journey | In Progress | Front end **done & tested** (demo adapter). Remaining: 3 API endpoints, SMS + e-mail sender — built with S01-T03/T05 |

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

Next step: owner approves the rest of Sprint 01.

Template for an unfinished task:
```
### S0X-T0Y <title>
Done: … | Remaining: … | Blockers: … | Files touched: … | Moved to sprint: …
```

## Sprint reviews
_(added at the end of each sprint)_
