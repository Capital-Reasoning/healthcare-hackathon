# Stack Decisions — Finalized

> Last updated: 2026-03-20. These decisions are locked in for hackathon prep.

## Core Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Framework** | Next.js 15 (App Router) | Best Vercel integration, layouts for persistent agent panel, API routes built-in, server components |
| **Language** | TypeScript (strict mode) | Type safety, better DX, agents generate better TS than JS |
| **Styling** | Tailwind v4 + shadcn/ui | Tailwind v4's CSS-first config, shadcn/ui is React-native and well-maintained |
| **State** | Zustand | Tiny, no boilerplate, works with Next.js SSR, documented in stores/ |
| **Database** | Supabase (PostgreSQL + pgvector) | Auth + DB + vectors + storage + realtime in one platform. Free tier. |
| **ORM** | Drizzle ORM | Type-safe, lightweight, Postgres-native, great migration story |
| **AI Framework** | Vercel AI SDK (`ai`, `@ai-sdk/react`, `@ai-sdk/anthropic`) | First-class React streaming, tool calling, chat hooks |
| **AI Model** | Claude Sonnet 4.6 (extended thinking, medium budget) | Fast for demos, smart enough for analysis. Opus toggle later if needed. |
| **Generative UI** | OpenUI (`@openuidev/react-lang`, `@openuidev/react-headless`) | Native React, 47-67% fewer tokens than JSON, streaming renderer, defineComponent pattern |
| **Charts** | Recharts | Most used React chart library (24k+ stars), D3-powered, declarative, great docs, agents know it well |
| **RAG Parsing** | LlamaParse (REST API) | Best-in-class document parsing, handles tables/forms/complex layouts |
| **RAG Chunking** | Semantic chunking (LlamaIndex TS or custom) | Best retrieval quality, worth the extra compute |
| **Embeddings** | Gemini Embedding 2 (`@google/generative-ai` or `@ai-sdk/google`) | Strong performance, 3072 dimensions, good on medical text |
| **Vector Store** | Supabase pgvector | Same DB as everything else, HNSW indexing, hybrid search with tsvector |
| **Deployment** | Vercel | Zero-config for Next.js, preview deploys, SSE streaming works |
| **Icons** | Lucide React | Comes with shadcn/ui, consistent, tree-shakeable |

## Architectural Decisions

### Generative UI (OpenUI)
- Every agent-renderable component gets a `defineComponent()` wrapper with Zod schema
- Components registered in a `createLibrary()` bundle
- System prompt auto-generated via `library.prompt()`
- Claude outputs OpenUI Lang (compact, line-oriented, streamable)
- `<Renderer>` component in the agent panel parses + renders progressively
- Components work identically in both static pages and agent-generated contexts

### Agent Panel
- Persistent across all pages (lives in root layout)
- Desktop (≥1024px): right 1/3, pushes main content left
- Tablet (<1024px): pushes content to phone-width layout
- Mobile (<640px): bottom sheet — peek strip → swipe up → full screen
- Frosted glass aesthetic with gradient borders
- Conversations persist in Supabase (`conversations` + `messages` tables)
- No auth — single shared space for hackathon demo
- Conversation management: new, clear, history list, delete

### RAG Pipeline
```
Document Upload → LlamaParse (REST API) → Semantic Chunking → Gemini Embedding 2 → Supabase pgvector
                                                                                          ↓
User Query → Claude (with tools) → vector_search(query) → top-K chunks → Claude → cited answer
                                 → keyword_search(terms) → tsvector matches → Claude
                                 → get_chunk(id) → direct retrieval → Claude
```
- Agent can make multiple retrieval calls per turn (deep search)
- Hybrid retrieval: vector similarity + PostgreSQL full-text search
- Citation tracking: every chunk has document_id + page_number

### API Design
- REST endpoints in `src/app/api/`
- Consistent response shape: `{ data, meta: { page, pageSize, total }, error }`
- Paginated by default
- Filter via query params, sort via `sort=field:asc|desc`
- Every endpoint also registered as an MCP tool and agent tool
- FHIR-inspired naming but simplified (patients, encounters, observations, medications, providers)

### Styling Strategy
- Standard data UI (left 2/3): clean, warm, professional — teal + warm neutrals from colour-scheme.md
- Agent panel (right 1/3): frosted glass background, gradient borders, subtle glow effects
- AI-generated components: subtle glass border to distinguish from static UI
- Light mode only (hackathon scope)

### App Name
- Display name: "Rithm" — configured in `src/config/app.ts`
- Easily changeable (single source of truth)

## MCP Servers (configured in .claude/settings.json)

| Server | Purpose |
|--------|---------|
| Supabase MCP | Direct DB access, schema management, migrations |
| Playwright MCP | UI testing, screenshots, flow verification |
| Context7 | Up-to-date docs for Next.js, React, Tailwind v4, Supabase |
| Vercel MCP | Deployment management |

## Environment Variables

All in `.env` (gitignored):
- `ANTHROPIC_API_KEY` — Claude API access
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `SUPABASE_DB_PASSWORD`
- `VERCEL_TOKEN`, `VERCEL_PROJECT_URL`
- `GITHUB_TOKEN`, `GITHUB_REPO_URL`
- `LLAMAPARSE_API_KEY` — Document parsing
- `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` — Embeddings
