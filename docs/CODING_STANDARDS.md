# Coding standards

Principles: Clean Code, SOLID where it pays, DRY, KISS, separation of concerns. Follow the existing patterns
before your preferences; record a deliberate deviation in `ARCHITECTURE.md` §6.

## TypeScript / React (DatingApp.APP)
**Files and names**
- Components `PascalCase.tsx`, named after the Figma component/frame; hooks `useX`; helpers `camelCase.ts` in `lib/`.
- Props use Figma variant names (`variant`, `size`, `tone`, `state`). Event props `onX`.
- Constants `UPPER_SNAKE` at the top of the file or in `content/`.

**Components**
- One responsibility per component; split when a file passes ~400 lines or mixes data loading, state and layout.
- Client components only where needed (`"use client"`); keep `page.tsx` thin and export `metadata`.
- Reuse `ui/` (see `COMPONENT_GUIDELINES.md`). No inline modal/backdrop code — use the shared dialog once it exists (TD-02).
- No `any`. Type API payloads in `types/` and mirror the C# DTOs.
- Effects: clean up listeners/timers; guard `window`/`localStorage` access for SSR.
- Keys: stable IDs, never array index for reorderable lists.

**Styling** — token classes only (`AGENTS.md` rules). No hex, no default Tailwind palette, no `style={{ color }}`;
exact Figma pixel sizes allowed with a comment. Opacity on tokens → `bg-[rgba(...)]`.

**State & data**
- Read/write browser storage only through a `lib/` helper that wraps try/catch once (TD-05).
- New business state goes to the API, not localStorage. Server data → one fetch helper with typed errors (TD-04).
- No duplicated logic: contact-detail check = `containsContactDetails()`; limits = `lib/usage.ts`; guest gate = `requireMember()`.

**Copy** — English in `content/*.ts`, Sinhala in `translations.ts`. No user-facing strings buried in logic.

**Imports** — absolute `@/…`; remove unused imports; no new dependency without an `ARCHITECTURE.md` decision row.

## C# / .NET (DatingApp.API)
- `PascalCase` types/members, `_camelCase` private fields, `Async` suffix, pass `CancellationToken` through.
- Controllers: route + auth attributes, call one service, map result → HTTP. No EF queries in controllers/hubs.
- Services: return DTOs; throw typed exceptions (`NotFoundException`, `ForbiddenException`, `ValidationException`)
  mapped centrally to ProblemDetails — never `Console.WriteLine` + fallback data.
- Identity: `User.FindFirstValue(ClaimTypes.NameIdentifier)` — never a profile/user ID from the request for "me".
- EF: `AsNoTracking()` for reads, project to DTOs, page every list (`Skip/Take`), add indexes for filter columns.
- DTO validation with data annotations or FluentValidation (choose one, record it).
- Config via `IOptions<T>`; secrets via user-secrets / environment variables only.

## Both
- Small functions, early returns, max ~3 nesting levels.
- Comments explain *why*; JSDoc/XML-doc on exported components and public services.
- Format with the project defaults (Prettier-compatible spacing in TS; `dotnet format` in C#).
