# BestPath Data Layer Plan

Generated: 2026-03-27
Status: **DRAFT — awaiting review before implementation**

---

## Executive Summary

This document covers the complete data layer rewrite for BestPath: schema redesign, Synthea import, drug reference import, and clinical knowledge corpus ingestion. The goal is a database that supports RCV/SRV construction, evidence retrieval, deterministic comparison, and the three-column dashboard — all from real data.

---

## 1. Schema Design

### Overview

Complete rewrite of `src/lib/db/schema.ts`. The current schema was designed for a generic demo; the new schema serves the BestPath engine specifically. **Conversations and messages tables are preserved as-is** for the existing chat.

### Table Inventory

| Table                      | Purpose                                              | Records (est.)      |
| -------------------------- | ---------------------------------------------------- | ------------------- |
| `patients`                 | Synthea patient demographics                         | 2,000               |
| `encounters`               | Visits with ICD-10-CA diagnoses, CTAS triage         | 10,000              |
| `lab_results`              | LOINC-coded lab values with reference ranges         | 3,000               |
| `vitals`                   | Vital signs per encounter                            | 2,000               |
| `medications`              | Active/historical meds with DIN codes                | 5,000               |
| `canadian_drug_reference`  | Drug lookup (DIN → class, indication)                | 100                 |
| `corpus_documents`         | Parent documents with rich metadata                  | ~1,100              |
| `corpus_chunks`            | Embedded chunks + tsvector for hybrid search         | ~30,000-60,000 est. |
| `pathway_target_run_facts` | Append-only engine output (1 row per target per run) | Grows over time     |
| `engine_runs`              | Run metadata (run_id, patient_id, timestamps)        | Grows over time     |
| `validation_cases`         | 100 synthetic test cases (JSONB)                     | 100                 |
| `validation_answer_keys`   | Ground truth answer keys (JSONB)                     | 100                 |
| `conversations`            | **PRESERVED** — existing chat conversations          | existing            |
| `messages`                 | **PRESERVED** — existing chat messages               | existing            |

### Key Design Decisions

#### 1. Separate `lab_results` and `vitals` tables (not merged `observations`)

The current schema has a single `observations` table for both. The Synthea data ships as two distinct CSVs with very different structures:
- **lab_results**: test_name, test_code (LOINC), value, unit, reference_range_low/high, abnormal_flag
- **vitals**: heart_rate, systolic_bp, diastolic_bp, temperature, respiratory_rate, o2_sat, pain_scale

Keeping them separate makes RCV construction cleaner — vitals are always per-encounter columnar data, labs are individual tests with reference ranges. No need to decode "what type of observation is this?" at query time.

#### 2. `corpus_documents` + `corpus_chunks` replace `documents` + `document_chunks`

The existing RAG tables are too sparse for our needs. New tables add:
- **corpus_documents**: `source_bucket`, `upload_group`, `source_url`, `content_type`, `clinical_domains` (text[]), `jurisdiction`, `file_type`
- **corpus_chunks**: `text_as_html`, `content_tsvector` (generated tsvector column for FTS), `source_bucket` (denormalized for fast filtering), plus all existing fields

The `content_tsvector` is a generated column — Postgres auto-maintains it. Combined with a GIN index, this gives us native BM25-equivalent full-text search without any external service.

#### 3. `pathway_target_run_facts` is append-only

Every engine run writes one row per target. Never updated, never deleted. Views materialize:
- `latest_target_state` — newest row per (patient, condition, screening_type)
- `patient_highest_value_action` — top-scored action per patient
- Clinic-wide queue sorted by action_value_score

#### 4. Validation dataset gets its own tables

The 100 synthetic cases have rich, nested JSON structures (demographics, problem lists, labs, vitals, timeline fragments, distractors). They're too different from Synthea patients to merge. Storing as JSONB preserves fidelity — the engine can read them when testing.

#### 5. Removed tables

- `providers` — Synthea has attending_physician as a text string, not a normalized entity. Storing as text on encounters is simpler and loses nothing.
- `organizations` — Same reasoning. Facility name stored as text on encounters.

### Schema Detail

```
patients
├── id (uuid PK)
├── patient_id (text, UNIQUE) — "PAT-000001" from Synthea
├── first_name, last_name (text NOT NULL)
├── date_of_birth (date)
├── age (integer) — from CSV, also computable
├── sex (text) — "M"/"F" from Synthea
├── postal_code (text)
├── blood_type (text)
├── insurance_number (text)
├── primary_language (text)
├── emergency_contact_phone (text)
├── created_at, updated_at (timestamptz)
└── INDEXES: patient_id (unique), last_name+first_name, postal_code

encounters
├── id (uuid PK)
├── encounter_id (text, UNIQUE) — "ENC-0000001" from Synthea
├── patient_id (text) → patients.patient_id
├── encounter_date (date)
├── encounter_type (text) — outpatient/emergency/inpatient
├── facility (text)
├── chief_complaint (text)
├── diagnosis_code (text) — ICD-10-CA
├── diagnosis_description (text)
├── triage_level (integer) — CTAS 1-5
├── disposition (text)
├── length_of_stay_hours (numeric)
├── attending_physician (text)
├── created_at (timestamptz)
└── INDEXES: encounter_id (unique), patient_id+encounter_date, diagnosis_code, encounter_type

lab_results
├── id (uuid PK)
├── lab_id (text, UNIQUE) — "LAB-000001"
├── patient_id (text) → patients.patient_id
├── encounter_id (text) → encounters.encounter_id
├── test_name (text)
├── test_code (text) — LOINC
├── value (numeric)
├── unit (text)
├── reference_range_low (numeric)
├── reference_range_high (numeric)
├── abnormal_flag (text) — N/H/L
├── collected_date (date)
├── created_at (timestamptz)
└── INDEXES: patient_id+collected_date, patient_id+test_code, encounter_id, abnormal_flag

vitals
├── id (uuid PK)
├── vitals_id (text, UNIQUE) — "VIT-000001"
├── patient_id (text) → patients.patient_id
├── encounter_id (text) → encounters.encounter_id
├── heart_rate (integer)
├── systolic_bp (integer)
├── diastolic_bp (integer)
├── temperature_celsius (numeric)
├── respiratory_rate (integer)
├── o2_saturation (numeric)
├── pain_scale (integer)
├── recorded_at (timestamptz)
├── created_at (timestamptz)
└── INDEXES: patient_id+recorded_at, encounter_id

medications
├── id (uuid PK)
├── medication_id (text, UNIQUE) — "MED-000001"
├── patient_id (text) → patients.patient_id
├── drug_name (text)
├── drug_code (text) — DIN
├── dosage (text)
├── frequency (text)
├── route (text)
├── prescriber (text)
├── start_date (date)
├── end_date (date, nullable)
├── active (boolean)
├── created_at (timestamptz)
└── INDEXES: patient_id+active, drug_code

canadian_drug_reference
├── id (uuid PK)
├── din (text, UNIQUE)
├── drug_name (text)
├── generic_name (text)
├── drug_class (text)
├── common_indication (text)
├── typical_dosage (text)
├── route (text)
├── schedule (text)
└── INDEX: din (unique), drug_class, generic_name

corpus_documents
├── id (uuid PK)
├── source_bucket (text) — e.g. "diabetes_national_guidance"
├── upload_group (text) — "core_clinical_and_screening" / "emergency_risk_evidence" / "route_only"
├── source_url (text, nullable) — from manifest
├── document_title (text)
├── filename (text)
├── file_type (text) — "html" / "pdf" / "docx"
├── content_type (text) — "guideline" / "pathway" / "policy" / "reference" / "patient_education"
├── clinical_domains (text[]) — e.g. {"cardiometabolic","hypertension"}
├── jurisdiction (text) — "BC" / "Canada" / "International"
├── page_count (integer, nullable)
├── file_size_bytes (integer, nullable)
├── sha1 (text, nullable) — from manifest for dedup
├── ingested_at (timestamptz)
├── chunk_count (integer DEFAULT 0)
└── INDEXES: source_bucket, upload_group, clinical_domains (GIN)

corpus_chunks
├── id (uuid PK)
├── document_id (uuid) → corpus_documents.id ON DELETE CASCADE
├── content (text NOT NULL) — plain text for embedding + search
├── text_as_html (text, nullable) — HTML for display (tables, formatted content)
├── heading (text, nullable)
├── page_number (integer, nullable)
├── chunk_index (integer)
├── chunk_type (text) — "text" / "table" / "list"
├── source_bucket (text) — denormalized from parent for fast filter queries
├── embedding (vector(3072))
├── content_tsvector — GENERATED tsvector for FTS
├── metadata (jsonb) — overflow for emphasized_text, parent_id, etc.
├── created_at (timestamptz)
└── INDEXES:
    HNSW on embedding (cosine),
    GIN on content_tsvector,
    document_id,
    source_bucket

pathway_target_run_facts
├── id (uuid PK)
├── run_id (text NOT NULL)
├── generated_at (timestamptz NOT NULL)
├── patient_id (text NOT NULL) → patients.patient_id
├── target_id (text NOT NULL)
├── condition (text)
├── screening_type (text)
├── action (text) — what to do
├── risk_tier (text) — high/medium/low
├── status (text) — overdue_now/due_soon/up_to_date/unknown_due
├── overdue_days (integer)
├── due_date (date, nullable)
├── interval_days (integer)
├── last_completed_date (date, nullable)
├── priority_rank (integer)
├── confidence (text) — high/medium/low
├── confidence_reason (text, nullable)
├── action_value_score (integer) — pre-computed for queue sorting
├── why_this_action (text)
├── why_now (text)
├── evidence_refs (jsonb) — [{doc_id, excerpt, chunk_id}]
├── missing_data_tasks (jsonb) — ["string"]
├── provider_route (text, nullable) — pharmacist/dietitian/PT/walk-in/ER/specialist
├── category (text) — red/yellow/green (for dashboard)
├── created_at (timestamptz)
└── INDEXES:
    patient_id+condition+screening_type+generated_at DESC,
    run_id,
    category+action_value_score DESC,
    status

engine_runs
├── id (uuid PK)
├── run_id (text, UNIQUE)
├── patient_id (text) → patients.patient_id
├── started_at (timestamptz)
├── completed_at (timestamptz, nullable)
├── corpus_version (text, nullable)
├── target_count (integer DEFAULT 0)
├── status (text) — running/completed/failed
├── error (text, nullable)
└── INDEX: patient_id, run_id

validation_cases
├── id (uuid PK)
├── case_id (text, UNIQUE) — "PC-0001"
├── clinical_domain (text)
├── package_size (text) — sparse/medium/dense
├── difficulty (text) — moderate/difficult/expert
├── is_edge_case (boolean)
├── patient_package (jsonb) — full patient package
├── created_at (timestamptz)
└── INDEX: case_id

validation_answer_keys
├── id (uuid PK)
├── case_id (text, UNIQUE) → validation_cases.case_id
├── label (text) — DUE/NOT_DUE
├── target_condition (text)
├── answer_data (jsonb) — full answer key
├── created_at (timestamptz)
└── INDEX: case_id, label

conversations (PRESERVED AS-IS)
messages (PRESERVED AS-IS)
```

### Views (SQL, created via db:push or setup script)

```sql
-- Latest state per patient-target (newest run)
CREATE OR REPLACE VIEW latest_target_state AS
SELECT * FROM (
  SELECT f.*,
    ROW_NUMBER() OVER (
      PARTITION BY patient_id, condition, screening_type
      ORDER BY generated_at DESC, run_id DESC
    ) AS rn
  FROM pathway_target_run_facts f
) s WHERE rn = 1;

-- Patient highest-value action
CREATE OR REPLACE VIEW patient_highest_value_action AS
WITH ranked AS (
  SELECT *,
    ROW_NUMBER() OVER (
      PARTITION BY patient_id
      ORDER BY action_value_score DESC, overdue_days DESC
    ) AS rn
  FROM latest_target_state
  WHERE status IN ('overdue_now', 'due_soon', 'unknown_due')
)
SELECT * FROM ranked WHERE rn = 1;
```

### Questions for Review

**Q1: Patient ID strategy — text IDs vs UUIDs?**

The Synthea data uses text IDs like "PAT-000001", "ENC-0000001". I propose using these as the primary linkage keys (with UUID as the actual PK for Drizzle compatibility). This means:
- Foreign keys reference patient_id TEXT, not the UUID
- Simpler CSV import (no UUID mapping needed)
- The engine can reference patients by their Synthea ID directly

Alternative: UUID PKs with Synthea IDs as unique secondary keys. More normalized but adds a lookup step everywhere.

**Recommendation**: Text IDs as unique indexed columns, UUIDs as PKs. Foreign keys use text IDs for simplicity. This is a hackathon — we don't need full normalization.

> Sounds great.

**Q2: Should we store the Synthea encounter diagnosis as a "conditions" derived table?**

Currently, conditions are implicit in encounter diagnoses (ICD-10-CA codes). For RCV construction, we need a patient's active condition list. Options:
- (A) Derive conditions at query time from encounters (GROUP BY diagnosis_code)
- (B) Create a materialized `patient_conditions` table derived from encounter data during import

**Recommendation**: Option A for now — derive at query time. The engine's context builder can aggregate distinct diagnosis codes from encounters. If this proves slow, we materialize later.

> Sounds great.

**Q3: The `observations` table references in existing query code — update or keep?**

Existing code in `src/lib/db/queries/observations.ts` references the old `observations` table. Since we're splitting into `lab_results` + `vitals`, all query code needs updating.

**Recommendation**: Rewrite the query files to match new schema. Old queries are incompatible anyway.

> Yes, rewrite it all. Nothing old/existing matters. 

---

## 2. Corpus Ingestion Strategy

### File Inventory (Priority Buckets Only)

**13 core + emergency buckets:**

| Bucket                        | HTML | PDF | DOCX | Priority                                |
| ----------------------------- | ---- | --- | ---- | --------------------------------------- |
| bc_guidelines_core            | 90   | 350 | 0    | HIGH — broad BC clinical guidelines     |
| specialty_guidelines_curated  | 187  | 143 | 6    | HIGH — specialist conditions            |
| primary_care_national_curated | 29   | 35  | 0    | HIGH — national PCP guidelines          |
| preventive_task_force         | 30   | 0   | 0    | HIGH — CTFPHC screening recommendations |
| diabetes_national_guidance    | 18   | 0   | 0    | HIGH — maps to Synthea conditions       |
| hypertension_guidance         | 13   | 0   | 0    | HIGH — maps to Synthea conditions       |
| cardiovascular_guidance       | 20   | 0   | 0    | HIGH — maps to Synthea conditions       |
| respiratory_guidance          | 20   | 34  | 2    | HIGH — maps to Synthea conditions       |
| renal_ckd_primary_care        | 2    | 21  | 0    | HIGH — maps to Synthea conditions       |
| bc_cancer_screening           | 20   | 1   | 0    | MEDIUM — cancer screening               |
| immunization_prevention       | 20   | 0   | 0    | MEDIUM — immunization schedules         |
| diagnostic_referral_guidance  | 4    | 12  | 0    | MEDIUM — referral criteria              |
| emergency_risk_support        | 18   | 2   | 0    | MEDIUM — escalation evidence            |
| interoperability_standards    | 29   | 13  | 0    | MEDIUM — hackathon suggested, route-only |
| substance_use_primary_care    | 3    | 1   | 0    | MEDIUM — substance use guidance         |

**Additional data source (from `health-info-data/additional-data/Vector Content/`):**

| Source | HTML | PDF | Priority |
|--------|------|-----|----------|
| 05_primary_care_national (stroke secondary prevention + Hypertension Canada PDF) | ~123 | ~100 | MEDIUM — evidence-graded BP/lipid/diabetes/anticoagulation thresholds |

**Totals: ~640 HTML + ~650 PDF + 8 DOCX = ~1,300 files**

Note: `05_primary_care_national` needs curation — exclude duplicate PDFs (files with `-2` hash suffix), award/nomination docs, AI-generated filler content (organometallic chemistry file), and organizational docs. Keep all clinical guideline content including the Hypertension Canada 2020-2022 PDF and stroke secondary prevention recommendation pages.

### Additional Data Review (2026-03-27)

Five opus subagents reviewed all 13 directories in `health-info-data/additional-data/Vector Content/` (5,679 files, 3.7GB). Results:

| Directory | Verdict | Reason |
|-----------|---------|--------|
| 01_bc_guidelines (427MB) | SKIP | 100% duplicate of existing bc_guidelines_core |
| 02_bcehs (34MB) | SKIP | Paramedic field protocols, no screening criteria |
| 03_health_canada_dpd (1.1GB) | SKIP | Regulatory drug registry, not clinical guidance |
| 04_cps_licensed (424KB) | SKIP | Marketing pages only, CPS is paywalled |
| **05_primary_care_national (189MB)** | **INCLUDE** | Hypertension Canada guidelines + stroke secondary prevention with evidence-graded thresholds |
| 06_rnao (0B) | SKIP | Empty directory (anti-bot blocked) |
| 07_specialty_guidelines (314MB) | SKIP | All clinical content already in curated corpus |
| 08_cadth_cda_amc (140MB) | SKIP | Drug reimbursement reviews, wrong content type |
| 09_standards_governance (183MB) | SKIP | Accreditation marketing, zero clinical content |
| 10_equity_demographic (6.9MB) | SKIP | Data collection methodology |
| 11_data_policy_interop (20MB) | SKIP | Government policy docs |
| 12_samd_ai_regulatory (8.5MB) | SKIP | Device regulatory guidance |
| 13_provincial_quality (95MB) | SKIP | Alberta Pathways Hub has great clinical content but skipping to keep BC focus |

### What We're Skipping (and Why)

| Bucket                                                 | Files | Reason for Skipping                                                                                                                                 |
| ------------------------------------------------------ | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| drug_safety_support                                    | 2,538 | Route-only group. 2,526 individual drug code pages — massive volume for lookup-only use. The `canadian_drug_reference` table covers our drug needs. |
| choosing_wisely                                        | 25    | Not in any upload group. "Things to question" lists, not actionable screening guidance.                                                             |
| provincial_quality_pathways                            | 91    | Not in any upload group. Quality improvement docs, not clinical guidelines.                                                                         |
| bc_prevention_schedule                                 | 1     | Not in any upload group. Single PDF — likely covered by preventive_task_force.                                                                      |
| equity_support, equity_data_support, indigenous_equity | 11    | Not in any upload group. Important but not core clinical guidance for the engine.                                                                   |
| evidence_reviews_support                               | 5     | Not in any upload group. Meta-analyses, not direct clinical guidance.                                                                               |
| medication_feasibility_guidance                        | 16    | Not in any upload group. Formulary/feasibility docs.                                                                                                |
| medication_safety_guidance                             | 34    | Not in any upload group. Drug safety warnings — partially covered by drug_safety_support.                                                           |
| oncology_referral_pathways                             | 1     | Not in any upload group. Single file.                                                                                                               |
| patient_education_support                              | 8     | Not in any upload group. Patient-facing materials, not clinical guidelines.                                                                         |
| quality_implementation                                 | 4     | Not in any upload group. Implementation guidance.                                                                                                   |

### Track A: HTML Files (471 files) → Cheerio (FREE)

Build a local parser that:
1. Loads HTML with cheerio
2. Strips boilerplate: `<nav>`, `<header>`, `<footer>`, `<script>`, `<style>`, `.sidebar`, breadcrumbs, cookie notices, analytics tags
3. Finds the main content area (typically `<main>`, `<article>`, `.content`, `#content`, or the largest `<div>` after stripping nav)
4. Walks the content DOM, splitting on `<h1>`/`<h2>`/`<h3>` boundaries
5. Preserves `<table>` elements as separate chunks with both `text` and `text_as_html`
6. Tracks `<strong>`/`<em>` content in metadata
7. Target chunk size: 1000-1500 chars, recursive split at paragraph boundaries if needed
8. Drops chunks under 100 chars (likely nav remnants)

Output shape per chunk:
```typescript
interface ParsedChunk {
  text: string;           // plain text for embedding + keyword search
  text_as_html: string | null;  // HTML for tables and formatted content
  heading: string | null; // section heading
  page_number: number | null;   // null for HTML
  chunk_index: number;    // position in document
  chunk_type: 'text' | 'table' | 'list';
  emphasized_text: string[];  // bold/italic content
}
```

### BC Guidelines Core PDF Filtering

The `bc_guidelines_core` bucket has 350 PDFs. Filter out obviously administrative docs by filename:
- EXCLUDE: files containing `contributor`, `cme_credit`, `external_review` in filename
- KEEP: files containing `patient_handout` (useful for patient navigator mode)
- KEEP: everything else (when in doubt, include — retrieval relevance sorting handles it)

### Track B: PDF + DOCX Files (~700 files) → Unstructured API

**Page budget estimate:**
- ~640 PDFs × ~4 pages avg = ~2,560 pages
- 8 DOCX × ~10 pages avg = ~80 pages
- ~100 PDFs from additional-data/05_primary_care_national × ~4 pages = ~400 pages
- **Total: ~3,040 pages** (well under 15,000 budget; leaves ~12,000 for re-processing)

Config:
- Strategy: `hi_res` (model-based layout detection)
- Chunking: `by_title`
- max_characters: 1500
- new_after_n_chars: 1000
- combine_text_under_n_chars: 400

Post-processing:
- Strip `orig_elements` from metadata (large, unneeded)
- Map Unstructured output to same `ParsedChunk` shape as Track A
- Track page consumption per API call

### Metadata Assignment

For each document, metadata is determined by:
1. **source_bucket** — derived from file path (parent directory)
2. **upload_group** — looked up from `upload_group_manifest.json`
3. **source_url** — looked up from `selected_manifest.csv` by matching filename/path
4. **document_title** — extracted from HTML `<title>` or PDF metadata or filename
5. **content_type** — heuristic from bucket name + document title:
   - `bc_guidelines_core`, `*_guidance` → "guideline"
   - `diagnostic_referral_guidance` → "pathway"
   - `preventive_task_force` → "guideline"
   - `patient_education_support` → "patient_education"
   - Default → "reference"
6. **clinical_domains** — mapped from bucket:
   - `diabetes_national_guidance` → ["diabetes", "endocrine"]
   - `hypertension_guidance` → ["hypertension", "cardiovascular"]
   - `cardiovascular_guidance` → ["cardiovascular", "cardiometabolic"]
   - `respiratory_guidance` → ["respiratory", "copd", "asthma"]
   - `renal_ckd_primary_care` → ["renal", "ckd"]
   - `bc_cancer_screening` → ["cancer_screening", "preventive"]
   - etc.
7. **jurisdiction** — from bucket/source:
   - `bc_*` → "BC"
   - `*_national_*`, `preventive_task_force` → "Canada"
   - `specialty_guidelines_curated` → varies, default "Canada"

### Embedding Pipeline

Uses existing `src/lib/rag/embed.ts` unchanged:
- `embedDocuments()` for batch embedding (Gemini `gemini-embedding-001`, 3072 dims)
- Task type: `RETRIEVAL_DOCUMENT` for corpus chunks
- Batch size: 20 chunks per API call (Gemini batch limit)
- Rate limiting: 1 second between batches

### Retrieval Adaptation

The existing `src/lib/rag/retrieve.ts` hybrid search (vector + keyword + RRF) works well. Needs updating for new table names (`corpus_chunks` instead of `document_chunks`, `corpus_documents` instead of `documents`). Also needs:
- **Bucket filtering** — add `sourceBuckets?: string[]` parameter to filter by clinical domain
- **Upload group filtering** — respect default_retrieval flag
- **tsvector column** — use the generated column instead of computing tsvector at query time (faster)

### Ingestion Order

1. **Condition-mapped buckets first** (most important for Synthea patients):
   - diabetes_national_guidance (18 HTML)
   - hypertension_guidance (13 HTML)
   - cardiovascular_guidance (20 HTML)
   - respiratory_guidance (20 HTML + 34 PDF + 2 DOCX)
   - renal_ckd_primary_care (2 HTML + 21 PDF)
2. **Core clinical** (broad coverage):
   - bc_guidelines_core (90 HTML + 350 PDF)
   - primary_care_national_curated (29 HTML + 35 PDF)
   - specialty_guidelines_curated (187 HTML + 143 PDF + 6 DOCX)
3. **Preventive/screening**:
   - preventive_task_force (30 HTML)
   - bc_cancer_screening (20 HTML + 1 PDF)
   - immunization_prevention (20 HTML)
4. **Referral + emergency**:
   - diagnostic_referral_guidance (4 HTML + 12 PDF)
   - emergency_risk_support (18 HTML + 2 PDF)

### Testing Plan (Before Bulk)

**Track A tests:**
1. Pick a hypertension guideline HTML (has clinical recommendations, likely `<strong>` tags)
2. Pick a diabetes guideline HTML (different site structure — diabetes.ca)
3. Pick a BC guidelines core HTML (gov.bc.ca format — known boilerplate)
4. Run cheerio parser → verify boilerplate stripped, content preserved, tables intact

**Track B tests:**
1. Pick a renal PDF (likely has threshold tables)
2. Pick a respiratory PDF with guidelines
3. Run Unstructured → verify tables have text_as_html, sections preserved

**Cross-track test:**
1. Embed + store test chunks from both tracks
2. Query: "blood pressure thresholds for hypertension diagnosis"
3. Query: "HbA1c target for type 2 diabetes management"
4. Verify results come from correct buckets, citations are traceable

---

## 3. Synthea Import

### Script: `scripts/import-synthea.ts`

Reads 5 CSVs from `hackathon-data/track-1-clinical-ai/synthea-patients/`:

| CSV             | Target Table  | Key Transformations                                               |
| --------------- | ------------- | ----------------------------------------------------------------- |
| patients.csv    | `patients`    | Parse DOB as date, sex as-is                                      |
| encounters.csv  | `encounters`  | Parse encounter_date as date, triage_level as int, LOS as numeric |
| medications.csv | `medications` | Parse active as boolean, dates, nullable end_date                 |
| lab_results.csv | `lab_results` | Parse value/ranges as numeric, collected_date as date             |
| vitals.csv      | `vitals`      | Parse recorded_at as timestamptz, all numerics                    |

**Idempotent**: DELETE FROM each table before inserting (respecting FK order).

**Batch insert**: 500 rows per batch to avoid query size limits.

### Drug Reference Import: `scripts/import-drug-reference.ts`

Reads `hackathon-data/shared/drug-database/canadian_drug_reference.csv` → `canadian_drug_reference` table.

Simple: 100 rows, no FKs, DELETE + INSERT.

### Validation Dataset Import: `scripts/import-validation.ts`

Reads JSONL files → `validation_cases` + `validation_answer_keys` tables.

Each line is a JSON object → parsed and inserted with case_id as unique key.

---

## 4. Dependencies to Install

```bash
npm install cheerio csv-parse
```

- `cheerio` — HTML parsing for Track A
- `csv-parse` — CSV parsing for Synthea/drug imports (better than hand-rolling)

Both are lightweight, no native dependencies.

---

## 5. Open Questions

### For You (Peter)

**Q1**: The schema uses text foreign keys (patient_id TEXT referencing patients.patient_id) rather than UUID FKs. This is simpler for import and querying but less "proper". OK for hackathon? > Sounds good.

**Q2**: I'm proposing to skip 2,780 files (67% of corpus) that aren't in the core/emergency upload groups. The biggest skip is drug_safety_support (2,538 files). The reasoning: our drug needs are covered by the canadian_drug_reference table, and these are individual drug monograph pages, not clinical guidelines. Sound right? > Yes, sounds good, per my notes in the prompt. 

**Q3**: The validation dataset (100 cases) — should these be importable into the *same* patient tables as Synthea data (allowing the engine to run against them), or kept separate? They have a richer structure (problem lists, family history, social history, distractors) that the Synthea schema doesn't capture. My proposal: separate tables with JSONB storage, and the engine reads them differently when in "validation mode." > Sounds good.

**Q4**: For the HTML parser — many of these HTML files are from different websites (gov.bc.ca, diabetes.ca, hypertension.ca, etc.) with different boilerplate structures. Should I build a generic parser that handles most cases, or should we have per-site extraction rules? I lean toward generic + aggressive boilerplate stripping, accepting some noise over missing content. > Sounds good. 

**Q5**: `bc_guidelines_core` has 350 PDFs — that's 60% of our PDF budget. Some of these may be administrative docs (CME credits, external review process) rather than clinical guidelines. Should I filter by filename before sending to Unstructured, or process everything and let retrieval relevance sorting handle it? > Yes, I think. But, if in doubt, ingest.

---

## 6. Execution Order

```
1. [BLOCKING] Schema rewrite → db:push
2. [BLOCKING] Synthea import + drug reference import + validation import
3. [PARALLEL] Build HTML parser (Track A) + Build Unstructured parser (Track B)
4. [BLOCKING] Test both tracks with sample files → review results
5. [BLOCKING] ⭐ REVIEW WITH PETER — present test results, confirm quality before bulk run
6. [PARALLEL] Bulk HTML ingestion (free) + Bulk PDF ingestion (Unstructured)
7. [AFTER]    Update query functions + retrieval code for new schema
8. [AFTER]    Verify hybrid search works end-to-end
```

Steps 1-2 are blocking for the rest of the team (can't build the engine without data).
Steps 3-5 can run while engine development starts against Synthea data.
Step 5 is a mandatory checkpoint — no bulk ingestion without sign-off.
Steps 7-8 enable the engine to use the knowledge corpus.

### File Paths (Updated)

The corpus is now in the project directory:
- **Corpus root**: `health-info-data/next-best-pathway-corpus/`
- **Source files**: `health-info-data/next-best-pathway-corpus/01_sources/`
- **Manifest**: `health-info-data/next-best-pathway-corpus/00_manifest/selected_manifest.csv`
- **Upload groups**: `health-info-data/next-best-pathway-corpus/02_upload_tagging/upload_group_manifest.json`
- **Augmentation pack**: `health-info-data/next-best-pathway-augmentation-pack/` (pharmacy locations, walk-in clinics, etc. — useful for provider routing later, not needed now)

---

## 7. Risk Mitigation

| Risk                             | Mitigation                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------- |
| Unstructured page budget overrun | Track pages per call; stop at 14,000; prioritize condition-mapped buckets first |
| HTML parser misses content       | Test on 3+ HTML files from different source sites before bulk run               |
| Gemini embedding rate limits     | Batch size 20, 1s delay between batches, exponential backoff                    |
| Chunking splits tables           | Both cheerio and Unstructured configured to preserve tables as atomic units     |
| Schema push fails                | No backwards compatibility needed — clean push. Run locally first.              |
| Import script data type errors   | Parse and validate each CSV field; log and skip bad rows rather than failing    |
