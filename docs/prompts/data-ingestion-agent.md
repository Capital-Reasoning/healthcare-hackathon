You are working on the BestPath healthcare hackathon project at /Users/petersalmon/Projects/Capital Reasoning/healthcare-hackathon

Read PLAN.md and CLAUDE.md first for full context. This is a hackathon — code freeze is Saturday March 28 at 3:30 PM. Move fast, make pragmatic decisions.

## Your Mission

Design and implement the complete data layer for BestPath. This means revamping the Supabase/Drizzle schema and ingestion pipeline to serve our core engine: RCV/SRV construction → AI risk assessment → deterministic comparator → prioritized action queue.

## Three Data Sources to Ingest

### 1. Hackathon Synthea Dataset (structured patient data)
Location: /Users/petersalmon/Projects/Capital Reasoning/healthcare-hackathon/hackathon-data/track-1-clinical-ai/synthea-patients/

Five CSVs:
- patients.csv (2,000 records): patient_id, first_name, last_name, date_of_birth, age, sex, postal_code, blood_type, insurance_number, primary_language, emergency_contact_phone
- encounters.csv (10,000 records): encounter_id, patient_id, encounter_date, encounter_type (outpatient/emergency/inpatient), facility, chief_complaint, diagnosis_code (ICD-10-CA), diagnosis_description, triage_level (CTAS 1-5), disposition, length_of_stay_hours, attending_physician
- medications.csv (5,000 records): medication_id, patient_id, drug_name, drug_code (DIN), dosage, frequency, route, prescriber, start_date, end_date, active (boolean)
- lab_results.csv (3,000 records): lab_id, patient_id, encounter_id, test_name, test_code (LOINC), value, unit, reference_range_low, reference_range_high, abnormal_flag (N/H/L), collected_date
- vitals.csv (2,000 records): vitals_id, patient_id, encounter_id, heart_rate, systolic_bp, diastolic_bp, temperature_celsius, respiratory_rate, o2_saturation, pain_scale, recorded_at

### 2. Canadian Drug Reference (structured lookup)
Location: /Users/petersalmon/Projects/Capital Reasoning/healthcare-hackathon/hackathon-data/shared/drug-database/canadian_drug_reference.csv
100 common Canadian drugs with DIN, drug class, indication, standard dosage.

### 3. Clinical Knowledge Corpus (unstructured — for RAG/vector DB)
Location: /Users/petersalmon/Downloads/health-info-date/next-best-pathway-corpus/

This is a 1.3GB corpus of ~4,200 files (3,129 HTML, 1,001 PDF, 8 DOCX, etc.) organized into 28 clinical buckets:
- bc_guidelines_core, primary_care_national_curated, specialty_guidelines_curated
- preventive_task_force, bc_cancer_screening, immunization_prevention
- diabetes_national_guidance, hypertension_guidance, cardiovascular_guidance
- respiratory_guidance, renal_ckd_primary_care, diagnostic_referral_guidance
- emergency_risk_support, drug_safety_support, interoperability_standards
- And 13 more (oncology, substance use, patient education, equity, etc.)

There is already an upload grouping system at:
/Users/petersalmon/Downloads/health-info-date/next-best-pathway-corpus/02_upload_tagging/upload_group_manifest.json

It defines three groups:
- core_clinical_and_screening (default retrieval: true) — 12 buckets
- emergency_risk_evidence (default retrieval: true) — 1 bucket
- route_only_medication_and_standards (default retrieval: false, routing only) — 2 buckets

Also see the corpus audit at docs/spec/corpus_capability_risk_screening_audit.md for coverage assessment.

## What to Do

### Schema Design
You are free to completely revamp the Drizzle schema (src/lib/db/schema.ts). The current schema was built for a generic dashboard demo. Redesign it for the BestPath engine. Consider:

- The schema must support efficient RCV construction (pull all risk-relevant data for a patient in minimal queries)
- The schema must support SRV construction (find last-completed date for each condition/action type per patient)
- The schema must store engine outputs (pathway_target_run_facts — append-only, one row per target per run)
- The schema must store the knowledge corpus chunks with embeddings for RAG retrieval
- Think about what views or indexes will make the action queue fast
- The canadian_drug_reference should be a lookup table

Look at the existing schema first (src/lib/db/schema.ts) to understand what's there, then adapt it.

### Synthea Import Script
Write a TypeScript import script (similar to existing src/lib/db/seed.ts) that:
- Reads all 5 Synthea CSVs
- Maps them into the new schema
- Handles the data correctly (dates, enums, foreign keys, numeric types)
- Is idempotent (can re-run safely)

### Drug Reference Import
Import the canadian_drug_reference.csv into a lookup table.

### Knowledge Corpus Strategy
For the 4,200-file knowledge corpus, design the ingestion approach:
- We already have a RAG pipeline (src/lib/rag/) with LlamaParse, chunking, and Gemini embeddings
- BUT 4,200 files × LlamaParse is expensive and slow. Consider alternatives:
  - For HTML files (3,129): parse directly with cheerio/jsdom — no LlamaParse needed
  - For PDFs (1,001): use LlamaParse or consider batching strategies
  - Use the upload_group_manifest.json to prioritize: core_clinical_and_screening first
- Chunk using the existing chunking logic (src/lib/rag/chunk.ts) or adapt it
- Embed using the existing Gemini embedding pipeline (src/lib/rag/embed.ts)
- Store with bucket/source metadata so we can filter retrieval by clinical domain
- Consider adding a `source_bucket` or `clinical_domain` field to document chunks for retrieval routing

Start with a plan, then implement the schema + Synthea import first (those are blocking). The corpus ingestion can be a script that runs in the background.

### Validation Dataset
There are 100 synthetic patient cases with answer keys at:
- docs/spec/synthetic_dataset_bundle/patient_cases.jsonl (100 rich patient packages)
- docs/spec/synthetic_dataset_bundle/answer_key.jsonl (ground truth for each)
- docs/spec/synthetic_dataset_bundle/condition_manifest.csv (case metadata)

These should be importable too — they're our gold standard for testing the engine. Consider where they fit in the schema or if they need their own table.

## Constraints
- Use Drizzle ORM (already configured with Supabase)
- Use existing Supabase Postgres + pgvector setup
- Preserve the existing conversation/messages tables (the chat still needs to work)
- Run `npm run db:push` to apply schema changes (not migrations for hackathon speed) NO BACKWARDS COMPABILITY NEEDED AT ALL.
- TypeScript strict mode
- Don't break the existing build

Document the updated schema and such somewhere notable. Fix outdated docs if present. 

NOTE: ASK ME LOTS OF QUESTIONS. We want to record the most information possible, and only do this upload once, so that our lives become easier down the line. We don't have to have to re-upload everything — so do some tests on single docs, ensure chunking & whatever works well, before going too far. 

Also, for the health-info-data — think about what parts of that data we do need, vs what is just noise — and let's skip anything that won't enhance the app at this stage. 