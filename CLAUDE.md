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

**Editor-specific translation keys** live under `editor.*`. All editor components (`PresentationEditor`, `SlideSidebarPanel`, `SlideThumbnail`, `SyncStatusBadge`, `ContextMenu`) use `useT()` — never hardcode strings. Key groups:
- Toolbar tabs/buttons: `tabHome`, `tabInsert`, `tabDesign`, `tabView`, `insertText`, `insertShape`, etc.
- Recovery banner: `unsavedChanges`, `restore`, `dismiss`
- Sync status badge: `saving`, `saved`, `syncUnsaved`, `syncError`, `autoSave`
- Sidebar: `slides`, `backHome`, `share`, `slideCounter`, `templates`, `confirmTemplate`, `addSlideTooltip`, `layoutBlank`, `layoutTitle`, `layoutTitleBody`, `layoutTwoCol`
- Template names: `templatePitchDeck`, `templateReport`
- Shape picker: `shapeRect`, `shapeCircle`, `shapeTriangle`, `shapeDiamond`, `shapeStar`, `shapeHexagon`, `shapeArrowRight`, `shapeArrowLeft`, `shapeLine`, `shapeSpeechBubble`, `shapeCloud`
- Context menu: `ctxUndo`, `ctxRedo`, `ctxCut`, `ctxCopy`, `ctxPaste`, `ctxDuplicate`, `ctxBringForward`, `ctxSendBackward`, `ctxDelete`
- Thumbnail: `thumbShow`, `thumbHide`, `thumbDuplicate`, `thumbDelete`
- Misc: `linkCopied`, `loading`, `emptyCanvas`, `layers`, `togglePanel`, `fillColor`, `fill`, `strokeColor`, `stroke`, `customColor`, `applyBgAll`
- View tab: `zoom`, `grid`, `slideshow`

**Wizard-specific translation keys** added under `form.*`:
`createOutline`, `outlineReady`, `outlineSubtitle`, `coreMessage`, `slideTitle`, `regenerateOutline`, `backToInput`, `generateFromOutline`, `attachFile`, `attachedFiles`, `removeFile`, `rateLimitError`, `rateLimitHint`, `getApiKey`, `apiKeyHint`, `invalidApiKeyError`.

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
  - `generateOutlineAction(prompt, slideCount, tone, audience, customApiKey?, fileContext?, imageFiles?)` — returns `{ success, data: OutlineItem[], imageDecisions: ImageDecision[] }`
  - `generateSingleSlideAction(outlineItem, colorTheme, customApiKey?, presentationId?, slideIndex?)` — colors driven by `COLOR_PALETTES[colorTheme]`
- `analytics.ts` — `logPresentationEvent`, `getPresentationAnalytics`, `getPresentationTokenSummary`, `getAllPresentationsAnalytics`
- `user.ts` — CRUD for presentations and users; includes `updateUserLanguage(userId, lang)`
- `payments.ts` — subscription approve/reject + Telegram notification
- `settings.ts` — read/write `settings` table key-value pairs
- `logs.ts` — AI usage audit log (`saveAiLog`, `updateAiLog`)

**API routes** (`src/app/api/`) handle binary/streaming operations and client-initiated actions:
- `/api/upload` — local image upload (`POST`, field name **`image`**). Saves to `public/uploads/` and returns `{ url }`. **Important:** the form field must be named `image`, not `file`.
- `/api/generate-image` — Gemini image generation
- `/api/stock-images` — proxy for Unsplash/Pexels queries
- `/api/bg-remove` — background removal
- `/api/user/language` — `POST` — saves preferred language to `users.preferred_language`
- `/api/analytics/event` — `POST` — logs user slide actions (add/delete/duplicate) from the editor client

### Presentation Creation Wizard

`PresentationForm` (`src/components/user/PresentationForm.tsx`) uses a **3-step wizard** (KIMI-style), not a single form:

**Step 1 — Input (`step === 'input'`)**
- Large textarea for topic/prompt
- File attachment button (paperclip): accepts images (PNG/JPG/WEBP) and text files (.txt/.md)
  - Images → uploaded via `POST /api/upload`, stored as URL in `AttachedFile.content`
  - Text files → read in browser via `file.text()`, capped at 8 000 chars
- Advanced collapse: slide count (3–15) + custom Gemini API key
- "Create Outline" button → calls `generateOutlineAction`

**Step 2 — Outline review (`step === 'outline'`)**
- Horizontal-scrollable style/template picker (12 templates)
- Accordion list of slides — each item is collapsible, showing editable `title` and `coreMessage` inputs
- "Regenerate Outline" button re-calls `generateOutlineAction` with same inputs
- "Generate Presentation" button → starts Step 3

**Step 3 — Generating (`step === 'generating'`)**
- Per-slide progress bar; calls `generateSingleSlideAction` in a loop
- After all slides: applies `imageDecisions` (see below), then `createPresentation`, then redirects to `/editor/[id]`

**File attachment & AI image decisions:**

Text files are passed as `fileContext` (plain text) to the outline prompt — AI uses them to inform slide content.

Images are uploaded via `POST /api/upload` (form field: `image`) before the outline call. The returned URL is stored in `AttachedFile.content`. Images are passed as `imageFiles: Array<{ filename, url }>`. The outline prompt asks AI to decide for each image:

| Decision | When AI uses it | Effect |
|---|---|---|
| `"background"` | Scenic/textural/atmospheric photo | Applied as `bg: { type:'image', value, overlayColor:'#000', overlayOpacity:0.35 }` on every slide |
| `"element"` | Diagram, product photo, portrait | Inserted as an `image` element (`x:1080, y:120, w:720, h:840`) on the target `slideNumber` |
| `"context"` | Logo, screenshot, reference material | Not displayed; used only to inform content generation |

`imageDecisions` are stored in React state after Step 2 and applied post-generation in `handleGenerate`.

### AI Generation Flow

The legacy `generateAndSavePresentation` (one-shot) still exists but the main creation path is the **wizard flow** above.

Wizard flow:
1. `generateOutlineAction` → `generateOutline` in `src/lib/gemini.ts`
   - Returns `{ slides: OutlineItem[], imageDecisions: ImageDecision[] }`
   - Accepts: `prompt, slideCount, tone, audience, customApiKey?, fileContext?, imageFiles?`
2. User reviews/edits outline in accordion (Step 2)
3. For each slide: `generateSingleSlideAction` → `generateSingleSlide`
   - Colors are theme-aware via `COLOR_PALETTES` dict (see below)
4. `imageDecisions` applied to the slides array (background / element / context)
5. `createPresentation` saves to SQLite
6. Redirect to `/editor/[id]`

Any element `src` or slide `background` starting with `stock:<query>` is resolved to a real URL via `getRandomStockImage` from `src/lib/images.ts` (inside `generateSingleSlideAction`).

**Gemini error types** — `src/lib/gemini.ts` throws structured JSON errors that actions parse and forward to the client as typed error codes:
- `RATE_LIMIT` — HTTP 429 (free quota exceeded). `PresentationForm` shows an amber banner with a link to `aistudio.google.com/api-keys` and auto-opens Advanced Settings so the user can paste their own key.
- `INVALID_API_KEY` — HTTP 400/403 with API_KEY/invalid in the message. Shows a red error.
- Actions return `{ success: false, error: 'RATE_LIMIT' | 'INVALID_API_KEY' | string }`. The form checks `res.error === 'RATE_LIMIT'` to distinguish typed errors from plain messages. Entering a new API key clears the banner.

Gemini is called with the API key loaded at runtime from the `settings` table (not just env), so key changes take effect without redeploy.

**Color palettes (`COLOR_PALETTES` in `src/lib/gemini.ts`):**

The `generateSingleSlide` function maps `colorTheme` → a palette before building the prompt. The palette sets background, title color, detail color, and accent options. Colors are **never hardcoded** in the prompt — always derived from the palette.

| colorTheme | Background | Title |
|---|---|---|
| `Modern Dark` | `#0D1117` | `#FFFFFF` |
| `Minimalist Light` | `#FFFFFF` | `#111827` |
| `Corporate Blue` | `#0F2044` | `#FFFFFF` |
| `Creative Pastel` | `#FFF8F0` | `#2D1B69` |
| `Vibrant Warm` | `#1A0A00` | `#FFF7ED` |

The AI also returns `"bg": { "type": "solid", "value": "..." }` in its JSON — this ensures the structured `bg` field (which takes precedence in `buildSlideStyle`) is always set correctly.

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

### Editor Toolbar (Word-style tabs)

The editor toolbar (`PresentationEditor.tsx`) is organized into **four tabs**, similar to MS Word's ribbon:

| Tab | Content |
|---|---|
| **Башкы** (Home) | Context-aware: when element selected → font/size/B/I/U/align/colors + shape fill+stroke + X/Y/W/H/R; when nothing selected → slide font, title size, title color |
| **Вставить** (Insert) | Add elements: Text, Image, Shape (with 11-type picker dropdown), Formula, Code, Icon, Video |
| **Дизайн** (Design) | Slide background: solid color presets + gradient presets + image upload. Always changes the **slide** background, never the selected element. Shows `⚠ Слайддын фону` warning when an element is selected to prevent confusion. Uses `setSlideBackground()` from the store — never `updateSlideField('background', ...)`. |
| **Вид** (View) | Zoom controls (−/+/%), Grid toggle |

**Tab bar right side (always visible, outside tabs):** `SyncStatusBadge` · slide counter · **Slideshow button** (`▶ Слайдшоу`, `editor.slideshow` key) · right panel toggle. The slideshow button is always visible regardless of active tab.

**Key editor behaviors:**
- `Backspace`/`Delete` deletes the **active slide** only when focus is inside `[data-sidebar-panel]` (the slide sidebar). Pressing Backspace in the toolbar, canvas, or any other UI does NOT delete a slide.
- New slides added via `addSlide()` automatically inherit `bg`, `background`, and `titleColor` from the active slide, keeping the presentation visually consistent.
- `FontDropdown` uses `position: fixed` + `getBoundingClientRect()` so the dropdown is never clipped by the toolbar's `overflow: auto` scroll container.
- Speaker notes panel has been removed from the editor layout.

### Fullscreen Slideshow

Triggered by the **▶ Слайдшоу** button in the toolbar tab bar. Renders a fullscreen overlay (`z-index: 9999`) over the editor — no route change.

**State in `PresentationEditor`:**
- `showSlideshow: boolean` — overlay visibility
- `slideshowIndex: number` — current slide (starts from `currentSlideIndex`)
- `slideshowScale: number` — computed as `min(window.innerWidth / 1920, window.innerHeight / 1080)`, updated on `resize`
- `slideshowDir: 'next' | 'prev'` — controls enter animation direction

**Slide rendering:** A wrapper div at `CANVAS_W * scale × CANVAS_H * scale` (exact visual size) contains the 1920×1080 slide div with `transform: scale(scale), transformOrigin: 'top left'`. This avoids layout overflow that `center center` origin causes. `buildSlideStyle()` is applied directly — slide backgrounds render correctly.

**Transitions:** CSS keyframes injected via `<style>` tag. The animated div has a `key={slideshowIndex}` — React remounts it on each navigation, restarting the animation cleanly.
- Next (→ / Space / click): `ss-in-next` — `translateX(5%)` → `translateX(0)` + fade, 380ms `cubic-bezier(0.4,0,0.2,1)`
- Prev (←): `ss-in-prev` — `translateX(-5%)` → `translateX(0)` + fade, same timing

**Navigation:** `ssNext()` / `ssPrev()` callbacks (wrapped in `useCallback`) set direction then index. Keyboard handler in `useEffect` (active only when `showSlideshow === true`) listens for `Escape`, `ArrowRight`/`ArrowDown`/`Space` (next), `ArrowLeft`/`ArrowUp` (prev). Clicking the slide area also advances. Prev/next arrow buttons appear on hover at the screen edges. Counter `N / total` and ✕ close button are fixed top-right.

### Slide Element Types

All element types are defined in `src/types/elements.ts` as a discriminated union on `type`:
`text` · `image` · `shape` · `line` · `formula` · `code` · `group`

Elements use a pixel coordinate system — canvas is **1920 × 1080 px** (16:9). Properties `x`, `y`, `width`, `height` are all in this space.

Editor utilities (snap, align, group, transform) live in `src/lib/editor/`.

**ShapeElement** key fields: `shapeKind` (rect/circle/triangle/diamond/star/hexagon/arrow-right/arrow-left/line/speech-bubble/cloud), `fill` (hex), `fillType` ('solid'|'gradient'), `stroke` (hex), `strokeWidth` (px). Shape fill and stroke colors are editable directly in the **Башкы** toolbar tab when a shape is selected.

### Slide Background

Slide background is stored in two fields on `Slide`:
- `bg: SlideBackground` — structured object `{ type: 'solid'|'gradient'|'image', value: string, overlayColor?, overlayOpacity? }`. **This takes precedence in `buildSlideStyle()`.**
- `background: string` — legacy plain string (hex or gradient CSS). Only used as fallback if `bg` is absent.

**Always use `setSlideBackground(slideId, bg)` from `slidesStore`** to change a slide's background. Never use `updateSlideField('background', ...)` — since `bg` always exists (set by `makeBlankSlide`), the `background` field is never reached and those updates have no visual effect.

### Export

`src/lib/export.ts` handles two formats:
- **PPTX** — `pptxgenjs` maps slide elements to native PPTX shapes
- **PDF** — `html2canvas` renders the canvas DOM node, then `jsPDF` wraps it

PNG export has been removed. The `handleExport` function in `PresentationEditor.tsx` and `SlideSidebarPanel.tsx` accept only `'pptx' | 'pdf'`.

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
- `src/lib/geminiLayouts.ts` and `src/lib/templates.ts` define the prompt templates and layout schemas sent to Gemini. Each entry in `presentationTemplates` has a `nameKey` field (e.g. `'editor.templatePitchDeck'`) — use `t(tmpl.nameKey)` in components instead of `tmpl.name`.
- Custom scrollbar classes: `custom-scroll` (light, for white areas), `custom-scroll-dark` (dark, for the sidebar).
- The slide sidebar panel has `data-sidebar-panel` attribute — used by `useSlideHotkeys` to scope Backspace/Delete to slide deletion only when the sidebar has focus.
