# Project analysis

Snapshot of `C:\Project\Aura` on **11 Nov 2026**, read file by file (139 front-end source files, 30 back-end files).
No application code was changed to produce this report.

**Verdict:** the front end is well-structured, design-system-driven and builds cleanly (typecheck ✔, `next build` ✔,
20 routes). The API is a reasonable Clean-Architecture skeleton but is **not safe to expose**: 5 critical
security bugs (login bypasses, unauthenticated chat) and nearly all business rules (plan, KYC, limits, boost) are
enforced only in the browser. Only 19 of the ~102 endpoints the UI needs exist.

---

## 1. Folder structure
```
Aura/
├─ README.md                    project index (status section is out of date)
├─ DatingApp.APP/               Next.js web app
│  ├─ AGENTS.md · CLAUDE.md     front-end rules (design tokens, reuse, Figma)
│  ├─ docs/FIGMA_MAP.md         Figma node ↔ file map
│  ├─ scripts/cleanup-old-ui.ps1
│  ├─ public/ brand · images (hero, profiles, stories, flags, decor)
│  └─ src/
│     ├─ app/                   18 routes (thin page.tsx; search & messages are large)
│     ├─ components/ ui · layout · cards · auth · motion · profile · sections/{home,dashboard,member,search,promote,support}
│     │                + 4 legacy root files (MemberDashboard, CheckoutModal, FoundMatchModal, AccountClosureModal)
│     ├─ content/               copy + demo data (home, dashboard, search, support, avatars, translations)
│     ├─ context/LanguageContext.tsx   en / si switch
│     ├─ lib/                   cn, demo, session, verification, usage, promotion, connections, kycDetails, backgroundAnimation
│     ├─ services/              api.ts (REST client), signalrService.ts
│     ├─ data/mockData.ts · types/index.ts · styles/tokens.css
├─ DatingApp.API/               .NET 9 solution
│  ├─ DatingApp.Domain/         7 entities, 3 enums, BaseEntity
│  ├─ DatingApp.Application/    DTOs, 4 services (Auth, Profile, MatchRequest, Content), interfaces
│  ├─ DatingApp.Infrastructure/ DbContext, initialiser/seed, JWT generator, PBKDF2 hasher, DI
│  └─ DatingApp.WebApi/         5 controllers, ChatHub, Program.cs, appsettings
└─ _backup_pre_figma/           git-ignored copy of the pre-Figma UI
```

## 2. Frameworks and dependencies
| Web (package.json) | Version | Note |
|---|---|---|
| next / react / react-dom | 15.1 / 19 / 19 | App Router |
| tailwindcss / postcss / autoprefixer | 3.4 | theme **replaces** defaults with Figma tokens |
| iconsax-react | 0.0.8 | main icon set |
| lucide-react | 0.475 | used in a few places (Share2, Ban…) — second icon set, see debt TD-08 |
| @microsoft/signalr | 10 | chat client |
| clsx + tailwind-merge | — | `cn()` |
| @fontsource nunito / yaldevi / noto-sans-tamil | 5 | self-hosted fonts |
| **Missing:** ESLint config, test runner, form/validation lib, data-fetching cache | | |

API: ASP.NET Core 9, EF Core 9 (SqlServer + InMemory), JwtBearer, Swashbuckle. No test project, no migrations.

## 3. Front-end architecture
- App Router, almost every screen is a client component (`"use client"`); pages are static (`○`) except `/friends` (and the `/requests` redirect).
- Layering (`app → sections/auth → cards/layout → ui → tokens`) is respected in new code.
- Global providers in `app/layout.tsx`: theme script, install script, `LanguageProvider`, `ToastProvider`,
  `MobileTabBar`, `UpgradePrompt`, `LoginRequiredModal`.
- Cross-component communication uses **window events + localStorage** (`vk-kyc-change`, `vk-plan-change`,
  `vk-usage-change`, `vk-boost-change`, `vk-upgrade-prompt`, `vk-login-required`, `aura_auth_change`).
- Largest files (lines): MemberDashboard 1405 (dead), RegisterFlow 1044, admin/page 977, CheckoutModal 967 (dead),
  messages/page 933, translations 909, api.ts 768, ProfileView 737, search/page 659.

## 4. Back-end architecture
- Clean Architecture with DI in `Infrastructure/DependencyInjection.cs`.
- Services return DTOs; controllers are thin except `ChatController`, which queries the DbContext directly.
- `ChatHub` writes to the DbContext directly (no service layer).
- DB chosen by `UseInMemoryDatabase` — **missing from appsettings, so InMemory is the default** (data lost on restart).
- `EnsureCreatedAsync()` + seed on every start; no EF migrations.

## 5. Database
Entities: `User` 1–1 `CandidateProfile` (cascade) · `MatchRequest` (sender/receiver profile, restrict) ·
`ChatMessage` (sender/receiver, `ConversationId` string, contact-share flags, safety flags) · `SuccessStory` ·
`PricingPlan` · `FaqItem`. Unique indexes: `User.Email`, `CandidateProfile.Code`; index on `ChatMessage.ConversationId`.
**Not modelled yet:** KYC status/documents, photos, preferences, subscriptions, payments, usage, boosts,
shortlist, blocks, reports, notifications, refresh tokens, audit log. `CandidateProfile.Interests` is a CSV string.

## 6. Authentication and authorization
- API: JWT (HS256, 7-day, no refresh/revoke), PBKDF2-SHA256 10k iterations, roles claim (`Member`).
- Web: token + session stored in **localStorage** (`aura_token`, `aura_session`, `aura_auth_user`), read by
  `lib/session.ts` (`hasSession`, `useSignedIn`, `requireMember`).
- Guards: `KycGuard` (inside `MemberShell`), `MemberRedirect` (login/register), `requireMember()` for actions.
  `/dashboard` has **no** guest guard; `KycGuard` treats a missing `vk-kyc` as approved (BUG-012).
- Admin: no role check anywhere; `/admin` is a client mock that accepts any password (BUG-010).

## 7. API integration
`services/api.ts` calls 14 endpoints with `fetch` (no timeout, no shared error type) and, for several, **falls back to
mock data or a fake session on failure** (BUG-003, BUG-014). `signalrService.ts` wraps the hub. Most screens use
`lib/*` demo state instead of the API. Endpoint-by-endpoint gap list: `API_GUIDELINES.md`.

## 8. Routing and navigation
| Route | Screen | Access today |
|---|---|---|
| `/` | Home (hero marquee, featured, how-it-works, pricing, stories, FAQ, sign-up) | public |
| `/login` `/register` `/forgot-password` | auth flows (+ Google) | redirect members away |
| `/register/status` | fix rejected fields / review status | members |
| `/dashboard` | member dashboard (verification panel, hero, plan cards, boost, inbox, best matches) | **unguarded** |
| `/search` (+ `?id=`) | filters, grid/list, full-page profile view, photo viewer | public, actions gated |
| `/friends` (old `/requests` redirects) `/messages` | friends + interests, chat | KycGuard (weak) |
| `/plans` | plans + mock payment | public |
| `/support` `/contact` | support page (contact re-exports support) | public |
| `/admin` | staff panel mock | **unguarded**, linked for every member |
| `/components` | live UI kit | public (should be dev-only) |
| `/terms` `/privacy` | placeholders | public |

## 9. UI components
32 `ui/` components mapped to Figma (Button + ButtonLink, Input, Field, PasswordField, PhoneField, OtpInput,
NumberField, Select, SortDropdown, Checkbox, Toggle, Chip, FilterChip, RemovableFilterChip, FilterSection,
RangeSlider, SegmentedTabs, ViewToggle, Pagination, Badge, Alert, StatusIcon, Stepper, Toast, Card, Brand,
Decor, Flag, SectionHeader, BackButton, PhotoSlot, Textarea). Inventory and gaps: `COMPONENT_GUIDELINES.md`.
**Gap:** no shared `Modal/Dialog` — 9 dialogs re-implement backdrop, focus, Esc and animation.

## 10. Design system
`styles/tokens.css` (Figma variables, light + dark) → `tailwind.config.ts` (defaults removed). Text styles
(`text-h1…`, `text-body-*`, `text-label-*`), radii, shadows, gradients and layout tokens are consistent in new code.
Violations: ~380 classes from non-existent palettes (`emerald/amber/purple/blue…`) in legacy files, `/admin`,
`messages/page.tsx` (12) and `Navbar` (6, admin link); 8 opacity modifiers on token colours that silently don't apply.

## 11. State management
React local state + custom hooks over localStorage (`useKyc`, `useAccess`, `useUsage`, `useBoost`, `useSignedIn`).
No server-state cache (React Query/SWR). Full key registry in `ARCHITECTURE.md` §4 — 25+ keys with two naming
schemes (`aura_*`, `vk-*`) and duplicated session copies (`aura_session` + `aura_auth_user`).

## 12. Form validation
Hand-written per screen (`errors` state + inline `error` prop) in RegisterFlow, Forgot password, Plans, SignUp,
EditProfile. Contact-detail filter exists (`containsContactDetails` in `lib/demo.ts`) but other places use their own
regex. API: DTOs have no validation attributes; services throw generic exceptions.

## 13. Error handling
UI pattern (inline / Alert / Toast) is good. Problems: 31 `console.*` calls, ~31 empty `catch {}` (mostly around
localStorage — acceptable but should be one helper; some in `api.ts` hide real failures), no global error boundary
(`app/error.tsx` missing), API has no exception middleware/ProblemDetails, services return fallback data on errors.

## 14. Existing features — inventory
| Area | Feature | Status |
|---|---|---|
| Home | All sections, motion, bilingual copy, profile marquee → profile page | Completed (UI) |
| Auth | Login (password), lockout, Google button, OTP | Partially (API exists, insecure; demo fallbacks) |
| Auth | Forgot / reset password | Partially (UI only, no API) |
| Auth | Logout, refresh, session expiry | Not started |
| Registration | 4-step flow, WhatsApp, illustration avatars, draft in sessionStorage | Partially (UI; API create only) |
| KYC | Pending/locked dashboard, rejected fields, fix & resubmit | Partially (UI on demo state; no KYC API) |
| Dashboard | Hero, verification panel, Free usage meters, Gold card (collapsible), boost card, inbox, best matches | Partially (UI, demo data) |
| Edit profile | Description + photos only, in-review badge | Partially (UI, localStorage) |
| Search | Filters, sort, grid/list, pagination, promoted row with shine, posted time, usage chips | Partially (UI; API search unpaged, no metering) |
| Profile view | Full page list+detail, photo viewer, share, report, interest note | Partially (UI) |
| Guest gating | Login-required popup, return-to-page after login | Completed (client) |
| Free limits | 5 views · 3 searches · 3 interests · 2 chats, upgrade popup | Partially (client-only, bypassable) |
| Interests | Send, Friends page (friends · favourites · received · sent), accept/decline | Partially (API exists; UI mostly demo) |
| Messaging | Chat UI, safety (block/report), contact-share | Partially (API + hub exist, insecure) |
| Plans & payment | Plans page, mock card payment, membership expiry | Partially (no gateway/API) |
| Boost | LKR 500 / 7 days, extend, results | Partially (client-only) |
| Notifications | Navbar counts | Not started (static numbers) |
| Support | Support page | Completed (static) |
| Admin | KYC/photo/report/payment back office | Not started (mock UI only) |
| Info pages | Terms, privacy | Not started (placeholders) |
| i18n | English + Sinhala for home/nav/dashboard; Tamil | Partially / Not started |
| PWA | Manifest, install banner | Completed |
| Tests / CI | Unit, e2e, pipeline | Not started |

## 15. Incomplete features (highest impact first)
1. Server-side KYC workflow + moderator back office (nothing can be approved for real).
2. Payments, subscriptions, boosts and usage metering on the server.
3. Photo upload/storage and moderation.
4. Auth hardening: refresh/logout, password reset, real OTP SMS, verified Google sign-in.
5. Wiring screens to the API (registration, search, friends/interests, chat, dashboard).
6. Notifications, saved searches, shortlist, blocks/reports persistence.

## 16. Known bugs
22 confirmed issues logged in `BUG_TRACKER.md` (5 critical, 6 high, 6 medium, 5 low).

## 17. Security vulnerabilities (summary)
OTP master code + OTP echoed in response · Google login trusts e-mail without verifying the ID token ·
fake local session when the API is down · chat REST + hub unauthenticated with caller-supplied identity ·
CORS any origin with credentials · JWT secret in `appsettings.json` + hard-coded fallback · profiles auto-`Verified` ·
plan/KYC/usage/boost trusted from localStorage · admin panel open · JWT in localStorage · weak PBKDF2 iterations.
Details and rules: `SECURITY_GUIDELINES.md`.

## 18. Performance
- `/dashboard` first-load JS 257 kB, `/search` 224 kB, home 209 kB — acceptable but most screens are fully client-rendered.
- Search API loads the whole profiles table, then filters in memory (`ProfileService`); no paging/indexes on filter columns.
- Profile images are plain `<img>` (no `next/image` sizing/lazy loading) — check LCP on mobile.
- Hub queries the profile twice per message for name and photo.

## 19. Duplication and complexity
- ~4,260 lines of dead legacy UI: `MemberDashboard`, `CheckoutModal`, `FoundMatchModal`, `AccountClosureModal`
  (only import each other), `profile/ProfileDetailModal`, `cards/ProfileGlassCard`, `member/MessagesScreen` (unused).
- 9 hand-built dialogs (Upgrade, LoginRequired, Report, PhotoViewer, Share, Promote, EditProfile, ChatSafety block, Install guide).
- Two icon libraries; two session-storage key schemes; three places writing the same 6 session keys in `api.ts`.
- `messages/page.tsx` (933 lines) and `search/page.tsx` (659) mix data, state and layout.

## 20. Existing documentation
| File | State |
|---|---|
| `README.md` (root) | useful index; **status section outdated** (says search/chat not built, API not connected) |
| `DatingApp.APP/README.md` | good run/structure/design-system guide; pages table missing newer routes |
| `DatingApp.APP/AGENTS.md` | strong design rules — keep as the front-end rulebook |
| `DatingApp.APP/CLAUDE.md` | points to AGENTS.md — keep |
| `DatingApp.APP/docs/FIGMA_MAP.md` | Figma map — needs the components added since (PhotoSlot, SegmentedTabs usages, ProfileView) |
| API docs | none besides Swagger and the Web API Specification doc |
