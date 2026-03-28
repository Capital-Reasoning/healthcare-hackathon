# Talking Points — BestPath

## The Problem

- **6.5 million Canadians** don't have a family doctor. In BC alone, over 900,000 people are unattached.
- The healthcare system is reactive: when preventive care is missed, conditions escalate and patients end up in the ER.
- Clinicians managing panels of 1,500+ patients have no scalable way to identify who is overdue for what.
- Patients without a doctor have no way to know what care they need or where to get it.
- **These are preventable emergencies.**

## Our Solution: BestPath

BestPath is a deterministic, evidence-cited clinical decision support platform that serves two audiences through one shared engine:

1. **Clinician Triage Dashboard** — analyze a patient panel against clinical guidelines to surface overdue, high-value actions in a three-column triage view (Urgent / Follow-up / On Track).
2. **Patient Care Navigator** — a conversational interface for people without a family doctor to understand what clinical care they may need and where to get it in BC.

## The Clinical Knowledge Base

We built a systematic pipeline to acquire and curate clinical guideline documents:

- **Pipeline:** Four Python scripts in `health-info-data/` handle corpus acquisition, content packaging, augmentation, and validation.
  - `acquire_vector_content.py` — fetches documents from curated source catalog
  - `build_next_best_pathway_corpus.py` — builds the structured corpus with metadata
  - `fetch_augmentation_pack.py` — acquires supplemental reference data (data access profiles, public health sources, device APIs, etc.)
  - `package_vector_content.py` — packages content for ingestion into the vector store
- **Result:** 4,026 documents selected, 1,534 rejected (duplicates, low relevance, broken links), 387 supplemental sources captured.
- **Sources include:** BC clinical practice guidelines, Canadian Task Force on Preventive Health Care (CTFPHC) recommendations, BC Cancer screening protocols, specialty society guidelines, Health Canada Drug Product Database, Diabetes Canada, Hypertension Canada, immunization schedules, patient education materials, and more.
- **Every recommendation traces to a specific guideline passage.** When the system says "A1C screening is overdue," it cites the exact Diabetes Canada guideline section that defines the screening interval.

## The Deterministic Comparator: Why Trust Matters

The scoring engine is deliberately not an LLM:

```
Clinical Guidelines  -->  Define what's needed (targets)
Patient Data         -->  Show what's been done (facts)
Simple Math          -->  Confirm what's overdue (comparison)
```

- **Guidelines** define screening targets: who needs what, at what interval, based on age/sex/conditions.
- **Patient data** (encounters, observations, medications, vitals) shows the last time each action was performed.
- **Deterministic comparison** calculates overdue status, scores by clinical severity and evidence grade, and categorizes into red/yellow/green.
- **AI is used only for:** natural language explanations ("why this action," "why now"), the navigator conversation, and evidence retrieval from the knowledge base. The AI never determines the triage category itself.
- **Result:** Clinicians trust the output because they can verify every step. The system is an augmented stethoscope, not a black box.

## Two Interfaces, One Engine

| | Clinician Dashboard | Patient Navigator |
|---|---|---|
| **Audience** | Family doctors, NPs, clinic staff | Unattached patients, self-navigators |
| **Input** | Patient panel data (EMR) | Self-reported demographics, conditions, medications |
| **Output** | Triage view with approve-and-send workflow | Cited recommendations with provider routing |
| **Trust model** | Clinician reviews, approves, sends | Patient receives decision support information (not medical advice) |
| **Access** | Authenticated clinician portal | Public-facing or health authority portal |

Both interfaces use the same underlying engine: same clinical knowledge base, same guideline targets, same evidence citations.

## Regulatory Framing

BestPath is designed to fall within Health Canada's SaMD (Software as a Medical Device) exclusion criteria:

- The system **provides information** to support clinician decision-making — it does not make autonomous clinical decisions.
- Clinicians must explicitly **approve and send** any recommendation before it reaches a patient.
- The navigator provides **decision support information** with a clear disclaimer: "This is not medical advice."
- The deterministic scoring model is **auditable and explainable** — no opaque ML model in the clinical loop.
- Evidence citations create a **verifiable chain** from recommendation to source guideline.

This positions BestPath as a clinical information tool rather than a medical device, reducing regulatory burden for initial deployment.

## Technical Architecture (One-liner)

Next.js 16 + TypeScript (strict) + Supabase PostgreSQL with pgvector + Drizzle ORM + Claude Opus 4.6 + Vercel AI SDK + LlamaParse/Gemini RAG pipeline — deployed on Vercel.

**Deeper if asked:**
- **Frontend:** Tailwind v4, shadcn/ui, Zustand state management, React Server Components for data-fetching pages
- **Engine:** Deterministic comparator in TypeScript — no LLM in the scoring loop
- **AI layer:** Claude for navigator conversation, explanation text generation, and evidence retrieval
- **Data:** Synthea synthetic patients (FHIR R4), imported via CSV. Production would integrate with EMR systems.
- **RAG:** LlamaParse document parsing, semantic chunking, Gemini 3072-dim embeddings, pgvector hybrid search (vector + BM25 keyword with Reciprocal Rank Fusion)
- **Corpus:** 4,026 curated clinical guideline documents from 46 source categories

## Impact Potential

- **For clinicians:** Analyze a 2,000-patient panel in minutes instead of manually reviewing each chart. Surface the highest-value clinical actions first.
- **For patients:** Democratize access to clinical decision support. A 55-year-old with hypertension shouldn't have to wait 3 years for a walk-in visit to learn they need an A1C check.
- **For the system:** Prevent ER visits by catching overdue screenings before conditions escalate. Route patients to the right provider (pharmacist, NP, walk-in) to reduce physician bottleneck.
- **Scalability:** The corpus pipeline and deterministic engine are condition-agnostic. Add new guidelines, add new targets. The architecture scales.

## Team

**Capital Reasoning** — building AI-powered tools that turn data into decisions.
