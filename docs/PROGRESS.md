# Progress

**Status values:** Not Started · In Progress · Testing · Completed · Blocked · Deferred.
"Completed" only when acceptance criteria pass and tests/manual checks are recorded (`TESTING_GUIDELINES.md` §6).

_Last updated: 2026-11-19 — Sprint 05: T01–T09 Completed (owner checked); T10 (web tests) built, awaiting `npm install` + `npm test` by the owner._

## Overall
| Area | State |
|---|---|
| Web UI (screens, design system) | Largely built against Figma; member features, plans, payments and the admin members area use the API (roles & staff accounts still demo — TD-28) |
| API | Auth, profiles, review / KYC, staff area, search, plan limits + usage, profile views, interests, shortlist, saved searches, blocks, reports, dashboard (S03); prices, subscriptions, bank-transfer payments, boosts, admin members + audit log, take a break / delete account (S04) — verified 2026-11-17 |
| Security | Sprint 01 critical/high issues closed; KYC, usage limits, plan and boost all enforced by the server — BUG-011 verified 2026-11-17 |
| Tests / CI | `DatingApp.Tests` (xUnit, 72 tests) + CI workflow (owner adds `.github/workflows/ci.yml`) |
| Current sprint | **05 — Cleanup & front-end debt** (branch `S05-Cleanup-&-front-end-debt`) — planned 2026-11-17 · 04 completed and merged to `main` (PR #8) |

## Sprint 01 — Foundation & critical security
| Task | Status | Notes |
|---|---|---|
| S01-T01 Secrets out of source | Completed | Secrets removed from appsettings; app refuses to start without `JwtSettings:Secret` (≥32 bytes); user-secrets id added. **Rotate** the old JWT key + Google client secret (in Git history) |
| S01-T02 CORS allow-list | Completed | `Cors:AllowedOrigins` allow-list (dev: localhost:3001/3000); production list empty until set |
| S01-T03 OTP hardening | Completed | Hashed codes, 5 min, 5 tries, 60 s resend, 3 resends/hour, per-IP limit; no master code; never in response. `ISmsSender` logs in dev only (TD-21: real provider) |
| S01-T04 Google token verification + no fake session | Completed | Google ID token (One Tap) + access token (popup) verified with Google; web fake sessions removed (register, Google, OTP, profile auto-session) |
| S01-T05 Refresh / logout / token storage | Completed | API: 15-min access token, rotating refresh token in httpOnly `vk_refresh` cookie, reuse detection. Web (2026-11-14): access token in memory only (`lib/http.ts`), restored with `/auth/refresh` after reload, old `aura_token` removed (BUG-017) |
| S01-T06 Chat authentication | Completed | Hub + chat API `[Authorize]`; identity from the JWT (`?access_token=` on the WebSocket); only matched members can chat; outsiders get 404; contact share needs the other member's accept (`ChatService`, BUG-004/005, TD-03) |
| S01-T07 Stop auto-verify on profile save | Completed | New profiles saved with `Verified = false` (2026-11-13). Existing-profile updates leave the flag unchanged |
| S01-T08 Admin link + role gate | Completed | Admin links stay out of the menu (also after merging `main`); `/admin` needs Admin/Moderator (`RequireMember role`); API policies `Admin` / `Staff` |
| S01-T09 Dashboard guest guard / KycGuard default | Completed | Guests on Dashboard / Friends / Messages → `/login?next=…` (`RequireMember`); `KycGuard` only acts for signed-in members; KYC default is "pending" |
| S01-T10 Migrations, SQL default, dev-only seed | Completed | `Migrate()` on start, SQL Server default, `InitialCreate` migration generated (2026-11-14), content seed only (no demo member) |
| S01-T11 Global ProblemDetails handler | Completed | All controllers throw `AppException` → ProblemDetails (`code`, `traceId`); match requests: 400 / 403 `PROFILE_REQUIRED` / 404 / 409; content no longer swallows DB errors |
| S01-T12 Typed fetch helper | Completed | `lib/http.ts`: `apiRequest` / `apiJson`, 15 s timeout, refresh-once on 401, `ApiError`; used by `api.ts`, `passwordReset.ts`, chat REST (TD-04) |
| S01-T13 Password hashing upgrade | Completed | PBKDF2-SHA256 600k (`v2.` format); old hashes verify and are upgraded at login |
| S01-T14 Lint, tests, CI, ui exports | Completed | `eslint.config.mjs` (+ devDeps — run `npm install`); `DatingApp.Tests` (xUnit, 17 tests: OTP, sessions, chat, interests); `.github/workflows/ci.yml` (owner to add — tool can't write `.github`); `SegmentedTabs`, `PhotoSlot`, `ButtonLink` exported |
| S01-T15 README update | Completed | Root README: start-here links to CLAUDE.md / docs, run + check commands, status |
| S01-T16 Forgot password journey | Completed | API endpoints #9–11 + change password #12 built; `services/passwordReset.ts` now calls them. Password rule aligned web ↔ API: 8+ chars, letter + number |

## Sprint 05 — Cleanup & front-end debt
Planned 2026-11-17 (see `SPRINT_PLAN.md`): no member-facing changes; branch **`S05-Cleanup-&-front-end-debt`**.
Decisions (owner, 2026-11-17): `/components` dev-only; TD-32 (admin member detail + CSV) moves to Sprint 06; web tests
with Vitest.

| Task | Status | Notes |
|---|---|---|
| S05-T01 Dead code + old staff console wrapper | Completed | The old tabbed staff console is gone: its parts now live in `components/admin/` (`ReviewQueue` — queue, review screen, new photos; `StaffManager`; `PlanLimitsEditor`; `ReportsQueue`; `PricesEditor`; `staffHelpers.ts`) and the admin pages import them from there; `sections/admin/AdminScreen.tsx`, `sections/admin/StaffConsole.tsx` and unused demo text `content/featuredAbout.ts` deleted. `/components` showcase → development only (production 404, `noindex`); content moved to `components/dev/ComponentsShowcase.tsx`. Unused-file sweep found nothing else. No behaviour change. Built 2026-11-17; old files removed with `git rm`; owner checked the admin pages 2026-11-19 |
| S05-T02 Colours that render (BUG-019) | Completed | Colour tokens in `tailwind.config.ts` now accept opacity modifiers (`color-mix()` only when a `/NN` is used, plain `var(--…)` otherwise): dialog backdrops `backdrop:bg-black/45`, `bg-black/40`, `bg-white/25`, `bg-surface-card/90`, `border-brand/20`, `ring-brand/20`, `bg-error-bg/50·80` render again. Messages: the safety-warning bubble used `amber-*` (not in the theme) → `warning-*` tokens. Also removed em dashes from UI text added in Sprint 04 (plan card, payment banner, admin payments, admin member messages). Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T03 Shared Modal + ConfirmDialog | Completed | `components/ui/Modal.tsx` (exported from `ui`): `Modal` on the native `<dialog>` (`showModal`: focus kept inside, page behind inert, top layer) + Esc / backdrop / close button → `onClose`, `dismissible={false}` to lock it, scroll lock counted for nested dialogs, focus returned to the opener, `aria-labelledby` / `aria-describedby` from `title` / `description`, sheet on phones / centred card from `sm`, sizes sm · md · lg · xl, `animationKey` to replay the animation per step. `ConfirmDialog`: title, text, optional extra field, Cancel + Confirm (`tone` danger, `busy`, `confirmDisabled`). Demo in `/components` → Dialogs. Built 2026-11-19 — owner checked the demo 2026-11-19 |
| S05-T04 Member dialogs → Modal | Completed | On the shared `Modal` now (own headers kept, look and steps unchanged): log in to continue, upgrade prompt (still not closable on the Search hard stop; backdrop never closes it), share profile, feedback, guided tour, block member (chat), report profile, edit profile, promote profile, account settings, install-app sheet. All of them: Tab stays inside, Esc closes (where allowed), page doesn't scroll behind, focus returns to the button that opened it; phones get the bottom sheet. `Modal` also learned `data-autofocus` (first focus) and its backdrop is no longer a hidden button. Kept as they are on purpose: the full-screen photo viewer (a lightbox, not a card) and the Search filter drawer (moves with the search split, T07). Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T05 Admin dialogs → Modal | Completed | Members: activate / deactivate / block / unblock / reset password → `ConfirmDialog` (member card + required reason + error inside; can't be closed while saving). Roles & staff: "Add a staff member" and "Temporary password" use `ui/Modal` (thin wrapper keeps the form spacing). Phone / tablet staff menu → `Modal placement="left"` (new drawer option: full height, 280 px, slides in from the left; scroll lock and focus return like every dialog). No hand-built dialog left in the app except the full-screen photo viewer (lightbox) and the Search filter drawer (T07). Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T06 Storage helper, no silent errors | Completed | New `lib/storage.ts` (all keys in `KEYS`, legacy keys in `LEGACY_KEYS`; `get / set / remove / getJSON / setJSON / clear / removeLegacy`, `readSessionData()`; never throws) and `lib/log.ts` (dev-only `log.warn / log.error`). Direct localStorage / sessionStorage calls: 66 → 0 (only the theme line in the inline script in `app/layout.tsx`, which runs before React). Empty `catch {}`: 0 (each now logs what it keeps doing). `console.*` outside `lib/log.ts`: 0; ESLint `no-console` added. Chat: `getConversations` / `getChatHistory` throw instead of returning `[]` — Messages shows "We couldn’t load your chats" + Try again, and a toast when one conversation fails (BUG-014). Also: the install sheet's own scroll lock removed (Modal does it); lint warnings cleared in ForgotPassword, ProfilePhotoCard, InstallAppBanner, Navbar, Hero, SignUp, HowToUse, ProfileView, Select (`aria-invalid` on a button → `data-invalid`), LanguageContext. Left for T07: warnings in the Messages / Search pages; GoogleSignInButton hook deps. Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T07 Split messages + search routes | Completed | Messages page 1,055 → 80 lines: logic in `components/sections/messages/useChat.ts` (list, open chat, SignalR, send, typing) + `useContactShare.ts` (share contact details) + `useChatSafety.ts` (block / unblock / report / mute); layout in `ConversationList`, `ChatHeader`, `MessageThread`, `ChatComposer`. Search page 790 → 222 lines: `components/sections/search/searchQuery.ts` (query mapping, URL filters, saved-search name), `useSearchResults` (fetch, 0.7 s apply, limit roll-back, load more, client filters), `useSavedSearches`, `useProfileDetail` (?id=, Back / Forward), `ActiveFilters` (chips + saved searches), `ResultsHeader`, `ResultsBody` (+ `EmptyResults`), `FilterDrawer`. Largest new file 335 lines. Filter drawer on phones now uses the shared `Modal` (`placement="left"`): Esc closes, Tab stays inside, focus returns to the Filters button, closes itself on desktop width; its own scroll-lock code removed. Lint: unused `unreadTotal` and an unused `eslint-disable` removed, chat hook deps complete (toast API now stable — `ToastProvider` memoises it), `GoogleSignInButton` hook deps fixed (latest handlers in a ref). Unused connection-status listener on Messages removed (nothing showed it). No visible change intended. Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T08 One icon set | Completed | `lucide-react` replaced with iconsax in its 4 files: filter-chip remove (the plus turned 45°), chat ⋯ menu (`User`, `Call`, `VolumeHigh` / `VolumeSlash` for mute, `Slash` for block, `Flag`), block dialog / blocked row / blocked notice (`Slash`, `TickCircle`, `ShieldCross`), profile Share button (`Share`), chat safety warning (`Danger`), read / sent ticks (filled / outline `TickCircle`), typing (`Message`). `lucide-react` removed from `package.json` — run `npm.cmd install` to update the lock file. Every iconsax name used in `src` checked against the package's type list. Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T09 next/image for static images | Completed | 18 `<img>` tags for files in `public/` → `next/image` (resized, WebP/AVIF, lazy by default): logo (`Logo`, staff area, page loader — `priority`), bride / groom / couple avatars (`BrandAvatar`, Hero "Looking for", tour card, feedback dialog + card, account dialogs), love stickers, country flags, install-app icon (2), how-to-use + guided-tour phone screenshots (with `sizes`), and the hero photo on Home (`priority`), Dashboard hero (`priority`) and Best matches (`fill`). Every size kept as before (same width / height / classes). Left as `<img>` on purpose (26): member photos and API files (private, need the token — `useApiImage`; success-story photos from the API), upload / camera previews and `data:` avatars, and the two spots that switch between a member photo and a bride / groom fallback (Dashboard views, profile view). Built 2026-11-19 — owner checked 2026-11-19 |
| S05-T10 Web tests + docs | Testing | Vitest 3 + Testing Library + jsdom: `vitest.config.mts` (`@` alias, jsdom, `src/test/setup.ts` — jest-dom matchers, storage reset, `<dialog>` stand-in since jsdom has no `showModal`). `npm test` (once) / `npm run test:watch`. 40 tests in 3 files: `components/ui/Modal.test.tsx` (closed = nothing rendered; name / description; `ariaLabel`; `data-autofocus`; Esc → onClose and the browser kept from closing it; close button + backdrop; `closeOnBackdrop={false}`; `dismissible={false}`; scroll lock with nested dialogs; focus back to the opener; ConfirmDialog confirm / cancel, labels + extra field, `confirmDisabled`, `busy`, Esc), `lib/storage.test.ts` (local vs session, JSON + fallbacks, never throws on quota / blocked storage, `clear`, `removeLegacy`, `readSessionData`, unique keys), `lib/http.test.ts` (ProblemDetails → `ApiError` title / message / fallback / code / extras / non-JSON body, `apiJson` 2xx / 204 / errors / JSON body, NETWORK and TIMEOUT errors, no token when signed out, Bearer header, 401 → one refresh → retry, restore after reload, failed refresh). Could not run here (no network for packages). First owner run 2026-11-19: all 40 failed in setup — Node 25's own empty `localStorage` global hid jsdom's; setup now puts jsdom's `localStorage` / `sessionStorage` / `Storage` back. Owner to re-run `npm.cmd test` |

## Sprint 04 — Earn
Planned 2026-11-16 (see `SPRINT_PLAN.md`): bank transfer only, Plans-page prices in the DB, no auto-renew; branch **`S04-pay`**.
Branch `S04-Pay` created 2026-11-16 (from main with Sprint 03). Started with T01–T02, then T03–T04.
**Decision (owner, 2026-11-16):** Roles & staff (custom roles, staff usernames) wait for a later sprint — Admin and Moderator only for now; the Roles page stays on demo data (TD-28).

| Task | Status | Notes |
|---|---|---|
| S04-T01 Plans and prices in the DB | Testing | `PlanPrice` (cents) seeded with the Plans-page prices; `GET /api/plans` (public, with saving %); `GET/PUT /api/admin/prices`; staff area **Prices** tab; Plans page reads the API. Built 2026-11-16 — awaiting owner test (migration `Sprint04Billing`) |
| S04-T02 Subscriptions + expiry + reminder | Testing | `Subscription` is the source of the plan (limits, contact share, session); profile keeps a cache (`PlanId`, `PlanEndsAt`, `Premium`); early renewal queues after the current end, Platinum starts at once; hourly job expires periods and sends the 3-day reminder (in-app + SMS) once; `GET /api/me/subscription`; admin grant / cancel with a note; old Premium flags moved to a one-month Gold period at start-up. Built 2026-11-16 — awaiting owner test |
| S04-T03 Bank-transfer orders + slip upload | Completed | New `Payment`: `POST /api/payments/bank-transfer` makes (or reuses) an order — amount from the price list, reference made by the server (`VK-G3-7K2QXM`); `POST /api/payments/{id}/receipt` (JPG / PNG / WebP / PDF ≤ 10 MB, `paidOn`, note; sending again replaces it); `GET /api/payments/mine`; `GET /api/payments/{id}/receipt` (owner + staff, staff views logged); bank details from appsettings `BankTransfer` (`GET /api/payments/bank-account`). Checkout page now uses the API — no more localStorage. Built 2026-11-16; `dotnet test` green 2026-11-17 (PaymentTests 4/4); migration `Sprint04Payments`; owner tested order → receipt → approve / reject in the browser 2026-11-17 |
| S04-T04 Staff payments queue | Completed | `/api/moderation/payments` (Admin + Moderator): list (to check / no receipt / approved / rejected), approve → starts or extends the plan once (guard + unique index on `Subscriptions.PaymentId`), member gets in-app + SMS; reject needs a reason (in-app + SMS). Every view / decision in the member's review history. Admin page **Payments** (`/admin/payments`). Built 2026-11-16 — owner tested 2026-11-17 |
| S04-T05 Boosts on the server | Completed | New `Boost` (profile, starts, ends, payment); buying = `POST /api/payments/bank-transfer` `{ product: "boost" }` (approved profile + Gold / Platinum, else 403 `KYC_REQUIRED` / 402 `PLAN_REQUIRED`; reference `VK-B7-…`); staff approve → boost starts now or after the current one (one payment = one boost), in-app + SMS. Profile cache `PromotedUntil`; search lists promoted profiles first with `promoted: true`; `GET /api/boosts/me` (days left, views and interests since it started). Web: promote dialog → bank-transfer checkout (`?product=boost`), dashboard card and search "Promoted" row from the API, boost price from the API. Built 2026-11-17; migration `Sprint04Boosts`; owner tested 2026-11-17 |
| S04-T06 Web: pay, plan, boost from the API | Completed | Dashboard plan card reads `GET /api/me/subscription` (plan, started, valid until incl. renewals, days left, "Renewal bought" — no renew reminder then); payment history in the plan card (`GET /api/payments/mine`, status, reject reason, open receipt); banner under the hero while a receipt is checked or after one was turned down ("Try again" → checkout); session plan comes only from the API's `planId`. Checkout (plans + boost), promote dialog and Plans prices were moved to the API in T03–T05. Built 2026-11-17 — owner tested 2026-11-17 |
| S04-T07 Admin back office (members, payments, audit) | Completed | `GET /api/admin/stats` and `GET /api/admin/members` (search name / mobile / e-mail / code, status filter, plan, last active) for Admin + Moderator; `POST /api/admin/members/{id}/status` (block · unblock · deactivate · activate, reason required to block / deactivate) and `POST …/reset-password` for Admin only. Block: can't sign in, profile hidden, sessions ended. Deactivate: profile hidden, sessions ended, signing in again brings it back. Hidden profiles drop out of search, profile pages, interests, shortlists, viewers, dashboard counts and public photos. New `AuditLogs` table for staff account actions. Members / Dashboard admin pages now use the real API (actions hidden from moderators). Not in this step: member detail page and payments CSV export. Built 2026-11-17; migration `Sprint04Admin`; owner tested 2026-11-17 |
| S04-T08 Account deactivate / delete | Completed | Take a break: `POST /api/account/visibility` hides the profile from search and best matches only (friends, chats, plan stay); session `profileHidden` so every device agrees. Delete: `POST /api/account/delete/send-code` (SMS code, same limits as login codes) → `POST /api/account/delete` `{ code, reason, comment? }` — profile hidden everywhere at once, pending interests withdrawn, sessions ended, refresh cookie cleared, sign-in refused (403 `ACCOUNT_DELETED`); reason stored with no link to the member. The hourly job erases the personal data after 30 days (photos, ID documents, chats, interests, shortlists, blocks, views, notifications, name / phone / e-mail; payments, subscriptions and staff logs kept; the mobile number is free again). Admin list shows deleted accounts as Deactivated ("Deleted by the member…"), locked. Web: account settings use the API (no localStorage flag). Built 2026-11-17; migration `Sprint04Account`; owner tested 2026-11-17 |
| S04-T09 Tests + docs | Completed | 72 xUnit tests — Sprint 04 adds `BillingTests` (prices, grant, renewal dates, expiry, reminder, cancel), `PaymentTests` (orders, receipts, approve once, reject, boost order + search position, price change vs. history), `AdminMembersTests`, `AccountTests`. Docs updated 2026-11-17 (PROGRESS, CHANGELOG, API / DATABASE guidelines, BUG_TRACKER, TECHNICAL_DEBT, SPRINT_PLAN). Not built from the plan: admin member detail page + payments CSV (TD-32). Owner ran `dotnet test` 2026-11-17: 72 / 72 green |

## Sprint 03 — Match & talk
Decisions (owner, 2026-11-14): Free plan starts at 3 searches · 5 profile views · 3 interests · 2 new chats per month
(Gold / Platinum unlimited), changeable by the admin; branch **`S03-match`**.

| Task | Status | Notes |
|---|---|---|
| S03-T01 Paged server search | Completed | `GET /api/profiles/search` — filters, sort, paging (≤50), approved only, not self; guests page 1 only. Owner verified 2026-11-14 (migration `Sprint03Usage`) |
| S03-T02 Admin-set plan limits | Completed | `GET/PUT /api/admin/plan-limits`; seeded Free 3/5/3/2, Gold/Platinum unlimited. Owner verified 2026-11-14 (migration `Sprint03Usage`) |
| S03-T03 Usage counters + LIMIT_REACHED | Completed | `GET /api/me/usage`; monthly counters; 402 `LIMIT_REACHED` with feature, limit, planId, resetsAt; staff exempt. Search uses it now; views / interests / chats in T04, T05, T07. Owner verified 2026-11-14 (migration `Sprint03Usage`) |
| S03-T04 Profile views | Completed | `GET /api/profiles/{id}` records a view and counts a ProfileView (re-opening this month, own profile, staff and members you share an interest with are free); `GET /api/profile-views/viewers` (Gold/Platinum list, Free = total + `locked`), `GET /api/profile-views/recent`. Built 2026-11-14 — awaiting owner test (migration `Sprint03Interactions`) · owner verified 2026-11-14 |
| S03-T05 Interests lifecycle | Completed | Send needs an approved profile (403 `KYC_REQUIRED`) and counts an Interest (402); `PUT {id}/withdraw`; `GET received · sent · matched`; notifications on new interest and on accept (decline is silent); withdrawn interests can be sent again, declined ones can't. Owner verified 2026-11-14 (withdraw uses the interest `id`, sender only). Web Friends screen in T10 |
| S03-T06 Shortlist + saved searches | Completed | `GET/PUT/DELETE /api/shortlist/{profileId}` (≤ 200, approved + not blocked); `GET/POST/DELETE /api/saved-searches` (≤ 10, unique name, filters kept as JSON). Owner verified 2026-11-16 in the web app (migration `Sprint03Safety`) |
| S03-T07 Chat limits, contact share, block / report | Completed | First message of a new conversation counts a NewChat (Free 2/month, replies free); asking for numbers needs Gold (402 `PLAN_REQUIRED`), answering is free; hub `DeclineContactShare` / `CancelContactShare`; conversations carry `contactShareState` + `isBlocked`; `/api/blocks` (hides both ways, blocker told `BLOCKED`, blocked member sees 404; waiting interests end); `POST /api/reports`. Owner verified 2026-11-16 in the web app (migration `Sprint03Safety`) |
| S03-T08 Staff reports queue | Completed | `GET /api/moderation/reports?status=open|closed|all`, `POST /api/moderation/reports/{id}/resolve` (dismiss · action · suspend — suspend needs a note, closes all the member's open reports); reporter notified "reviewed", decision in profile history; staff area **Reports** tab. Owner verified 2026-11-16 (no migration) |
| S03-T09 Dashboard summary | Completed | `GET /api/me/dashboard` (usage, viewers + this week, names for paid, interests received / waiting / sent, matches, shortlisted-by, unread, latest chats); dashboard stat tiles, "Who viewed you" and Messages card use it; `/messages?c=` opens a chat. Owner verified 2026-11-16 |
| S03-T10 Web wiring (Search, Friends, Messages, Dashboard) | Completed | Built 2026-11-15 (done before T08/T09 so the owner can test in the browser): usage from `/api/me/usage` (dashboard meters, Upgrade prompt, 402 handling), admin **Plan limits** tab, Search on `/api/profiles/search` (Load more, saved searches), profile opens via `GET /api/profiles/{id}` (views counted), shortlist / Friends / Received / Sent / Withdraw on the API, Messages: new-chat limit, contact share decline / cancel on the hub, block / unblock / report on the API. Owner verified 2026-11-16 (Tests 1–10: limits, search + filters, views, interests, saved searches, new chats, contact share, block, report). Still static: dashboard stats + Messages card (T09) |
| S03-T11 Tests + docs | Completed | 53 xUnit tests (search filters + paging, limits + 402, profile views, interests lifecycle, shortlist, saved searches, new-chat limit, contact share, block, report, reports queue, dashboard). Docs updated 2026-11-16 (PROGRESS, CHANGELOG, API / DATABASE guidelines, BUG_TRACKER, TECHNICAL_DEBT). Owner ran `dotnet test` 2026-11-17: 63 / 63 green (Sprint 03 + Sprint 04 tests) |

## Sprint 02 — Join & get approved
Decisions (owner, 2026-11-14): files on **local disk** behind `IFileStorage` (cloud later); first **Admin from user-secrets**,
admins promote moderators; branch **`S02-kyc`** (from merged `S01-api-auth`).

| Task | Status | Notes |
|---|---|---|
| S02-T01 Profile status replaces `Verified` | Completed | `ProfileStatus` enum on `CandidateProfile` (Verified removed); only approved profiles in search / profile pages; session returns `profileStatus` |
| S02-T02 Profile draft / submit / status API | Completed | `GET /profiles/me/status`, `POST /profiles/me/submit` (`ReviewService`); new profiles start as Draft |
| S02-T03 File storage (`IFileStorage`, local disk) | Completed | `IFileStorage` + `LocalDiskFileStorage` (`App_Data/uploads`, `Storage:Root`); type by file signature, ≤ 8 MB (`FileRules`) |
| S02-T04 Photo upload API | Completed | `/api/photos` upload · mine · main · order · delete · `{id}/file` (`MediaService`); max 6; pending until approved |
| S02-T05 KYC document upload API | Completed | `/api/kyc/documents` upload (NicFront · NicBack · Passport · Selfie) · list · `{id}/file`; owner + staff only; staff views logged |
| S02-T06 Moderator review queue API | Completed | `/api/moderation` queue · profile · approve · request-changes · suspend · reinstate · pending photos · approve / reject photo (`Staff` policy, `ModerationService`, review log) |
| S02-T07 Changes-requested → resubmit flow | Completed | Resubmit after changes resolves the flags and returns the profile to the queue |
| S02-T08 Admin bootstrap + staff roles API | Completed | First Admin from `Seed:AdminPhone` / `Seed:AdminPassword`; `/api/admin` staff · find user · change role (Member / Moderator), sessions revoked on change |
| S02-T09 Web: registration photos + KYC steps on the API | Completed | Step 3 saves the profile (`POST /profiles`); step 4 uploads photos to `/api/photos` (main, extra, replace, remove, in-review badges via `useApiImage`) or picks an avatar; new step 5 "Identity" uploads NIC / passport + selfie and submits (`lib/media.ts`); stepper has 5 steps |
| S02-T10 Web: dashboard review states + edit profile on the API | Completed | Dashboard panel from `GET /profiles/me/status` (Draft checklist, flagged fields with Fix links); `/profile/complete` (details → photos → ID & selfie → submit); Edit profile: About → `PATCH /profiles/me/about` (≥ 50 chars, no phone / e-mail / link), Photos → `/api/photos` straight away (new photos go to the staff New photos queue); no `vk-profile` localStorage |
| S02-T11 Web: staff back office (queue + review) | Completed | `/admin` (`StaffConsole`): review queue → profile review (photos with approve / reject, ID documents shown in-page or in a new tab — each view logged, details, history) → Approve · Request changes (tick fields + reasons) · Suspend / Reinstate; New photos tab; Staff tab (Admin): find by mobile, make / remove moderator. "Staff area" in the account menu for Admin / Moderator (`lib/staff.ts`) |
| S02-T12 Basic notifications for KYC decisions | Completed | `Notifications` table + `/api/notifications` (list, unread count, read, read all); SMS on approve / changes / suspend |
| S02-T13 Tests + docs | Completed | `ReviewFlowTests` (7), registration + profile tests; owner verified the full flow on 2026-11-14 |

## Small UI changes (outside sprint tasks)
| Change | Status | Notes |
|---|---|---|
| Free-limit popup can't be closed (Upgrade · Back to Dashboard) | Completed | Tested 1440/390: Esc keeps it open, no X, Back → /dashboard, build passes. Limits still client-side (BUG-011) |
| Share dialog Copy button radius | Completed | Checked 1440/390 |
| Upgrade popup: limit = hard stop, Gold feature = closable | Completed | Tested 1440/390: Message + Send interest → closable Gold popup, stays on page; searches used up → hard stop → /dashboard; build passes |
| Rename Requests → Friends (route `/friends`, redirect from `/requests`) | Completed | Tested 1440/390: menu + tab bar → /friends, `/requests?tab=sent` → `/friends?tab=sent`, title/breadcrumb; build passes. Sinhala label needs a native check |
| Best matches cards → profile page, Back → dashboard | Completed | Tested 1440/390; build passes |
| Share contact details flow (front end) | Completed (UI) | Tested 1440/390: request → sent card, incoming → Accept & share / Not now, accepted card + header chip, declined note, cancel; ⋯ menu on mobile; build passes. API in Sprint 03 (TD-20) |
| Sinhala font trial — Noto Sans Sinhala | Testing | Owner reviewing look & feel vs Yaldevi (Figma). Build passes. Decide, then align Figma or switch back |
| Responsive fixes (container 391–767, profile card, search toolbar, plans) | Completed | Automated overflow scan 9 pages × 8 widths × EN/SI: 0 cut-offs; screenshots checked; build passes |
| Sinhala home title −8 px | Completed | Checked 1440/390 SI + EN unchanged; build passes |
| How to use page `/how-to-use` + menu links (journey 50/50 list + phone, pinned-note tour, 2 screens per feature, 31 screens) | Completed | Tested 1440/390, EN/SI, light/dark, no overflow, member menu → page; build passes. SI tour details + screenshots in SI pending |
| Contact-share card buttons on phones | Completed | Fixed squashed buttons; checked 390 |
| Profile details redesign (square photo + thumbs, sections, blurred locked fields) | Completed | Tested 1440/390, member + guest, no overflow; build passes |
| Forgot password back button (all 3 steps) | Completed | Tested 1440/390: each step goes back one step, step 1 → /login; build passes |
| Hero search bar: Sinhala text wrapping fixed | Completed | Checked SI/EN 1440, 1024, 768, 390 light/dark |
| Feedback popup for paid members (rating, review, private feedback, success story) | Completed (front end) | Tested 1440 light/dark + 390: all 5 steps, validation, auto-open rules (free, day 2, shown 5 d ago, report 2 d ago → no popup; clean → popup; Not now → none), Free toast; `tsc` clean. API pending |
| Dashboard: active promotion card under hero | Completed | Checked 1440 dark, Gold + active boost; `tsc` clean |
| Dashboard: Promote + plan cards moved above Best matches (paid states) | Completed | Checked 1440 dark, Gold state |
| Remove em dashes from all UI text | Completed | 0 left outside code comments; `tsc` clean; 8 main pages load (200). How to use screenshots need re-capture |
| Search list card: match pill removed | Completed | Checked 1440 dark; `tsc` clean |
| Search list card: About me (KYC) + Created by | Completed | Checked 1440 light/dark + 390; `tsc` clean. Real API must return the KYC `about` text as `bio` |
| Chat header ⋯ button styled as round outline button | Completed | Checked 1440 light + dark, default + hover |
| Dark mode colour pass (tokens, focus ring, photo badges, pinned notes, gold band) + focus/hover fix | Testing | Checked in dark at 1440: home, login focus, dashboard, search, profile, friends, How to use; light unchanged; `tsc` clean. Needs 390 px + real-device review |
| Home sign-up: shared mobile field + details carried to register page; Sinhala hero title on 2 lines | Completed | Tested home form → /register at 1440 + 390 (mobile, name, email shown); title 2 lines at 768–1440; `tsc` clean |
| Friends page: tabs under the title, left-aligned | Completed | Checked 1440 light, 768 dark, 390 |
| Terms & Conditions + Privacy Policy pages, Delete account section + footer link | Completed (front end) | Checked 1440 light/dark, 390; footer link scrolls to the delete section. [Bracketed] text needs legal review; in-app "Delete my account" button still needs an API endpoint |
| Dashboard Free usage card collapsed by default with Details toggle | Completed | Checked 1440 light + 390 dark, open/close + remembered; `tsc` clean |
| Payment page: bank transfer + receipt upload (front end) | Completed (front end) | Tested 1440 light / 390 dark: plans → checkout, copy, validation, I’ve paid scroll, photo + PDF upload, submit → status card; `tsc` clean. Needs real bank details + API endpoint + staff review screen |
| Payment page: Bank accounts / QR code tabs, collapsible section per bank | Completed (front end) · API written, needs `dotnet build` + `dotnet test` | Tested 2026-11-21 at 1440 light / 390 dark, with no API (placeholders) and a mocked `GET /api/payments/methods`: one bank open at a time, collapse all, copy number + copy all, ← → between tabs, Tab skips closed sections, QR image + Save QR code, "coming soon" without an image, unsafe image URL refused, no sideways scroll; `tsc` clean. API changes (`PaymentsController.Methods`, DTOs, appsettings) could not be compiled here (no .NET SDK); no controller test (the test project doesn't reference WebApi). Real account numbers + QR images still to add |
| Preview my profile (dashboard → `/profile/preview`) | Completed (front end) | Tested 2026-11-21 at 1440 light / 390 dark with a mocked `GET /api/profiles/me` + `GET /api/photos/mine`: dashboard button → preview, display name shown (not full name), WhatsApp hidden, no interest / save / share / report, contact row click explains it's private, strength 25% with correct tips, tip opens the photo editor, "1 photo waiting for review" note, Exit preview → dashboard, no sideways scroll; `tsc` clean. Uses existing endpoints only |
| Contact support page: contact options with Copy + Send us a message form | Completed (front end) · API planned | Tested 2026-11-21 at 1440 light (guest) / 390 dark (member) with test WhatsApp + hotline numbers: 3 copy buttons, mailto / wa.me / tel links, copy to clipboard, member pre-fill, all 5 errors + focus on the first, payment reference only for Payments (upper-cased), wrong file type refused, file chip, invalid email caught, demo ticket, "Send another" clears the message but keeps the name, no sideways scroll; `tsc` clean. Needs `POST /api/support/messages` + a staff "Support messages" page; real hours / reply time to confirm |
| Account settings: take a break (hide) + delete account with SMS code | Completed (front end) | Tested 1440 light / 390 dark: menu → settings, hide/show, reason validation, confirm checkbox, wrong code (attempts), right code → deleted → signed out → home; `tsc` clean. Needs the 3 API endpoints |
| KYC profile step: WhatsApp typed by member, display name preview, no "Save & finish later" | Completed | Checked 1280 light / 390 dark (isolated step); `tsc` clean |
| About us page + nav / footer links | Completed | Checked 1440 + 1024 light, 390 dark; footer + phone menu link; top bar fits at 1024 |
| Gold-only full guide + guided tour popup + dashboard welcome card | Completed (front end) | Tested guest / Free / Gold on How to use; Gold dashboard card → tour (6 steps → done) at 1440 light + 390 dark; Free can’t open; `tsc` clean. Guide text still ships in the JS bundle (see TD) |
| Staff area redesign: admin sidebar layout, dashboard, members table, roles & staff accounts | Completed (front end) | Tested as Admin at 1440 light / dark and 390: dashboard counts + tables, members search / filter / paging / block with reason, new role created, staff account added → temporary password shown; Moderator has no Roles link; Member is sent to /dashboard; no horizontal scroll at 390; `tsc` clean. Review queue + photos + moderators use the live API; members, stats, roles and staff accounts need the planned endpoints (demo data in development only) |

## Owner requests
| Change | Status | Notes |
|---|---|---|
| Remove all demo data from the app (owner request) | Testing | 2026-11-14: tsc clean in a harness (React types from the project, stubs for Next/icons); needs `npm run check` + walk-through on the owner machine. Files: CHANGELOG "All demo data removed" |

## Documentation
| Item | Status |
|---|---|
| `CLAUDE.md` + 17 docs in `docs/` | Completed (2026-11-11) |

## Handover
### S01-T16 Forgot password journey
Done: 3-step UI (Email/Mobile → code → new password), shared `IdentifierTabs` (also on Login), `services/passwordReset.ts`
demo adapter with the planned endpoint contract, privacy-neutral messages. Tested: typecheck + production build pass;
Playwright walk-through at 1440 and 390 px (empty/invalid input, email + mobile, wrong code with tries left, 5-try lock,
password errors, success → /login with toast); dark theme checked on step 1. Follow-up: selected Email/Mobile option now brand colour via shared `SegmentedSwitch`
(Login, Forgot password, Registration photo switch) — checked at 1440/390, light + dark; build passes.
Remaining: API endpoints + code storage/limits + SMS/e-mail providers; then replace the 3 adapter functions.
Blockers: none (needs S01-T03 code service). Files: see CHANGELOG.

### S01 Auth API (branch `S01-api-auth`, 2026-11-13)
Done (code): endpoints #1–14 (register, login, Google, send/verify OTP, me, refresh, logout, forgot/verify/reset,
change password, sessions list/revoke); entities `RefreshToken`, `OtpCode`, `PasswordResetToken`; ProblemDetails
errors; CORS allow-list; per-IP rate limits; secrets out of config; migrations on start; dev-only demo member; web
client without fake sessions; forgot-password wired to the API.
**Not verified:** written without a .NET SDK in the editing environment — nothing has been compiled or run yet.
Remaining before "Completed":
1. `dotnet user-secrets set "JwtSettings:Secret" "<64 random chars>" --project DatingApp.API/DatingApp.WebApi`
   (optional: `Seed:DemoMemberPassword`)
2. Drop the old dev DB once (it was made by `EnsureCreated`), then
   `dotnet ef migrations add InitialCreate -p DatingApp.API/DatingApp.Infrastructure -s DatingApp.API/DatingApp.WebApi`
3. `dotnet build DatingApp.API/DatingApp.sln`; `npm run check` in `DatingApp.APP`
4. Walk-through (Swagger or the web app): register → login → wrong password ×5 = 429 locked → refresh → logout →
   refresh fails; send-otp twice < 60 s = 429; verify wrong code ×5; forgot → verify → reset → old sessions gone;
   Google One Tap + popup; sessions list + revoke; response never contains a code.
2026-11-13 later: build + `InitialCreate` migration succeeded on the owner's machine (SQL Express); API serves seeded
content. Registration wired to the API (see CHANGELOG "Registration now saves to the database"). The built-in test
browser can't make cross-port calls, so the end-to-end registration check runs in the owner's browser.
Blockers: none. Files: see CHANGELOG 2026-11-13.

### S01 completion + merge of `main` (2026-11-14)
- Sprint 01 code is complete; every S01 task is **Testing** until the owner runs `dotnet build`, `dotnet test`,
  `npm.cmd install`, `npm.cmd run lint`, `npm.cmd run check` and a manual pass (register → login → reload → chat between two matched members).
- `main` merged into `S01-api-auth`; 15 conflicts resolved (13 web, 2 docs). Rule used: keep main's new features (feedback
  popup, promote card placement, styling) and keep this branch wherever main brought back demo data (sample stories, fake
  "100+ couples", sample requests / conversations, hard-coded phone, Demo tips, staff links, client-side plan/KYC switching).
  Retired demo files that main had edited are back to empty stubs (TD-01).
- 2026-11-14 registration data fix (BUG-023): owner must run `dotnet ef migrations add RegistrationDataFix -p DatingApp.Infrastructure -s DatingApp.WebApi` before starting the API.
- Not verified here: C# was reviewed by hand only (no .NET in the assistant's workspace); web passes `tsc`.

Template for an unfinished task:
```
### S0X-T0Y <title>
Done: … | Remaining: … | Blockers: … | Files touched: … | Moved to sprint: …
```

## Sprint reviews
_(added at the end of each sprint)_
