# THIS IS THE CANONICAL PROJECT SPEC

# If information in other documents conflicts with this one, generally assume this document is the authoritative source

# BestPath: Proactive Care Intelligence Platform

Objectives:

* Improves Access
  * People can use self serve and get cited answer and best next step for preventative care
* Makes system more efficient
  * Automatic communication possible to individuals

## The Pitch

BestPath identifies the next-step highest-value clinical action for patients based upon all available information — the screening, medication start, referral, or follow-up most likely to prevent an emergency (and thus visit to the ER) — and surfaces it with evidence so clinicians can act before conditions escalate, or an automated communication can be sent to the patient after approval from health professional.

**North-star objective**

Build a low-friction, evidence-cited care-navigation engine that uses imperfect patient data to determine the next best action, due date, and best care setting/provider, so access improves while provider cognitive/admin burden drops.

## Product objectives

1. Route each person to the right level of care (PCP, nurse/pharmacist, community/virtual, allied provider) instead of defaulting to specialist/hospital paths, or best document supported self care measure to take (for example, reduce caffeine intake, or take a walk every day).
2. Detect who is truly due now using risk-confluence \+ last-known care timing, with deterministic and explainable logic.
3. Improve operational flow (wait times, congestion, diagnostic delay) by prioritizing and sequencing follow-ups with scheduling/timeline awareness.
4. Minimize behavior change for clinicians: "invisible" workflow, concise output, one clear next action.
5. Add a patient sidecar for people without a family doctor: self-enter data, get cited next-step guidance and timing.
6. Stay trustworthy: explicit citations, confidence \+ missing-data flags, and clinician-review guardrails.
7. Have the ability to weight certain screenings as `available to lower priority or risk individuals` if there is extra availability, so the system can get ahead.
8. A clear and elegant dashboard that breaks individuals up into three distinct categories \- Each of the three categories which are represented as three columns, are split into two sections, high confidence and low confidence, based on amount of information in the patient data and what was returned from the vector database
   1. Red: Is overdue and at high risk
   2. Yellow: Is overdue for action and at low risk
   3. Green: Is not overdue for at least six months, and is at low risk

## Mission-Critical Function

Given a patient snapshot, determine:

1. which preventable/treatable conditions are most likely to escalate to emergency care if unaddressed
2. how often those conditions should be screened/monitored
3. whether the patient is overdue right now based on their actual last screening dates
4. What medication/screening/drug/at-home treatment/specialist visit/behavior/etc. Should be addressed
+ Sorts patients from highest-priority, to enable the highest-important actions to be taken first

For the 6.5 million Canadians without a family doctor, the same engine powers a self-service care navigator that tells people what they need and who can help, routing them to the least-strained provider capable of addressing it based upon them uploading as many pieces of data about their health and metrics as they have (age, weight, sex, medical history, conditions, concerns, family history, etc.).

---

## What We're Building

Two interfaces on a single clinical intelligence engine:

**Clinician View** — A proactive panel management tool. The system ingests a patient panel (2,000 Synthea patients), determines the next best clinical action for each — whether that's an overdue screening, a medication that should be started, a specialist referral, or a follow-up after an abnormal finding — and surfaces a prioritized action queue: who to act on first, what to do, and why. The AI agent can drill into any patient, explain the clinical reasoning, and render bespoke UI. Everything is based upon and cited from the docs in the vector database, with no exception.

**Patient View** — A self-service care navigator for unattached patients. A person without a family doctor enters their health information conversationally. The same engine determines what clinical actions they likely need — screenings, medication reviews, referrals, follow-ups — and routes them to the right provider type. Not necessarily "see a doctor", but "a pharmacist can monitor your blood pressure," "a dietitian can help with diabetes management," or "you need a walk-in clinic to get this referral." Every recommendation is cited against clinical guidelines.

Both interfaces run on the same core: Risk Confluence Vector (RCV) \+ Screening Recency Vector (SRV) → deterministic factoring → prioritized, evidence-backed next best actions and priority ranking based upon the factor of the two vectors.

---

## Hackathon Alignment

### Track: Clinical AI

"Build an AI-powered tool that improves clinical workflows, patient care, or healthcare delivery using the provided Synthea patient dataset."

We directly address:

- **Clinical workflow improvement**: Proactive queue replaces reactive panel management — surfaces the next best action per patient
- **Patient care improvement**: Catches missed screenings, needed medication starts, overdue referrals, and follow-up gaps before conditions escalate to emergency
- **Healthcare delivery**: Routes unattached patients to the right level of care, weighted toward less-strained providers

### Scoring Rubric Mapping

| Criteria                 | Weight | Our Story                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| :----------------------- | :----- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Innovation**           | 25%    | Not a chatbot or dashboard. A two-vector proactive engine (RCV/SRV) that connects patient data to clinical guidelines, then does the math to determine what's overdue and how urgent it is. No AI guessing — evidence retrieval + arithmetic. The same engine serves clinicians AND patients — two interfaces, one architecture. Generative UI (OpenUI) means every query produces a bespoke clinical view, not a static page. |
| **Technical Execution**  | 25%    | Two-vector patient model, RAG evidence retrieval with citations, deterministic comparator (no hallucination on the critical path), append-only run history, operational queue scoring algorithm. Full-stack: Next.js 16, Supabase \+ pgvector, Drizzle ORM, Claude Opus 4.6, Vercel AI SDK, 23 OpenUI components, hybrid RAG pipeline. |
| **Impact Potential**     | 25%    | 6.5M Canadians lack a family doctor. Clinics drown in reactive care. ER closures across provinces. This system: (1) lets clinics surface the highest-value next action for every patient — the intervention most likely to prevent an ER visit — and (2) gives unattached patients evidence-based guidance on what they need and who can help. Every recommendation is auditable, guideline-cited, and clinician-reviewable. Designed as decision support under Health Canada's SaMD exclusion criteria. |
| **Presentation Quality** | 15%    | Two-perspective demo: clinician queue drill-down, then patient self-service navigation. Problem → solution → live demo → impact in 5 minutes.                                                                                                                                                                                                                                                                                                                                                            |
| **Design & UX**          | 10%    | AI IS the interface. Natural language in, actionable recommendations out. Generative UI renders clinical views tailored to the question. Zero cognitive load, zero behavior change. Warm teal design system, glass aesthetic for AI panel, clean data display.                                                                                                                                                                                                                                           |

### BuildersVault Values Alignment

BuildersVault's mission: *"Real datasets. Real problems. Real impact."* Converting hackathon output into funded, deployed projects.

- **Real dataset**: We ingest the full Synthea dataset (2,000 patients, 10,000 encounters, 5,000 medications, 3,000 labs, 2,000 vitals) and demonstrate clinical reasoning against it
- **Real problem**: Canadian healthcare access crisis, preventive screening gaps, reactive care model, backlogs, lack of access, making use of the available data to make productive and proactive recommendations
- **Real impact**: The proactive engine is architecturally deployable — same logic works against a real EHR feed. The patient navigator addresses an immediate unmet need for millions of Canadians
- **Private Compatibility**: Architecture is containerizable; the core engine could run inside sandbox infrastructure for private, on-premise deployment in hospital or clinic environments

### Submission Requirements

- [ ] Single shareable link (GitHub repo) openable on organizer's laptop
- [ ] Slides (PDF or Google Slides link) in repo README
- [ ] README includes: team members, challenge track, problem statement, solution summary, tech stack, how to run/view demo
- [ ] Deployed to Vercel (live demo link)
- [ ] Code freeze: Saturday March 28, 3:30 PM

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
- Any other relevant information in patient file

**Screening Recency Vector (SRV)** — when each relevant clinical action was last addressed:

- Condition/action type → last completed date → result status
- Covers screenings, medication initiations, referrals, follow-ups after abnormal findings
- Derived from encounters, labs, medication history, and preventive history

### Step 2: Evidence Connection (RAG Retrieval)

The RCV is used to query the clinical knowledge corpus (vector DB) for relevant guideline content. This is retrieval, not generation — the system connects the patient's specific risk profile to the specific guideline passages that apply to them.

The retrieved evidence tells us: what conditions this patient profile maps to, what clinical actions are recommended by guidelines for those conditions, and at what intervals. The LLM's role is to read the patient data and the retrieved guidelines, then connect the dots — structuring the output so the deterministic comparator can work against it.

There is no AI "guessing" about what a patient needs. The guidelines say what's needed. The patient data says what's present. The system connects the two.

### Step 3: Deterministic Comparator (No AI — Pure Math)

For each target from Step 2:

1. Find matching last-addressed date in the SRV (screening completed, medication started, referral made, follow-up done)
2. `due_date = last_addressed + interval_days`
3. `overdue_days = today - due_date`
4. Status: `overdue_now` (\>0) | `due_soon` (\<=30 days) | `up_to_date` | `unknown_due` (no record of action)

This is the critical trust design: the guidelines say what's needed, the patient data shows what's been done (or not), and math determines urgency. No AI guessing on the decision-critical path.

**It is acceptable for some patients to have no recommended action.** A typical healthy young person should not have unneeded screenings etc. noted, that is noise. Annual checkup is not within our scope of recommended action — we are aiming to address specific conditions, ongoing treatments, etc.

### Step 4: Priority Scoring & Categorization

Score each target by combining risk tier, overdue severity, and confidence. Use this to sort into the three dashboard categories:

- **Red**: Overdue and high risk — needs action now
- **Yellow**: Overdue and lower risk — needs action but less urgent
- **Green**: Not overdue for at least six months, low risk

Within each category, split by **high confidence** (rich patient data, strong vector DB match) vs **low confidence** (sparse data, uncertain). This gives clinicians immediate visual triage.

### Step 5: Provider Routing Examples (Patient Mode Only)

Map condition \+ screening type → appropriate provider: (examples, non-exhaustive)

| Screening Need              | Provider Route                | Why                                          |
| :-------------------------- | :---------------------------- | :------------------------------------------- |
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

| CSV               | Records | Target Table   | Key Fields                                                                                                             |
| :---------------- | :------ | :------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `patients.csv`    | 2,000   | `patients`     | patient\_id, name, DOB, age, sex, postal\_code, blood\_type, insurance\_number                                         |
| `encounters.csv`  | 10,000  | `encounters`   | encounter\_id, patient\_id, date, type, facility, chief\_complaint, ICD-10-CA diagnosis, CTAS triage, disposition, LOS |
| `medications.csv` | 5,000   | `medications`  | medication\_id, patient\_id, drug\_name, DIN code, dosage, frequency, route, active status                             |
| `lab_results.csv` | 3,000   | `observations` | lab\_id, patient\_id, encounter\_id, LOINC code, value, unit, reference range, abnormal\_flag                          |
| `vitals.csv`      | 2,000   | `observations` | vitals\_id, patient\_id, encounter\_id, HR, BP, temp, respiratory rate, O2 sat, pain scale                             |

Schema modifications needed: rewrite the entire schema based on what is needed for this project. The existing schema was an example for our boilerplate. When in doubt, include more fields & more information, as we can always skip using it — but if we miss things upon ingestion, there is no way of getting it all back.

### Shared Resources

- `canadian_drug_reference.csv` — 100 common Canadian drugs with DIN, class, indication
- FHIR R4 sample resources — reference for data normalization
- `utilities.py` — helper functions (Python, for reference)

### Knowledge Corpus (RAG)

Clinical guidelines for the risk prompt's retrieval context. Options:

- Upload key guideline documents via existing Settings page / POST to `/api/documents`
- Use existing RAG pipeline: Unstructured.io or local processing → chunking → Gemini embeddings → pgvector
- At minimum: Canadian preventive care guidelines, BC-specific screening recommendations, **condition-specific management guidelines**

---

## Build Phases

### Phase 1: Data Foundation (Friday Night)

**Goal**: Real patient data in the database, queryable by existing agent tools.

- [ ] Adapt Drizzle schema for Synthea CSV structure (new fields, type adjustments)
- [ ] Write import script for all 5 CSVs → Supabase
- [ ] Verify existing agent tools (`queryPatients`, `getPatientDetail`) work against new data
- [ ] Verify dashboard renders with real data

### Phase 2: Core Engine (Friday Night → Saturday Morning)

**Goal**: RCV/SRV construction, evidence connection, and deterministic comparison working for individual patients.

- [ ] Patient Context Builder: function that assembles RCV \+ SRV from DB for a given patient
- [ ] Evidence retrieval: RCV → vector DB query → relevant guideline passages with citations
- [ ] Connection step: LLM reads patient data + retrieved guidelines, structures the targets (what action, what interval, why)
- [ ] Deterministic comparator: structured targets × SRV → overdue status (pure math)
- [ ] Categorization: Red/Yellow/Green + confidence scoring
- [ ] New agent tool: `assessPatient` — runs the full pipeline for a patient and returns structured recommendations

### Phase 3: Clinician Queue View (Saturday Morning)

**Goal**: Dashboard shows the three-column prioritized view.

- [ ] Batch-run engine on a meaningful subset of patients (e.g., 50-100 high-signal patients)
- [ ] Store results in pathway\_target\_run\_facts table
- [ ] Three-column dashboard: Red (overdue \+ high risk) | Yellow (overdue \+ lower risk) | Green (not due for 6+ months)
- [ ] Each column split into high-confidence and low-confidence sections
- [ ] Drill-down: click patient → agent explains reasoning with OpenUI components
- [ ] Build out patient detail page (currently a stub)

### Phase 4: Patient Navigator (Saturday Morning → Afternoon)

**Goal**: Consumer-facing chat flow using the same engine.

- [ ] `/navigator` route with full-screen agent panel, consumer-friendly framing
- [ ] Patient-mode system prompt: conversational intake → RCV construction → evidence connection → next-step recommendations
- [ ] Provider routing logic: condition/screening → provider type \+ explanation
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

- Open dashboard → show the three-column view: Red, Yellow, Green
- "BestPath has analyzed 2,000 patients against clinical guidelines. Red column: overdue and high risk. Yellow: overdue, lower risk. Green: on track."
- Each column shows high-confidence and low-confidence sections
- Click a red/high-confidence patient → agent explains reasoning with evidence citations
- Show variety: "This patient needs BP medication started. This one needs a nephrology referral. This one is overdue for colonoscopy surveillance."
- Show the deterministic logic: "The guidelines say what's needed. The patient data shows what's been done. The math confirms what's overdue. The clinician decides."

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

"Same engine, two interfaces. The system connects patient data to clinical guidelines, then does the math on what's overdue. No AI guessing — just evidence retrieval, pattern matching, and arithmetic. Every recommendation is guideline-cited and clinician-reviewable."

### Act 5: Impact (30 seconds)

"Augment clinician capacity. Navigate patients to the right care. Prevent emergencies before they happen. This is what proactive healthcare looks like."

---

## Key Technical Decisions

| Decision                                         | Choice                                   | Why                                                                                                                                                                  |
| :----------------------------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guidelines define actions, math confirms urgency | Evidence retrieval \+ deterministic math | Trust. No AI guessing — the system connects patient data to guideline evidence, then does the math on what's overdue. The LLM reads and connects; it doesn't decide. |
| Same engine for clinician \+ patient             | Single architecture                      | Innovation story. Reduces build scope. Doubles impact narrative.                                                                                                     |
| OpenUI generative components                     | Agent renders bespoke views              | Every query produces a tailored clinical view, not a static dashboard. No new UI to learn.                                                                           |
| RAG for clinical guidelines                      | Evidence-backed recommendations          | Every recommendation is traceable to a source document.                                                                                                              |
| Provider-type routing                            | Condition → least-strained provider      | Directly addresses "no family doctor" crisis. Routes away from ER/GP when possible.                                                                                  |
| Structured JSON model output                     | Forced schema                            | Enables deterministic comparator downstream. No freeform text on the critical path.                                                                                  |
| Append-only run history                          | Reproducibility \+ audit trail           | Every recommendation is traceable by run\_id, corpus version, timestamp.                                                                                             |

---

## Regulatory Framing (One Sentence for Judges)

"BestPath is designed as a clinical decision support system under Health Canada's SaMD exclusion criteria — it augments clinical judgment, never replaces it. All recommendations require clinician review. All data processing can run in a private environment with zero data leaving the hospital."

---

## File References

| Document                       | Location                                                         | Purpose                                                 |
| :----------------------------- | :--------------------------------------------------------------- | :------------------------------------------------------ |
| Core two-vector model          | `docs/spec/core_two_vector_operating_model.md`                   | RCV/SRV construction standard                           |
| End-to-end blueprint           | `docs/spec/minimal_end_to_end_system_blueprint.md`               | System modules, data contracts, output schema           |
| Prompt \+ comparator framework | `docs/spec/patient-query-orchestration-framework.md`             | Prompt construction and comparator logic                |
| Triage framework               | `docs/spec/patient-vector-triage-framework.md`                   | Balanced context building, branch logic                 |
| Operation flowsheet            | `docs/spec/current_theoretical_operation_flowsheet.md`           | Mermaid diagram of full flow                            |
| Validation plan                | `docs/spec/validation_acceptance_plan.md`                        | Gold set design, acceptance criteria                    |
| Corpus audit                   | `docs/spec/corpus_capability_risk_screening_audit.md`            | Knowledge coverage assessment                           |
| Condition mapping (draft)      | `docs/spec/condition_screening_mapping_reference_unverified.csv` | 50 condition → screening mappings                       |
| Synthetic test cases           | `docs/spec/synthetic_dataset_bundle/`                            | 100 patient cases \+ answer keys                        |
| Hackathon data                 | `hackathon-data/track-1-clinical-ai/`                            | Synthea CSVs (patients, encounters, meds, labs, vitals) |
| Challenge tracks PDF           | `hackathon-data/hackathon-challenge-tracks.pdf`                  | Official scoring rubric and submission requirements     |
