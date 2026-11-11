# Component Guidelines

**Rule zero: look before you build.** Check `src/components/ui/index.ts`, then the folders below, then
`DatingApp.APP/docs/FIGMA_MAP.md`. Only create a component when nothing fits — and then build it from the same
tokens, sizes and patterns as the existing kit, in `ui/` if it is generic.

## 1. Layers (imports point down only)
```
app/<route>/page.tsx          route: data loading, guards, composition — no styling decisions
components/sections/<area>/   screens and screen parts (dashboard, search, member, promote, home, support)
components/auth/              auth + onboarding screens (Login, RegisterFlow, KycGuard, PlansScreen, DemoTips)
components/cards/ · profile/  domain cards (ProfileCard, ProfileCardList, ProfilePhotoCard), ProfileActions, ShareProfileDialog
components/layout/            app chrome: Navbar (light|glass|minimal|member), MemberShell, Footer, MobileTabBar,
                              LoginRequiredModal, UpgradePrompt, InstallAppBanner
components/motion/            BumpTitle, FloatingHearts, PageLoader, RevealObserver
components/ui/                Figma kit — no business logic, no API calls, no localStorage
styles/tokens.css             design tokens
```

## 2. The kit (`components/ui`)
| Need | Use | Notes |
|---|---|---|
| Action | `Button` (`primary` · `secondary` · `outline` · `ghost` · `white` · `danger`; `sm` · `md` · `lg`), `ButtonLink`, `TextLink`, `buttonClasses()` | Never style a raw `<button>` as a button |
| Form | `Field` + `Input` / `Select` / `Textarea` / `NumberField` / `PasswordField` / `PhoneField` / `OtpInput` / `Checkbox` / `Toggle` / `RangeSlider` | `Field` owns label, hint, error |
| Tabs / segmented | `SegmentedTabs`, `ViewToggle` | Same tab look everywhere (Edit profile, Requests, Messages) |
| Status | `Badge`, `Chip`, `StatusIcon`, `Alert` | `Alert` = action needed; `Badge` = state |
| Feedback | `useToast()`, `flashToast()` (survives navigation) | Confirmations only |
| Layout | `Card`, `CardTitle`, `OrDivider`, `SectionHeader`, `BackButton`, `Stepper`, `Pagination` | `BackButton` + title = page header style of Messages/Profile view |
| Search | `FilterChip`, `RemovableFilterChip`, `FilterSection`, `SortDropdown` | |
| Media | `PhotoSlot` (main / rejected / in-review states) | Edit profile + registration photos |
| Brand | `Logo`, `CoupleAvatar`, `LanguageSwitch`, `ThemeToggle`, `Flag`, `HeartPattern`, `LoveScene`, `LoveSticker` | |

`SegmentedTabs`, `PhotoSlot` and `ButtonLink` exist but are **not exported from `ui/index.ts`** — import by path
until TD-09 adds them.

## 3. Shared behaviours (use, don't re-implement)
| Behaviour | API |
|---|---|
| Guest tries a member action | `if (!requireMember("send an interest")) return;` → opens `LoginRequiredModal` |
| Free-plan limit | `if (!consume("search")) return;` / `consumeProfileView(id)` → opens `UpgradePrompt` |
| KYC not approved | wrap with `KycGuard` / `FeatureGate` |
| Toast after redirect | `flashToast(...)` |
| Demo states | `DashboardDemo` (tips, KYC pending/rejected, approved Free, approved Gold) |

## 4. Modals (until TD-02 lands)
Every dialog must: render through `createPortal(…, document.body)` (transformed parents trap fixed elements),
use the scrim token `bg-[var(--color-bg-scrim)]`, close on Esc and backdrop click, lock body scroll, move focus in and
restore it on close, have `role="dialog"` + `aria-modal` + a labelled title, keep header/footer `shrink-0` with the body
scrolling. When building the shared `Modal` (TD-02), migrate the 9 existing dialogs one at a time.

## 5. Creating a new component
1. Name by what it is (`ProfileMetaRow`), not where it is used. One component per file, PascalCase file name.
2. Props typed with an exported `interface XProps`; sensible defaults; `className` passthrough merged with `cn()`.
3. Tokens only; support light + dark; visible `focus-visible` ring; touch targets ≥ 44 px.
4. Copy via props or `src/content/*` — no hard-coded strings in `ui/`.
5. Generic → `ui/` + export from `index.ts` + add to the table above. Domain → its `sections/<area>/` folder.
6. If it maps to a Figma component, add the node to `FIGMA_MAP.md`.
7. Keep it < ~200 lines; extract sub-parts rather than adding boolean props for every case.

## 6. Don't
- Duplicate an existing component with slightly different styling — extend it with a variant instead.
- Put API calls, `localStorage` or routing inside `ui/` components.
- Use Tailwind default palettes (`emerald-*`, `purple-*`, `amber-*`, `slate-*` …) or `token/NN` opacity modifiers.
- Import from the dead legacy files (`MemberDashboard`, `CheckoutModal`, `FoundMatchModal`, `AccountClosureModal`,
  `profile/ProfileDetailModal`, `cards/ProfileGlassCard`, `sections/member/MessagesScreen`) — TD-01.
