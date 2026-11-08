# Aura — Vikasitha matrimony platform

| Folder | What | Stack |
|---|---|---|
| [`DatingApp.APP`](./DatingApp.APP) | Web app (front end). Built 1:1 from the Figma design. | Next.js 15 · React 19 · TypeScript · Tailwind 3 |
| [`DatingApp.API`](./DatingApp.API) | Back end, clean architecture (Domain · Application · Infrastructure · WebApi) | .NET (`DatingApp.sln`) |

**Design source of truth:** Figma file *AI-Learning-2*: https://www.figma.com/design/jyoGCUqvQuZsoUp2uUi95W/AI-Learning-2

## Start here
- Front end: [`DatingApp.APP/README.md`](./DatingApp.APP/README.md) (run, pages, structure, design system)
- AI tools: [`DatingApp.APP/AGENTS.md`](./DatingApp.APP/AGENTS.md) (rules every assistant must follow)
- Figma ↔ code: [`DatingApp.APP/docs/FIGMA_MAP.md`](./DatingApp.APP/docs/FIGMA_MAP.md)

## Status
- ✅ Home (desktop + mobile), Login, Forgot password, Registration (4 steps), Review status, Plans: front end only, fully clickable with mock data
- ⏳ Not connected to `DatingApp.API` yet (see "Connecting the API later" in the APP README)
- ⏳ Search results, profile detail, info pages and chat are designed in Figma but not built yet

`_backup_pre_figma/` holds the files replaced during the Figma rebuild. It is safe to delete once you're happy with the new UI.
