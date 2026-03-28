# BestPath: Proactive Care Intelligence Platform

## The One-Sentence Pitch

BestPath identifies the highest-value clinical action for every patient — the screening, medication start, referral, or follow-up most likely to prevent an emergency — and surfaces it with evidence so clinicians can act before conditions escalate. For the 6.5 million Canadians without a family doctor, the same engine powers a self-service care navigator that tells people what they need and who can help, routing them to the least-strained provider capable of addressing it.

---

## What We're Building

Two interfaces on a single clinical intelligence engine:

**Clinician View** — A proactive panel management tool. The system ingests a patient panel (2,000 Synthea patients), determines the next best clinical action for each — whether that's an overdue screening, a medication that should be started, a specialist referral, or a follow-up after an abnormal finding — and surfaces a prioritized action queue: who to act on first, what to do, and why. The AI agent can drill into any patient, explain the clinical reasoning, and render bespoke clinical views in real time using generative UI.

**Patient View** — A self-service care navigator for unattached patients. A person without a family doctor enters their health information conversationally. The same engine determines what clinical actions they likely need — screenings, medication reviews, referrals, follow-ups — and routes them to the right provider type. Not "see a doctor" (there are none), but "a pharmacist can monitor your blood pressure," "a dietitian can help with diabetes management," or "you need a walk-in clinic to get this referral." Every recommendation is cited against clinical guidelines.

Both interfaces run on the same core: Risk Confluence Vector (RCV) + Screening Recency Vector (SRV) → AI-powered risk assessment → deterministic comparator against care recency → prioritized, evidence-backed next best actions.

---

## Hackathon Alignment

### Track: Clinical AI

> "Build an AI-powered tool that improves clinical workflows, patient care, or healthcare delivery using the provided Synthea patient dataset."

We directly address:
- **Clinical workflow improvement**: Proactive queue replaces reactive panel management — surfaces the next best action per patient
- **Patient care improvement**: Catches missed screenings, needed medication starts, overdue referrals, and follow-up gaps before conditions escalate to emergency
- **Healthcare delivery**: Routes unattached patients to the right level of care, weighted toward less-strained providers

### Scoring Rubric Mapping

| Criteria                 | Weight | Our Story                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Innovation**           | 25%    | Not a chatbot or dashboard. A two-vector proactive engine (RCV/SRV) that determines the next best clinical action — screening, medication start, referral, or follow-up — for every patient. AI identifies what's needed; deterministic comparison confirms urgency. The same engine serves clinicians AND patients — two interfaces, one architecture. Generative UI (OpenUI) means every query produces a bespoke clinical view, not a static page.                                                    |
| **Technical Execution**  | 25%    | Two-vector patient model, structured AI output with evidence citations, deterministic comparator (no hallucination on the critical path), append-only run history, operational queue scoring algorithm. Full-stack: Next.js 16, Supabase + pgvector, Drizzle ORM, Claude Opus 4.6, Vercel AI SDK, 23 OpenUI components, hybrid RAG pipeline.                                                                                                                                                             |
| **Impact Potential**     | 25%    | 6.5M Canadians lack a family doctor. Clinics drown in reactive care. ER closures across provinces. This system: (1) lets clinics surface the highest-value next action for every patient — the intervention most likely to prevent an ER visit — and (2) gives unattached patients evidence-based guidance on what they need and who can help. Every recommendation is auditable, guideline-cited, and clinician-reviewable. Designed as decision support under Health Canada's SaMD exclusion criteria. |
| **Presentation Quality** | 15%    | Two-perspective demo: clinician queue drill-down, then patient self-service navigation. Problem → solution → live demo → impact in 5 minutes.                                                                                                                                                                                                                                                                                                                                                            |
| **Design & UX**          | 10%    | AI IS the interface. Natural language in, actionable recommendations out. Generative UI renders clinical views tailored to the question. Zero cognitive load, zero behavior change. Warm teal design system, glass aesthetic for AI panel, clean data display.                                                                                                                                                                                                                                           |

### BuildersVault Values Alignment

BuildersVault's mission: *"Real datasets. Real problems. Real impact."* Converting hackathon output into funded, deployed projects.

- **Real dataset**: We ingest the full Synthea dataset (2,000 patients, 10,000 encounters, 5,000 medications, 3,000 labs, 2,000 vitals) and demonstrate clinical reasoning against it
- **Real problem**: Canadian healthcare access crisis, preventive screening gaps, reactive care model
- **Real impact**: The proactive engine is architecturally deployable — same logic works against a real EHR feed. The patient navigator addresses an immediate unmet need for millions of Canadians
- **Trelent compatibility**: Architecture is containerizable; the core engine could run inside Trelent's Docker sandbox infrastructure for private, on-premise deployment in hospital environments

### Submission Requirements

- [ ] Single shareable link (GitHub repo) openable on organizer's laptop
- [ ] Slides (PDF or Google Slides link) in repo README
- [ ] Video demo (Loom/YouTube) as backup for local-only features
- [ ] README includes: team members, challenge track, problem statement, solution summary, tech stack, how to run/view demo
- [ ] Deployed to Vercel (live demo link)
- [ ] Code freeze: Saturday March 28, 3:30 PM

---

## Architecture Overview

```
                    ┌─────────────────────────────────────────┐
                    │           TWO INTERFACES                │
                    │                                         │
                    │  ┌──────────────┐  ┌─────────────────┐  │
                    │  │  Clinician   │  │    Patient       │  │
                    │  │  Queue View  │  │    Navigator     │  │
                    │  │  (Dashboard) │  │  (Chat Intake)   │  │
                    │  └──────┬───────┘  └────────┬────────┘  │
                    │         │                   │           │
                    │         ▼                   ▼           │
                    │  ┌──────────────────────────────────┐   │
                    │  │     OpenUI Generative Renderer    │   │
                    │  │     (23 clinical components)      │   │
                    │  └──────────────┬───────────────────┘   │
                    └─────────────────┼───────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │           CORE ENGINE                    │
                    │                 │                        │
                    │  ┌──────────────▼───────────────────┐   │
                    │  │    Patient Context Builder        │   │
                    │  │    Split → RCV + SRV              │   │
                    │  └──────┬──────────────┬────────────┘   │
                    │         │              │                 │
                    │         ▼              │                 │
                    │  ┌─────────────┐       │                │
                    │  │ Risk Prompt │       │                │
                    │  │ → Claude    │       │                │
                    │  │ + RAG       │       │                │
                    │  └──────┬──────┘       │                │
                    │         │              │                 │
                    │         ▼              ▼                │
                    │  ┌──────────────────────────────────┐   │
                    │  │   Deterministic Comparator       │   │
                    │  │   model targets vs SRV dates     │   │
                    │  │   → overdue_now / due_soon /     │   │
                    │  │     up_to_date / unknown_due     │   │
                    │  └──────────────┬───────────────────┘   │
                    │                 │                        │
                    │                 ▼                        │
                    │  ┌──────────────────────────────────┐   │
                    │  │   Priority Scoring & Queue       │   │
                    │  │   risk_tier + overdue_days +     │   │
                    │  │   confidence → action_value      │   │
                    │  └──────────────┬───────────────────┘   │
                    │                 │                        │
                    │                 ▼                        │
                    │  ┌──────────────────────────────────┐   │
                    │  │   Provider Routing (patient mode)│   │
                    │  │   condition → provider type      │   │
                    │  │   (pharmacist, dietitian, PT,    │   │
                    │  │    walk-in, ER, specialist)      │   │
                    │  └─────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼───────────────────────┐
                    │           DATA LAYER                     │
                    │                 │                        │
                    │  ┌──────────────▼───────────────────┐   │
                    │  │   Supabase (Postgres + pgvector)  │   │
                    │  │                                   │   │
                    │  │   patients (2,000 Synthea)        │   │
                    │  │   encounters (10,000 + ICD-10-CA) │   │
                    │  │   medications (5,000 + DIN codes) │   │
                    │  │   observations (labs + vitals)    │   │
                    │  │   documents + chunks (RAG corpus) │   │
                    │  │   pathway_runs (append-only)      │   │
                    │  └──────────────────────────────────┘   │
                    └─────────────────────────────────────────┘
```

---

## Core Engine: How It Works

Detailed specs live in `docs/spec/`. Summary of the flow:

### Step 1: Patient Context Builder

For a given patient, assemble two vectors from all available data:

**Risk Confluence Vector (RCV)** — everything that influences escalation risk:
- Demographics: age, sex at birth, BMI
- Clinical burden: active conditions from encounter diagnoses (ICD-10-CA)
- Physiological state: latest BP, key labs (HbA1c, creatinine, lipids), vitals trends
- Treatment context: active medications, polypharmacy signals, adherence gaps
- Utilization: ED visits, hospitalizations, missed appointments, last/next PCP visit
- Risk behaviors: smoking status
- Prior abnormal findings from preventive history

**Screening Recency Vector (SRV)** — when each relevant clinical action was last addressed:
- Condition/action type → last completed date → result status
- Covers screenings, medication initiations, referrals, follow-ups after abnormal findings
- Derived from encounters, labs, medication history, and preventive history

### Step 2: Risk Prompt (AI-Powered)

Send a structured prompt built from the RCV to Claude, with RAG-retrieved clinical guideline context:

> "Given this patient's risk profile, which preventable/treatable conditions are most likely to escalate to emergency care if unaddressed? For each, what is the recommended next clinical action — screening, medication initiation, specialist referral, monitoring follow-up, or other intervention — and at what interval?"

Model returns structured JSON:
```json
{
  "targets": [
    {
      "condition": "Stage 1 hypertension",
      "risk_tier": "high",
      "screening_type": "Initiate BP medication",
      "interval_days": 90,
      "rationale": "Persistent stage 1 BP (138/86, 133/84) with 10-year ASCVD risk >10%. ACC/AHA 2017 recommends pharmacotherapy.",
      "evidence_refs": ["acc_aha_2017_bp_guideline"]
    },
    {
      "condition": "CKD progression",
      "risk_tier": "medium",
      "screening_type": "Nephrology referral",
      "interval_days": 180,
      "rationale": "Persistent ACR >30 mg/mmol with hematuria. NICE NG203 recommends specialist evaluation.",
      "evidence_refs": ["nice_ng203_ckd"]
    }
  ]
}
```

Note: `screening_type` is a legacy field name — it encompasses any clinical action (screening, medication start, referral, follow-up, prophylaxis).

### Step 3: Deterministic Comparator (No AI — Pure Math)

For each target from Step 2:
1. Find matching last-addressed date in the SRV (screening completed, medication started, referral made, follow-up done)
2. `due_date = last_addressed + interval_days`
3. `overdue_days = today - due_date`
4. Status: `overdue_now` (>0) | `due_soon` (<=30 days) | `up_to_date` | `unknown_due` (no record of action)

This is the critical trust design: the AI identifies *what actions are clinically indicated* based on guidelines and patient risk, but the urgency determination is deterministic math against documented care history. No hallucination risk on the decision-critical path.

### Step 4: Priority Scoring

```
action_value_score =
  risk_tier_points   (high=300, medium=200, low=100)
  + status_points    (overdue_now=80, due_soon=40, unknown_due=20)
  + min(overdue_days, 180)
  + confidence_points (high=20, medium=10, low=0)
```

### Step 5: Provider Routing (Patient Mode Only)

Map condition + screening type → appropriate provider:

| Screening Need              | Provider Route                | Why                                          |
| --------------------------- | ----------------------------- | -------------------------------------------- |
| BP monitoring               | Pharmacist                    | BC pharmacists can do BP checks, med reviews |
| Diabetes dietary management | Dietitian                     | No referral needed                           |
| MSK assessment              | Physiotherapist               | Direct access in BC                          |
| Mental health screening     | Counsellor / community health | Walk-in available                            |
| Lab work (routine)          | LifeLabs / walk-in            | Self-request available for some tests        |
| Urgent cardiac/renal flags  | Walk-in or ER                 | With triage reasoning                        |
| Specialist referral needed  | Walk-in (for referral)        | Explain what to ask for                      |

---

## Data Pipeline

### Synthea Import (Hackathon Data → Supabase)

Source CSVs from `hackathon-data/track-1-clinical-ai/synthea-patients/`:

| CSV               | Records | Target Table   | Key Fields                                                                                                          |
| ----------------- | ------- | -------------- | ------------------------------------------------------------------------------------------------------------------- |
| `patients.csv`    | 2,000   | `patients`     | patient_id, name, DOB, age, sex, postal_code, blood_type, insurance_number                                          |
| `encounters.csv`  | 10,000  | `encounters`   | encounter_id, patient_id, date, type, facility, chief_complaint, ICD-10-CA diagnosis, CTAS triage, disposition, LOS |
| `medications.csv` | 5,000   | `medications`  | medication_id, patient_id, drug_name, DIN code, dosage, frequency, route, active status                             |
| `lab_results.csv` | 3,000   | `observations` | lab_id, patient_id, encounter_id, LOINC code, value, unit, reference range, abnormal_flag                           |
| `vitals.csv`      | 2,000   | `observations` | vitals_id, patient_id, encounter_id, HR, BP, temp, respiratory rate, O2 sat, pain scale                             |

Schema modifications needed:
- Add fields for ICD-10-CA codes, CTAS triage levels, DIN drug codes, facility names
- Add `abnormal_flag` to observations
- Add `disposition` and `length_of_stay_hours` to encounters
- Consider a `pathway_target_run_facts` table for engine output persistence

### Shared Resources

- `canadian_drug_reference.csv` — 100 common Canadian drugs with DIN, class, indication
- FHIR R4 sample resources — reference for data normalization
- `utilities.py` — helper functions (Python, for reference)

### Knowledge Corpus (RAG)

Clinical guidelines for the risk prompt's retrieval context. Options:
- Upload key guideline documents via existing Settings page / POST to `/api/documents`
- Use existing RAG pipeline: LlamaParse → chunking → Gemini embeddings → pgvector
- At minimum: Canadian preventive care guidelines, BC-specific screening recommendations, condition-specific management guidelines

---

## Build Phases

### Phase 1: Data Foundation (Friday Night)
**Goal**: Real patient data in the database, queryable by existing agent tools.

- [ ] Adapt Drizzle schema for Synthea CSV structure (new fields, type adjustments)
- [ ] Write import script for all 5 CSVs → Supabase
- [ ] Verify existing agent tools (`queryPatients`, `getPatientDetail`) work against new data
- [ ] Verify dashboard renders with real data

### Phase 2: Core Engine (Friday Night → Saturday Morning)
**Goal**: RCV/SRV construction and risk assessment working for individual patients.

- [ ] Patient Context Builder: function that assembles RCV + SRV from DB for a given patient
- [ ] Risk prompt template: structured prompt from RCV → Claude → JSON targets
- [ ] Deterministic comparator: targets × SRV → overdue status
- [ ] Priority scoring function
- [ ] New agent tool: `assessPatientRisk` — runs the full pipeline for a patient and returns ActionableRecommendations

### Phase 3: Clinician Queue View (Saturday Morning)
**Goal**: Dashboard shows prioritized action queue.

- [ ] Batch-run engine on a meaningful subset of patients (e.g., 50-100 high-signal patients)
- [ ] Store results in pathway_target_run_facts table
- [ ] Dashboard view: patients sorted by action_value_score, showing top overdue action
- [ ] Drill-down: click patient → agent explains reasoning with OpenUI components
- [ ] Build out patient detail page (currently a stub)

### Phase 4: Patient Navigator (Saturday Morning → Afternoon)
**Goal**: Consumer-facing chat flow using the same engine.

- [ ] `/navigator` route with full-screen agent panel, consumer-friendly framing
- [ ] Patient-mode system prompt: conversational intake → RCV construction → risk assessment
- [ ] Provider routing logic: condition/screening → provider type + explanation
- [ ] Render recommendations with OpenUI (StatusAlert, Timeline, List components)
- [ ] Clear "decision support only" framing and disclaimers

### Phase 5: Demo & Submission (Saturday Afternoon)
**Goal**: Polished, presentable, submittable.

- [ ] Deploy to Vercel (live link)
- [ ] Record Loom video demo as backup
- [ ] Prepare slides (PDF or Google Slides)
- [ ] Update README with: team members, track, problem statement, solution summary, tech stack, demo link
- [ ] Rehearse 5-minute presentation
- [ ] Submit link by 3:30 PM

---

## Demo Script (5 Minutes)

### Act 1: The Problem (30 seconds)
"6.5 million Canadians have no family doctor. Clinics are overwhelmed — the system is reactive. Patients end up in the ER because a blood pressure medication wasn't started, a referral wasn't made, a follow-up after an abnormal result never happened. These are preventable emergencies."

### Act 2: The Clinician View (90 seconds)
- Open dashboard → show prioritized patient queue
- "BestPath has analyzed 2,000 patients against clinical guidelines. Here's who needs action first — and what that action is."
- Click top patient → agent panel opens
- "Why is this patient #1?" → agent explains: RCV summary, identified actions, evidence citations
- Agent renders: PatientCard + RiskBadge + Timeline of needed actions
- Show variety: "This patient needs BP medication started — persistent stage 1 hypertension with ASCVD risk >10%. This one needs a nephrology referral — persistent albuminuria with hematuria. This one is overdue for colonoscopy surveillance after polyp removal 4 years ago."
- Show the deterministic logic: "The AI identified the clinical need. The math confirmed the urgency. The guideline is cited. The clinician decides."

### Act 3: The Patient View (90 seconds)
- "But what about the 6.5 million without a doctor?"
- Switch to `/navigator`
- Chat: "I'm 52, I have high blood pressure, I haven't seen a doctor in 2 years"
- Agent asks follow-up: medications, smoking, last screenings
- Agent returns: "Based on what you've told me, here's what you likely need — and who can help without a family doctor:"
  - "Your blood pressure needs monitoring and possibly medication — a pharmacist can do both in BC"
  - "You should get bloodwork to check kidney function and cholesterol — you can book at LifeLabs directly"
  - "If your results come back abnormal, a walk-in clinic can refer you to a specialist"
- Every recommendation cites a clinical guideline. No diagnosis — just the right next step and the right door to walk through.

### Act 4: The Architecture (30 seconds)
"Same engine, two interfaces. AI identifies what clinical actions are needed based on guidelines and patient risk. Deterministic comparison confirms urgency against documented care history. Every recommendation is guideline-cited and clinician-reviewable. The AI never makes the final decision — it surfaces the right next step so humans can act."

### Act 5: Impact (30 seconds)
"Augment clinician capacity. Navigate patients to the right care. Prevent emergencies before they happen. This is what proactive healthcare looks like."

---

## Key Technical Decisions

| Decision                                            | Choice                              | Why                                                                                                                                                      |
| --------------------------------------------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI identifies needed actions, math confirms urgency | Hybrid AI + deterministic           | Trust. AI determines what's clinically indicated; deterministic comparison against care history confirms urgency. No hallucination on the critical path. |
| Same engine for clinician + patient                 | Single architecture                 | Innovation story. Reduces build scope. Doubles impact narrative.                                                                                         |
| OpenUI generative components                        | Agent renders bespoke views         | Every query produces a tailored clinical view, not a static dashboard. No new UI to learn.                                                               |
| RAG for clinical guidelines                         | Evidence-backed recommendations     | Every recommendation is traceable to a source document.                                                                                                  |
| Provider-type routing                               | Condition → least-strained provider | Directly addresses "no family doctor" crisis. Routes away from ER/GP when possible.                                                                      |
| Structured JSON model output                        | Forced schema                       | Enables deterministic comparator downstream. No freeform text on the critical path.                                                                      |
| Append-only run history                             | Reproducibility + audit trail       | Every recommendation is traceable by run_id, corpus version, timestamp.                                                                                  |

---

## Regulatory Framing (One Sentence for Judges)

"BestPath is designed as a clinical decision support system under Health Canada's SaMD exclusion criteria — it augments clinical judgment, never replaces it. All recommendations require clinician review. All data processing can run in a private environment with zero data leaving the hospital."

---

## File References

| Document                      | Location                                                         | Purpose                                                 |
| ----------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------- |
| Core two-vector model         | `docs/spec/core_two_vector_operating_model.md`                   | RCV/SRV construction standard                           |
| End-to-end blueprint          | `docs/spec/minimal_end_to_end_system_blueprint.md`               | System modules, data contracts, output schema           |
| Prompt + comparator framework | `docs/spec/patient-query-orchestration-framework.md`             | Prompt construction and comparator logic                |
| Triage framework              | `docs/spec/patient-vector-triage-framework.md`                   | Balanced context building, branch logic                 |
| Operation flowsheet           | `docs/spec/current_theoretical_operation_flowsheet.md`           | Mermaid diagram of full flow                            |
| Validation plan               | `docs/spec/validation_acceptance_plan.md`                        | Gold set design, acceptance criteria                    |
| Corpus audit                  | `docs/spec/corpus_capability_risk_screening_audit.md`            | Knowledge coverage assessment                           |
| Condition mapping (draft)     | `docs/spec/condition_screening_mapping_reference_unverified.csv` | 50 condition → screening mappings                       |
| Synthetic test cases          | `docs/spec/synthetic_dataset_bundle/`                            | 100 patient cases + answer keys                         |
| Hackathon data                | `hackathon-data/track-1-clinical-ai/`                            | Synthea CSVs (patients, encounters, meds, labs, vitals) |
| Challenge tracks PDF          | `hackathon-data/hackathon-challenge-tracks.pdf`                  | Official scoring rubric and submission requirements     |
