# BestPath — Proactive Care Intelligence Platform

> Identifies the next-step highest-value clinical action for patients based on all available information — the screening, medication start, referral, or follow-up most likely to prevent an emergency — and surfaces it with evidence so clinicians can act before conditions escalate.

**Live Demo:** [healthcare-hackathon-capital-reasoning-team.vercel.app](https://healthcare-hackathon-capital-reasoning-team.vercel.app)

**Pitch Deck:** Open [`docs/presentation/pitch.html`](docs/presentation/pitch.html) in a browser for the interactive slide deck, or view [`docs/presentation/BestPath-Pitch.pptx`](docs/presentation/BestPath-Pitch.pptx) as PowerPoint.

## Team

- **Nicholas Miller** 
- **Peter Salmon** 

Capital Reasoning Solutions

## Challenge Track

**Track 1: Clinical AI** — "Build an AI-powered tool that improves clinical workflows, patient care, or healthcare delivery using the provided Synthea patient dataset."

## Problem

6.5 million Canadians have no family doctor. Clinics are overwhelmed with reactive care. Patients end up in the ER because a blood pressure medication wasn't started, a referral wasn't made, a follow-up after an abnormal result never happened. These are preventable emergencies.

## Solution

BestPath is a dual-interface clinical intelligence engine:

1. **Clinician View** — A proactive triage dashboard. The system analyzes patients against clinical guidelines, determines the next best clinical action for each, and surfaces a prioritized queue: Red (overdue + high risk), Yellow (overdue + lower risk), Green (on track). Every recommendation is cited against specific clinical guidelines.

2. **Patient Navigator** — A care navigator for people without a family doctor. Enter your health information conversationally, get evidence-based guidance on what you need and who can help — pharmacist, dietitian, walk-in clinic, LifeLabs — not just "see a doctor."

Both interfaces run on the same core: patient data + clinical guidelines via RAG → deterministic comparison → prioritized, evidence-backed next best actions.

## How It Works

1. **Patient Context Builder** — Assembles demographics, conditions, medications, labs, and vitals from the database into two vectors: a Risk Confluence Vector (RCV) capturing escalation risk, and a Screening Recency Vector (SRV) tracking when each clinical action was last addressed.
2. **Evidence Connection (RAG)** — Searches 4,000+ clinical guideline documents to find applicable recommendations for the patient's specific risk profile.
3. **Deterministic Comparator** — Pure math: guidelines say what's needed, patient data shows what's been done, arithmetic determines what's overdue. No AI guessing on the critical path.
4. **Priority Scoring** — Ranks actions by risk level, overdue severity, and confidence. Patients are triaged into Red/Yellow/Green categories, each split by confidence level.
5. **Evidence Citations** — Every recommendation links to the specific guideline passage that supports it.

## Clinical Knowledge Base

We built a systematic pipeline to acquire and curate **4,026 clinical documents** from Canadian healthcare sources, organized into a searchable knowledge base that powers every recommendation.

### Data Acquisition

Three Python scripts (`health-info-data/scripts/`) handle automated acquisition:

1. **`acquire_vector_content.py`** — Broad web crawler that scrapes 14 source groups across Canadian healthcare organizations. Produces a 5,559-row acquisition manifest tracking every document with metadata, SHA1 hashes, and provenance.
2. **`build_next_best_pathway_corpus.py`** — Policy-driven curation engine that filters the broad manifest using 120+ clinical keywords, deduplicates by content hash, and organizes selected documents into 31 thematic buckets.
3. **`fetch_augmentation_pack.py`** — Targeted BFS crawler for 46 supplemental sources (BC Cancer, BCCDC immunization, Choosing Wisely, FNHA, etc.) with domain whitelists and depth/page limits.

### Sources

| Category | Documents | Content |
|----------|-----------|---------|
| Health Canada DPD | 3,015 | Drug monographs, product info, safety data |
| BC Guidelines | 449 | Provincial clinical practice guidelines |
| Specialty Guidelines | 355 | 15+ specialty societies (cardiology, psychiatry, geriatrics, etc.) |
| Provincial Quality | 124 | Quality pathways and performance standards |
| National Guidelines | 71 | Primary-care national guidance (CFPC, diabetes, stroke, cardiovascular) |
| Augmentation Pack | 206 | BC Cancer, BCCDC, BCCSU, FNHA, Choosing Wisely, HealthLinkBC |

Key source organizations include the Canadian Task Force on Preventive Health Care, Health Canada, BC Ministry of Health, CADTH, CIHI, RNAO, and specialty societies (AMMI, CCS, SOGC, CPS, and others).

### Ingestion Pipeline

- **Parsing:** Unstructured extracts structured text from PDFs and HTML
- **Chunking:** Semantic chunking preserves clinical context
- **Embedding:** Google Gemini generates 3072-dimensional vectors
- **Storage:** pgvector in Supabase enables hybrid search (semantic + keyword + Reciprocal Rank Fusion)

Every recommendation traces to a specific guideline passage. The full acquisition pipeline, selection policies, and manifests are in `health-info-data/`.

## Tech Stack

| Layer         | Technology                                                                           |
| ------------- | ------------------------------------------------------------------------------------ |
| Framework     | Next.js 16 (App Router) · TypeScript (strict)                                        |
| Styling       | Tailwind v4 · shadcn/ui                                                              |
| Database      | Supabase (Postgres + pgvector) · Drizzle ORM                                         |
| AI Engine     | Claude Sonnet 4.6 (assessment) · Claude Opus 4.6 (interactive agent) · Vercel AI SDK |
| RAG Pipeline  | Unstructured → Gemini Embeddings (3072-dim) → pgvector hybrid search                 |
| Generative UI | OpenUI (23 agent-renderable components)                                              |
| Charts        | Recharts                                                                             |
| State         | Zustand                                                                              |

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

# Seed demo data (40 patients with encounters, medications, observations)
npm run db:seed

# Start development server
npm run dev
# Open http://localhost:3000

# Run the assessment engine on patients (requires health data sources to be added to the repo — large files, not present in git)
npx tsx scripts/run-batch.ts --limit 50 --tier production
```

## Regulatory Note

BestPath is designed as a clinical decision support system under Health Canada's SaMD exclusion criteria — it augments clinical judgment, never replaces it. All recommendations require clinician review.
