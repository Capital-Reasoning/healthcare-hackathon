# Hackathon Research Findings
> Compiled 2026-03-27 for BestPath project

---

## 1. RAG Pipeline Best Practices for Clinical Guidelines

### Chunking Strategies for Clinical Documents

**Semantic/Adaptive chunking** dramatically outperforms fixed-size chunking for clinical guidelines:

- **Fixed-size chunking** (e.g., 1000 chars) breaks semantic boundaries and severs critical clinical relationships. Avoid for guidelines.
- **Recursive character splitting** respects paragraph > sentence > punctuation boundaries. Better, but still not optimal.
- **Adaptive semantic chunking** (recommended): Tokenize into sentences with spaCy, compute embeddings per sentence via SentenceTransformer, maintain a chunk until cosine similarity drops below ~0.8 threshold, then start a new chunk. This produces variable-length chunks aligned to topic boundaries.
  - Results: Increased fully-relevant responses from 80% to 93%, reduced variability (SD from 0.81 to 0.40-0.55).
  - Use 100-char overlap between adjacent chunks.
- **Hierarchical chunking**: Preserve document structure at multiple levels (section > paragraph > sentence). Attach metadata at each level: section type, hierarchy level, guideline version, publication date, specialty area.
- **Element-aware chunking**: Tables chunked as complete units (never row-by-row). Numbered lists and procedure steps treated as atomic units. Tables augmented with natural language descriptions for semantic discoverability.

**For our project**: Use semantic chunking with the LlamaParse output. Chunk tables as whole units. Add metadata for guideline source, section type, population, and date.

### Embedding Models for Medical Text

- **MedEmbed** family (Small/Base/Large) outperforms general-purpose embeddings by 10%+ on medical IR benchmarks. MedEmbed-Small even beats larger general-purpose models.
- **BM25** can outperform semantic embeddings on highly structured clinical docs. This supports using hybrid search.
- **Fine-tuning** on target guideline-query pairs (even synthetically generated) further optimizes embeddings.

**For our project**: Gemini embeddings (already in stack) are solid. Hybrid search with BM25 is critical.

### Hybrid Search Architecture (Vector + Keyword)

Hybrid search combining BM25 (keyword) + vector (semantic) via **Reciprocal Rank Fusion (RRF)** consistently outperforms either alone:

```
RRF(d) = Sum(1 / (k + rank(d)))   where k = 60 typically
```

- BM25 excels at: exact drug names, lab values, procedure codes, negation ("does NOT have diabetes")
- Vector excels at: synonymy ("SGLT2 inhibitor" = "empagliflozin"), conceptual similarity
- Equal weighting (0.5/0.5) is robust across clinician query types

**For our project**: Already using hybrid search with pgvector. Ensure BM25/keyword component is weighted equally with vector.

### Re-ranking for Clinical Relevance

Two-stage retrieval is state-of-the-art:
1. **Stage 1**: Efficient initial retrieval (top 20-30 candidates) via bi-encoder embeddings
2. **Stage 2**: Re-rank with cross-encoder (ColBERT or similar) for token-level semantic alignment

- ModernBERT + ColBERT achieved highest accuracy (0.4448) on MIRAGE medical QA benchmark
- Re-ranking improved recall@3 by up to 4.2 percentage points
- Jina Reranker v3 (0.6B params) achieves SOTA at 10x smaller than generative re-rankers

**For our project**: Consider adding a lightweight re-ranking step before passing context to Claude. Even a simple relevance scoring prompt could help.

### Real-World Implementation Results

**NICE Guidelines RAG system** (300 guidelines, 10,195 chunks):
- Mean Reciprocal Rank: 0.814
- Recall@10: 99.1%
- Faithfulness: 99.5% (GPT-4 class)
- 67% reduction in unsafe responses vs non-augmented
- 98.7% clinical accuracy per expert evaluation

**FDA Guidance RAG system**:
- Correct source citation: 89.2% of the time
- GPT-4 Turbo: 69.6% correct/helpful responses

### Evaluation Framework (RAGAS)

Four critical dimensions:
1. **Faithfulness**: Are answers supported by retrieved docs (no hallucination)?
2. **Answer Relevancy**: Do responses address the question?
3. **Context Precision**: Are top-retrieved chunks relevant?
4. **Context Recall**: Did retrieval capture all necessary info?

---

## 2. Canadian Preventive Care Screening Guidelines (CTFPHC)

### Colorectal Cancer Screening

| Population | Recommendation | Test | Interval | Strength |
|-----------|---------------|------|----------|----------|
| Age 50-59 | Screen | FOBT/FIT or flex sig | Every 2y (FOBT/FIT) or 10y (flex sig) | Weak rec, moderate evidence |
| Age 60-74 | Screen | FOBT/FIT or flex sig | Every 2y (FOBT/FIT) or 10y (flex sig) | Strong rec, moderate evidence |
| Age 75+ | Do not screen | -- | -- | Weak rec, low evidence |
| Any age | Do NOT use colonoscopy as routine screening | -- | -- | -- |

**Recent development**: Canadian Cancer Society calling to lower start age to 45 (incidence in <50 rising 2-2.5x). CTFPHC expected to review in April 2026.

### Breast Cancer Screening

| Population | Recommendation | Test | Interval | Strength |
|-----------|---------------|------|----------|----------|
| Women 40-49 | Do not systematically screen | Mammography | -- | Conditional, very low certainty |
| Women 50-74 | Screen | Mammography | Every 2-3 years | Conditional, very low certainty |
| Women 75+ | Do not screen | -- | -- | Conditional, very low certainty |
| Dense breasts (C/D) | No supplemental MRI/ultrasound | -- | -- | Conditional, very low certainty |

**Key shift**: 2024 draft emphasizes shared decision-making. Screening is a personal choice. Mortality declining (41.7 to 21.8 per 100K from 1989-2024).

### Cervical Cancer Screening

| Population | Recommendation | Test | Interval | Strength |
|-----------|---------------|------|----------|----------|
| Women <20 | Do not screen | -- | -- | Strong, high evidence |
| Women 20-24 | Do not screen | -- | -- | Weak, moderate evidence |
| Women 25-29 | Screen | Pap test | Every 3 years | Weak, moderate evidence |
| Women 30-69 | Screen | Pap test | Every 3 years | Strong, high evidence |
| Women 70+ (adequately screened) | May cease | -- | -- | Weak, low evidence |

**Emerging**: HPV self-collection testing approved by FDA. Ontario now screens every 5 years with HPV test for age 25+.

### Lung Cancer Screening

| Population | Recommendation | Test | Interval | Strength |
|-----------|---------------|------|----------|----------|
| Age 55-74, >=30 pack-years, current/quit <15y | Screen | Low-dose CT | Annual x 3 consecutive | Weak, low evidence |
| All other adults | Do not screen | -- | -- | Strong, very low evidence |
| Any | Do NOT use chest X-ray | -- | -- | Strong, low evidence |

Must be done in settings with expertise in early lung cancer diagnosis/treatment.

### Diabetes Screening

| Population | Recommendation | Test | Interval |
|-----------|---------------|------|----------|
| Age 40+ or high-risk (CANRISK) | Screen | FPG and/or A1C | Every 3 years |
| Very high risk (50% 10y risk) | Screen | FPG and/or A1C | Every 6-12 months |
| All individuals | Annual risk evaluation | CANRISK questionnaire | Annually |

Risk factors: family history, non-white ethnicity, low SES, gestational diabetes history, CVD risk factors.

### Hypertension Screening

| Population | Recommendation | Frequency |
|-----------|---------------|-----------|
| All adults 18+ | Measure BP at appropriate primary care visits | New patient visits, periodic exams, neuro/CV urgent visits |
| BP 130-139/85-89 | Annual follow-up | Annually |
| BP >=140/>=90 | Follow-up within 1 month | Then ABPM or HBPM |

### Cardiovascular Risk / Lipid Screening

| Population | Recommendation | Test | Interval |
|-----------|---------------|------|----------|
| Men 40+, Women 50+ (or menopause) | Screen lipids | Fasting or non-fasting lipid panel | -- |
| Age 40-75 | Calculate CV risk | Modified Framingham or CLEM | Every 5 years |
| South Asian, Indigenous | Screen earlier | Same | Same |
| FRS <10% (low risk) | Lifestyle modification (unless LDL >=5.0) | -- | -- |
| FRS 10-19.9% + LDL >=3.5 | Statin therapy | -- | -- |
| FRS >=20% | Statin therapy | -- | -- |

**2026 update**: Lp(a) testing now recommended for all adults.

### Osteoporosis / Fragility Fracture Screening

| Population | Recommendation | Approach |
|-----------|---------------|----------|
| Women 65+ | Screen (risk-first) | FRAX without BMD first, then DXA if pharmacotherapy considered |
| Women 40-64 | Do not screen | Strong rec, very low evidence |
| Men 40+ | Do not screen | Strong rec, very low evidence |

### Prostate Cancer

| Population | Recommendation |
|-----------|---------------|
| Men <55 | Do not screen with PSA (strong) |
| Men 55-69 | Do not screen with PSA (weak) |
| Men 70+ | Do not screen with PSA (strong) |

### Other Key Screenings

| Screening | Population | Recommendation |
|-----------|-----------|---------------|
| Abdominal Aortic Aneurysm | Men 65-80 | One-time ultrasound (weak rec) |
| Chlamydia/Gonorrhea | Sexually active <30 | Annually at primary care (conditional) |
| Depression | All adults | Do NOT universally screen with questionnaire (strong, 2025 update) |
| Cognitive Impairment | Adults 65+ | Do NOT screen asymptomatic (strong, 2024 reaffirmed) |
| Thyroid Dysfunction | Asymptomatic adults | Do NOT screen (strong) |
| Vision Impairment | Adults 65+ | Do NOT screen in primary care (weak) |

---

## 3. Synthea Synthetic Patient Data: Structure and Best Practices

### FHIR Bundle Structure

Each Synthea patient generates one FHIR Bundle (type: `transaction`) containing:

1. **Patient** - Demographics (name, DOB, gender, race, ethnicity, address, SSN, drivers license)
2. **Encounter** - Each clinical visit (type, period, reason, provider, organization)
3. **Condition** - Diagnoses (code, onset, abatement, verification status, clinical status)
4. **Observation** - Vitals and labs (code, value, units, effective date, reference ranges)
5. **MedicationRequest** - Prescriptions (medication code, dosage, status, authored date)
6. **Procedure** - Clinical procedures (code, performed period, encounter reference)
7. **Immunization** - Vaccination records
8. **CarePlan** - Active care plans with activities
9. **AllergyIntolerance** - Documented allergies
10. **DiagnosticReport** - Lab panels and imaging reports
11. **Claim** / **ExplanationOfBenefit** - Insurance/billing

Resources are grouped by Encounter in chronological order. Organizations and Practitioners exported separately (referenced by multiple patients).

### CSV Export Format

Enable with `exporter.csv.export = true` in `synthea.properties`. Generates separate files:

| File | Key Columns |
|------|------------|
| `patients.csv` | Id, BIRTHDATE, DEATHDATE, SSN, FIRST, LAST, RACE, ETHNICITY, GENDER, CITY, STATE, ZIP |
| `encounters.csv` | Id, START, STOP, PATIENT, ENCOUNTERCLASS, CODE, DESCRIPTION, REASONCODE, REASONDESCRIPTION |
| `conditions.csv` | START, STOP, PATIENT, ENCOUNTER, CODE, DESCRIPTION |
| `observations.csv` | DATE, PATIENT, ENCOUNTER, CODE, DESCRIPTION, VALUE, UNITS, TYPE |
| `medications.csv` | START, STOP, PATIENT, ENCOUNTER, CODE, DESCRIPTION, REASONCODE, REASONDESCRIPTION |
| `procedures.csv` | DATE, PATIENT, ENCOUNTER, CODE, DESCRIPTION, REASONCODE, REASONDESCRIPTION |
| `immunizations.csv` | DATE, PATIENT, ENCOUNTER, CODE, DESCRIPTION |
| `careplans.csv` | Id, START, STOP, PATIENT, ENCOUNTER, CODE, DESCRIPTION, REASONCODE, REASONDESCRIPTION |
| `allergies.csv` | START, STOP, PATIENT, ENCOUNTER, CODE, DESCRIPTION |

Patient UUID is the foreign key across all tables.

### CSV vs FHIR JSON: Which to Use

| Factor | CSV | FHIR JSON |
|--------|-----|-----------|
| **Import speed** | Fast (direct SQL COPY) | Slower (parse JSON bundles) |
| **Relational DB** | Natural fit | Requires transformation |
| **Relationships** | Foreign keys (PATIENT, ENCOUNTER) | FHIR References |
| **Richness** | Fewer fields | Full FHIR resource detail |
| **Standards compliance** | Custom schema | FHIR R4 compliant |

**For our project**: CSV is ideal for PostgreSQL import. Use CSV for the relational data store, FHIR JSON if we need full resource fidelity.

### Disease Modules and Care Gaps

Synthea uses **state transition machines** for disease modeling:
- Each module represents a disease/condition lifecycle
- Patients flow through states based on logical conditions + weighted randomness
- Modules model: onset, diagnosis, treatment, monitoring, progression, resolution/death
- Created from clinical care protocols + publicly available incidence/prevalence stats

**Extracting care gaps from Synthea data**:
1. Build clinical timeline per patient from encounters + conditions + observations + medications
2. Compare against screening guidelines (age + sex + condition-based rules)
3. Look for: missing screenings by age, lapsed follow-ups, medication gaps, missing lab monitoring
4. Synthea data has realistic temporal gaps -- patients don't always follow up

### Import Tips for Hackathon

1. **CSV import is fastest**: `COPY` directly into PostgreSQL tables
2. **Patient UUID is the universal join key** across all CSV files
3. **SNOMED CT codes** are used for conditions; **LOINC codes** for observations; **RxNorm** for medications
4. **Watch for**: NULL STOP dates (ongoing conditions), DEATHDATE (deceased patients), encounter class types (ambulatory, emergency, inpatient, wellness)
5. **Temporal ordering**: Sort by date to build timelines. Encounters are the organizing unit.
6. **Data volume**: Default Synthea generates ~1000 patients. Can configure population size, demographics, geographic distribution.

---

## 4. Clinical Decision Support (CDS) Architecture

### Encoding Clinical Rules

Production CDS systems encode rules using several approaches:

**1. Deterministic Rule Engines**:
- If-then rules with patient data inputs: `IF age >= 50 AND sex = 'F' AND no_mammogram_in(2_years) THEN alert('Breast cancer screening due')`
- Rules organized by: screening type, target population, interval, contraindications
- Rule priority: urgency weighting, evidence grade, patient risk level

**2. Clinical Quality Language (CQL)**:
- HL7 standard for expressing clinical logic
- Same standard used for both electronic clinical quality measures (eCQM) and CDS
- Compiles to ELM (Expression Logical Model) for execution
- Can query FHIR resources directly

**3. HEDIS Measures (Healthcare Effectiveness Data and Information Set)**:
- NCQA-developed quality measures defining specific care gaps
- Examples: Colorectal Cancer Screening (COL), Breast Cancer Screening (BCS), Comprehensive Diabetes Care (CDC)
- Each measure defines: eligible population, numerator (who received care), denominator (who should have)
- CQL logic performs the "heavy lift" of measure calculation

### Care Gap Concept

A **care gap** = discrepancy between care provided and recommended best practices.

Detection pattern:
```
For each patient:
  For each applicable guideline (based on age, sex, conditions):
    Check if required action was performed within the required interval
    If not -> care gap identified
    Score gap by: overdue duration, clinical severity, evidence grade
```

### Scoring and Prioritization Frameworks

Real CDS systems prioritize overdue actions using multi-factor scoring:

| Factor | Weight | Example |
|--------|--------|---------|
| **Clinical severity** | High | Cancer screening > routine lab |
| **Time overdue** | Medium | 2 years overdue > 1 month overdue |
| **Evidence grade** | Medium | Strong rec > weak rec |
| **Patient risk level** | High | High-risk patient > average risk |
| **Intervention complexity** | Low | Simple lab order > specialist referral |
| **Potential harm of delay** | High | Progressing condition > stable monitoring |

Example priority scoring:
```
priority_score =
  (severity_weight * severity) +
  (overdue_weight * months_overdue / expected_interval) +
  (evidence_weight * evidence_grade) +
  (risk_weight * patient_risk_level)
```

### CDS Hooks Standard (HL7)

RESTful API for integrating CDS into EHR workflows:

- **Hooks**: Trigger points in clinical workflow (patient-view, order-select, order-sign, encounter-start)
- **CDS Service**: External service called at hook trigger with patient context
- **Cards**: Response format containing:
  - Information cards (text alerts)
  - Suggestion cards (proposed orders)
  - App Link cards (launch SMART on FHIR app)
- **Prefetch**: Allows CDS service to specify what FHIR data it needs upfront

**Architecture**:
```
EHR (CDS Client) -> Hook fires -> HTTP POST to CDS Service
CDS Service receives: hook, context, patient FHIR data (prefetch)
CDS Service returns: Cards[] with indicators, suggestions, links
```

### NYU Langone Example (Real-World)

- Best-practice alerts fire when care gap detected during patient visit
- Dynamic, individualized order set generated per patient
- 30 care quality protocols as of Feb 2024
- Orders auto-populated based on patient's unique factors

### Combining Deterministic Rules with AI/ML

**Hybrid approach** (recommended for our project):

1. **Deterministic layer**: Rule engine evaluates all patients against screening guidelines. Produces definitive care gaps with no ambiguity.
2. **ML/AI layer**: Risk stratification, prioritization, natural language explanation.
3. **RAG layer**: When clinician asks "why?" or "what does the guideline say?", retrieve relevant guideline text.

```
Patient Data -> Deterministic Rules -> Care Gaps List
Care Gaps -> Scoring Engine -> Prioritized Actions
Prioritized Actions -> AI Agent (Claude) -> Natural Language Summary + Generative UI
User Question -> RAG Pipeline -> Guideline Evidence -> Claude -> Cited Answer
```

### Open-Source CDS Tools

- **CQL Engine** (HL7): Reference implementation for Clinical Quality Language
- **CDS Hooks Sandbox** (HL7): Testing tool for CDS Hooks services
- **OpenCDS**: Open-source CDS framework
- **HAPI FHIR**: Java-based FHIR server with CDS support
- **CQF Ruler**: FHIR server with CQL execution engine built on HAPI FHIR

---

## 5. Vercel AI SDK Generative UI Patterns

### IMPORTANT: AI SDK RSC is Paused

> Development of AI SDK RSC (`ai/rsc`) is paused. Vercel recommends using **AI SDK UI** (`ai/react`) for production. AI SDK UI now supports generative UI via tool-based rendering on the client side.

### Current Recommended Approach: AI SDK UI with useChat + Tools

Instead of streaming React Server Components, the recommended pattern is:

1. **Server**: Use `streamText()` with tools that return structured data
2. **Client**: Use `useChat()` hook with tool rendering on the client
3. **Components**: Render tool call results as React components client-side

```typescript
// Server: route.ts
import { streamText, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-opus-4-6'),
    messages,
    tools: {
      showPatientCard: tool({
        description: 'Display a patient summary card',
        parameters: z.object({
          patientId: z.string(),
          name: z.string(),
          riskLevel: z.enum(['low', 'medium', 'high']),
          careGaps: z.array(z.object({
            type: z.string(),
            overdueDays: z.number(),
            priority: z.string(),
          })),
        }),
        // No execute = client-side rendering
      }),
    },
  });

  return result.toDataStreamResponse();
}

// Client: Chat.tsx
import { useChat } from 'ai/react';

function Chat() {
  const { messages } = useChat({
    api: '/api/chat',
  });

  return messages.map(m => {
    // Check for tool invocations
    if (m.toolInvocations) {
      return m.toolInvocations.map(tool => {
        if (tool.toolName === 'showPatientCard') {
          return <PatientCard {...tool.args} />;
        }
      });
    }
    return <div>{m.content}</div>;
  });
}
```

### Legacy RSC Approach (Still Works, Not Recommended for New Projects)

The `streamUI` function from `ai/rsc`:

```typescript
import { streamUI } from 'ai/rsc';

const result = await streamUI({
  model: anthropic('claude-opus-4-6'),
  prompt: 'Show patient dashboard',
  text: ({ content }) => <div>{content}</div>,
  tools: {
    patientCard: {
      description: 'Show patient info',
      parameters: z.object({ ... }),
      generate: async function* ({ patientId }) {
        yield <Loading />;  // Streaming skeleton
        const patient = await getPatient(patientId);
        return <PatientCard patient={patient} />;
      },
    },
  },
});
```

### createStreamableUI and createStreamableValue

```typescript
import { createStreamableUI, createStreamableValue } from 'ai/rsc';

// Streamable UI - stream React components
const ui = createStreamableUI(<Loading />);
ui.update(<PartialResults data={partial} />);
ui.done(<FinalResults data={complete} />);

// Streamable Value - stream serializable data
const value = createStreamableValue(0);
value.update(50);
value.done(100);
```

### State Management for Generative UI

Two types of state:
1. **AI State** (server-side): Serializable conversation history, tool calls, context. JSON-serializable.
2. **UI State** (client-side): Actual React components rendered. Can contain non-serializable elements.

```typescript
import { createAI } from 'ai/rsc';

const AI = createAI({
  initialAIState: [],   // Conversation history
  initialUIState: [],    // React elements
  actions: { submitMessage },
});
```

### Architecture for Our Project (OpenUI)

Given that AI SDK RSC is paused but our project already uses an OpenUI pattern:

**Recommended hybrid approach**:
1. Keep our existing OpenUI `defineComponent` library (23 components)
2. Use `useChat` + tools for the chat interaction layer
3. When Claude calls a tool, match tool name to OpenUI component, render on client
4. For streaming: use `useChat`'s built-in streaming for text, tool calls trigger component renders
5. Progressive rendering: show skeleton/loading state while tool executes, swap in final component

```
User Message -> useChat -> /api/chat -> streamText + tools
  -> Text chunks stream to client (real-time)
  -> Tool calls stream structured data
  -> Client matches tool to OpenUI component
  -> Component renders with tool args as props
```

---

## Key Takeaways for BestPath Implementation

### Architecture Summary

```
┌─────────────────────────────────────────────────────┐
│                   DATA LAYER                         │
│  Synthea CSV -> PostgreSQL (patients, encounters,    │
│  conditions, observations, medications, procedures)  │
│  + Clinical Guidelines -> LlamaParse -> pgvector     │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              DETERMINISTIC CDS ENGINE                │
│  For each patient, evaluate CTFPHC guidelines:       │
│  - Age/sex eligibility for each screening            │
│  - Last screening date from encounters/observations  │
│  - Calculate: overdue status, months overdue         │
│  - Score: severity * overdue * evidence * risk       │
│  Output: Prioritized care gaps per patient           │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              RAG + AI AGENT LAYER                    │
│  Claude Opus 4.6 with tools:                        │
│  - queryPatients (with care gap data)               │
│  - getPatientDetail (with prioritized actions)      │
│  - searchDocuments (hybrid: vector + BM25 via RRF)  │
│  - getCareGaps (new tool: population-level gaps)    │
│  Output: Natural language + OpenUI components        │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              GENERATIVE UI LAYER                     │
│  useChat + tool-based rendering                      │
│  OpenUI component library (23 components)            │
│  Progressive rendering with loading states           │
│  Cards, charts, timelines, risk badges               │
└─────────────────────────────────────────────────────┘
```

### Priority Implementation Order

1. **Import Synthea data** via CSV into existing schema (patients, encounters, conditions, observations, medications)
2. **Encode CTFPHC screening rules** as deterministic logic (age/sex/interval checks)
3. **Build care gap detection** comparing patient history against rules
4. **Score and prioritize** care gaps using multi-factor formula
5. **Expose via agent tools** so Claude can query care gaps per patient and population-wide
6. **RAG the guidelines** so Claude can cite specific CTFPHC recommendations when explaining gaps
7. **Render via OpenUI** components (RiskBadge, Timeline, PatientCard, DataTable, StatCard)
