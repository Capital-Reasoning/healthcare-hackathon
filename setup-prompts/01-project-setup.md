# Phase 01 — Project Setup & Configuration

## Context
You are setting up a healthcare hackathon project from scratch. The repo currently has only docs, a `.env` file with all API keys, and planning documents. Read `docs/stack-decisions.md` and `docs/colour-scheme.md` for full context on the decisions made.

Senior-dev mode: strict TypeScript, proper error handling, clean architecture. We're building a scaffold that will be extended rapidly during the actual hackathon, so patterns and conventions matter more than features right now.

**If anything is unclear or you need to make a judgment call, ask me before proceeding.**

## Objective
Initialize the full project: Next.js 15 with App Router, install all dependencies, configure tooling, set up the folder structure, create foundational config files, and write comprehensive CLAUDE.md documentation.

## Step-by-Step Instructions

### 1. Initialize Next.js Project

Create a new Next.js 15 project with App Router in the current directory (the repo root). Use TypeScript, Tailwind CSS v4, ESLint, and the `src/` directory convention. Do NOT use the `pages/` router. App name: `rithm`.

**Important:** The project must be initialized in the existing repo root, not in a subdirectory. There are existing files (docs/, .env, .gitignore, CLAUDE.md) that must be preserved.

### 2. Install Dependencies

Install all project dependencies. Here's the complete list:

**Core UI:**
```
shadcn/ui (via npx shadcn@latest init)
zustand
lucide-react
class-variance-authority clsx tailwind-merge
```

**Data & Forms:**
```
@tanstack/react-table
recharts
date-fns
react-hook-form @hookform/resolvers
```

**AI & OpenUI:**
```
ai @ai-sdk/react @ai-sdk/anthropic @ai-sdk/google
@openuidev/react-lang @openuidev/react-headless @openuidev/react-ui
zod
```

**Database & Backend:**
```
drizzle-orm drizzle-kit postgres
@supabase/supabase-js @supabase/ssr
```

**Content Rendering:**
```
react-markdown remark-gfm
```

**Dev Dependencies:**
```
@types/react @types/node
prettier prettier-plugin-tailwindcss
drizzle-kit (if not already added above)
```

After installing, verify all packages are in package.json with correct versions. If any package fails to install (e.g., OpenUI packages may have different names), search npm for the correct package name and install it. If you can't find an OpenUI package, note it and move on — we can address it later.

### 3. Configure TypeScript (Strict)

Update `tsconfig.json` to enable strict mode and enforce quality:
- `"strict": true`
- `"noUncheckedIndexedAccess": true`
- `"forceConsistentCasingInFileNames": true`
- `"noUnusedLocals": true` (warning, not error — for hackathon flexibility)
- `"noUnusedParameters": true` (warning, not error)
- Path aliases: `@/*` → `src/*` (should already be set by Next.js)

### 4. Configure ESLint

Set up ESLint with strict but practical rules. Extend from Next.js defaults and add:
- TypeScript strict rules
- React hooks rules (exhaustive-deps as warning)
- No explicit `any` (warning for hackathon, would be error in prod)
- Consistent type imports (`import type`)
- No console.log in production (warning)

Keep it strict enough to catch real bugs but not so strict it slows down hackathon development.

### 5. Configure Prettier

Create `.prettierrc` with:
- Single quotes
- Semicolons
- 2-space indent
- Trailing commas (all)
- Print width 100
- Tailwind plugin for class sorting
- Tab width 2

### 6. Set Up shadcn/ui

Initialize shadcn/ui with:
- Style: "default" or "new-york" (prefer "new-york" for a more polished look)
- Base color: Customize to match our colour scheme (see `docs/colour-scheme.md`)
- CSS variables: Yes
- Tailwind CSS v4: Yes (ensure compatibility)
- Components directory: `src/components/ui`

Install these base shadcn components (we'll customize them later):
```
button card dialog dropdown-menu input label select separator sheet skeleton tabs toast tooltip badge scroll-area popover command avatar checkbox radio-group switch slider textarea progress alert collapsible accordion
```

### 7. Create Project Directory Structure

Create this folder structure under `src/`:

```
src/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── (main)/                     # Route group for pages with nav
│   │   ├── layout.tsx              # Main layout: Navbar + content + AgentPanel
│   │   ├── page.tsx                # Dashboard
│   │   ├── patients/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── research/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── api/
│       ├── chat/route.ts           # Agent chat endpoint
│       ├── patients/route.ts
│       ├── encounters/route.ts
│       ├── observations/route.ts
│       ├── medications/route.ts
│       ├── documents/
│       │   ├── route.ts            # Document upload
│       │   └── search/route.ts
│       └── rag/
│           ├── vector-search/route.ts
│           └── keyword-search/route.ts
├── components/
│   ├── ui/                         # shadcn/ui (auto-generated)
│   ├── layout/                     # Page, Section, Card, Panel, Grid, Stack, Divider
│   ├── navigation/                 # Navbar, Tabs, Breadcrumbs, SideNav
│   ├── data-display/               # DataTable, StatCard, Badge, List, KeyValue
│   ├── charts/                     # Recharts wrappers
│   ├── forms/                      # Input, Select, SearchBar, FilterBar, etc.
│   ├── feedback/                   # Alert, Toast, Modal, Skeleton, etc.
│   ├── healthcare/                 # PatientCard, RiskBadge, Timeline, etc.
│   └── agent/                      # AgentPanel, ChatBubble, StreamingText, etc.
├── lib/
│   ├── openui/
│   │   ├── components/             # defineComponent wrappers
│   │   ├── library.ts              # createLibrary bundle
│   │   └── types.ts                # OpenUI-related types
│   ├── db/
│   │   ├── schema.ts               # Drizzle schema
│   │   ├── client.ts               # Database client
│   │   ├── queries/                # Reusable query functions
│   │   └── migrations/             # Drizzle migrations
│   ├── rag/
│   │   ├── parse.ts                # LlamaParse integration
│   │   ├── chunk.ts                # Semantic chunking
│   │   ├── embed.ts                # Gemini embeddings
│   │   └── retrieve.ts             # Hybrid retrieval logic
│   ├── ai/
│   │   ├── tools.ts                # Agent tool definitions
│   │   ├── system-prompt.ts        # System prompt construction
│   │   └── mcp.ts                  # MCP tool wrappers
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   └── server.ts               # Server Supabase client
│   └── utils.ts                    # cn() and shared utilities
├── stores/
│   ├── agent-store.ts              # Agent panel state (open/closed, active view)
│   ├── conversation-store.ts       # Active conversation, messages, history
│   └── ui-store.ts                 # Global UI state (filters, selections)
├── config/
│   ├── app.ts                      # App name and display config
│   └── env.ts                      # Environment variable validation
├── types/
│   ├── api.ts                      # API request/response types
│   ├── database.ts                 # Database entity types
│   └── agent.ts                    # Agent-related types
└── hooks/
    ├── use-agent.ts                # Agent panel hooks
    └── use-data.ts                 # Data fetching hooks
```

For directories that don't have content yet, create a placeholder `.gitkeep` file or a minimal `index.ts` that exports nothing (prefer the index.ts approach, as it also serves as a barrel export later).

### 8. Create Config Files

**`src/config/app.ts`:**
```typescript
export const APP_CONFIG = {
  name: 'Rithm',
  tagline: 'AI-powered healthcare insights',
  description: 'Real-time population health metrics and AI-powered data analysis',
  version: '0.1.0',
} as const;

export type AppConfig = typeof APP_CONFIG;
```

**`src/config/env.ts`:**
Create environment variable validation using Zod. Validate all required env vars at build time:
- ANTHROPIC_API_KEY
- SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY
- LLAMAPARSE_API_KEY
- GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY

Separate into `server` (only available server-side) and `client` (available in browser) groups. Use the `NEXT_PUBLIC_` prefix convention for client vars. The Supabase URL and publishable key should be client-accessible; everything else is server-only.

**Important:** Read the `.env` file to see the exact variable names being used, and make sure env.ts matches them exactly.

### 9. Create Zustand Stores (Scaffolds)

Create minimal but well-typed Zustand store scaffolds:

**`src/stores/agent-store.ts`:**
- `isOpen: boolean` — is the agent panel open
- `activeView: 'chat' | 'history'` — current panel view
- `toggle()`, `open()`, `close()`, `setView()`

**`src/stores/conversation-store.ts`:**
- `conversations: Conversation[]`
- `activeConversationId: string | null`
- `messages: Message[]`
- `isStreaming: boolean`
- `addMessage()`, `setStreaming()`, `newConversation()`, `deleteConversation()`, `clearHistory()`

**`src/stores/ui-store.ts`:**
- `activeFilters: Record<string, string[]>`
- `sortConfig: { field: string; direction: 'asc' | 'desc' } | null`
- `setFilter()`, `removeFilter()`, `clearFilters()`, `setSort()`

Define proper TypeScript types for `Conversation` and `Message` in `src/types/agent.ts`.

### 10. Create Placeholder Pages

Create minimal placeholder pages for each route so the app runs and navigates:

- `/` (Dashboard) — "Dashboard — coming soon"
- `/patients` — "Patient List — coming soon"
- `/patients/[id]` — "Patient Detail — coming soon"
- `/research` — "Research — coming soon"
- `/settings` — "Settings — coming soon"

Each page should import and use a consistent placeholder component. The root layout should include basic HTML structure with providers (Zustand, etc.). The `(main)/layout.tsx` should have a basic structure that will later hold the Navbar, SideNav, main content, and AgentPanel.

### 11. Create API Route Stubs

Create minimal API route stubs that return proper JSON responses. Each should follow this pattern:

```typescript
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  return NextResponse.json({
    data: [],
    meta: { page: 1, pageSize: 20, total: 0 },
    error: null,
  });
}
```

Create stubs for: `/api/chat`, `/api/patients`, `/api/encounters`, `/api/observations`, `/api/medications`, `/api/documents`, `/api/documents/search`, `/api/rag/vector-search`, `/api/rag/keyword-search`.

### 12. Create Utility Functions

**`src/lib/utils.ts`:**
- `cn()` function (className merger — standard shadcn pattern)
- `formatDate()` — date formatting helper
- `formatNumber()` — number formatting with locale support
- `truncate()` — string truncation
- `generateId()` — simple ID generator (for conversations, etc.)
- Export type for `ApiResponse<T>` matching our consistent response shape

### 13. Set Up Supabase Clients

**`src/lib/supabase/client.ts`:**
Create the browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`. Use the publishable key.

**`src/lib/supabase/server.ts`:**
Create the server-side Supabase client using `createServerClient` from `@supabase/ssr` with cookie handling for Next.js App Router. Use the secret key. This is used in API routes and server components.

### 14. Update .gitignore

Update `.gitignore` to be comprehensive for a Next.js project:
```
# dependencies
node_modules/
.pnp
.pnp.js

# next.js
.next/
out/

# build
dist/
build/

# env
.env
.env.local
.env.*.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
.ds_store
Thumbs.db

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

# drizzle
drizzle/meta/
```

### 15. Update CLAUDE.md

Replace the existing CLAUDE.md with a comprehensive version. This is the most important file in the repo — it guides all future development. It should include:

1. **Project overview** — "Rithm: AI-powered healthcare data platform for BuildersVault Hackathon"
2. **Quick reference** — tech stack table
3. **Principles**:
   - Hackathon speed: ship fast, iterate, don't over-engineer
   - Senior-dev quality: strict TS, proper error handling, clean patterns
   - Component duality: every component must work in both static pages and agent-generated (OpenUI) contexts
   - API consistency: all endpoints follow the same response shape, are paginated, and are documented
   - Glass for AI, clean for data: frosted glass aesthetic for AI features only; warm, professional look for standard data UI
4. **Project structure** — the full directory tree with descriptions
5. **Component patterns** — how to create new components, how to wrap them for OpenUI
6. **API patterns** — response shape, pagination, filtering, sorting, how to add new endpoints
7. **State management** — Zustand store patterns, when to use each store
8. **Styling conventions** — when to use glass effects, Tailwind theme tokens, CSS custom properties
9. **OpenUI patterns** — defineComponent, createLibrary, how agents render components
10. **Adding new features** checklist:
    - New component? Add to `components/{category}/`, create OpenUI wrapper if agent-renderable, export from barrel
    - New API route? Follow response shape, add pagination, register as MCP tool, register as agent tool, document in nested CLAUDE.md
    - New agent tool? Add to `lib/ai/tools.ts`, document in system prompt
11. **Commands** — npm scripts reference
12. **Key files** — where to find important things

HOWEVER: keep CLAUDE.md to 50 lines tops.

Also create a nested `src/app/api/CLAUDE.md` with API-specific conventions:
- Response shape
- Pagination pattern
- Error handling
- How to add a new endpoint
- How to ensure MCP compatibility (tool registration)

### 16. Configure MCP Servers

Update `.claude/settings.json` to add MCP server configurations. Add:
- Supabase MCP (HTTP type)
- Playwright MCP (npx command)
- Context7 (HTTP type)
- Vercel MCP (HTTP type)

Keep existing permissions. Note: Some MCP servers require auth tokens — add placeholder values that can be filled in later.

### 17. Add npm Scripts

Add useful scripts to `package.json`:
- `dev` — next dev (should already exist)
- `build` — next build
- `lint` — next lint + type check
- `lint:fix` — eslint --fix
- `format` — prettier --write
- `typecheck` — tsc --noEmit
- `db:generate` — drizzle-kit generate
- `db:push` — drizzle-kit push
- `db:studio` — drizzle-kit studio
- `db:seed` — tsx src/lib/db/seed.ts (placeholder for now)

### 18. Verify Everything Works

Run the following checks and fix any issues:
1. `npm run dev` — app starts without errors
2. `npm run typecheck` — no TypeScript errors
3. `npm run lint` — no critical lint errors
4. Navigate to `http://localhost:3000` — sees placeholder dashboard
5. Navigate to `/patients`, `/research`, `/settings` — all render
6. Hit `/api/patients` — returns the stub JSON response

**If any check fails, fix it before moving on. Ask me if you're unsure about how to resolve an issue.**

## Success Criteria
- [ ] Next.js app runs on `localhost:3000`
- [ ] All dependencies installed
- [ ] TypeScript strict mode enabled
- [ ] ESLint + Prettier configured
- [ ] shadcn/ui initialized with base components
- [ ] Full directory structure created
- [ ] Config files (app.ts, env.ts) in place
- [ ] Zustand stores scaffolded
- [ ] Placeholder pages render
- [ ] API stubs return JSON
- [ ] Supabase clients created
- [ ] CLAUDE.md is comprehensive
- [ ] MCP servers configured
- [ ] `npm run build` succeeds
