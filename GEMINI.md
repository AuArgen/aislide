# GEMINI.md — AI Slide Generator: Comprehensive Project Documentation

This file provides exhaustive context for AI assistants (and human developers) to understand the **AI Slide Generator** project. It covers the tech stack, every file's responsibility, page routing, data models, authentication flow, and more.

---

## 🚀 Project Overview

**AI Slide Generator** is a full-stack SaaS platform that produces professional slide presentations in seconds using Google Gemini AI. Users describe a topic, and the AI generates a fully structured, visually themed presentation stored in the cloud. The editor supports drag-and-drop element manipulation, resizing, and reordering. Finished presentations can be exported to `.pptx` or `.pdf`. An admin panel manages subscriptions, token settings, and payment approvals via a QR-proof workflow with Telegram notifications.

### Key Capabilities
| Feature | Details |
|---|---|
| AI Generation | Gemini 2.5 Flash with retry logic, Kyrgyz-language output |
| Interactive Editor | Drag, resize, and reorder slide elements |
| Export | `.pptx` (pptxgenjs), `.pdf` / `.png` (html2canvas + jsPDF) |
| Auth | External OAuth (Google SSO) via an external service; custom JWT session cookies |
| Roles | `user` (free, 3 presentations) · `teacher` (external sub, 1) · `admin` (unlimited) |
| Payments | QR-proof upload → pending → admin approve/reject → Telegram alert |
| Admin Panel | Settings editor, subscription management, payment review |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16+ (App Router) |
| **UI** | React 19, Tailwind CSS 4, Shadcn/UI |
| **Server Logic** | Next.js Server Actions (`'use server'`) |
| **Database & Storage** | Supabase (PostgreSQL) |
| **Auth** | Custom JWT (`HS256` via Web Crypto API), external Google OAuth service |
| **AI** | `@google/generative-ai` — Gemini 2.5 Flash |
| **Export** | `pptxgenjs`, `html2canvas`, `jspdf` |
| **State** | Zustand |
| **Validation** | Zod |
| **Notifications** | Telegram Bot API |

---

## ⚙️ Development Commands

> Run all commands from inside the `/ai-slide-generator` directory.

```bash
npm run dev      # Start Next.js dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

---

## 🗺️ Page Routes & Functionality Map

| Route | File | Access | Functionality |
|---|---|---|---|
| `/` | `src/app/page.tsx` | Public | Landing page — hero, feature cards, login/dashboard CTA |
| `/dashboard` | `src/app/dashboard/page.tsx` | Auth required | User home — create presentation, view list, subscription status |
| `/dashboard/upgrade` | `src/app/dashboard/upgrade/page.tsx` | Auth required | Upgrade plan — QR payment proof submission form |
| `/editor` | `src/app/editor/page.tsx` | Auth required | Placeholder editor shell (sidebar, canvas, toolbar) |
| `/editor/[id]` | `src/app/editor/[id]/page.tsx` | Auth required | Full interactive editor for a specific presentation (drag/resize/reorder) |
| `/presentation/[id]` | `src/app/presentation/[id]/page.tsx` | Auth required | Read-only slideshow viewer (shareable link) |
| `/auth/callback` | `src/app/auth/` | — | Handles OAuth callback and sets `auth_token` cookie |
| `/admin` | `src/app/admin/page.tsx` | Admin only | Admin overview — user stats, Gemini token status |
| `/admin/payments` | `src/app/admin/payments/page.tsx` | Admin only | Payment review — approve/reject pending QR payment proofs |
| `/admin/settings` | `src/app/admin/settings/page.tsx` | Admin only | System settings — update `GEMINI_API_KEY` and other settings |

---

## 📂 Full Directory Structure

```
aislide/
├── GEMINI.md                         ← This documentation file
├── README.md                         ← Basic setup readme
├── docs/                             ← Technical design documents
│   ├── AUTH_DOCUMENTATION.md         ← Full auth flow documentation
│   ├── TODO.md                       ← Pending development tasks
│   ├── admin_panel.md                ← Admin panel design spec
│   ├── base_structure.md             ← Initial project structure plan
│   ├── plan.md                       ← Overall feature roadmap
│   └── user_dashboard.md             ← Dashboard design spec
└── ai-slide-generator/               ← Main Next.js application root
    └── src/
        ├── middleware.ts             ← Edge middleware: JWT verification, route protection, role re-validation
        ├── app/                      ← Next.js App Router pages
        │   ├── layout.tsx            ← Root layout: Navbar + Inter font + global metadata
        │   ├── globals.css           ← Global CSS reset and base styles
        │   ├── page.tsx              ← Public landing page (/)
        │   ├── auth/                 ← Auth callback handling
        │   ├── dashboard/
        │   │   ├── page.tsx          ← User dashboard (/dashboard)
        │   │   └── upgrade/page.tsx  ← Plan upgrade page (/dashboard/upgrade)
        │   ├── editor/
        │   │   ├── page.tsx          ← Generic editor placeholder (/editor)
        │   │   └── [id]/page.tsx     ← Interactive editor for a presentation (/editor/[id])
        │   ├── presentation/
        │   │   └── [id]/page.tsx     ← Read-only slideshow viewer (/presentation/[id])
        │   └── admin/
        │       ├── page.tsx          ← Admin overview (/admin)
        │       ├── payments/page.tsx ← Payment management (/admin/payments)
        │       └── settings/page.tsx ← Settings editor (/admin/settings)
        ├── components/               ← Reusable UI components
        │   ├── auth/
        │   │   └── LoginButton.tsx   ← "Sign in with Google" button (triggers external OAuth)
        │   ├── shared/
        │   │   ├── Navbar.tsx        ← Top navigation bar (session-aware)
        │   │   ├── Button.tsx        ← Reusable styled button component
        │   │   ├── Card.tsx          ← Reusable card container component
        │   │   └── Modal.tsx         ← Generic modal/dialog component
        │   ├── user/
        │   │   ├── PresentationEditor.tsx ← Main interactive slide editor (drag/resize/reorder)
        │   │   ├── PresentationForm.tsx   ← AI generation form (topic, slide count, tone)
        │   │   └── UpgradeForm.tsx        ← QR payment proof upload form
        │   └── admin/
        │       ├── PaymentList.tsx   ← Approve/reject pending payment table
        │       └── SettingsForm.tsx  ← Key-value settings editor for admin
        ├── lib/                      ← Core business logic and integrations
        │   ├── gemini.ts             ← Gemini AI integration: slide generation with retry logic
        │   ├── export.ts             ← Export helpers: exportToPPTX, exportToPDF, exportToImage
        │   ├── telegram.ts           ← sendTelegramNotification helper (Bot API)
        │   ├── templates.ts          ← Predefined presentation templates (pitch deck, annual report)
        │   ├── auth/
        │   │   ├── auth-helpers.ts   ← Auth utility functions (session, user DB ops, role checks)
        │   │   ├── jwt.ts            ← Pure JWT sign/verify using Web Crypto API (Edge-compatible)
        │   │   └── limits.ts         ← Role-based presentation limits: getRoleLimits, canCreatePresentation
        │   ├── supabase/
        │   │   ├── client.ts         ← Browser-side Supabase client (anon key)
        │   │   ├── server.ts         ← Server-side Supabase client (SSR-safe, reads cookies)
        │   │   └── admin.ts          ← Admin Supabase client (service_role key, bypasses RLS)
        │   └── actions/              ← Next.js Server Actions ('use server')
        │       ├── gemini.ts         ← generateAndSavePresentation (calls Gemini → saves to DB)
        │       ├── user.ts           ← Presentation CRUD + subscription fetch
        │       ├── payments.ts       ← createSubscription, getPendingPayments, updatePaymentStatus
        │       └── settings.ts       ← getSettings, updateSetting, getSettingByKey
        ├── store/
        │   └── authStore.ts          ← Zustand store for client-side auth state
        └── types/
            ├── auth.ts               ← UserRole, User, Subscription, ExternalRoleCheck interfaces
            └── database.ts           ← Supabase table type definitions (Row/Insert/Update)
```

---

## 🧩 Component Responsibilities

### `src/app/layout.tsx`
**Root layout** wrapping every page. Imports the `Inter` font (with `cyrillic` subset), applies global CSS, and renders the `<Navbar />` above all page content. Sets the page `<title>` and meta description for SEO.

### `src/app/page.tsx` — `/`
**Public landing page.** Reads the `auth_token` cookie to determine if the user is logged in. If logged in, shows a "Go to Dashboard" link; otherwise shows the `<LoginButton />` and a "Learn More" button. Displays three feature cards: AI Generation, Modern Design, and Export & Share.

### `src/app/dashboard/page.tsx` — `/dashboard`
**User home screen.** An async Server Component that:
1. Calls `getCurrentSession()` — redirects to `/` if unauthenticated.
2. Fetches the user record from Supabase via `getUserByGoogleId()`.
3. Fetches the user's subscription (`getUserSubscription`) and presentations (`getUserPresentations`).
4. Computes role badges: `Admin`, `Premium`, `Pending`, or `Free`.
5. Renders the `<PresentationForm />` for AI generation and a grid of the user's existing presentations linking to `/editor/[id]`.

### `src/app/editor/page.tsx` — `/editor`
**Generic editor placeholder.** A static layout shell (sidebar, canvas, toolbar) rendered when no specific presentation ID is provided. Redirects unauthenticated users to `/`.

### `src/app/editor/[id]/page.tsx` — `/editor/[id]`
**Interactive presentation editor.** Receives the presentation `id` from the dynamic route. Fetches the full presentation data and renders the `<PresentationEditor />` component with drag/resize/reorder capabilities.

### `src/app/presentation/[id]/page.tsx` — `/presentation/[id]`
**Read-only slideshow viewer.** Renders slides in a linear, full-screen presentation mode for sharing purposes.

### `src/app/admin/page.tsx` — `/admin`
**Admin overview dashboard.** Verifies the user's `role === 'admin'` via Supabase query (redirects non-admins to `/dashboard`). Displays stat cards for total users, pending payments, active subscriptions, and Gemini token status.

### `src/app/admin/payments/page.tsx` — `/admin/payments`
**Payment management.** Renders the `<PaymentList />` component which lists all subscriptions with `status = 'pending'` and allows the admin to approve or reject each one.

### `src/app/admin/settings/page.tsx` — `/admin/settings`
**System settings editor.** Renders the `<SettingsForm />` component to update key-value pairs in the `settings` table (e.g., `GEMINI_API_KEY`).

---

## 🧩 Component Details

### `src/components/auth/LoginButton.tsx`
A client component that calls `signInWithGoogle()` from `auth-helpers.ts`, which redirects the browser to `NEXT_PUBLIC_AUTH_SERVICE_URL` (an external OAuth provider).

### `src/components/shared/Navbar.tsx`
Top navigation bar. Session-aware — shows user name and logout button when authenticated, or a login link when not. Uses `getCurrentSession()` to read the current auth state.

### `src/components/shared/Button.tsx` · `Card.tsx` · `Modal.tsx`
Generic, reusable UI primitives (styled button, card container, and modal dialog) used throughout the app.

### `src/components/user/PresentationEditor.tsx`
The **largest and most complex component** (~1,100 lines). A rich interactive editor with:
- Slide panel sidebar (add, delete, reorder slides)
- Canvas with absolutely-positioned elements
- Drag-and-drop via mouse events
- Selection handles for resizing
- Per-element style controls (font size, color, alignment, bold)
- Background color/gradient picker per slide
- Export buttons calling `exportToPPTX`, `exportToPDF`, `exportToImage`
- Auto-saves changes via the `updatePresentation` Server Action

### `src/components/user/PresentationForm.tsx`
AI generation form shown on the dashboard. Fields: topic prompt, slide count (3–10), and presentation tone (`business`, `academic`, `creative`, `school`). On submit, calls the `generateAndSavePresentation` Server Action and redirects to `/editor/[id]`.

### `src/components/user/UpgradeForm.tsx`
Plan upgrade form. Allows users to upload a QR payment proof image. Calls the `createSubscription` Server Action which saves it as `pending` and fires a Telegram notification to the admin.

### `src/components/admin/PaymentList.tsx`
Tabular list of pending subscriptions (user name, email, plan, proof image, date). Each row has "Approve" and "Reject" buttons connected to `updatePaymentStatus` Server Action.

### `src/components/admin/SettingsForm.tsx`
Settings key-value editor. Fetches all settings via `getSettings()` and allows the admin to update any value (e.g., swapping the Gemini API key) via `updateSetting()`.

---

## ⚡ Server Actions (`src/lib/actions/`)

All files in this directory are marked `'use server'`. They are the **only** way the client communicates with the database.

### `actions/gemini.ts` — `generateAndSavePresentation`
1. Calls `generateSlides(prompt, slideCount, tone)` from `lib/gemini.ts`.
2. Passes the result to `createPresentation()` to persist in Supabase.
3. Calls `revalidatePath('/dashboard')` to bust Next.js cache.
4. Returns `{ success, id }` or `{ success, error }`.

### `actions/user.ts`
| Function | Description |
|---|---|
| `getUserSubscription(userId)` | Fetches the user's subscription row from `subscriptions` table |
| `getUserPresentations(userId)` | Fetches all presentations ordered by `created_at` desc |
| `createPresentation(userId, title, slides, theme)` | Enforces role-based limits via `getRoleLimits()`, then inserts a new presentation |
| `getPresentationById(id)` | Fetches a single presentation by UUID |
| `updatePresentation(id, updates)` | Merges partial updates into a presentation row |

### `actions/payments.ts`
| Function | Description |
|---|---|
| `createSubscription(userId, planType, paymentProofUrl)` | Inserts `status: 'pending'` subscription + fires Telegram notification |
| `getPendingPayments()` | Returns all pending subscriptions joined with user info |
| `updatePaymentStatus(subscriptionId, status)` | Sets status to `'active'` or `'rejected'`; if active, computes `start_date` / `end_date` (1 month) |

### `actions/settings.ts`
| Function | Description |
|---|---|
| `getSettings()` | Returns all rows from `settings` table (uses admin Supabase client) |
| `updateSetting(key, value)` | Upserts a `key`/`value` pair (lowercased key) |
| `getSettingByKey(key)` | Returns the `value` for a single setting key (used by `gemini.ts` to fetch `GEMINI_API_KEY`) |

---

## 🔐 Authentication Architecture

The app uses a **custom JWT session** rather than Supabase Auth's built-in session management.

### Auth Flow
```
User → External OAuth Service (Google SSO)
  → Callback to /auth/callback
  → App signs an HS256 JWT containing { user_id, email, name, google_id, role, iat }
  → JWT stored in `auth_token` cookie (httpOnly: false, maxAge: 7 days)
  → All subsequent requests: middleware reads and verifies this cookie
```

### `src/lib/auth/jwt.ts`
Edge Runtime-compatible JWT utilities using the **Web Crypto API** (`crypto.subtle`). No third-party JWT library — pure `HS256` sign/verify.
- `signJWT(payload, secret)` — Signs and encodes a JWT.
- `verifyJWT(token, secret)` — Verifies HMAC signature; returns decoded payload or `null`.

### `src/lib/auth/auth-helpers.ts`
Central auth utility module:
| Function | Description |
|---|---|
| `getCurrentSession()` | Reads `auth_token` cookie (server or client), decodes payload, returns typed session object |
| `getUserByGoogleId(googleId)` | Queries `users` table by `google_id` |
| `upsertUser(user)` | Insert or update user row (conflict on `google_id`) |
| `checkExternalRole(googleId)` | Calls `EXTERNAL_CHECK_USER_URL` API to get the user's live role/subscription status |
| `generateInternalToken(payload)` | Signs a new JWT with `JWT_SECRET` |
| `verifyInternalToken(token)` | Verifies a JWT with `JWT_SECRET` |
| `signInWithGoogle()` | Redirects browser to `NEXT_PUBLIC_AUTH_SERVICE_URL` |
| `signOut()` | Calls `supabase.auth.signOut()` and clears session |
| `hasRole(userRole, requiredRoles)` | Checks if user has one of the required roles |
| `canManageContent(role)` | Returns `true` for `teacher` or `admin` |
| `isAdmin(role)` | Returns `true` for `admin` only |

### `src/lib/auth/limits.ts`
Role-based presentation creation limits:
| Role | Max Presentations | Label |
|---|---|---|
| `admin` | ∞ (Infinity) | Администратор (Чексиз) |
| `teacher` | 1 | Мугалим (Подписка: 1 жолу) |
| `user` (default) | 3 | Акысыз (3 презентация) |

Functions:
- `getRoleLimits(role)` — Returns `{ maxPresentations, label }` for a given role.
- `canCreatePresentation(currentCount, role)` — Returns boolean.

### `src/middleware.ts`
Next.js **Edge Middleware** running on every request to `/admin/**`, `/dashboard/**`, `/editor/**`.

Logic:
1. Reads `auth_token` cookie.
2. Verifies JWT via `verifyInternalToken()`.
3. If token is **older than 1 hour** (`now - iat > 3600`): calls `checkExternalRole()` to get latest role, updates DB if role changed, issues a refreshed JWT cookie.
4. If no valid session on a protected route: redirects to `/`.

---

## 🤖 Gemini AI Integration

### `src/lib/gemini.ts` — `generateSlides(prompt, slideCount, tone)`
1. Resolves the API key: first checks `settings` table (`GEMINI_API_KEY`), falls back to `process.env.GEMINI_API_KEY`.
2. Initialises the `gemini-2.5-flash` model.
3. Builds a detailed system prompt (in Kyrgyz) with:
   - Design rules (gradient backgrounds, contrast, coordinate system 0–100%)
   - Slide structure: title slide → N content slides → conclusion slide
   - Tone instructions (business / academic / creative / school)
4. Calls `model.generateContent()` wrapped in `withRetry()` (up to 3 retries with exponential back-off for 429 / 5xx errors).
5. Strips ````json` fences and parses the response as JSON.
6. Returns `{ title, slides[] }` where each slide has `{ title, background, titleColor, elements[], visual_hint }`.

**Slide element shape:**
```typescript
{
  type: "text",
  content: string,
  x: number,       // 0–100 (% of slide width)
  y: number,       // 0–100 (% of slide height)
  width: number,   // 0–100 (% of slide width)
  fontSize: number, // pixels
  color: string,   // hex
  align: "left" | "center" | "right",
  fontWeight: "normal" | "bold"
}
```

---

## 📤 Export System

### `src/lib/export.ts`
Three export modes, all callable from `PresentationEditor.tsx`:

| Function | Method | Library | Notes |
|---|---|---|---|
| `exportToPPTX(title, slides)` | Server-friendly | `pptxgenjs` | Creates slides with title + bulleted content text; downloads `.pptx` |
| `exportToPDF(containerId, filename)` | Browser-only | `html2canvas` + `jsPDF` | Renders DOM element to canvas, saves as A4 landscape PDF |
| `exportToImage(containerId, filename, format)` | Browser-only | `html2canvas` | Renders DOM to PNG/JPG, triggers download |

---

## 🔔 Telegram Notifications

### `src/lib/telegram.ts` — `sendTelegramNotification(message)`
Posts an HTML-formatted message to a Telegram chat via the Bot API. Uses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` environment variables. Called whenever a user submits a payment proof to immediately alert the admin.

---

## 📋 Presentation Templates

### `src/lib/templates.ts`
Exports `presentationTemplates` — an array of predefined slide structures:
- **`pitch-deck`** — "Startup Pitch Deck": Project title, Problem, Solution, Market Size, Business Model.
- **`report`** — "Annual Report": Report title, Financial Metrics, Charts & Analysis.

These can be selected as a starting point instead of AI generation.

---

## 🗃️ Database Schema (`src/types/database.ts`)

### `users` table
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `google_id` | `text` | Unique; used as the auth identity |
| `email` | `text` | |
| `full_name` | `text` | |
| `avatar_url` | `text \| null` | |
| `role` | `'user' \| 'teacher' \| 'admin'` | Default: `'user'` |
| `created_at` | `timestamptz` | |
| `last_login` | `timestamptz \| null` | |

### `presentations` table
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → `users.id` |
| `title` | `text` | |
| `theme` | `text \| null` | e.g. `'default'` |
| `slides` | `jsonb` | Array of slide objects |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `subscriptions` table
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → `users.id` |
| `plan_type` | `'free' \| 'premium'` | |
| `status` | `'active' \| 'pending' \| 'expired' \| 'rejected'` | |
| `start_date` | `timestamptz \| null` | Set on approval |
| `end_date` | `timestamptz \| null` | Set on approval (start + 1 month) |
| `expires_at` | `timestamptz \| null` | Same as `end_date` |
| `payment_proof_url` | `text \| null` | URL to uploaded QR proof image |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `settings` table
| Column | Type | Notes |
|---|---|---|
| `key` | `text` | Primary key (lowercased) |
| `value` | `text` | Stores config values like `GEMINI_API_KEY` |
| `created_at` | `timestamptz` | |
| `updated_at` | `timestamptz` | |

### `notifications` table
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | FK → `users.id` |
| `message` | `text` | |
| `type` | `'info' \| 'success' \| 'error' \| 'payment'` | |
| `is_read` | `boolean` | Default: `false` |
| `created_at` | `timestamptz` | |

---

## 🗝️ TypeScript Type Definitions (`src/types/`)

### `auth.ts`
```typescript
type UserRole = 'user' | 'teacher' | 'admin'

interface User {
  id: string; google_id: string; email: string; full_name: string;
  avatar_url: string | null; role: UserRole; created_at: string; last_login: string | null;
}

interface Subscription {
  id: string; user_id: string; plan_type: 'free' | 'premium';
  status: 'active' | 'pending' | 'expired' | 'rejected';
  start_date: string | null; end_date: string | null;
  payment_proof_url: string | null; expires_at: string | null;
  created_at: string; updated_at: string;
}

interface ExternalRoleCheck {
  role: string;
  subscriptions?: { is_active: boolean; expires_at: string; }[];
}
```

### `database.ts`
Full Supabase-typed schema (Row / Insert / Update shapes) for `users`, `subscriptions`, `presentations`, `settings`, and `notifications` tables. Used when initialising the typed Supabase client.

---

## 🌐 Supabase Clients (`src/lib/supabase/`)

| File | Key | Usage |
|---|---|---|
| `client.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-side client (respects RLS) |
| `server.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Server-side SSR client (reads request cookies) |
| `admin.ts` | `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS, used only in admin Server Actions |

---

## 🧠 Global State (`src/store/authStore.ts`)

A minimal **Zustand** store holding the current auth session on the client side. Components that need the session without prop-drilling read from this store. It is populated once during app initialisation from the `auth_token` cookie.

---

## � Environment Variables

| Variable | Used In | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | `lib/gemini.ts` | Fallback Gemini API key (primary source is DB `settings` table) |
| `NEXT_PUBLIC_SUPABASE_URL` | `lib/supabase/*` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `lib/supabase/client.ts`, `server.ts` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | `lib/supabase/admin.ts` | Supabase service role key (RLS bypass) |
| `JWT_SECRET` | `lib/auth/jwt.ts`, `middleware.ts` | HMAC-SHA256 secret for signing session JWTs |
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | `lib/auth/auth-helpers.ts` | External Google OAuth provider redirect URL |
| `EXTERNAL_CHECK_USER_URL` | `lib/auth/auth-helpers.ts` | External API to validate user role/subscription |
| `EXTERNAL_API_KEY` | `lib/auth/auth-helpers.ts` | API key header for external role check |
| `TELEGRAM_BOT_TOKEN` | `lib/telegram.ts` | Telegram bot token for admin notifications |
| `TELEGRAM_CHAT_ID` | `lib/telegram.ts` | Telegram chat/channel ID for admin notifications |
| `NEXT_PUBLIC_APP_URL` | `lib/actions/payments.ts` | Public app URL (used in Telegram message links) |

---

## 💡 AI Coding Guidelines

1. **Server Actions first** — All DB mutations and AI calls must go through Server Actions in `src/lib/actions/`. Never query the DB directly from client components.
2. **Supabase client selection** — Use `client.ts` in client components, `server.ts` in Server Components/Actions, and `admin.ts` only for privileged admin operations.
3. **Auth pattern** — Always call `getCurrentSession()` at the top of a Server Component to get the session. Redirect to `/` if `null`.
4. **Role checks** — Use `hasRole()`, `isAdmin()`, `canManageContent()` from `auth-helpers.ts`. Never hardcode role strings in components; import `UserRole` from `types/auth.ts`.
5. **Gemini API key** — The key is dynamically fetched from the `settings` table so it can be updated by the admin without redeployment. The `process.env.GEMINI_API_KEY` is only the fallback.
6. **Middleware protects routes** — Do not add manual session checks to `/admin`, `/dashboard`, `/editor` pages (beyond a null-check UX fallback) — middleware handles enforcement.
7. **Styling** — Use Tailwind CSS 4 utility classes. Do not write inline `style` objects except for dynamic values (e.g., element position from the editor store).
8. **Zustand** — Use `authStore` for cross-component client auth state. Avoid prop-drilling the session object.
9. **Exports are client-only** — `exportToPDF` and `exportToImage` use `document` and must be called from client components or event handlers. `exportToPPTX` can run on either side.
10. **Rate limiting** — The `withRetry` wrapper in `gemini.ts` handles 429/5xx errors automatically. Do not add additional retry logic in the Server Action layer.

---

## 📝 Recent Progress & Status

| Area | Status |
|---|---|
| Landing page | ✅ Complete |
| Google OAuth (external service) | ✅ Complete |
| Custom JWT session system | ✅ Complete |
| Role-based limits enforcement | ✅ Complete |
| External role re-validation (middleware) | ✅ Complete |
| AI slide generation (Gemini) | ✅ Complete (with retry) |
| Interactive editor (drag/resize) | ✅ Complete |
| PPTX / PDF / Image export | ✅ Complete |
| Subscription + QR payment workflow | ✅ Complete |
| Telegram admin notifications | ✅ Complete |
| Admin panel (settings, payments) | ✅ Complete |
| Presentation templates | ✅ Complete (2 templates) |
| Read-only slideshow viewer | 🔲 Scaffold exists |
| Notifications table | 🔲 Schema exists, UI pending |
