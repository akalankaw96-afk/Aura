# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/). Newest first. Reference task, bug and debt IDs.
Sections: Added · Changed · Fixed · Security · Removed · Breaking.

## [Unreleased]

### Added
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

### Fixed
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
