# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/). Newest first. Reference task, bug and debt IDs.
Sections: Added · Changed · Fixed · Security · Removed · Breaking.

## [Unreleased]

### Added
- 2026-11-16 — **Staff reports queue (S03-T08).** `GET /api/moderation/reports?status=open|closed|all` and
  `POST /api/moderation/reports/{id}/resolve` with `dismiss`, `action` (handled without suspending) or `suspend` (note
  required; suspends the member and closes all their open reports). The reporter gets an in-app "We reviewed your report"
  (never the decision); each decision is written to the reported profile's history (`ReportDismissed` /
  `ReportActioned`, plus `Suspended`). Staff area: new **Reports** tab (open / closed, open-report count per member,
  note, Dismiss · Handled · Suspend member, Open profile). Files: `ReportQueueService.cs`, `ModerationController.cs`,
  `SafetyDtos.cs`, `Enums.cs` (`ReviewAction` 8, 9), `lib/staff.ts`, `StaffConsole.tsx`; tests `ReportsAndDashboardTests`.
- 2026-11-16 — **Dashboard summary (S03-T09).** `GET /api/me/dashboard` returns usage, profile viewers (all-time and
  this week; names for Gold / Platinum only), interests received / waiting / sent, matches, members who shortlisted you,
  unread messages and the five latest chats — blocked members excluded everywhere. The dashboard's stat tiles, a new
  "Who viewed you" strip (paid) and the Messages card now use it (no more placeholders); `/messages?c=<conversation or
  profile id>` opens that chat. Files: `DashboardService.cs`, `MeController` (in `ModerationController.cs`),
  `UsageDtos.cs`, `lib/{matching,dashboard}.ts`, `StatsRow.tsx`, `Inbox.tsx`, `app/messages/page.tsx`, `content/dashboard.ts`.

### Fixed
- 2026-11-16 — **A tab could keep showing one member while acting as another (owner test: "You cannot message
  yourself").** All tabs of a browser share the refresh cookie; after signing in as B in a second tab, A's tab renewed
  its token as B. Tabs now reload when another tab signs in as someone else or signs out. To test two members at once,
  use a normal and a private window (or two browsers). File: `services/api.ts`.
- 2026-11-15 — **Search limit could be skipped with app-side filters (owner test).** Height, "Verified only",
  "With photo", several religions / professions, countries and the "More" filters only narrowed the loaded results,
  so they never counted and kept working at 0 searches left. The web app now sends `filtered=true` with them and the
  API counts that as a search (402 at the limit). Plain browsing (Bride / Groom, newest first) stays free.
  Files: `UsageDtos.cs` (`ProfileSearchDto.Filtered`), `SearchService.IsRefined`, test; `app/search/page.tsx`, `lib/matching.ts`.
- 2026-11-15 — **Reset date showed "30 Nov" instead of "1 Dec"** west of UTC: the server's month starts at midnight
  UTC; the usage card and Upgrade prompt now show that date in UTC. Files: `PlanUsageCard.tsx`, `UpgradePrompt.tsx`.

### Changed
- 2026-11-15 — **Web app on the Sprint 03 APIs (S03-T10).** Usage counters come from `GET /api/me/usage` (localStorage
  `vk-usage` / `vk-viewed` gone): dashboard shows four meters (profile views, searches, interests, new chats) with the
  admin's limits and reset date; the Upgrade prompt opens on any 402 (`LIMIT_REACHED` / `PLAN_REQUIRED`) and is closable
  except when searches and views are both used up on /search. Free members can now send interests and start chats up to
  their limits (they were Gold-only in the browser). Search uses `GET /api/profiles/search` (48 per API page, "Load
  more"; multi-selects, height, countries and "More" filters narrow the loaded results — TD-28) and opens profiles
  through `GET /api/profiles/{id}`, so views are counted; deep links accept the profile UUID. Saved searches are real
  (chips above the results). Favourites = server shortlist; Friends, Received and Sent tabs and the dashboard
  requests card read `/api/match-requests/matched · received · sent`; accept / decline / **Withdraw** call the API.
  Messages: the first message of a chat counts a new chat (refused message is taken back with the reason), asking for
  numbers needs Gold, decline / cancel go to the hub, block / unblock / report use `/api/blocks` and `/api/reports`,
  blocked chats and contact-share state come from the server. Profile "Report" sends `POST /api/reports`. Admin:
  **Plan limits** tab in the staff area. API: plain browsing (Bride / Groom, newest first) no longer counts as a search;
  religion / profession filters match like the web did (contains). Files: `lib/{usage,matching,connections,http,profiles}.ts`,
  `services/signalrService.ts`, `app/search/page.tsx`, `app/messages/page.tsx`, `components/layout/UpgradePrompt.tsx`,
  `components/sections/dashboard/{PlanUsageCard,Inbox,BestMatches}.tsx`, `components/sections/member/RequestsScreen.tsx`,
  `components/sections/search/ProfileView.tsx`, `components/sections/home/{Hero,FeaturedProfiles}.tsx`,
  `components/profile/ProfileActions.tsx`, `components/sections/admin/StaffConsole.tsx`, `content/home.ts`;
  API `SearchService` (+ test).

### Added
- 2026-11-14 — **Shortlist, saved searches, chat limits, contact share answers, block and report (S03-T06, T07).**
  Shortlist on the server (`GET /api/shortlist`, `PUT` / `DELETE /api/shortlist/{profileId}`; up to 200; only approved,
  unblocked profiles listed). Saved searches (`GET` / `POST /api/saved-searches`, `DELETE /{id}`; up to 10, unique
  names; run with `GET /api/profiles/search`). Chat: the first message of a conversation counts one new chat (Free: 2 a
  month; replies and later messages are free); asking to share numbers needs Gold / Platinum — 402 `PLAN_REQUIRED`
  (TD-24) — while accepting or declining is free; new hub methods `DeclineContactShare` / `CancelContactShare` with
  events `ContactShareDeclined` / `ContactShareCancelled` (TD-20, API side); a request is open until accepted,
  declined or cancelled; `GET /api/chat/conversations` adds `contactShareState` (none · sent · received · accepted) and
  `isBlocked`. Blocking (`GET /api/blocks`, `PUT` / `DELETE /api/blocks/{profileId}` with optional `reason`) hides the
  two members from each other in search, profiles, interests, shortlist and chat; the blocker gets 403 `BLOCKED`, the
  blocked member a plain 404; waiting interests between them end, an accepted match is kept for unblocking. Reports
  (`POST /api/reports` — Scam · Inappropriate · FakeProfile · Other) are stored for the staff queue (T08). New tables
  `Shortlists`, `SavedSearches`, `Blocks`, `Reports`; `ChatMessages` + `IsContactShareDeclined`,
  `IsContactShareCancelled` (migration `Sprint03Safety`). Files: `SafetyEntities.cs`, `SafetyConfigurations.cs`,
  `SafetyDtos.cs`, `SafetyService.cs` (+ `BlockRules`), `ShortlistService.cs`, `ChatService.cs`, `ChatHub.cs`,
  `SafetyControllers.cs`, block checks in `SearchService`, `ProfileViewService`, `MatchRequestService`; tests
  `SafetyAndChatLimitTests`, `ChatServiceTests` (contact share now needs Gold).
- 2026-11-14 — **Profile views and the interests lifecycle (S03-T04, T05).** Opening a profile (`GET /api/profiles/{id}`)
  as a member records the view and counts one profile view (Free: 5 a month → 402 `LIMIT_REACHED`); re-opening the same
  profile this month, your own profile, staff, and members you share a pending / accepted interest with are free.
  `GET /api/profile-views/viewers` — Gold / Platinum see who viewed them, Free gets the total with `locked: true`;
  `GET /api/profile-views/recent`. Interests: sending needs an approved profile (403 `KYC_REQUIRED`) and counts one
  interest (Free: 3 a month); new `PUT /api/match-requests/{id}/withdraw` (status `Withdrawn`, can be sent again);
  a declined interest can't be re-sent; lists `GET /api/match-requests/received · sent · matched` return the other
  member's card; the receiver is notified of a new interest and the sender when it's accepted. New table
  `ProfileViews` (migration `Sprint03Interactions`). Files: `ProfileViewService.cs`, `ProfileViewsController.cs`,
  `MatchRequestService.cs`, `MatchRequestsController.cs`, `ProfilesController.cs`, `UsageEntities.cs`,
  `UsageConfigurations.cs`, DTOs; tests `ProfileViewTests`, `MatchRequestServiceTests` (rewritten for the new rules).
- 2026-11-14 — **Server search, plan limits and monthly usage (S03-T01–T03).** `GET /api/profiles/search` filters
  approved profiles on the server (gender, age from birth date, religion, community, location, country, profession,
  horoscope, free text), sorts (newest / ageAsc / ageDesc) and pages (`page`, `pageSize` ≤ 50; guests see page 1 only).
  Admin-set limits per plan: `GET/PUT /api/admin/plan-limits` (seeded Free = 3 searches, 5 profile views, 3 interests,
  2 new chats a month; Gold / Platinum unlimited). Monthly counters with `GET /api/me/usage`; going over returns
  402 `LIMIT_REACHED` with `feature`, `limit`, `planId`, `resetsAt`. Staff are never counted. A member's first page of a
  search counts once; later pages are free. New tables `PlanLimits`, `UsageCounters` + search indexes (migration
  `Sprint03Usage`). Files: `UsageEntities.cs`, `UsageConfigurations.cs`, `UsageDtos.cs`, `UsageService.cs`,
  `SearchService.cs`, `ProfilesController`, `ModerationController.cs` (`AdminController`, new `MeController`),
  initialiser `EnsurePlanLimitsAsync`, tests `SearchAndUsageTests`.

### Changed
- 2026-11-14 — **Edit profile on the API (S02-T10 done).** About text saves with `PATCH /api/profiles/me/about` (new
  endpoint: 50–500 characters, phone numbers / e-mails / links refused on the server too); the Photos tab uploads,
  replaces, removes and sets the main photo through `/api/photos` immediately, shows "In review" / rejected reasons,
  and new photos appear in the staff New photos queue. The old `vk-profile` localStorage copy is gone.
  Files: `components/sections/dashboard/EditProfileModal.tsx`, `lib/media.ts`, API `ProfileService.UpdateAboutAsync`,
  `ProfilesController`, `UpdateAboutDto`, test in `ProfileServiceTests`.
- 2026-11-14 — **Staff back office at `/admin` (S02-T11).** Replaces the placeholder: review queue, profile review with
  photos (approve / reject with reason), ID documents (in-page preview or new tab; every view logged by the API),
  details and history, and the decision panel (approve, request changes per field with reasons, suspend / reinstate).
  New-photos tab for approved members' uploads; Staff tab (Admin) to make or remove moderators. "Staff area" link in the
  account menu for Admin / Moderator only. Files: `components/sections/admin/{StaffConsole,AdminScreen}.tsx`,
  `app/admin/page.tsx`, `lib/staff.ts`, `components/layout/Navbar.tsx`.
- 2026-11-14 — **Finish / fix your profile from the dashboard (S02-T10, part).** The verification panel now uses the
  server's review status: Draft profiles get a checklist (details · photos · ID · selfie) and "Complete my profile";
  changes requested show each flagged field with the moderator's reason and a Fix link. New page `/profile/complete`
  (signed-in members, prefilled from `GET /profiles/me`) with Profile details → Photos → ID & selfie → Submit; the old
  `/register/status` links redirect there. Files: `components/auth/CompleteProfileFlow.tsx`, `app/profile/complete/page.tsx`,
  `components/auth/{RegisterFlow,ReviewStatus}.tsx`, `components/sections/dashboard/VerificationPanel.tsx`.
- 2026-11-14 — **Registration on the review API (S02-T09).** Step 3 saves the profile to the server; step 4 uploads real
  photos to `/api/photos` (no image data in the browser any more) or keeps an avatar; new step 5 "Identity" uploads
  NIC front + back or passport and a selfie, then submits for review (`POST /api/profiles/me/submit`; missing items are
  listed). Member status reads `profileStatus` from the session (Approved → live, ChangesRequested → changes).
  Files: `components/auth/RegisterFlow.tsx`, new `lib/media.ts`, `components/ui/{PhotoSlot,Stepper}.tsx`,
  `content/avatars.ts` (`photo:<id>` → API file URL), `lib/{registrationDraft,verification}.ts`, `services/api.ts`.

### Added
- 2026-11-14 — **Sprint 02 API: join & get approved (S02-T01–T08, T12; branch `S02-kyc`).**
  - Profile status (`Draft · Submitted · ChangesRequested · Resubmitted · Approved · Suspended`) replaces `Verified`;
    other members see approved profiles only; the session carries `profileStatus`.
  - Member: `GET /api/profiles/me/status`, `POST /api/profiles/me/submit` (needs birth date, main photo or avatar,
    NIC front + back or passport, selfie — 400 lists what is `missing`); resubmitting after changes resolves the flags.
  - Files: `IFileStorage` with local disk (`App_Data/uploads`, not public, ignored by Git); uploads checked by file
    signature (JPEG / PNG / WebP, PDF for documents), ≤ 8 MB.
  - Photos `/api/photos` (≤ 6, main, order, delete, file) — pending until a moderator approves; approved photos of
    approved members load by link, others only for the owner / staff. Documents `/api/kyc/documents` — owner and staff
    only, every staff view logged.
  - Moderation `/api/moderation` (Staff policy): queue, review details, approve, request changes per field with reason,
    suspend / reinstate, new-photo queue, approve / reject photo; all decisions in `ProfileReviewLogs`.
  - Admin `/api/admin` (Admin policy): staff list, find by mobile, make Moderator / Member (sessions revoked). First
    admin from user-secrets `Seed:AdminPhone` + `Seed:AdminPassword`.
  - Notifications `/api/notifications` + SMS for approve / changes / suspend / reinstate; in-app note for rejected photos.
  - New tables: `ProfilePhotos`, `KycDocuments`, `ProfileReviewFlags`, `ProfileReviewLogs`, `Notifications`. Tests:
    `DatingApp.Tests/ReviewFlowTests.cs`. **Needs migration `Sprint02Review`.**

### Fixed
- 2026-11-14 — **Registration data (BUG-023), owner report.** API: mobile-only accounts store no e-mail (`Users.Email`
  nullable) instead of `phone_…@auramatrimony.lk`; `POST /auth/register` with a mobile number returns **201 without a
  session** — sign-in happens at `verify-otp`; login refuses unverified numbers (`403 PHONE_NOT_VERIFIED`); an unconfirmed
  sign-up no longer blocks the number (re-registering takes it over). `POST /profiles` validates and trims input, needs a
  birth date (18–80) and stores `DateOfBirth` (age worked out from it, also in search filters), copies the name and
  optional e-mail to the account (409 if the e-mail is taken), refuses image data in `photoUrl` (avatars are
  `avatar:<id>`), keeps WhatsApp / profile-for in the details (WhatsApp and birth date owner-only), and makes profile
  codes `LK-######` checked against the database. Startup repair cleans existing rows (see DATABASE_GUIDELINES).
  Web: sign-up step 3 asks for profession, field of work and highest education; the profile is sent exactly as entered
  (no "Professional", "Bachelor's Degree", "5' 8\"", age 28, Buddhist / Sinhalese defaults); avatars resolve from
  `avatar:<id>` (`content/avatars.ts`, `services/api.ts`); uploaded photos stay in the browser until the photo API
  (Sprint 02). Files: `Domain/Entities/{User,CandidateProfile}.cs`, `Application/Services/{AuthService,ProfileService,
  SessionService,PasswordService}.cs`, `Application/DTOs/{AuthDtos,ProfileDtos}.cs`, `Application/Common/Exceptions/AppException.cs`,
  `Infrastructure/Persistence/{ApplicationDbContext,ApplicationDbContextInitialiser,Configurations/AuthConfigurations}.cs`,
  `Infrastructure/Services/JwtTokenGenerator.cs`, `WebApi/Controllers/AuthController.cs`, `DatingApp.Tests/{RegistrationTests,
  ProfileServiceTests}.cs`; web `components/auth/RegisterFlow.tsx`, `lib/registrationDraft.ts`, `lib/kycDetails.ts`,
  `content/avatars.ts`, `services/api.ts`, `types/index.ts`. **Needs a migration** (`RegistrationDataFix`).

### Security
- 2026-11-14 — **Sprint 01 completion (S01-T05/06/08/09/11/12/14/15).**
  - Chat (BUG-004/005, TD-03): `ChatController` and `ChatHub` require login; the member comes from the JWT (WebSocket
    token via `?access_token=`), never from arguments. New `Application/Services/ChatService.cs`: only members with an
    accepted interest can chat, outsiders get 404, contact share needs the other member's accept and each side receives
    the other's number, 2,000-char limit, one conversation id per pair, real presence (`WebApi/Hubs/PresenceTracker.cs`).
    Web `services/signalrService.ts` sends the token; `app/messages/page.tsx` swaps optimistic messages for saved ones.
  - Tokens (BUG-017, TD-14): access token in memory only, restored from the refresh cookie (`lib/http.ts`); `aura_token`
    / `aura_auth_user` removed. One fetch helper with timeout used by `services/api.ts`, `services/passwordReset.ts` and
    chat REST (TD-04).
  - Guards (BUG-010/012): `components/auth/RequireMember.tsx` on Dashboard, Friends, Messages, Admin (Admin/Moderator);
    API policies `Admin` / `Staff` (`WebApi/Auth/Policies.cs`).
  - Errors (S01-T11): match-request, profile and content endpoints use `AppException` (400 / 403 `PROFILE_REQUIRED` /
    404 / 409 `ALREADY_EXISTS`); `AppException.Forbidden/Conflict`, codes `FORBIDDEN`, `PROFILE_REQUIRED`, `NOT_MATCHED`.
  - Tooling: `DatingApp.Tests` (xUnit + EF InMemory, 17 tests), `eslint.config.mjs` + ESLint devDeps,
    `.github/workflows/ci.yml` (to be added by the owner), ui index exports, root README rewritten.
- 2026-11-14 — **Merged `main` into `S01-api-auth`.** Kept main's feedback popup, promote placement and styling; kept this
  branch's real-data versions where main restored sample stories, "100+ couples", sample requests / conversations,
  Demo tips, staff links, a hard-coded phone number and client-side plan / KYC switching. Retired demo files are stubs again.

### Removed
- 2026-11-14 — **All demo data removed from the web app (owner request: "remove all demo data").** Screens now show
  only what the API returns, with empty states when there is nothing yet.
  - Demo tools: Demo tips panels (login, register, forgot password, plans, messages), dashboard state switcher,
    fake credentials/codes (`DEMO` in `lib/demo.ts`), "Demo OTP" banner, fake support numbers.
  - Sample people: hero marquee, featured profiles, search pool (`data/mockData.ts`, Figma sample profiles),
    best matches, dashboard requests/inbox/friends, conversations (`content/demoChat.ts`), fake member identity in
    Messages ("Dr. Kavinda Perera"), sample success stories (EN + SI) and fake counts ("100+ couples",
    "12,000+ profiles", category counts, dashboard stats, boost results).
  - Fake behaviour: payment and boost "succeed" without a gateway → now "Online payment is coming soon"; interests
    are sent with `POST /api/match-requests` and show "sent" only after the API accepts; saved search says "coming
    soon"; generated match %, "active now", "posted" labels, horoscope values and education/civil defaults removed.
  - Member status: verification + plan read only from the server session (`lib/verification.ts`, refreshed from
    `GET /auth/me` on load) — the `?kyc=` / `?plan=` previews and localStorage overrides are gone (BUG-011 part, BUG-012).
  - Admin: mock panel (any password, sample members) replaced by a placeholder; staff links removed from the menu (BUG-010).
  - API: `ProfileService` fallback sample profiles and stock photos, `ContentService` fallback stories and fake
    totals, sample success-story seed and demo member seed removed. Home shows approved members only.
  - New: `lib/profiles.ts` (API → card adapters, `useMemberProfiles`, `sendInterest`), `lib/registrationDraft.ts`
    (draft helpers moved out of `lib/demo.ts`), `MatchRequest` type, `apiService.getStories/refreshSession`.
  - Retired files (now empty stubs — delete them): `lib/demo.ts`, `data/mockData.ts`, `content/demoChat.ts`,
    `components/auth/DemoTips.tsx`, `components/sections/dashboard/DashboardDemo.tsx`, `components/MemberDashboard.tsx`,
    `components/CheckoutModal.tsx`, `components/FoundMatchModal.tsx`, `components/AccountClosureModal.tsx`,
    `components/profile/ProfileDetailModal.tsx`, `components/cards/ProfileGlassCard.tsx`,
    `components/sections/member/MessagesScreen.tsx` (TD-01).
  - Still kept in the browser until their APIs exist (not demo data, not secure yet): free-plan usage counters,
    favourites, edit-profile text/photos.

### Added
- 2026-11-13 — **Auth API, endpoints #1–14 (branch `S01-api-auth`, S01-T01/02/03/04/05/10/11/13/16).** New:
  `POST /api/auth/refresh`, `logout`, `forgot-password`, `forgot-password/verify`, `reset-password`,
  `change-password`, `GET sessions`, `DELETE sessions/{id}`; reworked `register`, `login`, `google-login`,
  `send-otp`, `verify-otp`, `me`. Errors are ProblemDetails with `code` (+ `attemptsLeft`, `retryAfterSeconds`).
  Files (API): `Domain/Entities/{User,RefreshToken,OtpCode,PasswordResetToken}.cs`, `Domain/Enums/AuthEnums.cs`,
  `Application/Common/{Exceptions/AppException,Security/AuthRules,Security/SecureTokens,Security/Identifiers}.cs`,
  `Application/Common/Interfaces/{IApplicationDbContext,ISecurityServices}.cs`, `Application/DTOs/AuthDtos.cs`,
  `Application/Services/{AuthService,SessionService,OtpService,PasswordService}.cs`,
  `Infrastructure/{DependencyInjection.cs,DatingApp.Infrastructure.csproj}`,
  `Infrastructure/Persistence/{ApplicationDbContext,ApplicationDbContextInitialiser,Configurations/AuthConfigurations}.cs`,
  `Infrastructure/Services/{JwtTokenGenerator,PasswordHasher,GoogleTokenValidator,LoggingMessageSenders}.cs`,
  `WebApi/{Program.cs,DatingApp.WebApi.csproj,appsettings.json,appsettings.Development.json}`,
  `WebApi/Controllers/{AuthController,AuthController.Passwords,BaseApiController}.cs`,
  `WebApi/Auth/{RefreshCookie,AuthCookieSettings,RateLimits}.cs`, `WebApi/Errors/AppExceptionHandler.cs`.
  Files (web): `services/api.ts`, `services/passwordReset.ts`, `components/ui/PasswordField.tsx`,
  `components/auth/{RegisterFlow,ForgotPasswordScreen}.tsx`. **Not yet compiled or tested** — see PROGRESS handover.

- 2026-11-14 — **Feedback popup for paid members** (Gold / Platinum, KYC approved). One reusable `FeedbackDialog`
  (mounted in the root layout) with a brand illustration on top (couple + love stickers, badge per step):
  rate 1–5 stars → 4–5: quick tags, optional public review (first name + city consent), "Found your partner?" link ·
  1–3: private feedback (tags or text required) + Contact support link · Success story form (names, wedding date,
  city, story ≥ 30 chars, up to 3 photos, both-partner consent) · Thank you with reference (VK-DDMM-NNNN).
  Opens automatically on the dashboard (2 s after load) only after a happy moment: 3 days after a contact share is
  accepted · 14 days after paying with ≥ 1 accepted interest · after a renewal. Never in the first 3 days after paying
  or 7 days after a report/block; max once per 30 days; "Don't ask again"; none for 6 months after sending.
  Manual: profile menu "Share feedback" (desktop + mobile) and a new Share feedback card on `/support`
  (Share your story · Share feedback); Free members get an info toast. Demo tips: "Feedback popup". Demo storage in
  localStorage; planned `POST /api/feedback`. Files: `lib/feedback.ts`, `components/feedback/FeedbackDialog.tsx`,
  `components/feedback/ShareFeedbackCard.tsx`, `app/layout.tsx`, `layout/Navbar.tsx`, `support/SupportScreen.tsx`,
  `app/messages/page.tsx` (contact accepted, block/report), `search/ProfileView.tsx` (report), `lib/verification.ts`
  (renewal), `dashboard/DashboardDemo.tsx`.
- 2026-11-12 — **"How to use" page (`/how-to-use`)**, concept inspired by invitation.lk's guide, built with our design
  system: hero with Create New / Login (member: Go to dashboard) + trust chips; **6-step journey** (create account →
  log in → get verified → find a match → send interest → chat & share contacts) — tap a step to see its real phone
  screen and the statuses you'll meet (e.g. Pending review → Changes needed → Approved); **full tour** of every feature
  in 4 groups (account · finding a match · connecting · plans) with screens, bullets and "Find it in"; closing CTA.
  EN + SI (tour group details in English for now). 17 real 390 px screenshots in `public/how-to-use/*.webp` (568 KB).
  Linked from: guest top menu "How it works", member profile menu "How to use" (desktop + mobile), home "How it
  works" section → "See the full guide". Files: `app/how-to-use/page.tsx`, `sections/howto/HowToUseScreen.tsx`,
  `content/howToUse.ts`, `layout/Navbar.tsx`, `home/HowItWorks.tsx`.
- 2026-11-11 — **Share contact details (front end, mutual consent).** Chat header "Share contact" (Gold) → request card
  in the thread; the other member sees "{name} wants to share contact details" with **Accept & share · Not now**.
  Accepted → both see mobile + WhatsApp (Call / WhatsApp buttons, header chip); declined → gentle note, can ask again;
  requester can cancel. State is per conversation. Mobile uses the ⋯ menu. Demo: 2nd chat has an incoming request,
  Demo tips simulate accept / decline. New `components/sections/member/ContactShare.tsx`; replaced the old unstyled
  banner/button in `app/messages/page.tsx` (it used non-existent `emerald-*` / `brand/30` classes and one shared state).
- 2026-11-11 — **Forgot password journey (front end, S01-T16).** 3 steps: choose Email or Mobile → enter it → send
  code · enter 6-digit code (auto-verifies, attempts left, expired code, 5-try lock, 60 s resend, max 3 resends,
  "Still no code?" help) · new password + confirm → Login with toast. Same message whether or not the account exists
  (privacy). Runs on a demo adapter until the API exists (TD-18).
  Files: `components/auth/ForgotPasswordScreen.tsx` (rewritten), `components/auth/IdentifierTabs.tsx` (new),
  `services/passwordReset.ts` (new), `lib/demo.ts` (`registeredEmail`).

### Security
- 2026-11-13 — BUG-001: no master OTP; codes hashed, limited, never returned. BUG-002: Google tokens verified with
  Google. BUG-003: no fake sessions in the web client. BUG-006: CORS allow-list. BUG-007: no secrets in appsettings,
  no fallback JWT key (rotate the old key + Google client secret). BUG-008: 15-min access token + rotating refresh
  token with reuse detection, logout, session revoke. BUG-013/015: SQL + migrations by default, demo member only in
  Development. BUG-018: PBKDF2 600k with upgrade on login. Per-IP rate limits on auth endpoints.

### Breaking
- 2026-11-13 — `google-login` now takes only `{ idToken }`. `send-otp` no longer returns `demoOtp`. Passwords need
  8+ characters with a letter and a number (web + API). Startup needs `JwtSettings:Secret` (user-secrets) and an
  `InitialCreate` migration; Swagger only in Development. Phone numbers are stored as E.164.

### Fixed
- 2026-11-13 — **Registration now saves to the database.** The 4 steps used demo timers and the final save only reached
  the API with a fake session (removed for BUG-002/003), so profiles stayed in the browser. Now: step 1 →
  `POST /auth/register` (mobile + password; e-mail optional) + `POST /auth/send-otp`; step 2 → `POST /auth/verify-otp`
  (real attempts / expiry / resend limits); finish → `POST /profiles` with the member's token, refreshed once on 401 via
  the httpOnly cookie; a failed save shows an error and keeps the member on the step. New profiles start
  **unverified** (BUG-009). Demo OTP banner removed. Files: `components/auth/RegisterFlow.tsx`, `services/api.ts`
  (`ApiError`, `authFetch`, `refreshAccessToken`), `Application/DTOs/AuthDtos.cs`, `Application/Services/AuthService.cs`,
  `Application/Services/ProfileService.cs`.
- 2026-11-14 — **Home hero search bar (Sinhala)**: the age "25 - 32" and the "යෝජනා සොයන්න" button wrapped to two
  lines. Bar max width 600 → 760 px, segments size to their content (min 230 px), labels / values / button text no
  longer wrap. Checked SI + EN at 1440, 1024, 768, 390. `home/Hero.tsx`.
- 2026-11-14 — Search crashed with "Cannot read properties of undefined (reading 'MP-24817')": `content/home.ts` was
  re-saved from an older copy, dropping `FEATURED_ABOUT`. Moved it to its own file `content/featuredAbout.ts`.
- 2026-11-14 — Hovering a focused input/textarea replaced the rose focus border with the grey hover border (both
  themes). `ui/Field.tsx`, `ui/Textarea.tsx` hover now applies only when not focused; `ui/Select.tsx` sort trigger
  only hovers when closed.
- 2026-11-12 — Share-contact card on phones: "Accept & share" / "Not now" were squashed flat (flex-1 in a column) →
  full width when stacked, flex-1 only side by side. `member/ContactShare.tsx`
- 2026-11-11 — **Responsive layout.** Scanned home, search, dashboard, friends, messages, plans, login, register and
  forgot password at 360–1280 px (EN + SI); fixed every cut-off:
  - Mobile container was fixed at 358 px, so large phones / landscape / small tablets (391–767 px) showed a narrow
    centre column → now fluid (`--layout-container-max: 100%` below 768 px; phones ≤ 390 px unchanged). `styles/tokens.css`
  - Profile card: "View" spilled out of the card and details were cut to "28…" → buttons wrap to a second row,
    details drop to one column when the card is narrow. `cards/ProfileCard.tsx`
  - Search at 360 px: Filters / view / sort toolbar wider than the screen → wraps. `app/search/page.tsx`
  - Plans: period switch and plan cards wider than a phone; price "/ 3 months" overflowed at 768–1023 px → switch
    stacks the saving badge under the label on phones, cards p-6 on phones, one column (max 576 px) until 1024 px,
    price wraps. `auth/PlansScreen.tsx`

### Changed
- 2026-11-14 — **"Your profile is promoted" card moved under the dashboard hero.** While a boost is active the status
  card (days left, extra views, interests, Extend 7 days) shows right under the welcome banner; the "Promote your
  profile" offer (not promoted) stays between Requests & messages and Best matches. New `placement` prop on
  `PromoteCard` ("top" | "offer"). Files: `promote/PromoteFlow.tsx`, `app/dashboard/page.tsx`.
- 2026-11-14 — **Dashboard order for paid members** (Approved Gold, Platinum, expiring soon): the Promote your profile
  and Gold/Platinum member cards moved from under the hero to between Requests & messages and the Best matches band.
  Free and pending members unchanged. `app/dashboard/page.tsx`.
- 2026-11-14 — **No em dashes (—) in any UI text** (EN + SI): titles, toasts, errors, FAQs, How to use copy, demo
  chat text, aria-labels and the PWA name. Replaced with a comma, full stop, colon or space as fits the sentence;
  empty-cell placeholders now "-". 31 files across `content/*`, `components/*`, `app/*`, `lib/usage.ts`. Code
  comments untouched. How to use screenshots (`public/how-to-use`) still show old copy until re-captured.
- 2026-11-14 — **Removed the match pill** ("95% · Excellent match · 10 of 10 preferences") from the search list card;
  the shortlist heart stays top right. Unused `MatchPill` component removed from `cards/ProfileCardList.tsx`.
- 2026-11-14 — **Search list card: "About me" + "Created by".** The quoted one-line placeholder ("Verified member
  (MP-…). Dedicated professional…") is replaced by an **About me** block — the member's short description from the
  KYC "About you" field, 2 lines, hidden when empty. "Posted by" renamed **Created by** on the list card, the
  profile Basic details and the search filter title (matches the profile's "Created by" badge). Demo About text for
  the 8 featured profiles in `content/featuredAbout.ts` (`FEATURED_ABOUT`), also used on the profile page. Files:
  `cards/ProfileCardList.tsx`, `app/search/page.tsx`, `sections/search/ProfileView.tsx`, `content/search.ts`.
- 2026-11-14 — **Chat header ⋯ (More options) button** is now a 40 px round outline button matching Share contact /
  View profile beside it (surface card + `ring-line-strong`); hover and open = brand-subtle fill, rose ring, rose
  icon; keyboard focus ring; removed the 90° rotate. `app/messages/page.tsx`.
- 2026-11-14 — **Dark mode colour pass (UX audit).** Measured issues: cards vs page 1.13:1 (no depth), brand-subtle
  rose-950 1.0:1 on cards (icon tiles / selected rows invisible), white on rose-500 4.03:1 (failed AA), solid 700
  status fills (loud), cool blue-grey neutrals clashing with the rose brand, full-opacity heart pattern. New dark
  tokens in `styles/tokens.css`: warm plum neutrals (page `#110B0E`, card `#241A1F`, raised `#2F2329`), brand
  rose-600 (4.98:1), brand-subtle `#43182A`, softer text (`#F7EFF2` / `#D3C4CB` / `#A8979F`), translucent status
  tints with light text, warm page gradient, `--color-border-premium` (gold-300 → 45 % in dark; Tailwind
  `premium.line` now uses it). Heart pattern 35 % in dark (`ui/Decor.tsx`). Light theme unchanged.
  - **Input focus in dark:** soft translucent rose ring (`--focus-ring-brand` / `--focus-ring-error` dark overrides)
    instead of the bright rose-100 halo.
  - **Badges on photos** (Verified / Horoscope / Promoted on `ProfileCard`, `ProfilePhotoCard`, `ProfileDetailModal`)
    get `.on-photo` (dark glass backing, `app/globals.css`) so translucent tints stay readable on light photos.
  - **Pinned notes** (`ui/PinNote.tsx`, home How it works, How to use tour) use dark rose/gold surfaces
    (`--gradient-note-rose|gold`) with token text in dark instead of bright paper.
  - **Gold member band** (`dashboard/ProPlanCard.tsx`) uses `--gradient-premium-band` in dark.
- 2026-11-14 — Profile details: "Created by Self / Mother / Father / Relative" chip next to ID verified (who manages
  the profile); "Posted …" chip shown without the person icon so the two aren't confused.
- 2026-11-14 — Profile details: hidden fields shown as **blurred placeholder values with a lock badge** in their own
  section (Weight, Monthly income, Zodiac sign; new **Contact details** section with Mobile and Email). Real values are
  never rendered — the blur is fake text. Guests tap → login popup ("Log in to see …"). Members: weight / income /
  zodiac unlock; Mobile / Email stay hidden until both accept a contact share (tap explains, or opens Messages when
  already friends). Removed the grouped "More details for members" box, the separate privacy box and the section
  menu chips.
- 2026-11-14 — **Profile details redesigned** (`search/ProfileView.tsx`): square main photo + 4 square thumbnails
  (last shows "+N", all open the photo viewer); summary on the right — name, location, badges, round **Share** and
  **Favourite** icon buttons (replace the match-% card and the heart on the photo), 4 key facts, About, Message /
  Send interest. Below: section menu (Chips, highlights the section in view) and titled full-width sections —
  Basic details · Religion and background · Education and career · Location · Horoscope · Family — using the
  icon-tile rows. Empty fields are hidden; guest-only fields (weight, salary, zodiac) are grouped in one
  "More details for members" box with Log in. Phones: 2-column rows, long values wrap.
- 2026-11-12 — How to use: removed Create New / Login from the page header, removed the divider lines between tour
  groups and the extra love stickers around the phones — the page now uses only the home page's heart pattern background.
- 2026-11-12 — How to use tour: **every feature now shows two screens** (before/after or list/detail), e.g. register →
  verify mobile, edit description → edit photos, sent list → waiting for reply, conversations → chat, report → block
  menu, plans → Gold plan. 9 new real screenshots (31 total, ~1 MB WebP, lazy-loaded).
- 2026-11-12 — How to use tour redesigned with the brand's **pinned-note style**: each feature is a large pinned note
  (big number 01–17, icon, title, bullets, statuses, "Find it in") next to floating, slightly tilted phone mock-ups
  with love stickers; sides alternate (note left / phone right, then phone left / note right) and note colours
  alternate rose / gold. New shared `ui/PinNote` (extracted from Home "How it works" — home notes render identically).
- 2026-11-12 — How to use journey: **reverted the 6-column strip** (owner preferred the original). Back to the step list
  on the left + phone on the right (tap a step), now as **two equal halves** (`lg:grid-cols-2`); the phone sits on a
  soft brand panel and is larger (250–270 px). Original six steps restored (incl. "Log in"). The tour additions from
  the previous change are kept (edit profile, sent interests, favourites, safety & privacy, promote).
- 2026-11-12 — How to use, layout clean-up: no background behind text — only screens sit on a white panel; tour rows
  are **text 4 / screens 8 columns** (12-col grid), text always left and top-aligned, bigger titles (H4→H3); group
  names as overline with a divider; journey section without the outer card.
- 2026-11-12 — How to use closing CTA now **reuses the home page "Ready to meet your life partner?" band** (same
  gradient, heart pattern and sign-up form) for guests; members get the same band with Dashboard / Search buttons.
  Fixed the blank "Login" button (white text on white). `home/SignUp.tsx` now exports `BrandBandDecor` and takes
  `embedded` (no extra container) — home page unchanged.
- 2026-11-12 — Top menu links don't wrap any more at 1024 px ("How it works" was on two lines). `layout/Navbar.tsx`
- 2026-11-12 — How to use page, journey redesigned: **6-column strip** (3 × 2 on tablets, swipe row on phones) where
  every step shows its screen at once — no clicking: Create account → Get verified → Find your match → **Send
  interest** → **Accept a request** → Chat & share contacts; numbered circles joined by a dashed line, statuses
  listed under each step. Tour gained: Edit your profile, Track sent interests (Waiting / Accepted / Declined),
  Favourites, **Safety & privacy** group (Report or block: Report sent → Under review → Action taken) and Promote your
  profile. 5 new screenshots (`interest-sent`, `favourites`, `edit-profile`, `report`, `promote`).
- 2026-11-11 — Home hero title in Sinhala is 8 px smaller than English at every breakpoint (28 / 40 / 52 px vs
  36 / 48 / 60), line height 1.2. `home/Hero.tsx`.
- 2026-11-11 — **Sinhala font trial: Noto Sans Sinhala** (400/600/700/800) replaces Yaldevi for look-and-feel review;
  nothing else changed. Figma `font/family/sinhala` is still Yaldevi — `@fontsource/yaldevi` stays installed to switch
  back (2 lines: `app/layout.tsx` imports + `--font-family-sinhala` in `styles/tokens.css`). New dependency
  `@fontsource/noto-sans-sinhala` → run `npm install`. Noto is wider: e.g. hero search "25 – 32" wraps to 2 lines.
- 2026-11-11 — Dashboard "Your best matches today": every card opens the full profile page
  (`/search?id=…&from=dashboard`); the header shows "Dashboard / ID" and Back returns to the dashboard
  (`#matches`, or browser history when available). Free members' profile-view limit still applies.
  Files: `dashboard/BestMatches.tsx`, `app/search/page.tsx`, `search/ProfileView.tsx`.
- 2026-11-11 — **"Requests" page renamed "Friends".** New route `/friends` (`app/friends/page.tsx`); `/requests` now
  redirects there keeping `?tab=` / `?id=` so old links and bookmarks work. Updated: top menu + mobile tab bar label
  (EN "Friends", SI "මිතුරන්"), page title/breadcrumb/subtitle, browser title, dashboard Inbox links, Messages links,
  verification panel, `MEMBER_LINKS`, `FIGMA_MAP.md`. Internal names (`RequestsScreen`, `REQUEST_TABS`, `t.nav.requests`)
  kept to avoid churn.
- 2026-11-11 — `UpgradePrompt` has two modes. **Monthly limit reached** (searches, profile views): hard stop —
  Upgrade to Gold · Back to Dashboard. **Gold-only feature** (messages, chats, interests — free allowance 0):
  closable — X, Esc, Upgrade to Gold · Close; the member stays on the page. (Fixes the earlier change that had
  made the Gold-feature prompt impossible to close.)
- 2026-11-11 — Forgot password: `BackButton` top-left of the card on all 3 steps — step 1 → previous page (Login),
  step 2 → step 1 (change email/mobile), step 3 → step 2 (re-verify; password fields cleared).
  File: `components/auth/ForgotPasswordScreen.tsx`.
- 2026-11-11 — **Free-limit popup is now a hard stop.** `UpgradePrompt` has no close (X), Esc and "Keep browsing" removed.
  Two buttons only: **Upgrade to Gold** · **Back to Dashboard** (navigates to `/dashboard`; on the dashboard itself it just
  closes). Browser back also clears an action-triggered prompt.
  File: `components/layout/UpgradePrompt.tsx`.
- 2026-11-11 — Share dialog: Copy button sits 5 px inside the link field with `rounded-sm` (8 px) so its corners follow
  the field's 12 px radius. File: `components/profile/ShareProfileDialog.tsx`.
- 2026-11-11 — **Selected tab in brand colour.** New shared `ui/SegmentedSwitch` (2 options, sliding brand-gradient pill,
  on-brand text, Bold icon, short labels under `sm`). Now used by `IdentifierTabs` (Login + Forgot password, labels
  "Email"/"Mobile" on phones) and Registration's "Upload photos / Choose an avatar" switch (`RegisterFlow.tsx`), so all
  auth flows share one look. Files: `ui/SegmentedSwitch.tsx` (new), `ui/index.ts`, `auth/IdentifierTabs.tsx`, `auth/RegisterFlow.tsx`.
- 2026-11-11 — `LoginScreen` uses the new shared `IdentifierTabs` instead of its inline Email/Mobile toggle (same look).

### Removed
- 2026-11-11 — "Number not found" alert on Forgot password (revealed whether a number is registered).

### Docs
- 2026-11-11 — Project documentation: root `CLAUDE.md` and `docs/` (overview, analysis, architecture, coding standards,
  UI/UX, components, database, API, security, error handling, testing, workflow, sprint plan, progress, bug tracker,
  technical debt, changelog). No application code changed.

## Baseline (before 2026-11-11)
State at the time of the analysis, for reference: Next.js 15 web app with home, auth, registration, KYC dashboard states,
search, profile view, requests, messages, plans, promote and support screens (mostly demo data); .NET 9 API with 19
endpoints and a chat hub. See `PROJECT_ANALYSIS.md`.
