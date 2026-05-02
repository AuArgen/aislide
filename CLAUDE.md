# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

```
aislide/
├── ai-slide-generator/   ← Main Next.js application (all work happens here)
├── docs/                 ← Design specs and feature roadmap
├── GEMINI.md             ← Comprehensive architecture reference
└── logs/                 ← Application logs
```

All commands and file paths below are relative to `ai-slide-generator/`.

## Commands

```bash
# Run from ai-slide-generator/
npm run dev      # Dev server at http://localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

There are no test commands — the project has no test suite.

## Architecture Overview

**AI Slide Generator** is a Next.js 16 (App Router) SaaS that generates presentations via Google Gemini AI and provides an interactive browser-based editor.

### Authentication

Auth is split across two systems:
- **External OAuth service** handles Google SSO and returns a JWT. The callback at `/auth/callback` sets an `auth_token` cookie.
- **Internal JWT** (`HS256` via Web Crypto API, `src/lib/auth/`) is verified in `middleware.ts` on every protected request. Every hour, middleware re-checks the user's role against the external service and refreshes the token.

Roles: `user` (free, 3 presentations max) · `teacher` (external subscription, 1 per session) · `admin` (unlimited). Limits live in `src/lib/auth/`.

### Database Layer

`src/lib/db/index.ts` exports a single `db` singleton (`DatabaseSync` from the built-in `node:sqlite` module — no npm package needed). The schema is auto-created on first run; the database file lives at `./data/app.db` (override with `DATABASE_PATH` env var).

**Important**: `db` is server-only. Never import `src/lib/db/` or `src/lib/auth/auth-db.ts` in client components — they pull in `node:sqlite` which cannot be bundled for the browser.

Auth helpers are split for this reason:
- `src/lib/auth/auth-helpers.ts` — client-safe (no DB imports): `getCurrentSession`, `signInWithGoogle`, `signOut`, JWT helpers, re-exports from `edge.ts`
- `src/lib/auth/auth-db.ts` — server-only: `getUserByGoogleId`, `upsertUser`
- `src/lib/auth/edge.ts` — Edge Runtime-safe: `verifyInternalToken`, `generateInternalToken`, `checkExternalRole` (used by middleware)

### Server Actions vs API Routes

Business logic uses **Server Actions** (`'use server'`) in `src/lib/actions/`:
- `gemini.ts` — `generateAndSavePresentation` (main AI generation flow)
- `user.ts` — CRUD for presentations and users
- `payments.ts` — subscription approve/reject + Telegram notification
- `settings.ts` — read/write `settings` table key-value pairs
- `logs.ts` — AI usage audit log

**API routes** (`src/app/api/`) handle binary/streaming operations:
- `/api/upload` — image uploads to Supabase Storage (`slide-images` bucket)
- `/api/generate-image` — Gemini image generation
- `/api/stock-images` — proxy for Unsplash/Pexels queries
- `/api/bg-remove` — background removal

### AI Generation Flow

1. `generateAndSavePresentation` (Server Action) calls `generateSlides` in `src/lib/gemini.ts`
2. Gemini returns a JSON presentation structure with slides and elements
3. Any element `src` or slide `background` that starts with `stock:<query>` gets resolved to a real URL via `getRandomStockImage` from `src/lib/images.ts`
4. The resolved presentation is saved to Supabase (`presentations` table, `slides` column is JSONB)
5. User is redirected to `/editor/[id]`

Gemini is called with the API key loaded at runtime from the `settings` table (not just env), so key changes take effect without redeploy.

### Editor State

Five Zustand stores in `src/store/`:
- `slidesStore` — slide array, active slide index, undo/redo stack (50-step history). **Single source of truth for slide content.**
- `editorStore` — UI selection, drag/resize/marquee state, clipboard
- `authStore` — current user, role, loading flag
- `syncStore` — server sync status (auto-saved via `useAutoSave` hook)
- `themeStore` — theme preferences

Auto-save is debounced in `src/lib/hooks/useAutoSave.ts` and calls `updatePresentation` Server Action.

### Slide Element Types

All element types are defined in `src/types/elements.ts` as a discriminated union on `type`:
`text` · `image` · `shape` · `line` · `formula` · `code` · `group`

Elements use a pixel coordinate system — canvas is **800 × 600 px** (16:9). Properties `x`, `y`, `width`, `height` are all in this space.

Editor utilities (snap, align, group, transform) live in `src/lib/editor/`.

### Export

`src/lib/export.ts` handles all three formats:
- **PPTX** — `pptxgenjs` maps slide elements to native PPTX shapes
- **PDF** — `html2canvas` renders the canvas DOM node, then `jsPDF` wraps it
- **PNG** — `html-to-image` renders individual slides

`next.config.js` sets `serverActions.bodySizeLimit: '10mb'` to support image upload payloads.

## Environment Variables

See `.env.local.example`. Required at minimum:

```
GEMINI_API_KEY            # Bootstrap key; runtime key is stored in settings table
UNSPLASH_ACCESS_KEY
PEXELS_API_KEY
JWT_SECRET                # ≥32 chars
NEXT_PUBLIC_AUTH_SERVICE_URL
EXTERNAL_CHECK_USER_URL
EXTERNAL_API_KEY
NEXT_PUBLIC_APP_URL
DATABASE_PATH             # Optional; defaults to ./data/app.db
```

## SQLite Notes

- All tables use `TEXT` UUIDs generated via `crypto.randomUUID()` — no auto-increment integers.
- The `presentations.slides` column is stored as a JSON string; `parsePresentation()` in `user.ts` handles parse + legacy coordinate normalization on every read.
- Uploaded images are saved to `public/uploads/` and served as `/uploads/<filename>`. The directory is created automatically by `api/upload/route.ts`.
- `node:sqlite` is **experimental** in Node.js 22/24. The ExperimentalWarning in the console is expected and harmless.

## Key Conventions

- UI language is **Kyrgyz** (`ky`). Default text placeholders (e.g., `'Аталышты жазыңыз'`) are Kyrgyz.
- `@/*` path alias maps to `src/*` (configured in `tsconfig.json`).
- Admin-only pages (`/admin/*`) require `role === 'admin'`; middleware redirects unauthorized users to `/`.
- Telegram notifications fire on payment approval/rejection via `src/lib/telegram.ts`.
- `src/lib/geminiLayouts.ts` and `src/lib/templates.ts` define the prompt templates and layout schemas sent to Gemini.
