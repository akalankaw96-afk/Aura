# API Guidelines

Back end: `DatingApp.API` (.NET 9, ASP.NET Core). Base URL `/api`. Swagger at `/swagger` in Development.
The **full target endpoint list (102 endpoints, grouped A, P/K, S, M/C, B/U/X, D/N/W/AD)** is the API spec:
https://claude.ai/artifact/LP2mSaiPiJYZCij2bLU1p6 — this file holds the conventions plus what exists today.

## 1. What exists today (27 endpoints + hub)
| Controller | Endpoints | Auth today | Problems |
|---|---|---|---|
| `AuthController` `/api/auth` (+ `AuthController.Passwords.cs`) | #1–14: `POST register`, `POST login`, `POST google-login`, `POST send-otp`, `POST verify-otp`, `GET me`, `POST refresh`, `POST logout`, `POST forgot-password`, `POST forgot-password/verify`, `POST reset-password`, `POST change-password`, `GET sessions`, `DELETE sessions/{id}` | `me`, `change-password`, `sessions` (refresh/logout use the `vk_refresh` httpOnly cookie) | Built 2026-11-13 on `S01-api-auth`. 2026-11-14: `register` with a mobile → 201 `{ userId, phoneNumber, phoneVerificationRequired }`, no session until `verify-otp`; login → 403 `PHONE_NOT_VERIFIED` for unconfirmed numbers |
| `ProfilesController` `/api/profiles` | `GET` (search — approved only), `GET me`, `GET me/status`, `POST me/submit`, `GET {id}` (approved only), `POST` (create/update) | `me`, `me/*`, `POST` | `POST` validates (name, gender, `dateOfBirth` 18–80, `photoUrl` = "" / `avatar:<id>` / https) → 400; e-mail taken → 409. `dateOfBirth` and `details.whatsApp` only in `GET me` (2026-11-14) |
| `MatchRequestsController` `/api/match-requests` | `POST`, `GET my`, `PUT {id}/respond` | all | Errors: 400 / 403 `PROFILE_REQUIRED` / 404 / 409 (2026-11-14) |
| `ChatController` `/api/chat` | `GET conversations`, `GET history/{conversationId}` | all — member from the JWT; history 404 unless a participant | Fixed 2026-11-14 (BUG-004) — awaiting test |
| `PhotosController` `/api/photos` | `POST` (multipart `file`), `GET mine`, `PUT {id}/main`, `PUT order`, `DELETE {id}`, `GET {id}/file` | all but `file` (approved + approved member = public link; else owner / staff) | S02-T04 |
| `KycController` `/api/kyc` | `POST documents` (multipart `type` + `file`), `GET documents`, `GET documents/{id}/file` | all (owner / staff; staff views logged) | S02-T05 |
| `ModerationController` `/api/moderation` | `GET queue`, `GET profiles/{id}`, `POST profiles/{id}/approve · request-changes · suspend · reinstate`, `GET photos/pending`, `POST photos/{id}/approve · reject` | `Staff` policy | S02-T06 |
| `AdminController` `/api/admin` | `GET staff`, `GET users?phone=`, `PUT users/{id}/role` | `Admin` policy | S02-T08 |
| `NotificationsController` `/api/notifications` | `GET`, `GET unread-count`, `POST {id}/read`, `POST read-all` | all | S02-T12 |
| `ContentController` `/api/content` | `GET home`, `GET stories`, `GET plans`, `GET faqs` | anonymous (correct) | — |
| `ChatHub` `/hubs/chat` | `JoinConversation(conversationId)`, `LeaveConversation`, `SendMessage(receiverProfileId, text)`, `SendTyping(conversationId, isTyping)`, `MarkAsRead(messageId)`, `RequestContactShare(partnerProfileId)`, `AcceptContactShare(partnerProfileId)` | all — `?access_token=`; matched members only; errors as `HubException` "CODE: message" | Fixed 2026-11-14 (BUG-005) — awaiting test. Gold-only rule still web-side (TD-24) |

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

## Planned: bank transfer payments (front end ready 2026-11-15)
- `POST /api/payments/bank-transfer` — multipart: `plan` (gold|platinum), `months` (1|3|6), `amount` (LKR, server
  must recompute from its own price list), `reference`, `paidOn` (yyyy-mm-dd), `note?`, `receipt` (JPG/PNG/WEBP/PDF
  ≤ 10 MB). Returns `{ id, status: "Pending" }`. Store receipts privately (same rules as ID documents, TD-26).
- `GET /api/payments/mine` — latest request + status (Pending / Approved / Rejected + reason), so the Payment page
  and dashboard can show it across devices (replaces localStorage `vk-payment-pending`).
- Staff: list pending receipts, approve (activates the plan, sets start/expiry, SMS) or reject with a reason.

## Planned: account visibility and deletion (front end ready 2026-11-15)
- `POST /api/account/visibility` `{ hidden: boolean, reason? }` → 204. Hidden profiles drop out of search and Best
  matches; friends, chats and plan stay. Return the flag in the session/profile so every device agrees.
- `POST /api/account/delete/send-code` `{}` → `{ resendAvailableInSeconds }`. SMS to the verified mobile; same limits as
  login codes (6 digits, 60 s resend, 5 attempts, expiry).
- `POST /api/account/delete` `{ code, reason, comment? }` → 204, or 400 ProblemDetails `{ code: CODE_INVALID |
  CODE_EXPIRED | TOO_MANY_ATTEMPTS, attemptsLeft }`. On success: hide the profile at once, end all sessions (clear
  the refresh cookie), schedule erasure of profile, photos, chats, ID documents within 30 days (keep legally required
  payment records), and store the reason/comment anonymously for reporting.

## Planned: admin back office (front end ready 2026-11-16)
All under the `Staff` policy; each call also checks the permission below. Every change is written to an audit log
(who, what, when, reason). Front end: `lib/adminApi.ts`.
- `GET /api/admin/stats` → `{ totalMembers, newThisWeek, activeMembers, pendingReview, kycUpdates, halfRegistered,
  paidMembers, blocked }` (`dashboard.view`).
- `GET /api/admin/members?search=&status=&page=&pageSize=` → paged `{ items: [{ userId, fullName, code?, phoneNumber,
  email?, gender?, plan, status: Active | PendingReview | Incomplete | Deactivated | Blocked, joinedAt, lastActiveAt? }],
  total }` (`members.view`). Search matches name, mobile, email, MP code.
- `POST /api/admin/members/{id}/status` `{ action: activate | deactivate | block | unblock, reason? }` → 204
  (`members.status`). Reason required for deactivate / block; block and deactivate end all the member's sessions.
- `POST /api/admin/members/{id}/reset-password` → 204 (`members.resetPassword`). Staff never see or type a member's
  password: this ends their sessions and sends an SMS so the member sets a new one with a code.
- `GET /api/admin/roles` · `POST /api/admin/roles` · `PUT /api/admin/roles/{id}` · `DELETE /api/admin/roles/{id}`
  (`staff.manage`). Role `{ id, name, description?, permissions[], builtIn, staffCount }`. Admin (all permissions,
  read-only) and Moderator are built-in; a role in use can't be deleted (409).
- `GET /api/admin/staff-accounts` · `POST /api/admin/staff-accounts` `{ fullName, username, email?, password, roleId }`
  · `PATCH /api/admin/staff-accounts/{id}` `{ roleId?, status? }` · `POST /api/admin/staff-accounts/{id}/reset-password`
  → `{ temporaryPassword }` (`staff.manage`). Staff sign in with username + password; a new or reset password is
  temporary and must be changed at the next sign-in; a role or status change revokes their sessions. An admin can't
  deactivate or demote themselves, and the last active Admin can't be removed.
- Permissions: `dashboard.view`, `reviews.view`, `reviews.decide`, `photos.moderate`, `documents.view`,
  `members.view`, `members.status`, `members.resetPassword`, `payments.verify`, `reports.handle`, `staff.manage`.
  Return the signed-in staff member's permissions in the session so the sidebar can hide what they can't use.
