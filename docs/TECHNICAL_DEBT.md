# Technical Debt

Shortcuts and structural problems that don't break a feature today but slow every future change.
Bugs go to `BUG_TRACKER.md`; debt goes here. Add an item whenever you knowingly take a shortcut.

**Priority:** P1 (fix before building on it) · P2 (fix in the cleanup sprint) · P3 (opportunistic).
**Status:** Open · Planned (sprint no.) · Done.

| ID | P | Area | Item | Impact | Status |
|---|---|---|---|---|---|
| TD-01 | P2 | Web | ~4,260 lines of dead legacy UI | Confuses search/AI tools; holds most palette violations (BUG-019) | Done (verified 2026-11-19) — retired stubs deleted (checked 2026-11-17); S05-T01 removed the old staff console wrapper and the unused `content/featuredAbout.ts` |
| TD-02 | P2 | Web | 9 hand-built modals, no shared `Modal`/`Dialog` | Inconsistent focus trap, Esc, scroll lock, portal, a11y | In progress — `ui/Modal` + `ConfirmDialog` built 2026-11-19 (S05-T03); 11 member dialogs moved (S05-T04); admin confirm, staff forms and staff menu moved (S05-T05); left: Search filter drawer (T07) |
| TD-03 | P1 | API | `ChatController` and `ChatHub` use the DbContext directly | Business rules in the transport layer; untestable | Done (verified 2026-11-14) — 2026-11-14 moved to `Application/Services/ChatService.cs` (unit-tested) |
| TD-04 | P1 | Web | No typed fetch helper (timeouts, errors, auth header, refresh) | Every call re-implements error handling; mock fallbacks hide failures | Done (verified 2026-11-14) — 2026-11-14 `lib/http.ts` |
| TD-05 | P2 | Web | localStorage / sessionStorage accessed directly with try/catch everywhere | ~31 empty catches; key names scattered | Done (verified 2026-11-19) — S05-T06: `lib/storage.ts`, 0 direct calls left (inline theme script excepted) |
| TD-06 | P1 | Web | Business state (plan, KYC, usage, boost, connections) in localStorage | Must move to API (BUG-011); screens read `lib/*` directly | Planned (02–04) |
| TD-07 | P2 | Web | Large route files mixing data, state and layout (`messages/page.tsx` 933 lines, `search/page.tsx` 659) | Hard to review and test | Done (verified 2026-11-19) — S05-T07: Messages 1,055 → 80 lines, Search 790 → 222; hooks + parts in `components/sections/messages/` and `components/sections/search/`, every file ≤ 400 lines |
| TD-08 | P3 | Web | Two icon libraries (iconsax-react + lucide-react) | Visual inconsistency, extra bundle | Done (verified 2026-11-19) — S05-T08: iconsax only; `lucide-react` removed |
| TD-09 | P2 | Web | `SegmentedTabs`, `PhotoSlot`, `ButtonLink` not exported from `ui/index.ts` | Imports by path; easy to miss and duplicate | Planned (01) |
| TD-10 | P1 | API | No EF migrations (`EnsureCreated`) | Schema changes impossible without data loss (BUG-013) | Done (verified 2026-11-14) — `Migrate()` + `InitialCreate` (2026-11-14) |
| TD-11 | P2 | API | `CandidateProfile` stores lists as strings (`Interests` CSV, `SubmittedDetailsJson`, `PricingPlan.FeaturesJson`, `Price` as string) | No querying/validation; money as text | Money part done 2026-11-16 (S04-T01: `PlanPrices` / `Payments` in cents); `PricingPlan.Price` (old content table) and the CSV / JSON profile fields remain |
| TD-12 | P2 | API | No global exception handler / ProblemDetails; no request validation library | Inconsistent error shape for the web app | Global handler done; all controllers use `AppException` (2026-11-14). Validation library still open |
| TD-13 | P1 | All | No automated tests, no CI | Every change re-tested by hand | In progress — `DatingApp.Tests` 72 tests (2026-11-17) + CI workflow; web: Vitest + Testing Library, 40 tests (`npm test`, S05-T10, 2026-11-19); coverage + E2E in Sprint 06 |
| TD-14 | P3 | Web | Two session-storage key schemes; the same 6 session keys written in three places in `api.ts` | Drift between login paths | Done (verified 2026-11-14) — one `storeSession` / `clearLocalSession`, `aura_token` + `aura_auth_user` removed (2026-11-14) |
| TD-15 | P3 | Web | Images use `<img>` instead of `next/image` | LCP/bandwidth on mobile | Done (verified 2026-11-19) — S05-T09: all 18 static images on `next/image`; member photos / API files / previews stay `<img>` (private, token) |
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
| TD-28 | P1 | Web/API | Staff area roles and staff accounts run on demo data in development (`lib/adminApi.ts`; stats and members are real since S04-T07); the sidebar only knows Admin vs Moderator, not per-role permissions | Pages show "needs the API" in production; custom roles have no effect until the API enforces permissions | Planned (API endpoints in API_GUIDELINES → Planned: admin back office). Custom roles / staff usernames postponed by the owner 2026-11-16 — Admin and Moderator only for now |
| TD-29 | P3 | Web | Old staff console wrapper (`sections/admin/AdminScreen.tsx` and the tabbed `StaffConsole` component) is no longer used by any route; its parts (review screen, queue, photos, reports, plan limits, prices) are used by the `/admin/*` pages | Dead code | Done (verified 2026-11-19) — 2026-11-17 S05-T01: parts moved to `components/admin/{ReviewQueue,StaffManager,PlanLimitsEditor,ReportsQueue,PricesEditor}.tsx` + `staffHelpers.ts`; `AdminScreen.tsx` and `StaffConsole.tsx` deleted |
| TD-30 | P2 | API + Web | Search: multi-select religion / profession, countries, height, "with photo" and the "More" filters (ethnicity, civil status, education, posted by) run on the loaded page only (counted as a search via `filtered=true` since 2026-11-15) | With many members a match on a later API page shows only after "Load more" | Planned: list parameters + KYC detail columns on the search API (Sprint 05/06) |
| TD-31 | P2 | API + Web | No online payment gateway — bank transfer with manual approval only (owner decision 2026-11-16) | Slower activation; staff must check every slip | Planned after Sprint 04: PayHere hosted checkout + notify callback (needs a public URL), same `Payment` records |
| TD-32 | P3 | Web/API | Admin back office: no member detail page (plan, payments, reports, review history in one place) and no payments CSV export — planned in S04-T07, not built | Staff open several screens to see one member's history | Planned (Sprint 06 — owner, 2026-11-17) |

## Rules
- Paying down debt is a task in a sprint with acceptance criteria — not a side effect of a feature task.
- Removing "dead" code: prove it is unused (`grep -rlw Name src`, build passes) and list the files in `CHANGELOG.md`.
- When an item is done, set **Done**, add the sprint and the commit/PR reference.
