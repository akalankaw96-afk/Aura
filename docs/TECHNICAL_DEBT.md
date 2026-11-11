# Technical Debt

Shortcuts and structural problems that don't break a feature today but slow every future change.
Bugs go to `BUG_TRACKER.md`; debt goes here. Add an item whenever you knowingly take a shortcut.

**Priority:** P1 (fix before building on it) · P2 (fix in the cleanup sprint) · P3 (opportunistic).
**Status:** Open · Planned (sprint no.) · Done.

| ID | P | Area | Item | Impact | Status |
|---|---|---|---|---|---|
| TD-01 | P2 | Web | ~4,260 lines of dead legacy UI | Confuses search/AI tools; holds most palette violations (BUG-019) | Planned (05) |
| TD-02 | P2 | Web | 9 hand-built modals, no shared `Modal`/`Dialog` | Inconsistent focus trap, Esc, scroll lock, portal, a11y | Planned (05) |
| TD-03 | P1 | API | `ChatController` and `ChatHub` use the DbContext directly | Business rules in the transport layer; untestable | Planned (01/03) |
| TD-04 | P1 | Web | No typed fetch helper (timeouts, errors, auth header, refresh) | Every call re-implements error handling; mock fallbacks hide failures | Planned (01) |
| TD-05 | P2 | Web | localStorage / sessionStorage accessed directly with try/catch everywhere | ~31 empty catches; key names scattered | Planned (05) |
| TD-06 | P1 | Web | Business state (plan, KYC, usage, boost, connections) in localStorage | Must move to API (BUG-011); screens read `lib/*` directly | Planned (02–04) |
| TD-07 | P2 | Web | Large route files mixing data, state and layout (`messages/page.tsx` 933 lines, `search/page.tsx` 659) | Hard to review and test | Planned (05) |
| TD-08 | P3 | Web | Two icon libraries (iconsax-react + lucide-react) | Visual inconsistency, extra bundle | Planned (05) |
| TD-09 | P2 | Web | `SegmentedTabs`, `PhotoSlot`, `ButtonLink` not exported from `ui/index.ts` | Imports by path; easy to miss and duplicate | Planned (01) |
| TD-10 | P1 | API | No EF migrations (`EnsureCreated`) | Schema changes impossible without data loss (BUG-013) | Planned (01) |
| TD-11 | P2 | API | `CandidateProfile` stores lists as strings (`Interests` CSV, `SubmittedDetailsJson`, `PricingPlan.FeaturesJson`, `Price` as string) | No querying/validation; money as text | Planned (02/04) |
| TD-12 | P2 | API | No global exception handler / ProblemDetails; no request validation library | Inconsistent error shape for the web app | Planned (01) |
| TD-13 | P1 | All | No automated tests, no CI | Every change re-tested by hand | Planned (01 setup, 06 coverage) |
| TD-14 | P3 | Web | Two session-storage key schemes; the same 6 session keys written in three places in `api.ts` | Drift between login paths | Planned (01 with TD-04) |
| TD-15 | P3 | Web | Images use `<img>` instead of `next/image` | LCP/bandwidth on mobile | Open |
| TD-16 | P3 | Web | Tamil not started; Sinhala partial | Copy debt grows with each screen | Open |
| TD-17 | P2 | API | Hub loads the profile twice per message | Extra DB round trips under chat load | Planned (03) |

## Rules
- Paying down debt is a task in a sprint with acceptance criteria — not a side effect of a feature task.
- Removing "dead" code: prove it is unused (`grep -rlw Name src`, build passes) and list the files in `CHANGELOG.md`.
- When an item is done, set **Done**, add the sprint and the commit/PR reference.
