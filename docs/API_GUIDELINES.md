# API Guidelines

Back end: `DatingApp.API` (.NET 9, ASP.NET Core). Base URL `/api`. Swagger at `/swagger` in Development.
The **full target endpoint list (102 endpoints, grouped A, P/K, S, M/C, B/U/X, D/N/W/AD)** is the API spec:
https://claude.ai/artifact/LP2mSaiPiJYZCij2bLU1p6 — this file holds the conventions plus what exists today.

## 1. What exists today (see table + hub)
| Controller | Endpoints | Auth today | Problems |
|---|---|---|---|
| `AuthController` `/api/auth` (+ `AuthController.Passwords.cs`) | #1–14: `POST register`, `POST login`, `POST google-login`, `POST send-otp`, `POST verify-otp`, `GET me`, `POST refresh`, `POST logout`, `POST forgot-password`, `POST forgot-password/verify`, `POST reset-password`, `POST change-password`, `GET sessions`, `DELETE sessions/{id}` | `me`, `change-password`, `sessions` (refresh/logout use the `vk_refresh` httpOnly cookie) | Built 2026-11-13 on `S01-api-auth`. 2026-11-14: `register` with a mobile → 201 `{ userId, phoneNumber, phoneVerificationRequired }`, no session until `verify-otp`; login → 403 `PHONE_NOT_VERIFIED` for unconfirmed numbers |
| `ProfilesController` `/api/profiles` | `GET search` (paged — S03-T01), `GET` (old list — approved only), `GET me`, `GET me/status`, `POST me/submit`, `GET {id}` (approved only), `POST` (create/update) | `me`, `me/*`, `POST` | `POST` validates (name, gender, `dateOfBirth` 18–80, `photoUrl` = "" / `avatar:<id>` / https) → 400; e-mail taken → 409. `dateOfBirth` and `details.whatsApp` only in `GET me` (2026-11-14) |
| `MatchRequestsController` `/api/match-requests` | `POST`, `GET my`, `GET received`, `GET sent`, `GET matched`, `PUT {id}/withdraw`, `PUT {id}/respond` | all | Errors: 400 / 402 `LIMIT_REACHED` / 403 `PROFILE_REQUIRED` · `KYC_REQUIRED` / 404 / 409. Lists return `InterestDto { id, direction, status, note, createdAt, respondedAt, profile }` (S03-T05) |
| `ShortlistController` `/api/shortlist` | `GET`, `PUT {profileId}`, `DELETE {profileId}` | all | S03-T06 |
| `SavedSearchesController` `/api/saved-searches` | `GET`, `POST { name, filters }`, `DELETE {id}` | all | S03-T06 — run with `GET /api/profiles/search` |
| `BlocksController` `/api/blocks` | `GET`, `PUT {profileId}` (`{ reason? }`), `DELETE {profileId}` | all | S03-T07 — chat to a blocked member: 403 `BLOCKED` (blocker) / 404 (blocked side) |
| `ReportsController` `/api/reports` | `POST { profileId, reason: Scam·Inappropriate·FakeProfile·Other, details?, conversationId? }` | all | S03-T07 — one open report per reporter + member (409) |
| `ProfileViewsController` `/api/profile-views` | `GET viewers` → `{ total, locked, planId, items }`, `GET recent?take=20` | all | S03-T04 — views are recorded by `GET /api/profiles/{id}` (402 when the month's views are used) |
| `ChatController` `/api/chat` | `GET conversations`, `GET history/{conversationId}` | all — member from the JWT; history 404 unless a participant | Fixed 2026-11-14 (BUG-004) — awaiting test |
| `PhotosController` `/api/photos` | `POST` (multipart `file`), `GET mine`, `PUT {id}/main`, `PUT order`, `DELETE {id}`, `GET {id}/file` | all but `file` (approved + approved member = public link; else owner / staff) | S02-T04 |
| `KycController` `/api/kyc` | `POST documents` (multipart `type` + `file`), `GET documents`, `GET documents/{id}/file` | all (owner / staff; staff views logged) | S02-T05 |
| `ModerationController` `/api/moderation` | `GET reports?status=`, `POST reports/{id}/resolve` (S03-T08), `GET queue`, `GET profiles/{id}`, `POST profiles/{id}/approve · request-changes · suspend · reinstate`, `GET photos/pending`, `POST photos/{id}/approve · reject` | `Staff` policy | S02-T06 |
| `AdminController` `/api/admin` | `GET/PUT prices`, `GET/POST members/{userId}/subscriptions`, `POST subscriptions/{id}/cancel` (S04), `GET staff`, `GET users?phone=`, `PUT users/{id}/role`, `GET plan-limits`, `PUT plan-limits` (`{ limits: [{ planId, feature, monthlyLimit }] }`, null = unlimited) | `Admin` policy | S02-T08; plan limits S03-T02 |
| `PlansController` `/api/plans` | `GET` → `[{ product, planId, months, days, amountCents, amount, currency, savePercent }]` | anonymous | S04-T01 |
| `MeController` `/api/me` | `GET subscription` (S04-T02), `GET usage` → `{ planId, periodStart, resetsAt, items: [{ feature, used, limit, remaining }] }`; `GET dashboard` → usage + viewers, interests, matches, shortlistedBy, unread, recentConversations | all | S03-T03, S03-T09 |
| `BoostsController` `/api/boosts` | `GET me` → `{ active, startsAt, endsAt, daysLeft, totalDays, views, interests, canBuy }` | all | S04-T05 — search results carry `promoted` and list promoted profiles first |
| `PaymentsController` `/api/payments` | `GET methods` (anonymous) → `{ accounts: [{ id, bankName, accountName, accountNumber, branch, swift }], qrCodes: [{ id, name, provider, accountName, imageUrl, note? }] }` from appsettings `BankTransfer:Accounts` / `BankTransfer:QrCodes` (old single-account keys still read; `imageUrl` only `/…` or `https://…`, else blanked), `GET bank-account` (anonymous, first account — kept for older clients), `POST bank-transfer` `{ product?: plan·boost, planId, months, days? }` (boost: approved + Gold / Platinum, else 403 `KYC_REQUIRED` / 402 `PLAN_REQUIRED`) → `PaymentDto { id, product, planId, months, days, amountCents, amount, currency, reference, status: Pending·AwaitingReview·Approved·Rejected, hasReceipt, receiptFileName, paidOn, memberNote, createdAt, submittedAt, reviewedAt, reviewNote }`, `POST {id}/receipt` (multipart `receipt` ≤ 10 MB, `paidOn` yyyy-mm-dd, `note?`), `GET mine`, `GET {id}/receipt` | all but `methods` and `bank-account` (receipt: owner / staff, staff views logged) | S04-T03 — 409 `PAYMENT_UNDER_REVIEW` when a receipt is already waiting |
| `PaymentsQueueController` `/api/moderation/payments` | `GET ?status=review·pending·approved·rejected·all`, `POST {id}/approve` `{ note? }`, `POST {id}/reject` `{ reason }` → `StaffPaymentDto` (+ member name, code, phone, current plan, reviewedBy) | `Staff` policy | S04-T04 — approve once (409 `PAYMENT_ALREADY_USED`); member told in-app + SMS |
| `AccountController` `/api/account` | `POST visibility`, `POST delete/send-code`, `POST delete` | all | S04-T08 — see below |
| `NotificationsController` `/api/notifications` | `GET`, `GET unread-count`, `POST {id}/read`, `POST read-all` | all | S02-T12 |
| `ContentController` `/api/content` | `GET home`, `GET stories`, `GET plans`, `GET faqs` | anonymous (correct) | — |
| `ChatHub` `/hubs/chat` | `JoinConversation(conversationId)`, `LeaveConversation`, `SendMessage(receiverProfileId, text)`, `SendTyping(conversationId, isTyping)`, `MarkAsRead(messageId)`, `RequestContactShare(partnerProfileId)`, `AcceptContactShare(partnerProfileId)`, `DeclineContactShare(partnerProfileId)`, `CancelContactShare(partnerProfileId)` | all — `?access_token=`; matched members only; errors as `HubException` "CODE: message" | S03-T07: first message of a conversation counts a NewChat (`LIMIT_REACHED`); `RequestContactShare` needs Gold (`PLAN_REQUIRED`); events `ContactShareDeclined` / `ContactShareCancelled`; blocked → `BLOCKED` / `NOT_FOUND` |

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
| 409 | Conflict (duplicate request, already submitted) | `ALREADY_EXISTS`, `PAYMENT_UNDER_REVIEW`, `PAYMENT_ALREADY_USED` | toast |
| 429 | Rate limited | `RATE_LIMITED` | toast with retry time |
| 500 | Unhandled | `SERVER_ERROR` | generic error + retry; no details |

`LIMIT_REACHED` (S03) also carries `feature` (`Search` · `ProfileView` · `Interest` · `NewChat`), `limit`, `planId` and
`resetsAt` (UTC, first day of next month). Search: `GET /api/profiles/search?gender=&ageFrom=&ageTo=&religion=&community=&location=&country=&profession=&horoscope=&q=&sort=newest|ageAsc|ageDesc&page=1&pageSize=20`
→ `{ items, total, page, pageSize, totalPages }`; page 1 counts one search for members.

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

## Bank transfer payments — built 2026-11-16 (S04-T03 / T04)
Payment methods (2026-11-21): several bank accounts and LankaQR codes live in appsettings `BankTransfer` →
`"Accounts": [{ "Id", "BankName", "AccountName", "AccountNumber", "Branch", "Swift" }]` and
`"QrCodes": [{ "Id", "Name", "Provider", "AccountName", "ImageUrl", "Note" }]`. Put QR images in the web app's
`public/payments/qr/` and use `"/payments/qr/combank.png"`. Accounts without a number and QR codes without a name are
left out. Change them per environment (user secrets / environment variables), never in code.
`appsettings.Development.json` holds 4 SAMPLE banks and 3 sample QR codes (`/payments/qr/sample-*.png`) so the page can
be tried locally; .NET loads it only when `ASPNETCORE_ENVIRONMENT=Development`. Never copy those values to production.
The earlier plan (one multipart call with a reference made in the browser) changed: the order comes first so the
**server** sets the amount and the reference the member types into the transfer. See `PaymentsController` above.

## Account visibility and deletion — built 2026-11-17 (S04-T08)
- `POST /api/account/visibility` `{ hidden, reason? }` → 204. Hidden = out of search and best matches; friends, chats,
  plan and the profile page for friends stay. The session carries `profileHidden`.
- `POST /api/account/delete/send-code` `{}` → `OtpResponseDto` (`resendAvailableInSeconds` …); same limits as login codes.
- `POST /api/account/delete` `{ code, reason, comment? }` → 204 (refresh cookie cleared), or 400 `{ code: CODE_INVALID |
  CODE_EXPIRED | TOO_MANY_ATTEMPTS, attemptsLeft }`. Sign-in afterwards: 403 `ACCOUNT_DELETED`. Personal data is erased
  by the hourly job 30 days later; payment records are kept.

## Admin back office — members built 2026-11-17 (S04-T07); roles & staff accounts planned
Built (`AdminMembersController`): `GET /api/admin/stats` → `{ totalMembers, newThisWeek, activeMembers, pendingReviews,
kycUpdates, incompleteRegistrations, paidMembers, blocked }` and `GET /api/admin/members?search=&status=&page=&pageSize=`
→ `{ items: [{ userId, profileId, code, fullName, phoneNumber, email, gender, plan, status, statusReason, joinedAt,
lastActiveAt }], total, page, pageSize }` (`Staff` policy); `POST /api/admin/members/{id}/status` `{ action: activate |
deactivate | block | unblock, reason? }` → 204 and `POST /api/admin/members/{id}/reset-password` → 204 (`Admin` policy;
reason required for deactivate / block; both end the member's sessions; every change in `AuditLogs`).
Still planned (owner postponed custom roles, 2026-11-16):
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

## Planned: support messages (front end ready 2026-11-21)
`POST /api/support/messages` — multipart, anonymous allowed (members are matched by their token):
`topic` (payments · account · verification · report · technical · other), `subject` (4–120), `message` (20–1000),
`name`, `email` (required, the reply goes here), `mobile?` (international, e.g. `+94771234567`), `paymentReference?` (payments), `attachment?` (JPG / PNG / WebP / PDF
≤ 10 MB, kept private like receipts) → 201 `{ reference: "SUP-4821" }`. Rate-limit by IP and account.
Staff side (planned): a
"Support messages" page in the staff area with topic filter, status (New · Answered · Closed) and reply by email.
Front end: `services/support.ts` (404 → demo in development, "please email us" in production).
