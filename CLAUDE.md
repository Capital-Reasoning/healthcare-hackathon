# Rithm — AI-powered Healthcare Data Platform

## Quick Start
```bash
npm install
cp .env.example .env.local   # Fill in API keys
npm run db:push               # Push schema to Supabase
npm run db:seed               # Seed demo data (40 patients, encounters, meds, observations, documents)
npm run dev                   # Start dev server at localhost:3000
```

## Stack
Next.js 16 (App Router) · TypeScript (strict) · Tailwind v4 + shadcn/ui · Zustand · Supabase (Postgres + pgvector) · Drizzle ORM · Vercel AI SDK + Claude Sonnet 4.6 · OpenUI (generative UI) · Recharts · LlamaParse → Gemini Embeddings → pgvector RAG

## Principles
- **Hackathon speed** — ship fast, iterate, don't over-engineer
- **Senior-dev quality** — strict TS, proper error handling, clean patterns
- **Component duality** — every component works in static pages AND agent-generated (OpenUI) contexts
- **API consistency** — all endpoints: `{ data, meta: { page, pageSize, total }, error }`
- **Glass for AI, clean for data** — frosted glass aesthetic for agent panel only; warm teal + neutrals for data UI

## Structure
- `src/app/(main)/` — pages (dashboard, patients, research, settings)
- `src/app/api/` — REST endpoints (see `src/app/api/CLAUDE.md`)
- `src/components/{ui,layout,navigation,data-display,charts,forms,feedback,healthcare,agent}/`
- `src/lib/{ai,db,rag,supabase,openui}/` — backend logic
- `src/stores/` — Zustand (agent-store, conversation-store, ui-store)
- `src/config/` — app.ts (display config), env.ts (Zod-validated env vars)
- `src/types/` — api.ts, database.ts, agent.ts

## Key Patterns
- **New component**: add to `components/{category}/`, create OpenUI `defineComponent` wrapper if agent-renderable
- **New API route**: follow response shape in `src/app/api/CLAUDE.md`, register as agent tool
- **New agent tool**: add to `lib/ai/tools.ts`, document in system prompt
- **Styling**: use `bg-background`, `text-foreground`, `border-border` tokens; teal-500 for primary; glass effects only in agent panel
- **Icons**: always use Lucide React (`lucide-react`). **Never** draw custom SVG paths/icons — find the closest Lucide icon instead

## Commands
```
npm run dev          # Start dev server
npm run build        # Production build (uses webpack)
npm run typecheck    # Type check
npm run lint         # ESLint + typecheck
npm run format       # Prettier
npm run db:generate  # Drizzle migrations
npm run db:push      # Push schema to DB
npm run db:studio    # Drizzle Studio
npm run db:seed      # Seed demo data
npm run db:indexes   # Set up pgvector indexes
```

## Colour Scheme
Primary: teal (#0B8585). Background: warm white (#FAFAF8). Text: navy (#1A2E44). See `docs/colour-scheme.md`. Always use the colour variables in-app, *never hardcode colours*.

## Agent Tools
The AI agent has 7 tools registered in `src/lib/ai/tools.ts`:

| Tool | Purpose |
|------|---------|
| `queryPatients` | Search/filter patients by name, MRN, risk level, condition, age range |
| `getPatientDetail` | Get full patient record with encounters, medications, observations |
| `searchDocuments` | Hybrid semantic + keyword search across uploaded documents |
| `keywordSearch` | Exact keyword matching in documents |
| `listDocuments` | List all documents in the knowledge base |
| `getDocumentChunk` | Retrieve a specific document chunk by ID |
| `getMetrics` | Aggregate dashboard metrics (patient counts, risk distribution, encounters, wait times) |

Tools call query functions directly from `src/lib/db/queries/` — no HTTP round-trip.

## OpenUI Component Library
23 components registered in `src/lib/openui/library.ts` for agent-generated UI:

**Data Display:** StatCard, DataBadge, List, DataTable, ImageCard, ComparisonTable, MetricRow
**Charts:** BarChart, LineChart, DonutChart, SparkLine, AreaChart, HeatMap, ScatterPlot, RadarChart, GaugeChart
**Healthcare:** PatientCard, RiskBadge, Timeline, VitalSign, MedicationCard
**Feedback:** StatusAlert
**Layout:** Row, Card, Tabs

Component definitions live in `src/lib/openui/components/`. The system prompt in `src/lib/ai/system-prompt.ts` contains the full syntax and examples.

## Custom Commands
Hackathon acceleration commands in `.claude/commands/`:

| Command | Purpose |
|---------|---------|
| `/scaffold-page` | Create a new page with route, nav link, command palette entry, agent context |
| `/add-component` | Create component with props, OpenUI wrapper, barrel export, library registration |
| `/add-api-route` | Create API endpoint with query functions, response format, agent tool |
| `/add-agent-tool` | Register new tool with Zod schema, system prompt update |
| `/challenge-intake` | Analyse hackathon challenge brief, map to scaffold, generate sprint plan |
| `/pre-commit` | Run typecheck, lint, console.log check, then commit if clean |

## During Hackathon

### Loading new data
1. Examine the provided dataset format (CSV, JSON, FHIR, etc.)
2. Modify `src/lib/db/schema.ts` if new tables are needed
3. Run `npm run db:generate && npm run db:push`
4. Write an import script (similar to `src/lib/db/seed.ts`)
5. For documents: POST to `/api/documents` or use the Settings page upload

### Adding features fast
- New page: `/scaffold-page` — creates route, nav, command palette, agent context
- New component: `/add-component` — creates component, OpenUI def, exports
- New API: `/add-api-route` — creates endpoint, queries, agent tool
- New tool: `/add-agent-tool` — registers tool for the AI agent

### RAG pipeline
Upload documents via Settings page or POST to `/api/documents` (multipart form data).
Pipeline: LlamaParse → semantic chunking → Gemini 3072-dim embeddings → pgvector.
Search modes: `hybrid` (default, RRF fusion), `vector` (semantic only), `keyword` (exact match).

### Demo prep
- Demo script: `docs/presentation/demo-script.md`
- Talking points: `docs/presentation/talking-points.md`
- Challenge intake template: `docs/challenge-intake.md`
- Stretch goals: `docs/ideas.md`

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails with Turbopack font error | Build uses `--webpack` flag — should be resolved. If not, check `package.json` build script |
| Database connection error | Check `DATABASE_URL` in `.env.local`. Must be a Supabase Postgres connection string |
| Agent not responding | Check `ANTHROPIC_API_KEY` in `.env.local`. Verify with `curl` to Anthropic API |
| RAG returns no results | Ensure documents are ingested (check `/api/documents`). Run `npm run db:indexes` for pgvector |
| Seed fails | Check `DATABASE_URL` is set. Run `npm run db:push` first to ensure schema exists |
| Type errors after schema change | Run `npm run db:generate` to update Drizzle types |
