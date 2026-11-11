# Error Handling

Goal: every failure is **visible to the right person** — the member gets a clear, safe message; the developer gets a
log entry with context. Silence (empty `catch {}`, mock-data fallbacks) is the main problem today (BUG-014, BUG-021).

## 1. Back end (.NET)
- **One global handler** (`app.UseExceptionHandler` + `IExceptionHandler`) converts exceptions to ProblemDetails
  (shape and codes in `API_GUIDELINES.md` §4). Controllers don't wrap actions in try/catch.
- Expected failures are **results, not exceptions**: services return a `Result<T>` (or throw a small set of typed
  exceptions: `ValidationException`, `NotFoundException`, `ForbiddenException`, `LimitReachedException`,
  `ConflictException`) that the handler maps to 400/404/403/402/409.
- Validation at the DTO edge (FluentValidation or DataAnnotations) → 400 with `errors` per field.
- Never catch and continue with fake data. If a fallback is genuinely wanted, log a warning and say so in the response.
- Log with `ILogger<T>` structured templates: `logger.LogWarning("KYC submit rejected for {ProfileId}: {Reason}", id, reason)`.
  No PII, tokens or secrets in logs. Include `traceId` in ProblemDetails so support can find the log.
- SignalR: hub methods throw `HubException` with a safe message; client shows a toast and re-syncs.

## 2. Web app
- **One fetch helper** (TD-04) in `src/services/http.ts`: base URL, auth header, timeout (15 s, `AbortController`),
  JSON parse, maps non-2xx ProblemDetails to a typed `ApiError { status, code, message, fieldErrors }`,
  refreshes the token once on 401. No other file calls `fetch` directly.
- UI reaction by `code`: see the table in `API_GUIDELINES.md` §4 (field errors inline, 401 → login popup,
  402 → `UpgradePrompt`, 403 KYC → banner, 429/500 → toast + retry).
- Every data view has loading / empty / error states; error state offers **Retry**.
- Forms: keep user input on failure; focus the first invalid field; disable submit while pending.
- Route-level crashes: `app/error.tsx` (friendly message + "Try again") and `app/not-found.tsx`; `global-error.tsx`
  for the root layout.
- Browser storage access goes through the storage helper (TD-05) — the **only** allowed silent catch, because
  Safari private mode and quota errors are not actionable.
- No `console.log` in committed UI code; `console.error` only inside the fetch helper / error boundaries in development.

## 3. Message style
Short, human, actionable, no blame, no internals: "We couldn't load profiles. Check your connection and try again."
Never show stack traces, SQL, exception names or raw status codes to members.

## 4. Checklist
- [ ] No empty catch (except the storage helper)
- [ ] No mock/demo data returned on failure
- [ ] Error shown to the user with a next step; input preserved
- [ ] Logged once, with context, without PII
- [ ] Test covers the failure path
