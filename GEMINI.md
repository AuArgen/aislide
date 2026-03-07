# GEMINI.md - Context for AI Assistants

This file provides essential context for AI assistants to understand the **AI Slide Generator** project structure, tech stack, and development patterns.

## 🚀 Project Overview
AI Slide Generator is a platform that uses Google Gemini AI to generate professional slide presentations in seconds. It includes an interactive editor, export capabilities (PPTX, PDF), and an admin panel for managing tokens and payments.

## 🛠 Tech Stack
- **Frontend**: Next.js 16+ (App Router), React 19, Tailwind CSS 4, Shadcn/UI.
- **Backend**: Next.js Server Actions.
- **Database & Auth**: Supabase (PostgreSQL, SSR Auth).
- **AI**: Google Generative AI (`@google/generative-ai` - Gemini 1.5 Pro).
- **Export**: `pptxgenjs`, `html2canvas`, `jspdf`.
- **State Management**: `zustand`.
- **Validation**: `zod`.

## 📂 Key Directory Structure
- `/ai-slide-generator`: Main Next.js application.
  - `/src/app`: Page routes and layouts.
  - `/src/components`: UI components (Shadcn/UI and custom).
  - `/src/lib`: Core logic and integrations.
    - `gemini.ts`: Gemini API integration logic.
    - `supabase/`: Supabase client and server-side utilities.
    - `actions/`: Next.js Server Actions for database and AI operations.
    - `export.ts`: Presentation export logic.
  - `/src/store`: Global state (Zustand).
  - `/src/types`: TypeScript definitions.
- `/docs`: Technical documentation and project plans.

## ⚙️ Development Commands
Run these inside the `/ai-slide-generator` directory:
- `npm run dev`: Start development server.
- `npm run build`: Build for production.
- `npm run lint`: Run ESLint.

## 💡 AI Coding Guidelines
1. **Server Actions**: Use Server Actions for all database mutations and AI calls. They are located in `src/lib/actions`.
2. **Supabase**: Use `@supabase/ssr` for authentication and data fetching. Ensure proper middleware handling in `middleware.ts`.
3. **AI Generation**: Gemini integration is centralized in `src/lib/gemini.ts`. Follow the established prompt patterns.
4. **Styling**: Use Tailwind CSS 4 and Shadcn/UI components. Maintain the responsive design.
5. **State**: Use Zustand for complex client-side state (e.g., slide editor state).

## 📝 Recent Progress
- Admin panel for token and payment management is completed.
- Subscription system and QR payment proof workflow are active.
- PPTX and PDF export functionality is fully implemented.
