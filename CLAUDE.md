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

### App Shell & Layout

The UI uses a **claude.ai-style sidebar layout**:

- **Left sidebar** (`AppSidebar`, 260px, `#0f172a` dark slate) — logo, "New Presentation" button, recent presentations list, language switcher, admin link, user profile + sign-out.
- **Right content area** (white, `rounded-l-2xl`) — `PresentationForm` for authenticated users, `LandingContent` for guests.
- `body` background is `#0f172a` so the sidebar blends seamlessly with the page edge.

The global `Navbar` component only renders on `/admin/*` and `/dashboard/upgrade` routes — all other pages use the sidebar or their own layout (editor has no nav).

**Routing:**
- `/` — main page. Server component: checks auth, renders full app shell (auth) or landing (guest).
- `/dashboard` — redirects to `/`.
- After Google sign-in, `auth/callback` redirects to `/` (not `/dashboard`).
- `/editor/[id]` — full-screen editor, no sidebar.
- `/admin/*` — admin panel, uses `Navbar`.

### Internationalization (i18n)

The app supports **three languages: Kyrgyz (`ky`), Russian (`ru`), English (`en`)**.

**Key files:**
- `src/lib/i18n/index.ts` — full translation dictionary + `createT(lang)` factory + `detectBrowserLanguage()`.
- `src/store/languageStore.ts` — Zustand store persisted to `localStorage` under key `aislide-language`. Fields: `language`, `hasChosen`, `setLanguage`.
- `src/components/shared/LanguageProvider.tsx` — React context wrapping the whole app. On first visit, silently auto-detects browser language via `navigator.language`; if not supported, defaults to `ky`. No confirmation modal — user changes language via the sidebar switcher anytime. Syncs to DB on every change via `POST /api/user/language` (no-ops if not authenticated).

**How to add/use translations in a component:**
```tsx
'use client'
import { useT } from '@/components/shared/LanguageProvider'

export function MyComponent() {
  const t = useT()
  return <p>{t('form.title')}</p>
}
```

**Adding new translation keys:** Edit all three language objects in `src/lib/i18n/index.ts`. Use `{placeholder}` syntax for variables: `t('form.stepSlide', { n: 1, total: 5 })`.

**Language preference storage:** `localStorage` (immediate) + `users.preferred_language` column in SQLite (synced via `/api/user/language`).

### Authentication

Auth is split across two systems:
- **External OAuth service** handles Google SSO and returns a JWT. The callback at `/auth/callback` sets an `auth_token` cookie and redirects to `/`.
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
- `gemini.ts` — `generateAndSavePresentation`, `generateSingleSlideAction`, `generateOutlineAction`, `textAiAction`
- `analytics.ts` — `logPresentationEvent`, `getPresentationAnalytics`, `getPresentationTokenSummary`, `getAllPresentationsAnalytics`
- `user.ts` — CRUD for presentations and users; includes `updateUserLanguage(userId, lang)`
- `payments.ts` — subscription approve/reject + Telegram notification
- `settings.ts` — read/write `settings` table key-value pairs
- `logs.ts` — AI usage audit log (`saveAiLog`, `updateAiLog`)

**API routes** (`src/app/api/`) handle binary/streaming operations and client-initiated actions:
- `/api/upload` — image uploads to Supabase Storage (`slide-images` bucket)
- `/api/generate-image` — Gemini image generation
- `/api/stock-images` — proxy for Unsplash/Pexels queries
- `/api/bg-remove` — background removal
- `/api/user/language` — `POST` — saves preferred language to `users.preferred_language`
- `/api/analytics/event` — `POST` — logs user slide actions (add/delete/duplicate) from the editor client

### AI Generation Flow

1. `generateAndSavePresentation` (Server Action) calls `generateSlides` in `src/lib/gemini.ts`
2. Gemini returns a JSON presentation structure with slides and elements
3. Any element `src` or slide `background` that starts with `stock:<query>` gets resolved to a real URL via `getRandomStockImage` from `src/lib/images.ts`
4. The resolved presentation is saved to SQLite (`presentations` table, `slides` column is a JSON string)
5. An `ai_generate_presentation` event is written to `presentation_events` with full token/cost data
6. User is redirected to `/editor/[id]`

Gemini is called with the API key loaded at runtime from the `settings` table (not just env), so key changes take effect without redeploy.

**`AiResponse<T>.metadata`** fields returned by all three Gemini functions (`generateSlides`, `generateOutline`, `generateSingleSlide`):
- `inputTokens`, `outputTokens`, `tokensUsed` — from `response.usageMetadata`
- `costUsd` — `(inputTokens / 1e6) * 0.075 + (outputTokens / 1e6) * 0.30`
- `durationMs`, `rawResponse`, `fullPrompt`, `clientPrompt`, `isValid`

### Presentation Analytics System

Every significant operation on a presentation is logged to the `presentation_events` table for data analysis.

**Event types:**
| `event_type` | Trigger |
|---|---|
| `ai_generate_presentation` | Full presentation generated by AI |
| `ai_generate_slide` | Single slide generated by AI (has exact per-slide tokens) |
| `ai_edit_text` | AI text assistant used on a slide |
| `user_add_slide` | User manually added a slide in editor |
| `user_delete_slide` | User deleted a slide in editor |
| `user_duplicate_slide` | User duplicated a slide in editor |

**Per-slide token estimation:** When a full presentation is generated in one Gemini call, the total tokens are stored in the `ai_generate_presentation` event. The `metadata` JSON field contains `estimated_tokens_per_slide` and `estimated_cost_per_slide` (total divided by slide count). Individual `ai_generate_slide` events have exact tokens.

**How user events are tracked:** `slidesStore` (`src/store/slidesStore.ts`) holds a `presentationId` field set on `initSlides()`. When the user adds/deletes/duplicates a slide, the store fires a fire-and-forget `POST /api/analytics/event` call.

**`generateSingleSlideAction`** and **`textAiAction`** accept optional `presentationId` and `slideIndex` parameters — pass them to get per-slide event logging.

**Admin view:** `/admin/analytics` lists all presentations with AI token/cost breakdown and user action counts. `/admin/analytics/[id]` shows the full event timeline for one presentation.

### Editor State

Six Zustand stores in `src/store/`:
- `slidesStore` — slide array, active slide index, `presentationId`, undo/redo stack (50-step history). **Single source of truth for slide content.**
- `editorStore` — UI selection, drag/resize/marquee state, clipboard
- `authStore` — current user, role, loading flag
- `syncStore` — server sync status (auto-saved via `useAutoSave` hook)
- `themeStore` — theme preferences
- `languageStore` — current language (`ky`/`ru`/`en`), persisted to `localStorage`

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
- The `users` table has a `preferred_language TEXT DEFAULT 'ky'` column (added via `ALTER TABLE` migration in `initSchema`).
- The `presentation_events` table stores one row per operation (AI or user). The `metadata` column is a JSON string (nullable). AI events have `input_tokens`, `output_tokens`, `total_tokens`, `cost_usd`; user events have all these as 0.
- Uploaded images are saved to `public/uploads/` and served as `/uploads/<filename>`. The directory is created automatically by `api/upload/route.ts`.
- `node:sqlite` is **experimental** in Node.js 22/24. The ExperimentalWarning in the console is expected and harmless.

## Key Conventions

- UI text must use `useT()` from `LanguageProvider` — **never hardcode Kyrgyz or any language strings** in components. All strings live in `src/lib/i18n/index.ts`.
- `@/*` path alias maps to `src/*` (configured in `tsconfig.json`).
- Admin-only pages (`/admin/*`) require `role === 'admin'`; middleware redirects unauthorized users to `/`.
- Telegram notifications fire on payment approval/rejection via `src/lib/telegram.ts`.
- `src/lib/geminiLayouts.ts` and `src/lib/templates.ts` define the prompt templates and layout schemas sent to Gemini.
- Custom scrollbar classes: `custom-scroll` (light, for white areas), `custom-scroll-dark` (dark, for the sidebar).
