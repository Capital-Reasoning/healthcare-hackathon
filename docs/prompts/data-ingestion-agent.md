You are working on the BestPath healthcare hackathon project at /Users/petersalmon/Projects/Capital Reasoning/healthcare-hackathon

Read PLAN.md and CLAUDE.md first for full context. PLAN.md is the canonical project spec — if anything conflicts, PLAN.md wins. This is a hackathon — code freeze is Saturday March 28 at 3:30 PM. Move fast, make pragmatic decisions.

You may use subagents, web searches, and any tools available to you. We ***must*** do this correctly — we only have one chance in this hackathon. Test everything first, in small chunks, verify, be completely sure, before completing any large uploads.

## Your Mission

Design and implement the complete data layer for BestPath. This means revamping the Supabase/Drizzle schema and ingestion pipeline to serve our core engine:

**RCV/SRV construction → evidence retrieval from clinical guidelines (vector DB) → LLM connects patient data to guideline evidence → deterministic comparator does the math on what's overdue → prioritized action queue**

Key principle: **there is no AI guessing.** The guidelines say what's needed, the patient data shows what's present, the system connects the two, and math determines urgency.

The engine also needs to support:
- Routing patients to the right level of care (pharmacist, dietitian, PT, walk-in, ER, specialist)
- Self-care recommendations where appropriate (e.g., reduce caffeine intake, take a walk every day)
- It is acceptable for some patients to have NO recommended action — healthy young people without conditions shouldn't get noise
- Weighting certain screenings as "available to lower priority/risk individuals" if there is extra availability

## Three Data Sources to Ingest

### 1. Hackathon Synthea Dataset (structured patient data)
Location: `/Users/petersalmon/Projects/Capital Reasoning/healthcare-hackathon/hackathon-data/track-1-clinical-ai/synthea-patients/`

Five CSVs:
- `patients.csv` (2,000 records): patient_id, first_name, last_name, date_of_birth, age, sex, postal_code, blood_type, insurance_number, primary_language, emergency_contact_phone
- `encounters.csv` (10,000 records): encounter_id, patient_id, encounter_date, encounter_type (outpatient/emergency/inpatient), facility, chief_complaint, diagnosis_code (ICD-10-CA), diagnosis_description, triage_level (CTAS 1-5), disposition, length_of_stay_hours, attending_physician
- `medications.csv` (5,000 records): medication_id, patient_id, drug_name, drug_code (DIN), dosage, frequency, route, prescriber, start_date, end_date, active (boolean)
- `lab_results.csv` (3,000 records): lab_id, patient_id, encounter_id, test_name, test_code (LOINC), value, unit, reference_range_low, reference_range_high, abnormal_flag (N/H/L), collected_date
- `vitals.csv` (2,000 records): vitals_id, patient_id, encounter_id, heart_rate, systolic_bp, diastolic_bp, temperature_celsius, respiratory_rate, o2_saturation, pain_scale, recorded_at

### 2. Canadian Drug Reference (structured lookup)
Location: `/Users/petersalmon/Projects/Capital Reasoning/healthcare-hackathon/hackathon-data/shared/drug-database/canadian_drug_reference.csv`
100 common Canadian drugs with DIN, drug class, indication, standard dosage.

### 3. Clinical Knowledge Corpus (unstructured — for RAG/vector DB)
Location: `/Users/petersalmon/Downloads/health-info-date/next-best-pathway-corpus/`

This is a 1.3GB corpus of ~4,200 files (3,129 HTML, 1,001 PDF, 8 DOCX, etc.) organized into 28 clinical buckets:
- bc_guidelines_core, primary_care_national_curated, specialty_guidelines_curated
- preventive_task_force, bc_cancer_screening, immunization_prevention
- diabetes_national_guidance, hypertension_guidance, cardiovascular_guidance
- respiratory_guidance, renal_ckd_primary_care, diagnostic_referral_guidance
- emergency_risk_support, drug_safety_support, interoperability_standards
- And 13 more (oncology, substance use, patient education, equity, etc.)

There is already an upload grouping system at:
`/Users/petersalmon/Downloads/health-info-date/next-best-pathway-corpus/02_upload_tagging/upload_group_manifest.json`

It defines three groups:
- `core_clinical_and_screening` (default retrieval: true) — 12 buckets
- `emergency_risk_evidence` (default retrieval: true) — 1 bucket
- `route_only_medication_and_standards` (default retrieval: false, routing only) — 2 buckets

The full file manifest with source URLs, file types, and SHA1 hashes is at:
`/Users/petersalmon/Downloads/health-info-date/next-best-pathway-corpus/00_manifest/selected_manifest.csv`

Also see the corpus audit at `docs/spec/corpus_capability_risk_screening_audit.md` for coverage assessment.

## What to Do

### Schema Design

**Rewrite the entire Drizzle schema** (`src/lib/db/schema.ts`). The current schema was built for a generic dashboard demo — it needs to be redesigned from scratch for the BestPath engine. When in doubt, include more fields & more information, as we can always skip using it — but if we miss things upon ingestion, there is no way of getting it all back.

Look at the current schema first to understand what's there and what must be preserved (conversations/messages tables for the chat). Then redesign for:

- **RCV construction**: Pull all risk-relevant data for a patient in minimal queries (demographics, conditions from encounters, latest labs/vitals, active medications, utilization patterns, abnormal findings)
- **SRV construction**: Find last-completed date for each condition/action type per patient (derived from encounters, labs, medication history)
- **Engine outputs**: `pathway_target_run_facts` — append-only, one row per target per run. This stores what the engine determined for each patient.
- **Knowledge corpus chunks**: Embeddings for RAG retrieval with rich metadata (source_bucket, clinical_domains, heading, text_as_html, etc.)
- **Dashboard categorization**: The dashboard has three columns — Red (overdue + high risk), Yellow (overdue + lower risk), Green (not due for 6+ months). Each column is split by high/low confidence based on data completeness and vector DB match quality. The schema should support this efficiently.
- **Canadian drug reference**: Lookup table with DIN, drug class, indication, standard dosage
- **Validation dataset**: Consider where the 100 synthetic test cases fit (their own table, or importable into the patient tables)

Think about what views or indexes will make the action queue fast.

**Existing files to review:**
- Current schema: `src/lib/db/schema.ts`
- Current seed script (for patterns): `src/lib/db/seed.ts`
- Current query functions: `src/lib/db/queries/*.ts` (patients, encounters, observations, medications, documents)
- Spec docs for schema requirements: `docs/spec/core_two_vector_operating_model.md`, `docs/spec/minimal_end_to_end_system_blueprint.md`

### Synthea Import Script
Write a TypeScript import script (similar to existing `src/lib/db/seed.ts`) that:
- Reads all 5 Synthea CSVs
- Maps them into the new schema
- Handles the data correctly (dates, enums, foreign keys, numeric types)
- Is idempotent (can re-run safely)

### Drug Reference Import
Import the `canadian_drug_reference.csv` into a lookup table.

### Knowledge Corpus Ingestion — This Is Critical

The vector DB is the backbone of BestPath. When the system connects a patient's risk profile to clinical guidelines, the quality of that connection depends entirely on how well we chunk, embed, and index the corpus. Get this wrong and the whole engine produces garbage. Get it right and the system gives cited, trustworthy recommendations.

Everything must be **based upon and cited from the docs in the vector database, with no exception.** This is a hard requirement.

#### Retrieval Architecture: Hybrid Search (Sparse + Dense)

We need **hybrid retrieval** — not just dense vector similarity. Clinical guideline content has specific terminology (ICD codes, drug names, screening interval language like "every 3 years") that dense embeddings can miss but keyword/sparse matching catches perfectly.

Design for:
- **Dense vectors** (semantic similarity): Gemini embeddings at 3072 dimensions. Good for matching patient risk profiles to guideline passages even when exact terminology differs.
- **Sparse vectors / keyword index**: BM25 or equivalent full-text search. Critical for matching specific clinical terms — "colonoscopy surveillance," "FIB-4 cutoff," "CHA2DS2-VASc," "stage 1 hypertension 130-139/80-89." These exact terms appear in both the patient data and the guidelines.
- **Reciprocal Rank Fusion (RRF)** to combine dense + sparse results.

Supabase Postgres supports both pgvector (dense) and full-text search with `tsvector`/`tsquery` (sparse) natively. Use both.

**Existing retrieval code to review and adapt:**
- `src/lib/rag/retrieve.ts` — Already implements hybrid search with RRF. Has `vectorSearch`, `keywordSearch`, and `hybridSearch` functions with configurable weights. Review this and adapt for the new schema.
- `src/lib/db/queries/documents.ts` — Current document query functions (searchDocumentChunks, keywordSearchChunks). Will need updating for the new schema.

#### Chunking Strategy for Clinical Content

Clinical guidelines are NOT like blog posts. They have:
- Structured hierarchies (condition → screening → criteria → interval → exceptions)
- Tables with threshold values (BP >130/80, HbA1c >7%, FIB-4 cutoff by age)
- Numbered recommendation lists with evidence grades
- Cross-references between sections

Chunking must preserve this structure. Consider:
- **Header-aware splitting**: Split on H1/H2/H3 boundaries. Each chunk should be a coherent clinical unit (e.g., one screening recommendation with its criteria).
- **Table preservation**: Tables containing threshold values or screening intervals must NOT be split across chunks. These are the most important content for our engine.
- **Chunk size**: Target 1000-2000 characters. Large enough to capture a complete recommendation + rationale, small enough for focused retrieval.
- **Overlap**: 200-300 character overlap between chunks to avoid losing context at boundaries.
- **Metadata per chunk**: This is critical for retrieval routing and citation quality.

**Existing chunking code to review:** `src/lib/rag/chunk.ts` — Already implements header-based splitting with table preservation, configurable chunk size (default 1500), overlap (default 200), and recursive splitting. This was built for markdown (LlamaParse output). You may need to adapt it for HTML-extracted content or write a parallel HTML chunker.

#### Metadata Design (Per Chunk)

Every chunk must carry rich metadata for:
1. **Retrieval routing** — filter by clinical domain before searching, so a cardiac patient doesn't get irrelevant dermatology guidelines
2. **Citation quality** — the clinician/patient must be able to trace every recommendation to its source
3. **Confidence scoring** — the dashboard's high/low confidence split depends partly on how well the vector DB matched

Required metadata fields per chunk:
- `source_bucket` — which of the 28 clinical buckets (e.g., "diabetes_national_guidance", "bc_cancer_screening")
- `upload_group` — which upload group (core_clinical_and_screening / emergency_risk_evidence / route_only)
- `source_url` — original source URL from the manifest CSV at `00_manifest/selected_manifest.csv`
- `document_title` — human-readable document name
- `heading` — section heading this chunk falls under
- `page_number` — for PDFs
- `chunk_index` — position within the document
- `content_type` — "guideline" | "pathway" | "policy" | "reference" | "patient_education"
- `clinical_domains` — array of relevant clinical domains (e.g., ["cardiometabolic", "hypertension"])
- `jurisdiction` — "BC" | "Canada" | "International"

#### Embedding Model — Gemini (Already Set Up)

The existing pipeline uses Gemini embeddings (`gemini-embedding-001`, 3072 dimensions) with asymmetric retrieval:
- `RETRIEVAL_DOCUMENT` task type for corpus chunks
- `RETRIEVAL_QUERY` task type for search queries

This is confirmed as the right approach. Asymmetric embedding matters because patient risk summaries (queries) look very different from guideline text (documents).

**Existing embedding code — use as-is:** `src/lib/rag/embed.ts` — Has `embedQuery()`, `embedDocument()`, and `embedDocuments()` (batch) functions. Uses the Vercel AI SDK's `embed`/`embedMany` with Google provider. Use this for the embedding step after parsing produces the chunks.

Note: Unstructured has its own embedding integrations, but we skip those and use our Gemini pipeline instead. Unstructured handles parse + chunk only; we handle embed + store.

#### Parsing + Chunking: Hybrid Strategy (Budget-Conscious)

**We have 15,000 free pages on Unstructured. We must stay under that.** The corpus has ~4,200 files. Sending everything through Unstructured would burn the budget. Instead, use a two-track approach:

##### Track A: HTML Files (3,129 files) → Parse Locally with Cheerio (FREE, no API calls)

HTML files already have structure in the markup — `<h1>`, `<h2>`, `<table>`, `<p>`, `<li>`, `<strong>`. We don't need to pay an API to detect layout on content that's already structured.

Build a local HTML parser that:
1. Loads the HTML with `cheerio` (already a common dependency, or install it)
2. **Strips boilerplate**: Remove `<nav>`, `<header>`, `<footer>`, `.sidebar`, breadcrumbs, cookie notices. The BC Guidelines HTML files have predictable nav/sidebar boilerplate — the first chunk from Unstructured testing was always navigation junk. Strip this.
3. **Extracts content by heading hierarchy**: Walk the DOM, split on `<h1>`/`<h2>`/`<h3>` boundaries. Each section becomes a chunk candidate.
4. **Preserves tables**: When a `<table>` is encountered, keep it as a separate chunk. Store both:
   - `text` — plain text extraction of the table (for embedding and keyword search)
   - `text_as_html` — the raw `<table>` HTML (for rendering source chunks to the user with formatting)
5. **Preserves emphasis**: Track `<strong>`/`<b>`/`<em>` content — clinically important for warnings and key recommendations. Store as metadata.
6. **Chunk sizing**: Target 1000-1500 chars per chunk. If a section is too large, split at paragraph boundaries. If too small, combine with the next section (unless it's a heading change).
7. **Output**: Same shape as what Unstructured would give — `text`, `type`, `heading`, `page_number` (N/A for HTML), `text_as_html` (for tables), plus our metadata.

This is straightforward because HTML is already structured. The heading tags ARE the section boundaries. The table tags ARE the table boundaries. No layout detection needed.

##### Track B: PDF Files (~1,001 files) + DOCX (8 files) → Unstructured API

PDFs need real parsing — layout detection, table extraction, OCR for scanned docs. This is where Unstructured earns its cost.

Estimate: ~1,001 PDFs averaging 3-5 pages = ~3,000-5,000 pages. Plus 8 DOCX at maybe 50 pages total. **Well under 15,000 page budget** with room to spare.

Unstructured API is already set up and tested. A test on a BC Guidelines HTML returned 13 clean chunks in ~3 seconds. The SDK is installed (`unstructured-client`). There's a test script at `scripts/test-unstructured.ts` you can reference.

Config for Unstructured API calls:
- **API URL**: `https://api.unstructuredapp.io/general/v0/general` (already in .env as `UNSTRUCTURED_API_URL`)
- **API Key**: Already in `.env` as `UNSTRUCTURED_API_KEY`
- **Partitioning strategy**: `hi_res` for PDFs (model-based layout detection — critical for clinical guideline tables with threshold values and screening intervals)
- **Chunking strategy**: `by_title` — preserves section boundaries, ideal for clinical guidelines
- **`max_characters`**: 1500 (hard limit per chunk)
- **`new_after_n_chars`**: 1000 (soft target — start looking for a break point)
- **`combine_text_under_n_chars`**: 400 (merge small sections)
- **Tables**: Unstructured isolates tables as separate elements, never combining them with text. Tables get both plain text and `text_as_html`. Critical for screening interval tables.

Unstructured output per chunk includes:
- `type` (CompositeElement, Table, etc.)
- `text` (plain text content)
- `metadata.text_as_html` (for tables — HTML representation for display)
- `metadata.page_number`
- `metadata.emphasized_text_contents` + `emphasized_text_tags` (bold/italic)
- `metadata.parent_id` + `category_depth` (document hierarchy)
- `metadata.orig_elements` (base64 — **strip this before storing**, it's large and we don't need it)

##### Both Tracks → Same Output Shape

Regardless of whether a file went through cheerio (Track A) or Unstructured (Track B), the output chunk shape stored in the DB must be identical. Both tracks produce:
- `text` — plain text content for embedding and search
- `text_as_html` — HTML representation for display (tables especially, but also formatted content)
- `heading` — section heading this chunk falls under
- `page_number` — for PDFs (null for HTML)
- `chunk_index` — position within the document
- Plus all the metadata fields listed in the Metadata Design section above

This means downstream code (embedding, storage, retrieval, display) doesn't care which track produced the chunk.

##### Page Budget Tracking

Log page consumption during ingestion. Before each Unstructured API call, increment a counter. Stop and alert if approaching 14,000 pages (leave 1,000 page buffer for re-processing or additional docs later).

#### Prioritization

Use the `upload_group_manifest.json` to prioritize ingestion:

1. **First**: `core_clinical_and_screening` (12 buckets) — this is 90% of what the engine needs. Includes: bc_guidelines_core, primary_care_national_curated, specialty_guidelines_curated, preventive_task_force, bc_cancer_screening, immunization_prevention, diabetes_national_guidance, hypertension_guidance, cardiovascular_guidance, respiratory_guidance, renal_ckd_primary_care, diagnostic_referral_guidance.
2. **Second**: `emergency_risk_evidence` (1 bucket) — condition-to-ER-escalation risk evidence.
3. **Last/optional**: `route_only_medication_and_standards` (2 buckets) — drug safety and interoperability standards. Only query-routed, not default retrieval. Skip these initially if time is tight.

Within the core group, further prioritize: the buckets that directly map to conditions in our Synthea dataset (diabetes, hypertension, cardiovascular, respiratory, renal) should go first.

#### Testing Before Bulk Upload

**Test BOTH tracks separately before running bulk ingestion:**

Track A (HTML/cheerio) test:
1. Pick 2-3 HTML files from different buckets (one BC guideline with tables, one simpler text-heavy guideline)
2. Run through cheerio parser → chunker → embed → store
3. Verify: boilerplate stripped, headings preserved, tables intact with `text_as_html`, chunk sizes in range
4. Test retrieval: query with a clinical term that should match and verify results

Track B (PDF/Unstructured) test:
1. Pick 2 PDFs — one with tables/thresholds, one text-heavy
2. Run through Unstructured API → embed → store
3. Verify: tables have `text_as_html`, section boundaries respected, `orig_elements` stripped, metadata populated
4. Test retrieval: same queries as Track A, verify comparable quality

Cross-track test:
1. Query the vector DB with a sample patient risk profile
2. Verify results come back from both HTML-sourced and PDF-sourced chunks
3. Verify citations are traceable (source_bucket, document_title, heading, source_url all present)
4. Verify chunks render well when displayed to the user (formatting preserved)

**Only after all tests pass, run the full batch — HTML first (free), then PDFs (costs pages).**

Start with a plan, then implement the schema + Synthea import first (those are blocking). The corpus ingestion can be a script that runs in the background.

### Validation Dataset
There are 100 synthetic patient cases with answer keys at:
- `docs/spec/synthetic_dataset_bundle/patient_cases.jsonl` (100 rich patient packages with demographics, problem lists, medications, labs, vitals, timeline fragments, chart snippets, distractors)
- `docs/spec/synthetic_dataset_bundle/answer_key.jsonl` (ground truth per case: DUE/NOT_DUE label, rationale, decisive factors, threshold logic, primary/secondary sources)
- `docs/spec/synthetic_dataset_bundle/condition_manifest.csv` (100 cases across 15+ clinical domains, varying difficulty: moderate/difficult/expert, package sizes: sparse/medium/dense)

These should be importable too — they're our gold standard for testing the engine. Consider where they fit in the schema or if they need their own table.

## Constraints
- Use Drizzle ORM (already configured with Supabase)
- Use existing Supabase Postgres + pgvector setup
- **Preserve the existing conversation/messages tables** (the chat still needs to work)
- Run `npm run db:push` to apply schema changes (not migrations for hackathon speed). **NO BACKWARDS COMPATIBILITY NEEDED AT ALL.**
- TypeScript strict mode
- Don't break the existing build
- The env config is at `src/config/env.ts` — Zod-validated. Update if you add new env vars.

## Key File References

| File | Purpose |
|------|---------|
| `PLAN.md` | **Canonical project spec** — read first |
| `CLAUDE.md` | Codebase instructions, stack, patterns |
| `src/lib/db/schema.ts` | Current Drizzle schema (rewrite this) |
| `src/lib/db/seed.ts` | Current seed script (reference for patterns) |
| `src/lib/db/queries/*.ts` | Current query functions (will need updating) |
| `src/lib/rag/embed.ts` | Gemini embedding functions (use as-is) |
| `src/lib/rag/chunk.ts` | Markdown chunker (review, adapt for HTML) |
| `src/lib/rag/retrieve.ts` | Hybrid search with RRF (review, adapt) |
| `src/config/env.ts` | Zod-validated env vars |
| `scripts/test-unstructured.ts` | Unstructured API test script (reference) |
| `docs/spec/core_two_vector_operating_model.md` | RCV/SRV construction standard |
| `docs/spec/minimal_end_to_end_system_blueprint.md` | System modules, data contracts |
| `docs/spec/corpus_capability_risk_screening_audit.md` | Knowledge coverage assessment |
| `docs/spec/synthetic_dataset_bundle/` | 100 test cases + answer keys |
| `hackathon-data/track-1-clinical-ai/synthea-patients/` | The 5 Synthea CSVs |
| `hackathon-data/shared/drug-database/canadian_drug_reference.csv` | Drug lookup data |

Document the updated schema and any ingestion decisions somewhere notable. Fix outdated docs if present.

NOTE: ASK ME LOTS OF QUESTIONS. We want to record the most information possible, and only do this upload once, so that our lives become easier down the line. We don't have to have to re-upload everything — so do some tests on single docs, ensure chunking & whatever works well, before going too far.

Also, for the health-info-data — think about what parts of that data we do need, vs what is just noise — and let's skip anything that won't enhance the app at this stage.
