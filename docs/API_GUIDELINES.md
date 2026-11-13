# API Guidelines

Back end: `DatingApp.API` (.NET 9, ASP.NET Core). Base URL `/api`. Swagger at `/swagger` in Development.
The **full target endpoint list (102 endpoints, grouped A, P/K, S, M/C, B/U/X, D/N/W/AD)** is the API spec:
https://claude.ai/artifact/LP2mSaiPiJYZCij2bLU1p6 — this file holds the conventions plus what exists today.

## 1. What exists today (27 endpoints + hub)
| Controller | Endpoints | Auth today | Problems |
|---|---|---|---|
| `AuthController` `/api/auth` (+ `AuthController.Passwords.cs`) | #1–14: `POST register`, `POST login`, `POST google-login`, `POST send-otp`, `POST verify-otp`, `GET me`, `POST refresh`, `POST logout`, `POST forgot-password`, `POST forgot-password/verify`, `POST reset-password`, `POST change-password`, `GET sessions`, `DELETE sessions/{id}` | `me`, `change-password`, `sessions` (refresh/logout use the `vk_refresh` httpOnly cookie) | Built 2026-11-13 on `S01-api-auth` — awaiting build + test |
| `ProfilesController` `/api/profiles` | `GET` (search), `GET me`, `GET {id}`, `POST` (create/update) | `me`, `POST` | BUG-009, BUG-014, BUG-016 |
| `MatchRequestsController` `/api/match-requests` | `POST`, `GET my`, `PUT {id}/respond` | all | — |
| `ChatController` `/api/chat` | `GET conversations`, `GET history/{conversationId}` | **none** | BUG-004, TD-03 |
| `ContentController` `/api/content` | `GET home`, `GET stories`, `GET plans`, `GET faqs` | anonymous (correct) | — |
| `ChatHub` `/hubs/chat` | `JoinConversation`, `LeaveConversation`, `SendMessage`, `SendTyping`, `MarkAsRead`, `RequestContactShare`, `AcceptContactShare` | **none** | BUG-005, TD-03, TD-17 |

## 2. Target groups (see spec for every route, request and response)
| Group | Scope | Sprint |
|---|---|---|
| **A** (A1–A18) | Auth: register, login, Google, OTP, refresh, logout, forgot/reset password, change password, sessions | 01 |
| ↳ forgot password | `POST /auth/forgot-password {channel,value}` → 202 always · `POST /auth/forgot-password/verify {channel,value,code}` → `{resetToken}` or 400 `{code, attemptsLeft}` · `POST /auth/reset-password {resetToken,newPassword}` → 204. Web contract: `services/passwordReset.ts` | 01 |
| **P / K** | Profile draft, submit, photos (upload, order, primary, delete), edit description; KYC submit, status, resubmit rejected fields | 02 |
| **S** (S1–S16) | Search with filters/sort/paging, saved searches, profile view (metered), shortlist, recently viewed, promoted row | 03 |
| **M / C** | Interests (send with note, accept, decline, withdraw), connections, conversations, messages, contact share, block, report | 03 |
| **B / U / X** | Plans, checkout + payment webhook, subscription & expiry, boosts (buy, extend, results), usage counters | 04 |
| **D / N / W / AD** | Dashboard summary, notifications, real-time events, admin & moderator back office (KYC queue, photo moderation, reports, payments, members) | 02–04 |

## 3. Conventions
- **Routes:** plural nouns, kebab-case: `/api/profiles/{id}/photos`, `/api/match-requests/{id}/accept`.
  Actions that aren't CRUD use a verb sub-resource (`/submit`, `/accept`, `/extend`).
- **Verbs:** `GET` read · `POST` create/action · `PUT` replace · `PATCH` partial · `DELETE` remove. `GET` never changes state
  — except the metered profile view, which is an explicit `POST /api/profiles/{id}/views`.
- **Identity:** never in the URL for "me" resources — `/api/profiles/me`, not `/api/profiles/{myId}`.
- **DTOs:** request/response records in `Application/DTOs`; never return entities. camelCase JSON. Dates ISO-8601 UTC.
  Money: integer **cents** of LKR (`amountLkrCents`) + `currency`.
- **Paging:** `?page=1&pageSize=20` (max 50) → `{ items, page, pageSize, total }`.
- **Filtering/sort:** query parameters (`ageMin`, `religion`, `sort=newest`); unknown values → 400.
- **Idempotency:** payments and boosts accept an `Idempotency-Key` header.
- **Versioning:** none yet; breaking changes require a note in `CHANGELOG.md` and the web app updated in the same PR.

## 4. Errors (RFC 7807 ProblemDetails)
```json
{ "type": "https://vikasitha.lk/errors/limit-reached", "title": "Monthly search limit reached",
  "status": 402, "code": "LIMIT_REACHED", "detail": "Free plan allows 3 searches per month.",
  "errors": { "field": ["message"] }, "traceId": "…" }
```
| Status | When | `code` examples | Web app reaction |
|---|---|---|---|
| 400 | Validation | `VALIDATION_FAILED` | inline field errors |
| 401 | No/expired token | `UNAUTHENTICATED` | refresh once, else login popup |
| 402 | Plan limit / paid feature | `LIMIT_REACHED`, `PLAN_REQUIRED` | upgrade popup |
| 403 | Forbidden / KYC not approved / blocked | `KYC_REQUIRED`, `FORBIDDEN` | KYC banner / alert |
| 404 | Not found or not visible to caller | `NOT_FOUND` | empty state |
| 409 | Conflict (duplicate request, already submitted) | `ALREADY_EXISTS` | toast |
| 429 | Rate limited | `RATE_LIMITED` | toast with retry time |
| 500 | Unhandled | `SERVER_ERROR` | generic error + retry; no details |

One global exception handler produces these (TD-12). Never leak stack traces or SQL.

## 5. Real-time (SignalR)
- Hub `/hubs/chat` (later `/hubs/events` for notifications). `[Authorize]`; WebSocket token via `access_token` query.
- Server → client events: `ReceiveMessage`, `Typing`, `MessageRead`, `ContactShareRequested`, `ContactShareAccepted`,
  `Notification`. Client → server methods carry only `conversationId` + payload, never a sender id.
- The hub calls an `IChatService`; persistence and rules live there.

## 6. Adding an endpoint — checklist
1. Spec row exists (or add it to the spec doc). 2. DTOs + validator. 3. Service method with business rules + tests.
4. Thin controller action with `[Authorize]`/roles and `ProducesResponseType`. 5. ProblemDetails codes from §4.
6. Web client function in `src/services/` using the typed fetch helper (TD-04). 7. Update §1 table + `CHANGELOG.md`.
