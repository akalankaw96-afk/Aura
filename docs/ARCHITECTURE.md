# Architecture

## 1. System view
```
Browser (Next.js 15 client components, PWA)
   │  REST  fetch  →  {API}/api/*            services/api.ts
   │  WebSocket   →  {API}/hubs/chat         services/signalrService.ts
   ▼
ASP.NET Core 9 WebApi ── Controllers ── Application services ── EF Core DbContext ── SQL Server (or InMemory)
                     └─ ChatHub (SignalR)  ───────────────────────┘
```
Ports: web `3001` (`npm run dev`), API `5000/5001` (launchSettings). API base URL: `NEXT_PUBLIC_API_URL`
(default `http://localhost:5000/api`).

## 2. Back end — Clean Architecture
| Project | Contains | May depend on |
|---|---|---|
| `DatingApp.Domain` | Entities (`User`, `CandidateProfile`, `MatchRequest`, `ChatMessage`, `SuccessStory`, `PricingPlan`, `FaqItem`), enums, `BaseEntity` (Guid Id, CreatedAt, UpdatedAt) | nothing |
| `DatingApp.Application` | DTOs, `I*Service` + implementations, `IApplicationDbContext`, `IPasswordHasher`, `IJwtTokenGenerator` | Domain |
| `DatingApp.Infrastructure` | `ApplicationDbContext`, initialiser/seed, `JwtTokenGenerator`, `PasswordHasher`, `AddInfrastructureServices` | Application, Domain |
| `DatingApp.WebApi` | Controllers (`Auth`, `Profiles`, `MatchRequests`, `Chat`, `Content`), `ChatHub`, `Program.cs` | all |

**Target rules:** controllers and the hub call services only (today `ChatController` and `ChatHub` use the DbContext
directly — TD-03). Caller identity comes from JWT claims. Validation at the DTO edge; domain rules in services.

## 3. Front end — layers
```
app/<route>/page.tsx            thin route files (metadata + one screen)
  → components/sections/*  components/auth/*        screens & page sections
    → components/cards/*  components/layout/*  components/profile/*
      → components/ui/*                             Figma kit (no page logic, no content imports)
        → styles/tokens.css + tailwind.config.ts    design tokens
lib/*        state helpers & hooks (session, verification, usage, promotion, connections, demo)
content/*    copy, demo data, translations
services/*   REST + SignalR clients
```
Global mounts (`app/layout.tsx`): theme + install scripts, `LanguageProvider`, `ToastProvider`, `MobileTabBar`,
`UpgradePrompt`, `LoginRequiredModal`. Cross-feature signals use window events (table below).

## 4. Client-side state registry
These keys hold state that **must move to the server** (★) or are legitimate UI preferences.
| Key | Store | Owner | Meaning | Target |
|---|---|---|---|---|
| `aura_token` | local | services/api.ts | JWT | ★ HttpOnly cookie + short access token |
| `aura_session`, `aura_auth_user` | local | lib/session.ts, api.ts | session copy (duplicated) | ★ one session from `/auth/me` |
| `vk-kyc` | local | lib/verification.ts | pending / changes / resubmitted / (absent = live) | ★ `/kyc/status` |
| `vk-plan`, `vk-membership` | local | lib/verification.ts | plan + start/months | ★ `/subscriptions/me` |
| `vk-usage`, `vk-viewed` | local | lib/usage.ts | Free-plan counters, viewed profile IDs | ★ `/usage/me` + server metering |
| `vk-boost` | local | lib/promotion.ts | boost start/days | ★ `/boosts/me` |
| `vk-profile` | local | EditProfileModal | about + photos (data URLs) | ★ profile/photo APIs |
| `vk-favourites:<user>`, `vk-friends:<user>`, `vk-sent-interests:<user>`, `vk-declined-interests:<user>` | local | lib/connections.ts | shortlist, connections, interest history | ★ `/shortlist`, `/connections`, `/match-requests` |
| `vk-kyc-details:user:<id>` | local | lib/kycDetails.ts | read-only verified fields | ★ `/profiles/me` |
| `vk_registration` | session | lib/demo.ts | registration draft | ★ `/profiles/me/draft` |
| `vk-fix-original` | session | ReviewStatus | originals of rejected fields | ★ `/kyc/status` |
| `aura_review_status`, `aura_subscription`, `aura_closure_status`, `aura_cancel_survey`, `aura_my_success_story` | local | services/api.ts | legacy mock flows | ★ remove with legacy code |
| `vk-return-to` | session | lib/session.ts | page to return to after login | keep |
| `vk_flash_toast` | session | ui/Toast.tsx | toast across navigation | keep |
| `vk-theme`, `vk-lang`, `vk-background-animation` | local | layout, LanguageContext, lib | preferences | keep |
| `vk-install-dismissed`, `vk-plan-card-open` | local | InstallAppBanner, ProPlanCard | UI memory | keep |

Window events: `aura_auth_change`, `vk-kyc-change`, `vk-plan-change`, `vk-usage-change`, `vk-boost-change`,
`vk-connections-change`, `vk-background-animation-change`, `vk-upgrade-prompt`, `vk-login-required`,
`vk-open-promote`, `vk-edit-profile`.

## 5. Key flows
- **Guest action:** component → `requireMember(action)` → `vk-login-required` → `LoginRequiredModal` →
  `/login?next=` → `takeReturnTo()` after login.
- **Free limit:** `consume(kind)` / `consumeProfileView(id)` → `vk-upgrade-prompt` → `UpgradePrompt`.
  Server must enforce the same rule and answer `402 LIMIT_REACHED`.
- **KYC gate:** `useKyc().locked` → `FeatureGate`, `KycGuard`, locked tab-bar items.

## 6. Decisions record
| # | Decision | Why | Date |
|---|---|---|---|
| D1 | Figma is the source of truth; Tailwind defaults removed | 1:1 design fidelity, dark mode via semantic tokens | 2026-11 (existing) |
| D2 | Profile view is an in-page full view on `/search?id=` (not a modal) | keeps results list beside the profile; shareable URL | 2026-11-09 |
| D3 | Guest actions open a login popup, not a redirect | users keep context | 2026-11-10 |
| D4 | Free limits per calendar month (Asia/Colombo), unique profiles for views | simple to explain, fair re-views | 2026-11-10 |
| D5 | Approved members edit only description + photos | KYC-verified fields stay trustworthy | 2026-11-10 |

Add a row for every new library, structural change or cross-cutting rule.
