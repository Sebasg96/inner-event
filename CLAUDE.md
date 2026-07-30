# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (also runs prisma generate)
npm run build        # Production build
npm run lint         # ESLint
npx prisma db seed   # Seed sample data
npx prisma migrate dev --name <name>  # Create and apply a migration
```

No test suite is configured yet.

## Architecture

**PRAGMA** is a Next.js 16 (App Router) multi-tenant B2B SaaS platform for strategic management and OKR tracking.

### Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| Backend | Next.js Server Actions + API Routes |
| Database | PostgreSQL + Prisma 5.22 + pgvector |
| Auth | Supabase Auth (JWT via cookies) |
| AI | Google Gemini 2.5-Flash (text), text-embedding-004 (RAG) |

### Folder structure

- `src/app/` — Pages and API routes (App Router). Each feature has its own subfolder: `dashboard`, `strategy`, `capacities`, `analytics`, `reports`, `emergent`, `rituals`, `admin`, `auth`.
- `src/components/` — Reusable components grouped by feature.
- `src/lib/` — Shared utilities: `permissions.ts` (roles), `auth/AuthContext.tsx` (session), `krUtils.ts` (KR math), `rag.ts` (AI embeddings), `i18n/` (translations).
- `src/app/actions.ts` — **All server-side mutations live here** (~2,000 lines). Uses `revalidatePath()` for cache invalidation after writes.
- `prisma/schema.prisma` — Full data model (25+ models).
- `src/middleware.ts` — Auth guard; refreshes JWT on every request.

### Data model hierarchy

```
Purpose → Mega → Objective (L1 → L2 → L3, recursive) → KeyResult → Initiative → KanbanTask
                                                          ↓
                                                 KeyResultUpdate (audit log)
```

Supporting models: `User`, `Team`, `TeamMember`, `DiscProfile`, `Ritual`, `RitualCommitment`, `RitualActionLog`, `HardChoice`, `Document` (RAG store), `StrategicAccess`.

All models carry `tenantId` for multi-tenant isolation.

### Auth & roles

**Middleware** (`src/middleware.ts`) refreshes the Supabase JWT. Cookies `inner_event_user_id` / `inner_event_tenant_id` identify the session. Server actions read these cookies directly.

**4-tier role hierarchy** (weakest → strongest): `COLLABORATOR → DIRECTOR → ADMIN → SUPERADMIN`.

Permission helpers live in `src/lib/permissions.ts`:
- `canAccessModule(role, module)` — used in `NavBar.tsx` to hide menu items
- `canEditStrategy()`, `canManageUsers()`, etc.

### State management

- **Server state**: Prisma queries (server components fetch data directly).
- **Mutations**: Server actions in `actions.ts`; they call `revalidatePath()` to trigger re-renders.
- **Client state**: `AuthContext` (session), `LanguageContext` (i18n, `localStorage`-persisted), and local `useState` for UI (modals, forms). No Redux or Zustand.

### Adding a new module

1. Create `src/app/<module>/page.tsx` (server component, fetches data via Prisma).
2. Add mutations to `src/app/actions.ts`.
3. Add new Prisma models in `prisma/schema.prisma` and run `npx prisma migrate dev`.
4. Register the module in `src/lib/permissions.ts` so `canAccessModule()` covers it.
5. Add the nav entry in `src/components/NavBar.tsx` (role-gated).

### KR progress calculation

KR progress uses one of four `MeasurementDirection` types: `MAXIMIZE`, `MINIMIZE`, `TARGET`, `COMPLETE`. The math lives in `src/lib/krUtils.ts` (`calculateKRProgress()`). Dashboard health scores are weighted averages that propagate up through the hierarchy.

### AI integration

- Chat / OKR drafting / text refinement: `/api/ai/pragma-chat`, `/api/ai/draft-okr`, `/api/ai/refine-text`, `/api/ai/strategy-coach`.
- RAG pipeline in `src/lib/rag.ts` — stores embeddings in pgvector, retrieves top-3 similar docs as context.
- All AI calls are synchronous (no streaming).

### Environment variables required

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
DIRECT_URL
GEMINI_API_KEY
NEXT_PUBLIC_APP_URL
```
