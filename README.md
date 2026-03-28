# BestPath — Proactive Care Intelligence Platform

> Identifies the next-step highest-value clinical action for patients based on all available information — the screening, medication start, referral, or follow-up most likely to prevent an emergency — and surfaces it with evidence so clinicians can act before conditions escalate.

## Team
- **Peter Salmon** — Capital Reasoning Solutions, Victoria, BC

## Challenge Track
**Track 1: Clinical AI** — "Build an AI-powered tool that improves clinical workflows, patient care, or healthcare delivery using the provided Synthea patient dataset."

## Problem
6.5 million Canadians have no family doctor. Clinics are overwhelmed with reactive care. Patients end up in the ER because a blood pressure medication wasn't started, a referral wasn't made, a follow-up after an abnormal result never happened. These are preventable emergencies.

## Solution
BestPath is a dual-interface clinical intelligence engine:

1. **Clinician View** — A proactive triage dashboard. The system analyzes patients against clinical guidelines, determines the next best clinical action for each, and surfaces a prioritized queue: Red (overdue + high risk), Yellow (overdue + lower risk), Green (on track). Every recommendation is cited against specific clinical guidelines.

2. **Patient View** — A care navigator for people without a family doctor. Enter your health information conversationally, get evidence-based guidance on what you need and who can help — pharmacist, dietitian, walk-in clinic, LifeLabs — not just "see a doctor."

Both interfaces run on the same core: patient data + clinical guidelines via RAG → deterministic comparison → prioritized, evidence-backed next best actions.

## How It Works

1. **Patient Context Builder** — Assembles demographics, conditions, medications, labs, and vitals from the database
2. **Evidence Connection (RAG)** — Searches 4,000+ clinical guideline documents to find applicable recommendations
3. **Deterministic Comparator** — Pure math: guidelines say what's needed, patient data shows what's been done, arithmetic determines what's overdue
4. **Priority Scoring** — Ranks actions by risk level, overdue severity, and confidence
5. **Evidence Citations** — Every recommendation links to the specific guideline passage that supports it

## Tech Stack
Next.js 16 · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres + pgvector) · Drizzle ORM · Claude Sonnet (assessment engine) + Opus (interactive agent) · Vercel AI SDK · OpenUI (generative UI) · Gemini Embeddings · Hybrid RAG (vector + keyword + RRF)

## Clinical Knowledge Base
We built a systematic pipeline to acquire and curate 4,000+ clinical guideline documents from BC and national sources. The corpus includes screening guidelines, management protocols, drug safety information, and provincial quality standards. Every recommendation traces to a specific passage. See `health-info-data/` for the acquisition pipeline.

## Slides
See `docs/presentation/pitch.html` (open in browser for the pitch deck).

## How to Run Locally

```bash
# Prerequisites: Node.js 20+, npm

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in: ANTHROPIC_API_KEY, DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
# SUPABASE_SECRET_KEY, GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, LLAMAPARSE_API_KEY

# Push database schema
npm run db:push

# Start development server
npm run dev
# Open http://localhost:3000

# Run the assessment engine on patients
npx tsx scripts/run-batch.ts --limit 50 --tier production
```

## Regulatory Note
BestPath is designed as a clinical decision support system under Health Canada's SaMD exclusion criteria — it augments clinical judgment, never replaces it. All recommendations require clinician review.
