# Vikasitha — Web app (`DatingApp.APP`)

Next.js 15 + React 19 + TypeScript + Tailwind CSS 3.
The UI is a **1:1 build of the Figma file
[AI-Learning-2](https://www.figma.com/design/jyoGCUqvQuZsoUp2uUi95W/AI-Learning-2)**.
Figma is the source of truth for every colour, font, size, spacing, radius, shadow and piece of copy.

> **AI coding tools:** read [`AGENTS.md`](./AGENTS.md) first. It has the rules you must follow.

---

## 1. Run it

First time after the Figma rebuild, move the old UI files out of `src/` (they import packages that were removed):

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\cleanup-old-ui.ps1
```

```bash
npm install
npm run dev          # http://localhost:3001
npm run typecheck    # TypeScript only
npm run check        # typecheck + production build (run before every commit)
```

There is **no API connection yet**. Every screen is front-end only and fully clickable, using mock rules from `src/lib/demo.ts`.

## 2. Pages

| URL | What | Figma page → frame |
|---|---|---|
| `/` | Home (desktop + mobile) | 🏠 Home Page → *Home — Desktop 1442*, *Home — Mobile 390* |
| `/components` | Living UI-kit preview | 🧩 Components |
| `/login` | Login + all error states | 🔐 Registration Flow → Journey 1 |
| `/forgot-password` | Reset password | Journey 2 |
| `/register` | Account → Verify → Profile → Photos | Journeys 3–6 |
| `/register/status` | Review: submitted / changes needed / fix fields / resubmitted / live | Journey 7 |
| `/plans` | Plans + payment | Journey 8 |
| `/terms`, `/privacy` | Placeholders (full pages in 📄 Info Pages, not built yet) | — |

## 3. Folder structure

```
DatingApp.APP/
├─ AGENTS.md                 ← rules for AI tools (Claude, Cursor, Copilot, Codex…)
├─ CLAUDE.md                 ← points Claude Code to AGENTS.md
├─ docs/FIGMA_MAP.md         ← Figma component / frame → code file map
├─ tailwind.config.ts        ← Tailwind theme = Figma tokens ONLY (default palette removed)
├─ public/
│  ├─ brand/                 ← logo, couple / bride / groom illustrations, love scene
│  └─ images/
│     ├─ hero/  profiles/  stories/   ← photos exported from Figma
│     ├─ flags/              ← country flags (Figma: Country Flag)
│     └─ decor/              ← heart pattern, love stickers
└─ src/
   ├─ styles/tokens.css      ← ★ design tokens: 1:1 copy of Figma variables (light + dark)
   ├─ app/                   ← routes only (thin page.tsx files)
   │  ├─ layout.tsx          ← fonts, theme script, <ToastProvider>
   │  └─ globals.css         ← base styles + .container-page
   ├─ components/
   │  ├─ ui/                 ← Figma 🧩 Components (Button, Input, Chip, Badge, Toast…) — generic, no page logic
   │  ├─ layout/             ← Navbar, Footer
   │  ├─ cards/              ← ProfileCard, ProfileGlassCard
   │  ├─ sections/home/      ← one file per Home section, top → bottom as in Figma
   │  └─ auth/               ← login / register / review / plans screens + AuthShell
   ├─ content/home.ts        ← all Home copy and data (word-for-word from Figma)
   ├─ lib/
   │  ├─ cn.ts               ← className merge helper (knows our custom text styles)
   │  └─ demo.ts             ← mock rules + registration draft (sessionStorage)
   ├─ services/api.ts        ← backend client (NOT wired to the new UI yet)
   ├─ data/mockData.ts       ← fallback data used by services/api.ts
   └─ types/index.ts         ← API types
```

**The layers only point one way:** `app` → `sections` / `auth` → `cards` / `layout` → `ui` → `styles/tokens.css`.
A `ui` component never imports from `sections`, `auth` or `content`.

## 4. Design system

### Tokens (`src/styles/tokens.css` → `tailwind.config.ts`)

| Figma | CSS variable | Tailwind class |
|---|---|---|
| `color/bg/brand` | `--color-bg-brand` | `bg-brand` |
| `color/bg/brand-subtle` | `--color-bg-brand-subtle` | `bg-brand-subtle` |
| `color/surface/card` | `--color-surface-card` | `bg-surface-card` |
| `color/text/primary · secondary · tertiary` | `--color-text-*` | `text-ink` · `text-ink-secondary` · `text-ink-tertiary` |
| `color/text/brand` | `--color-text-brand` | `text-brand-text` |
| `color/border/default · strong` | `--color-border-*` | `border-line` · `border-line-strong` |
| `color/status/success-bg / -fg` (and error, warning, info, premium) | `--color-status-*` | `bg-success-bg` · `text-success-fg` |
| `radius/sm · md · lg · xl · 2xl · full` | `--radius-*` | `rounded-sm … rounded-full` |
| `Shadow/XS … XL`, `Brand Glow`, `Focus/*` | `--shadow-*`, `--focus-ring-*` | `shadow-xs … shadow-xl`, `shadow-glow`, `shadow-ring-brand` |
| `Gradient/Brand` · `Brand Soft` · `Hero Overlay` · `Page Background` | `--gradient-*` | `bg-brand-gradient` · `bg-brand-soft` · `bg-hero-overlay` · `bg-page-gradient` |
| `Layout` page margin / container | `--layout-*` | `.container-page`, `px-page-x`, `max-w-container` |
| Text styles `Display/*`, `Heading/H1–H6`, `Body/*`, `Label/*`, `Button/*`, `Caption`, `Overline` | — | `text-display-xl`, `text-h3`, `text-body-md`, `text-label-sm`, `text-button-lg`, `text-caption`, `text-overline` |

Tailwind's default colours, font sizes, radii and shadows are **replaced**, not extended. `text-sm`, `bg-red-500`, `rounded-2xl` (Tailwind's version) and so on don't exist on purpose. If a class doesn't compile, the value isn't in the design system.

- **Dark mode:** the Figma `Color` collection's **Dark** mode lives under `[data-theme="dark"]`. Use the `<ThemeToggle>`. Components switch automatically when they use semantic tokens.
- **Fonts:** Nunito (UI), Yaldevi (Sinhala), Noto Sans Tamil, all self-hosted via `@fontsource`. Text marked `lang="si"` or `lang="ta"` switches font automatically.
- **Icons:** Vuesax **Outline** set via `iconsax-react`. Use `color="currentColor"` and colour the icon with a text class.

### Rules for every UI change
1. Find the frame or component in Figma first, then reuse an existing `ui/` component. Only add a new one if Figma has a new component.
2. Use token classes only: no hex values, no `style={{ color }}`, no Tailwind default palette.
3. Buttons and chips are pills (`rounded-full`); primary buttons and selected chips use `bg-brand-gradient`. Inputs are `rounded-md` and 50px tall. Cards are `rounded-lg`; panels are `rounded-xl`.
4. Copy goes in `src/content/*` or next to the screen as constants, word-for-word from Figma.
5. Check the result against Figma at 1440px and 390px before you finish.

## 5. Demo values (no API)

Open **Demo tips** (bottom-right) on any auth page. All values live in `src/lib/demo.ts`.

| What | Value |
|---|---|
| Working login | `77 123 4567` / `Vikasitha1` |
| Suspended account | `77 000 0000` |
| Wrong password 5 times | Locked for 15 min |
| Register → already registered / server error | `77 123 4567` / `77 999 9999` |
| Correct OTP / expired OTP | `482913` / `000000` |
| Failing card | `4000 0000 0000 0002` |
| Admin approve / request changes | Buttons in Demo tips on `/register/status` |

Set `NEXT_PUBLIC_HIDE_DEMO=1` to hide the panel.

## 6. Connecting the API later

Each screen keeps its mock in one place (a `window.setTimeout(...)` block in the submit handler, plus `src/lib/demo.ts`). Replace those blocks with calls from `src/services/api.ts`. The UI states (errors, alerts, toasts) are already in place.

## 7. Known placeholders

- Profile and story photos are the ones in the Figma file. **Replace them with licensed or member photos before launch.** One photo (`mp-24671.jpg`) still carries a stock watermark.
- Success stories 2–4 are placeholder copy (Figma shows one story).
- Search results, profile detail and info pages are designed in Figma but not built yet.
