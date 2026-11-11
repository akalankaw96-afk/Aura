# Testing Guidelines

Today there are **no automated tests and no CI** (TD-13). Sprint 01 sets up the tooling; every later task adds tests
for what it touches. Until coverage exists, the manual checks in §4 are mandatory.

## 1. Test pyramid
| Level | Tool | Lives in | What |
|---|---|---|---|
| API unit | xUnit + FluentAssertions + NSubstitute | `DatingApp.API/tests/DatingApp.Application.Tests` | Services: rules, limits, ownership, KYC transitions |
| API integration | `WebApplicationFactory` + SQLite in-memory (or Testcontainers SQL Server) | `tests/DatingApp.WebApi.Tests` | Endpoints: auth, status codes, ProblemDetails, authorization |
| Web unit | Vitest + Testing Library | `DatingApp.APP/src/**/*.test.ts(x)` | `lib/*` (usage, session, promotion), helpers, `ui/` components |
| E2E | Playwright | `DatingApp.APP/e2e/` | Critical journeys at 1440 and 390 px |

## 2. What must be tested
- **Security (always):** every endpoint rejects anonymous calls unless allow-listed; member A can't read/modify member B;
  chat only within accepted matches; admin endpoints need the role; no OTP/token in responses.
- **Business rules:** Free limits (5 views · 3 searches · 3 interests · 2 chats per month), plan expiry, boost window,
  KYC state machine (Draft → Pending → Approved/Rejected → Resubmitted), interest lifecycle.
- **Each bug fix:** a test that fails before the fix and passes after (reference the BUG id in the test name).
- **E2E journeys:** guest → login popup; register → KYC pending dashboard; rejected → fix & resubmit; Free search until
  upgrade prompt; send interest → accept → chat; buy Gold; promote profile.

## 3. Conventions
- Test names: `Method_State_Expected` (C#) / `it("blocks a 4th search on Free")` (TS).
- Arrange-Act-Assert; one behaviour per test; no sleeps (await conditions).
- Test data via builders/factories; no real member data; no secrets in fixtures.
- Tests must be deterministic and runnable offline; external services (SMS, payment, Google) faked behind interfaces.

## 4. Manual verification (until automated, and for every UI change)
1. `npm run typecheck` and `npm run check` in `DatingApp.APP`; `dotnet build DatingApp.API/DatingApp.sln`.
2. Screen at 1440 and 390 px, light and dark; keyboard-only pass.
3. States via `DashboardDemo`: tips, KYC pending, KYC rejected, approved Free, approved Gold; plus guest.
4. Flows you touched, plus a smoke of home → search → profile → interest.
5. Browser console has no errors; network tab has no failing calls you didn't expect.
Record results in the task report and `PROGRESS.md`.

## 5. Commands (after Sprint 01 setup)
```
# Web
npm run lint && npm run typecheck && npm test && npm run build
npx playwright test
# API
dotnet test DatingApp.API/DatingApp.sln
```
CI (GitHub Actions) runs all of the above on every PR; a red pipeline blocks merging.

## 6. Definition of "tested"
Acceptance criteria demonstrated, automated tests added for new logic and bug fixes, all suites green, manual checks in
§4 done. Anything less is **In Progress / Testing**, not Completed.
