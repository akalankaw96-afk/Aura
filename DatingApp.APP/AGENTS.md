# AGENTS.md — rules for AI coding tools

These rules apply to every AI assistant working in this repo (Claude Code, Cursor, GitHub Copilot, Codex, Windsurf…). Read `README.md` for the project overview.

## Project in one paragraph
Vikasitha is a Sri Lankan matrimony website. `DatingApp.APP` is the Next.js 15 / React 19 / TypeScript / Tailwind 3 front end. `DatingApp.API` is the .NET back end, which is **not connected yet**. The UI must match the Figma file **AI-Learning-2** (`jyoGCUqvQuZsoUp2uUi95W`) 1:1. Figma is the source of truth; code follows it.

## Golden rules
1. **Design tokens only.** Every colour, size, radius, shadow and gradient comes from `src/styles/tokens.css` through the Tailwind classes in `tailwind.config.ts`.
   - ❌ `text-[#de0547]`, `bg-red-500`, `style={{ color: "#..." }}`, `text-sm`, `rounded-2xl` (Tailwind's own version)
   - ✅ `text-brand-text`, `bg-error-bg`, `text-body-sm`, `text-h3`, `rounded-xl`, `shadow-sm`, `bg-brand-gradient`
   - The only allowed arbitrary values are exact Figma pixel sizes (e.g. `h-[50px]`, `w-[232px]`), with the Figma node named in a comment.
2. **Reuse before you create.** Check `src/components/ui/index.ts` and `/components` (the live UI kit) first. A new `ui/` component must map to a Figma component, and its name goes in the JSDoc (`/** Figma: Badge (Tone = …) */`).
3. **Keep the layers.** `app/` (routes) → `sections/` · `auth/` (screens) → `cards/` · `layout/` → `ui/` → `styles/tokens.css`. `ui/` never imports from screens or `content/`.
4. **Copy is content.** Text comes word-for-word from Figma and lives in `src/content/*.ts` (or as constants at the top of a screen file), never scattered through JSX.
5. **Icons:** `iconsax-react` (Vuesax), Outline style by default, `color="currentColor"`, coloured with a `text-*` token class. Never use emoji for flags; use `<Flag country="lk" />`.
6. **Fonts:** never add Google Fonts links. Nunito, Yaldevi and Noto Sans Tamil are self-hosted in `src/app/layout.tsx`.
7. **Dark mode:** use semantic tokens (`bg-surface-card`, `text-ink`, `border-line`) so `[data-theme="dark"]` works. Use primitives (`gray-900`, `rose-600`) only for things that never change with the theme, such as the footer or paper notes.
8. **Accessibility:** real `<button>` and `<a>` elements, labels on inputs (`<Field>` does this), `aria-expanded` on toggles, `role="alert"` on errors, visible focus (`focus-visible:shadow-ring-brand`), and alt text on content images (`alt=""` on decoration). Respect `prefers-reduced-motion` (already global).
9. **Feedback pattern** (agreed in design):
   - Field problem → inline error under the field (`error` prop)
   - Something the user must act on → `<Alert>` inside the card
   - Quick confirmation or system message → `useToast()`, shown top-centre, 4 s
10. **Dropdowns:** always use `<Select>` from `ui/Select.tsx` (Figma *Dropdown Menu*). Never use a native `<select>`: it looks different on every OS and doesn't match the design.
11. **No API calls from components yet.** Mocks live in `src/lib/demo.ts` and in one `setTimeout` per submit handler. When connecting, call `src/services/api.ts` and keep the same UI states.

## Before you finish any change
- [ ] `npm run check` passes (typecheck + build)
- [ ] Compared with the Figma frame at **1440px** and **390px** (no horizontal scroll on mobile)
- [ ] No hex colours, emoji flags or Tailwind default classes added
- [ ] New component listed in `src/components/ui/index.ts`, shown on `/components`, and added to `docs/FIGMA_MAP.md`

## Where things are
| Need | File |
|---|---|
| Tokens (colours, radius, shadows, layout, gradients) | `src/styles/tokens.css` |
| Tailwind mapping + text styles | `tailwind.config.ts` |
| UI kit (Figma 🧩 Components) | `src/components/ui/*` · preview at `/components` |
| Home sections | `src/components/sections/home/*` · copy in `src/content/home.ts` |
| Login / register / review / plans screens | `src/components/auth/*` |
| Mock rules and test values | `src/lib/demo.ts` |
| Figma node ↔ file map | `docs/FIGMA_MAP.md` |
| Backend client (not wired yet) | `src/services/api.ts` |

## Naming
- Components use PascalCase files named after the Figma component (`ProfileCard.tsx` = Figma *Profile Card*).
- Props follow Figma variant names in camelCase: `variant`, `size`, `tone`, `surface`, `state`.
- Section components follow the Figma frame names (`01 Hero` → `Hero.tsx`, `07 FAQ` → `Faq.tsx`).
