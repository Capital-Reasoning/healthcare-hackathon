---
name: BuildersVault Healthcare Hackathon prep
description: Hackathon March 27-28, 2026 at UVic. Building "Rithm" — AI-powered healthcare data platform. React/Next.js + OpenUI + Claude + Supabase. 8-phase scaffold in setup-prompts/.
type: project
---

BuildersVault Hackathon #2 — Healthcare AI, March 27-28, 2026 at University of Victoria.

**Why:** Winning projects get connected with organizations for potential paid engagements. Prototypes that become products.

**How to apply:**
- Challenge brief + datasets revealed Friday evening at kickoff — scaffold must be flexible
- Judging: Innovation, Technical Execution, Business Viability, Presentation Quality (2-3 min demos)
- Partners: Anthropic (will likely provide Claude API credits), UVic Hacks, Red Bull

**Finalized architecture:**
- **App name:** Rithm (configurable in config/app.ts)
- **Framework:** Next.js 15 (App Router) + React + TypeScript (strict)
- **UI:** Tailwind v4 + shadcn/ui + OpenUI (defineComponent/createLibrary for agent generative UI)
- **State:** Zustand
- **AI:** Vercel AI SDK + Claude Sonnet 4.6 (extended thinking, medium budget)
- **Charts:** Recharts
- **Database:** Supabase (PostgreSQL + pgvector + Realtime + Storage)
- **ORM:** Drizzle
- **RAG:** LlamaParse → semantic chunking → Gemini Embedding 2 → pgvector → hybrid retrieval
- **Deployment:** Vercel
- **No auth needed** — straight to dashboard for hackathon demo

**Key differentiator:** Generative UI via OpenUI — AI agent generates native React components (same as the rest of the app) rather than text/JSON. Agent panel is always available (collapsible glass side panel).

**8-phase build plan in setup-prompts/**, each phase is a detailed prompt for Claude Code.
