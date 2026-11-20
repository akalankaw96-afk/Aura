# Component Guidelines

**Rule zero: look before you build.** Check `src/components/ui/index.ts`, then the folders below, then
`DatingApp.APP/docs/FIGMA_MAP.md`. Only create a component when nothing fits — and then build it from the same
tokens, sizes and patterns as the existing kit, in `ui/` if it is generic.

## 1. Layers (imports point down only)
```
app/<route>/page.tsx          route: data loading, guards, composition — no styling decisions
components/sections/<area>/   screens and screen parts (dashboard, search, messages, member, promote, home, support);
                              a big screen keeps its state in `use<Thing>.ts` hooks beside its parts (e.g. messages/useChat)
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
| Choose 1 of 2 | `SegmentedSwitch` (brand-gradient selected pill, optional `shortLabel` for phones) | Email/Mobile, Upload/Avatar — never hand-build a 2-option toggle |
| Status | `Badge`, `Chip`, `StatusIcon`, `Alert` | `Alert` = action needed; `Badge` = state |
| Feedback | `useToast()`, `flashToast()` (survives navigation) | Confirmations only |
| Layout | `Card`, `CardTitle`, `OrDivider`, `SectionHeader`, `BackButton`, `Stepper`, `Pagination` | `BackButton` + title = page header style of Messages/Profile view |
| Search | `FilterChip`, `RemovableFilterChip`, `FilterSection`, `SortDropdown` | |
| Dialog | `Modal` (`title`, `description`, `size` sm·md·lg·xl, `placement` center·left (drawer), `dismissible`, `closeOnBackdrop`, `animationKey`), `ConfirmDialog` (`tone` primary·danger, `busy`, extra field as children) | Native `<dialog>`: focus stays inside, Esc / backdrop close, scroll lock, focus back to the opener; sheet on phones (S05-T03) |
| Media | `PhotoSlot` (main / rejected / in-review states) | Edit profile + registration photos |
| Email / Mobile switch (auth) | `components/auth/IdentifierTabs` (preset of `SegmentedSwitch`) | Login + Forgot password; don't rebuild per screen |
| Share contact details | `sections/member/ContactShare` (`ContactShareHeaderAction`, `ContactShareCard`) | Messages page |
| Messages screen | `sections/messages/` — `useChat` (+ `useContactShare`, `useChatSafety`), `ConversationList`, `ChatHeader`, `MessageThread`, `ChatComposer` | Page only composes them (S05-T07) |
| Search screen | `sections/search/` — `useSearchResults`, `useSavedSearches`, `useProfileDetail`, `searchQuery.ts`, `ResultsHeader`, `ActiveFilters`, `ResultsBody`, `FilterDrawer` (`Modal placement="left"`), `FiltersSidebar`, `ProfileView` | Page only composes them (S05-T07) |
| Guide / help page | `sections/howto/HowToUseScreen` (`PhoneFrame`, `StatusFlow`); copy in `content/howToUse.ts` | Screens in `public/how-to-use/` |
| Pinned note (paper card + push-pin, rose / gold) | `PinNote` | Home How it works, How-to-use tour — content uses gray-900 / gray-600 with `dark:` token counterparts (dark mode = dark rose/gold note) |
| Feedback / rating / success story popup | `components/feedback/FeedbackDialog` (mounted once in the root layout) — open with `openFeedback()` / `openFeedback("story")` from `lib/feedback` | Paid members only; auto-open rules live in `feedbackDue()`. Call `markContactAccepted()` / `markSafetyEvent()` from new contact-share or report/block flows |
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

## 4. Dialogs
Use `Modal` / `ConfirmDialog` from `components/ui` (S05-T03) — never a hand-built overlay. Keep `open` in state and
render the dialog always; it renders nothing while closed. Pass `title` (and `description`) so it is announced, or your
own `labelledBy` id when you draw a custom header. Use `dismissible={false}` while something must finish (payment,
upload). The 14 older dialogs move to it in S05-T04 / T05.

## 5. Creating a new component
1. Name by what it is (`ProfileMetaRow`), not where it is used. One component per file, PascalCase file name.
2. Props typed with an exported `interface XProps`; sensible defaults; `className` passthrough merged with `cn()`.
3. Tokens only; support light + dark; visible `focus-visible` ring; touch targets ≥ 44 px.
4. Copy via props or `src/content/*` — no hard-coded strings in `ui/`.
5. Generic → `ui/` + export from `index.ts` + add to the table above. Domain → its `sections/<area>/` folder.
6. If it maps to a Figma component, add the node to `FIGMA_MAP.md`.
7. Keep it < ~200 lines; extract sub-parts rather than adding boolean props for every case.

## 6. Don't
- Use `<img>` for a file in `public/` — use `next/image` with its real display `width` / `height` (or `fill` + `sizes` for
  backgrounds; `priority` only above the fold). `<img>` + `eslint-disable` only for member photos / API files (`useApiImage`,
  private), previews and `data:` / `blob:` URLs (S05-T09).
- Duplicate an existing component with slightly different styling — extend it with a variant instead.
- Put API calls, `localStorage` or routing inside `ui/` components.
- Use Tailwind default palettes (`emerald-*`, `purple-*`, `amber-*`, `slate-*` …) — they don't exist in this theme. (`token/NN` opacity
  modifiers are fine since S05-T02.)
- Import from the dead legacy files (`MemberDashboard`, `CheckoutModal`, `FoundMatchModal`, `AccountClosureModal`,
  `profile/ProfileDetailModal`, `cards/ProfileGlassCard`, `sections/member/MessagesScreen`) — TD-01.
