# Progress

**Status values:** Not Started · In Progress · Testing · Completed · Blocked · Deferred.
"Completed" only when acceptance criteria pass and tests/manual checks are recorded (`TESTING_GUIDELINES.md` §6).

_Last updated: 2026-11-11 — initial analysis and documentation._

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

## Documentation
| Item | Status |
|---|---|
| `CLAUDE.md` + 17 docs in `docs/` | Completed (2026-11-11) |

## Handover
_Nothing in progress. Next step: owner reviews `PROJECT_ANALYSIS.md` and `SPRINT_PLAN.md` and approves Sprint 01._

Template for an unfinished task:
```
### S0X-T0Y <title>
Done: … | Remaining: … | Blockers: … | Files touched: … | Moved to sprint: …
```

## Sprint reviews
_(added at the end of each sprint)_
