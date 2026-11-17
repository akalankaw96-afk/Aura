# Technical Debt

Shortcuts and structural problems that don't break a feature today but slow every future change.
Bugs go to `BUG_TRACKER.md`; debt goes here. Add an item whenever you knowingly take a shortcut.

**Priority:** P1 (fix before building on it) · P2 (fix in the cleanup sprint) · P3 (opportunistic).
**Status:** Open · Planned (sprint no.) · Done.

| ID | P | Area | Item | Impact | Status |
|---|---|---|---|---|---|
| TD-01 | P2 | Web | ~4,260 lines of dead legacy UI | Confuses search/AI tools; holds most palette violations (BUG-019) | Planned (05) — 2026-11-14: legacy files emptied to stubs; delete them (list in CHANGELOG) |
| TD-02 | P2 | Web | 9 hand-built modals, no shared `Modal`/`Dialog` | Inconsistent focus trap, Esc, scroll lock, portal, a11y | Planned (05) |
| TD-03 | P1 | API | `ChatController` and `ChatHub` use the DbContext directly | Business rules in the transport layer; untestable | Done (verified 2026-11-14) — 2026-11-14 moved to `Application/Services/ChatService.cs` (unit-tested) |
| TD-04 | P1 | Web | No typed fetch helper (timeouts, errors, auth header, refresh) | Every call re-implements error handling; mock fallbacks hide failures | Done (verified 2026-11-14) — 2026-11-14 `lib/http.ts` |
| TD-05 | P2 | Web | localStorage / sessionStorage accessed directly with try/catch everywhere | ~31 empty catches; key names scattered | Planned (05) |
| TD-06 | P1 | Web | Business state (plan, KYC, usage, boost, connections) in localStorage | Must move to API (BUG-011); screens read `lib/*` directly | Planned (02–04) |
| TD-07 | P2 | Web | Large route files mixing data, state and layout (`messages/page.tsx` 933 lines, `search/page.tsx` 659) | Hard to review and test | Planned (05) |
| TD-08 | P3 | Web | Two icon libraries (iconsax-react + lucide-react) | Visual inconsistency, extra bundle | Planned (05) |
| TD-09 | P2 | Web | `SegmentedTabs`, `PhotoSlot`, `ButtonLink` not exported from `ui/index.ts` | Imports by path; easy to miss and duplicate | Planned (01) |
| TD-10 | P1 | API | No EF migrations (`EnsureCreated`) | Schema changes impossible without data loss (BUG-013) | Done (verified 2026-11-14) — `Migrate()` + `InitialCreate` (2026-11-14) |
| TD-11 | P2 | API | `CandidateProfile` stores lists as strings (`Interests` CSV, `SubmittedDetailsJson`, `PricingPlan.FeaturesJson`, `Price` as string) | No querying/validation; money as text | Planned (02/04) |
| TD-12 | P2 | API | No global exception handler / ProblemDetails; no request validation library | Inconsistent error shape for the web app | Global handler done; all controllers use `AppException` (2026-11-14). Validation library still open |
| TD-13 | P1 | All | No automated tests, no CI | Every change re-tested by hand | In progress — 2026-11-14 `DatingApp.Tests` (17 tests) + CI workflow; coverage in Sprint 06 |
| TD-14 | P3 | Web | Two session-storage key schemes; the same 6 session keys written in three places in `api.ts` | Drift between login paths | Done (verified 2026-11-14) — one `storeSession` / `clearLocalSession`, `aura_token` + `aura_auth_user` removed (2026-11-14) |
| TD-15 | P3 | Web | Images use `<img>` instead of `next/image` | LCP/bandwidth on mobile | Open |
| TD-16 | P3 | Web | Tamil not started; Sinhala partial | Copy debt grows with each screen | Open |
| TD-17 | P2 | API | Hub loads the profile twice per message | Extra DB round trips under chat load | Done (verified 2026-11-14) — one query per message in `ChatService` (2026-11-14) |
| TD-18 | P1 | Web | `services/passwordReset.ts` is a demo adapter (fixed code, in-memory attempts) | Forgot password doesn't really work until the API exists | Planned (01) — adapter replaced by real API calls 2026-11-13; Done after verification |
| TD-20 | P1 | Web | Contact sharing runs on local state + demo phone numbers; decline/cancel not sent to the hub | Works only in the browser until the API exists | API done 2026-11-14 (S03-T07: hub decline / cancel, `contactShareState`); web wired 2026-11-15 (S03-T10) — **Resolved**, owner verified 2026-11-16 |
| TD-21 | P1 | API | SMS and e-mail senders are log-only placeholders (`LoggingSmsSender`, `LoggingEmailSender`) | Codes and "password changed" alerts aren't delivered outside Development; pick providers before launch | Open |
| TD-22 | P3 | Web | Forgot-password Demo tips still show the old fixed codes; real codes now appear in the API console (Development) | Misleading for testers | Done (2026-11-14, Demo tips removed) |
| TD-19 | P3 | Web | `IdentifierTabs` active segment barely stands out in dark theme (`bg-surface-card` ≈ track) — same as Login before | Low contrast for the selected method in dark mode | Done (2026-11-11, brand-gradient `SegmentedSwitch`) |
| TD-23 | P2 | API | Chat presence (`PresenceTracker`) is in memory | "Online" is wrong with more than one API server | Open — move to Redis / SignalR backplane before scaling out |
| TD-24 | P1 | API | Gold-only chat / contact share is enforced in the web app only | Free members could call the hub directly | API done 2026-11-14 (S03-T07): `RequestContactShare` needs Gold → `PLAN_REQUIRED`; new chats limited by `NewChat` plan limit — **Resolved**, owner verified 2026-11-16 |
| TD-25 | P2 | API | Edits to an approved profile (name, birth date, photos excepted) are not re-reviewed | A member could change checked details after approval | Planned (03) — re-review of sensitive fields |
| TD-26 | P1 | API | ID documents stored unencrypted on local disk | Disk access = document access; needs encryption at rest / cloud storage with KMS before launch | Planned (06) |
| TD-27 | P3 | API | Approved photos load by an unguessable link without login | Links can be shared outside the app | Accepted for now (images in `<img>` can't send a token); revisit with signed URLs |
| TD-28 | P1 | Web/API | Staff area members, stats, roles and staff accounts run on demo data in development (`lib/adminApi.ts`); the sidebar only knows Admin vs Moderator, not per-role permissions | Pages show "needs the API" in production; custom roles have no effect until the API enforces permissions | Planned (API endpoints in API_GUIDELINES → Planned: admin back office) |
| TD-29 | P3 | Web | Old staff console `sections/admin/AdminScreen.tsx` (tab UI) is no longer used by any route | Dead code | Open — delete once the new admin pages are approved |

## Rules
- Paying down debt is a task in a sprint with acceptance criteria — not a side effect of a feature task.
- Removing "dead" code: prove it is unused (`grep -rlw Name src`, build passes) and list the files in `CHANGELOG.md`.
- When an item is done, set **Done**, add the sprint and the commit/PR reference.
