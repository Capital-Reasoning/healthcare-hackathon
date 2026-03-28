# Talking Points — Rithm

## The Problem

- Healthcare organizations have **two separate problems**: data dashboards and AI assistants
- Existing solutions are either a BI tool (Tableau, PowerBI) **or** a chatbot — never both in one product
- Chatbots return walls of text; dashboards are static and inflexible
- Clinicians want answers, not charts they have to interpret themselves

## Our Solution: Generative UI

- **Rithm** fuses a production-grade data platform with an AI co-pilot that generates native UI
- The AI doesn't just return text — it builds the same charts, tables, and cards that power the rest of the app
- "Component duality" — every visualization works in static pages AND in agent-generated responses
- The user gets a polished data platform **and** an intelligent assistant in one product

## Key Differentiator: OpenUI

- **OpenUI Lang**: a domain-specific language for describing UI that's 47-67% more token-efficient than JSON
- **Streaming render**: components appear progressively as tokens arrive — no waiting for full responses
- **23+ renderable components**: charts (bar, line, donut, area, radar, gauge), tables, patient cards, medication cards, vital signs, timelines, risk badges, comparison tables
- **Not a chatbot**: the AI generates real, interactive UI — not screenshots, not markdown, not templates

## Technical Architecture (One-liner)

Next.js 16 + React 19 + Claude Sonnet 4.6 + OpenUI generative components + Supabase PostgreSQL with pgvector + LlamaParse/Gemini RAG pipeline — deployed on Vercel.

**Deeper if asked:**
- **Frontend**: TypeScript (strict), Tailwind v4, shadcn/ui, Zustand state management, container queries for responsive layouts
- **AI**: Vercel AI SDK streaming, 7 custom agent tools, system prompt with page-aware context
- **Data**: Drizzle ORM, paginated REST API with consistent response shape, 11 database tables
- **RAG**: LlamaParse document parsing → semantic chunking → Gemini 3072-dim embeddings → pgvector hybrid search (vector + keyword with Reciprocal Rank Fusion)

## Business Viability

- **Every healthcare org needs this**: they all have a "data dashboard" problem and an "AI assistant" problem
- **Reusable scaffold**: the component library, API patterns, and agent tools work with any healthcare dataset
- **Low switching cost**: plug in any data source — CSV, FHIR, HL7, database dumps — and the platform adapts
- **Compliance-ready architecture**: all data stays in your Supabase instance, no data leaves to third parties except the LLM API
- **Cost-effective**: OpenUI's token efficiency means lower API costs than JSON-based alternatives

## Future Potential

- **Any dataset, any domain**: the generative UI pattern isn't healthcare-specific — it works for finance, logistics, research, any data-heavy domain
- **MCP integration**: plug in healthcare-specific MCP servers (FDA, PubMed, ICD-10, FHIR) for live external data
- **Write-back with approval**: agent suggests database updates, user approves via modal — closes the loop from insight to action
- **Multi-modal**: agent can analyze uploaded images, charts, and documents
- **Real-time**: Supabase Realtime subscriptions for live-updating dashboards

## Team

**Capital Reasoning** — building AI-powered tools that turn data into decisions.
