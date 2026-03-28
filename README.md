# BestPath — AI-powered Healthcare Data Platform

## Setup

```bash
npm install
cp .env.example .env.local   # Fill in API keys (see below)
npm run db:push               # Push schema to Supabase
npm run db:seed               # Seed demo data
npm run dev                   # http://localhost:3000
```

### Required Environment Variables
- `DATABASE_URL` — Supabase Postgres connection string
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`
- `ANTHROPIC_API_KEY` — Claude API key (for AI agent)
- `LLAMAPARSE_API_KEY` — LlamaParse (for document ingestion)
- `GEMINI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini (for embeddings)

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint + typecheck |
| `npm run format` | Prettier |
| `npm run db:push` | Push schema to Supabase |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:indexes` | Set up pgvector indexes |

## Hackathon Commands (Claude Code)

These are slash commands you run in Claude Code to scaffold code quickly during the hackathon.

### `/challenge-intake`
**When:** First thing after the hackathon challenge brief is revealed.
**How:** Paste the challenge brief into `docs/challenge-intake.md`, then run `/challenge-intake`. Claude will analyse the brief, map it to existing components/APIs/tools, identify gaps, and generate a sprint plan with time estimates.

### `/scaffold-page`
**When:** You need a new page (e.g., analytics, reports, cohort-builder).
**How:** Run `/scaffold-page analytics`. Claude creates the route file, adds a nav link, adds a command palette entry, and sets up agent page context.

### `/add-component`
**When:** You need a new UI component that the agent can also render.
**How:** Run `/add-component` and describe what you need. Claude creates the component file, TypeScript props interface, OpenUI definition, barrel export, and registers it in the library.

### `/add-api-route`
**When:** You need a new data endpoint (e.g., for challenge-specific data).
**How:** Run `/add-api-route` and describe the resource. Claude creates the route file, query functions, and registers it as an agent tool — all following the standard response format.

### `/add-agent-tool`
**When:** You want the AI agent to be able to do something new (e.g., query a new dataset).
**How:** Run `/add-agent-tool` and describe the capability. Claude creates the Zod schema, tool definition, and updates the system prompt.

### `/pre-commit`
**When:** Before committing — runs typecheck, lint, and console.log checks.
**How:** Run `/pre-commit`. If everything passes, Claude stages and commits with a generated message. If something fails, it shows errors and suggests fixes.

## Docs

- `docs/presentation/demo-script.md` — 2-3 minute demo script
- `docs/presentation/talking-points.md` — Key differentiators and talking points
- `docs/challenge-intake.md` — Template for hackathon challenge analysis
- `docs/ideas.md` — Stretch goals and future ideas
- `docs/colour-scheme.md` — Design system colour palette
- `docs/stack-decisions.md` — Architecture decisions

---

## Architecture

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Zustand · Supabase (Postgres + pgvector) · Drizzle ORM · Vercel AI SDK + Claude Opus 4.6 · OpenUI (generative UI) · Recharts · LlamaParse + Gemini Embeddings + pgvector RAG

### Key Idea: Generative UI
The AI agent doesn't return text — it generates native UI components (charts, tables, patient cards) using the same component library that powers the static pages. This is powered by [OpenUI](https://openui.fly.dev), a DSL for describing UI that's 47-67% more token-efficient than JSON.

### Project Structure
```
src/
├── app/(main)/          # Pages: dashboard, patients, research, settings
├── app/api/             # REST API endpoints (consistent response shape)
├── components/          # UI components (9 categories)
├── lib/ai/              # Claude agent, tools, system prompt, OpenUI
├── lib/db/              # Drizzle schema, queries, seed data
├── lib/rag/             # LlamaParse → chunking → Gemini embeddings → pgvector
├── stores/              # Zustand: agent panel, conversations, UI state
└── config/              # App config, Zod-validated env vars
```

### Agent Tools
7 tools registered for the AI agent: `queryPatients`, `getPatientDetail`, `searchDocuments`, `keywordSearch`, `listDocuments`, `getDocumentChunk`, `getMetrics`. Tools call the query layer directly (no HTTP round-trip).

### OpenUI Component Library
23 renderable components: StatCard, DataBadge, List, DataTable, ImageCard, ComparisonTable, MetricRow, BarChart, LineChart, DonutChart, SparkLine, AreaChart, HeatMap, ScatterPlot, RadarChart, GaugeChart, PatientCard, RiskBadge, Timeline, VitalSign, MedicationCard, StatusAlert, Row, Card, Tabs.

### Database
Supabase PostgreSQL with pgvector. 11 tables: patients, providers, organizations, encounters, observations, medications, documents, documentChunks, conversations, messages. Drizzle ORM with typed queries.

### RAG Pipeline
LlamaParse (document parsing) → semantic chunking (1500 char, 200 overlap) → Gemini embeddings (3072 dimensions) → pgvector storage → hybrid retrieval (vector + keyword with Reciprocal Rank Fusion).

---

*Built by Capital Reasoning for the BuildersVault Healthcare Hackathon.*
