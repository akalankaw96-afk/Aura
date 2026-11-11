# UI / UX Guidelines

Figma file `jyoGCUqvQuZsoUp2uUi95W` is the source of truth. Detailed front-end rules: `DatingApp.APP/AGENTS.md`
and `DatingApp.APP/CLAUDE.md`. This page is the short, project-wide version.

## 1. Brand and tone
Warm, trustworthy, family-friendly. Rose (primary), gold (premium/Gold plan), neutral grays. Copy is respectful and
plain — "Send interest", not "Swipe". Bilingual English/Sinhala (Tamil planned). Never shame a member for limits or rejection.

## 2. Tokens
- Colours: semantic CSS variables in `styles/tokens.css` (`--color-bg-*`, `--color-surface-*`, `--color-text-*`,
  `--color-border-*`, `--color-icon-*`, `--color-status-{success|warning|error}-{bg|fg}`) exposed as Tailwind classes.
  Only scales: `rose`, `gray`, `gold`. **No hex, no default Tailwind palette, no `token/NN` modifiers** — use
  `rgba()`/`color-mix()` arbitrary values when you need transparency.
- Type, spacing, radius, shadow: Tailwind theme values from the token file; no arbitrary pixel sizes unless Figma demands it.
- Light and dark themes both required; check contrast in both.

## 3. Layout and responsive
- Design at **1440 px** and **390 px**; check 768 px. Content max width per Figma; no horizontal scroll at 360 px.
- Member pages use `MemberShell` + `Navbar variant="member"`; mobile gets `MobileTabBar`.
- Page header pattern = Messages module: `BackButton` + title (+ actions right, e.g. Share). Don't invent new headers.
- List + detail pattern (Requests, Messages, Profile view): list on the left, detail on the right on desktop; list → detail
  navigation on mobile.
- Back behaviour: return to where the user came from (`?from=home` → home). Home profile cards open the full profile page.

## 4. States every screen must handle
Loading (skeleton matching the layout) · empty (friendly text + next action) · error (message + retry) · guest ·
KYC pending / rejected · Free (with remaining counters) · paid (Gold/Platinum, collapsible plan card) · boosted.

## 5. Feedback patterns
| Situation | Pattern |
|---|---|
| Field invalid | inline error under the field (`Field error=`), on blur and on submit |
| Action needed / page-level problem | `Alert` |
| Success / undo-able confirmation | `useToast()` |
| Guest presses a member action (incl. photo viewer) | `LoginRequiredModal`: Login (primary) · Create New (secondary) · Cancel |
| Free limit reached | `UpgradePrompt` with what they get on Gold |
| Destructive action (block, delete photo, close account) | confirmation dialog with `danger` button |
| Long action | button loading state + disabled; never double-submit |

Guest CTAs in navigation: **Create New** (secondary) + **Login** (primary), everywhere the guest header appears.

## 6. Accessibility
Semantic HTML; one `h1` per page; labels on every control; `focus-visible` ring; keyboard reachable dialogs with focus
trap and Esc; `alt` on profile photos (name + "photo"); motion respects `prefers-reduced-motion` (promoted-card shine,
reveal animations); contrast ≥ 4.5:1 for text.

## 7. Content and privacy in the UI
- Don't show phone/e-mail before contact share is accepted; blur or hide full photos for guests as Figma specifies.
- Posted time on landscape profile cards; "Promoted" label + shine on boosted profiles.
- Report profile: simple modal with reason + optional details, then toast.
- Numbers and money: `LKR 500`, dates `12 Nov 2026`, relative time for recent ("2 h ago").

## 8. Before handing over a UI change
Compare with Figma at 1440 and 390 · light + dark · keyboard pass · all states from §4 · copy in `src/content` · no
console errors · screenshot in the PR.
