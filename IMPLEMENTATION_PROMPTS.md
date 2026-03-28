# BestPath Implementation Prompts

**Execute these prompts in order. Each is self-contained and can be fed directly to Claude Code.**

**Context snapshot at time of writing:**
- Supabase: 2,000 patients, 10,000 encounters, 5,000 medications, 3,000 labs, 2,000 vitals, 100 drug references loaded
- Corpus: 146 documents / 2,228 chunks embedded (more being ingested — engine works regardless of corpus size)
- Validation: 100 AI-generated synthetic test cases + answer keys loaded (useful for pipeline smoke tests, NOT clinically validated — do not treat as ground truth)
- Engine tables: `engine_runs` and `pathway_target_run_facts` exist but are empty (ready to populate)
- Schema, RAG pipeline (hybrid search + Gemini embeddings), chat API, agent tools, and OpenUI components all functional
- Known issue: `src/lib/db/queries/patients.ts` references nonexistent schema fields (mrn, riskLevel, primaryCondition, gender, etc.)

**Priority order (from Peter):**
1. Core engine — assessing patients for highest-value followups
2. Three-column triage dashboard (replaces homepage)
3. Patient detail page (reasoning, source citations, approve button)
4. Patient navigator (separate full-screen experience)
5. Batch processing for 50-100+ patients
6. Presentation / demo polish

---

## Prompt 0: Fix ALL Stale Query Files & Setup

**Goal:** Fix the ENTIRE broken query layer. The schema was rewritten for Synthea data but EVERY query file still references the old FHIR-style schema. This is a build blocker — nothing works until this is done.

**Estimated effort: 3-4 hours. This is the biggest single task. Do not underestimate it.**

### Context

The schema (`src/lib/db/schema.ts`) was rewritten for the hackathon Synthea data. But ALL query files, API routes, and agent tools still reference the OLD schema fields. The build cannot typecheck until every file is fixed.

### Patient ID Convention (IMPORTANT)

Throughout the entire system, use `patient_id` (e.g., "PAT-000123") as the canonical patient identifier, NOT the UUID `id` field. All engine tables use `patient_id`. The triage dashboard and patient detail page route by `patient_id`. The `getPatientById` function should look up by `patient_id`, not UUID.

### Files to Fix (ALL of these)

#### 1. `src/lib/db/queries/patients.ts` — COMPLETE REWRITE

Old fields → New fields:
| Old | New |
|-----|-----|
| `mrn` | `patientId` |
| `gender` | `sex` |
| `riskLevel` | (doesn't exist) |
| `primaryCondition` | (doesn't exist) |
| `email`, `phone`, `address` | (don't exist) |
| `status` | (doesn't exist) |

- `getPatients()`: filter by `firstName`/`lastName` text search, `sex`, age range. Remove riskLevel/condition filters.
- `getPatientById(patientId: string)`: look up by `patients.patientId` (NOT UUID `id`). Join encounters, medications, labResults, vitals. Note: there is NO `observations` table — it's split into `labResults` and `vitals`.
- `searchPatients()`: search against firstName + lastName + patientId
- `getPatientStats()`: count by sex, age distribution buckets (0-17, 18-34, 35-49, 50-64, 65+), total

#### 2. `src/lib/db/queries/encounters.ts` — COMPLETE REWRITE

Old fields → New fields:
| Old | New |
|-----|-----|
| `startDate` | `encounterDate` |
| `endDate` | (doesn't exist) |
| `status` | `disposition` |
| `type` | `encounterType` |
| `providerId` | `attendingPhysician` |
| `organizationId` | `facility` |
| `reasonCode` | `diagnosisCode` |
| `reasonDisplay` | `diagnosisDescription` |
| `notes` | `chiefComplaint` |
| `provider` (relation) | (doesn't exist) |
| `organization` (relation) | (doesn't exist) |
| `observations` (relation) | (doesn't exist) |

Also add: `triageLevel`, `lengthOfStayHours`

#### 3. `src/lib/db/queries/observations.ts` — REWRITE or SPLIT

The `observations` table does NOT exist. The schema has TWO separate tables:
- `labResults`: labId, patientId, encounterId, testName, testCode, value, unit, referenceRangeLow, referenceRangeHigh, abnormalFlag, collectedDate
- `vitals`: vitalsId, patientId, encounterId, heartRate, systolicBp, diastolicBp, temperatureCelsius, respiratoryRate, o2Saturation, painScale, recordedAt

Options: either split into `lab-results.ts` + `vitals.ts`, or keep as `observations.ts` with functions for both. Either way, fix ALL field references. The current file imports `observations` from schema which doesn't exist.

#### 4. `src/lib/db/queries/medications.ts` — PARTIAL REWRITE

| Old | New |
|-----|-----|
| `name` | `drugName` |
| `status` (enum) | `active` (boolean) |

Also: `drugCode`, `dosage`, `frequency`, `route`, `prescriber`, `startDate`, `endDate`

#### 5. `src/lib/db/queries/documents.ts` — COMPLETE REWRITE (CRITICAL for RAG)

| Old | New |
|-----|-----|
| `documents` (table) | `corpusDocuments` |
| `documentChunks` (table) | `corpusChunks` |
| `documents.title` | `corpusDocuments.documentTitle` |
| `documents.createdAt` | `corpusDocuments.ingestedAt` |
| `documentChunks.*` | `corpusChunks.*` |
| Raw SQL `document_chunks` | `corpus_chunks` |
| Raw SQL `documents` | `corpus_documents` |

**This is critical** — the entire RAG pipeline (`retrieve.ts` → `documents.ts`) is broken. The engine's `searchGuidelines` tool depends on this. Fix the table names in raw SQL for `keywordSearchChunks`.

#### 6. `src/lib/db/queries/index.ts` — UPDATE EXPORTS

After fixing all query files, ensure index.ts exports everything correctly. If you split observations into lab-results.ts + vitals.ts, update the exports.

#### 7. `src/lib/ai/tools.ts` — FIX ALL AGENT TOOLS

- `queryPatients`: remove riskLevel/condition params, fix execute function
- `getPatientDetail`: fix to use `patientId` (not UUID), fix returned field names
- `listDocuments`: fix field mapping (`d.documentTitle` not `d.title`, `d.ingestedAt` not `d.createdAt`, remove `d.tags`)
- `getMetrics`: verify query functions work with new schema
- `searchDocuments` and `keywordSearch`: these call `retrieve()` which calls `documents.ts` — will work after documents.ts is fixed

#### 8. API Routes — FIX

- `src/app/api/patients/route.ts`: remove `mrn` insert reference
- `src/app/api/documents/route.ts`: fix import from `documents` to `corpusDocuments`
- Check any other API routes for stale schema references

#### 9. `src/lib/db/seed.ts` — FIX or DELETE

References `documentChunks`, `documents`, `observations`, `providers`, `organizations` — all nonexistent. Either fix it to use the new schema or delete it (we have dedicated import scripts now).

### Verification

After fixing ALL of the above:
```bash
npm run typecheck  # MUST pass with 0 errors
```

Test that the RAG pipeline works:
```bash
# Quick test: can we search documents?
curl -X POST http://localhost:3000/api/rag/vector-search -H 'Content-Type: application/json' -d '{"query":"diabetes screening"}'
```

**Do NOT change the schema. Fix everything else to match the schema.**

#### Additional Setup Tasks

10. **Add `maxDuration` to existing chat route:** Add `export const maxDuration = 300;` to `src/app/api/chat/route.ts` (needed for Vercel deployment — multi-step agent calls can take 30-60 seconds)

11. **Add React error boundary component:** Create `src/components/feedback/error-boundary.tsx` — a simple error boundary that catches React render errors and shows a user-friendly message instead of a blank screen. Use this to wrap data-dependent sections on the dashboard and patient detail pages. This is critical because engine results could have unexpected null fields or malformed JSONB data.

```typescript
'use client';
import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; }
interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">Something went wrong loading this section.</p>
          <button onClick={() => this.setState({ hasError: false })} className="mt-2 text-xs text-primary underline">Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

12. **Verify theme/colour setup:** Check that `src/app/globals.css` defines the CSS custom properties for the colour scheme (bg-background, bg-card, text-foreground, border-border, etc.). If `next-themes` is installed but no `<ThemeProvider>` exists in the root layout, either add one or confirm the colour variables work without it. The warm white (#FAFAF8) background and teal primary must be applied globally, not falling back to shadcn defaults.

---

## Prompt 1: Core Assessment Engine

**Goal:** Build the patient assessment pipeline — the heart of BestPath. Given a patient, search clinical guidelines via RAG, determine what clinical actions are needed, run deterministic math, and persist results.

### Architecture

```
Patient ID
    |
    v
[Build Patient Context] — assemble demographics, conditions, meds, labs, vitals from DB
    |
    v
[LLM Assessment] — Claude Sonnet + searchGuidelines tool
    |                reads patient context + searches corpus
    |                outputs structured JSON targets
    v
[Deterministic Comparator] — pure math, no AI
    |                        computes overdue status, due dates, scoring
    v
[Persist] — write to engine_runs + pathway_target_run_facts
    |
    v
[Return structured results]
```

### Files to Create

```
src/lib/engine/
  types.ts                  — Zod schemas for engine I/O
  build-patient-context.ts  — Assemble patient data from DB into LLM-ready format
  assess-patient.ts         — Main pipeline: context -> LLM -> comparator -> persist
  comparator.ts             — Deterministic comparator (pure math)
  scoring.ts                — Action value scoring + red/yellow/green categorization
  persist.ts                — Write results to engine_runs + pathway_target_run_facts
  engine-tools.ts           — Tools the engine LLM can use (searchGuidelines)
  prompts.ts                — System prompt for the engine LLM
```

### Implementation Details

#### `types.ts`

Define Zod schemas for:

**LLM Output Target** (what the LLM returns per recommended action):
```typescript
const EngineTargetSchema = z.object({
  condition: z.string(),           // e.g. "Type 2 Diabetes"
  screeningType: z.string(),       // e.g. "HbA1c monitoring"
  action: z.string(),              // e.g. "Order HbA1c test"
  riskTier: z.enum(['high', 'medium', 'low']),
  recommendedIntervalDays: z.number(), // from guidelines
  lastCompletedDate: z.string().nullable(), // YYYY-MM-DD or null if unknown
  whyThisAction: z.string(),       // clinical reasoning
  whyNow: z.string(),              // urgency reasoning
  confidence: z.enum(['high', 'medium', 'low']),
  confidenceReason: z.string(),
  evidenceRefs: z.array(z.object({
    docId: z.string().nullable(),
    chunkId: z.string().nullable(),
    documentTitle: z.string(),
    excerpt: z.string(),
  })),
  missingDataTasks: z.array(z.string()),
  providerRoute: z.string().nullable(), // pharmacist, dietitian, walk-in, ER, specialist, etc.
});

const EngineOutputSchema = z.object({
  targets: z.array(EngineTargetSchema),
  patientSummary: z.string(), // 1-2 sentence clinical summary
  overallConfidence: z.enum(['high', 'medium', 'low']),
});
```

**Comparator Output** (after deterministic math):
```typescript
// Extends each target with computed fields:
// - dueDate, overdueDays, status, priorityRank, actionValueScore, category
```

#### `build-patient-context.ts`

Export `buildPatientContext(patientId: string)` that:

1. Call `getPatientById(patientId)` — this returns patient + encounters + medications + observations
2. Extract unique diagnosis codes and descriptions from encounters (deduplicate)
3. Get latest lab results per test type (most recent value for each LOINC code)
4. Get latest vitals
5. Get active medications
6. Compute engagement signals: count of ED visits, last encounter date, encounter frequency
7. Format everything into a clear markdown string for the LLM:

```markdown
## Patient Demographics
- Name: {firstName} {lastName}
- Age: {age}, Sex: {sex}
- Patient ID: {patientId}

## Conditions (from encounter diagnoses)
{deduplicated list: diagnosis_description (diagnosis_code) — first seen date, last seen date, encounter count}

## Active Medications
{drug_name} {dosage} {frequency} via {route} — since {start_date}
...

## Recent Lab Results (latest per test)
{test_name} ({test_code}): {value} {unit} [{abnormal_flag}] — collected {date}
  Reference range: {low} - {high}
...

## Latest Vitals
BP: {systolic}/{diastolic} mmHg — {date}
HR: {hr} bpm, Temp: {temp}C, RR: {rr}, O2: {o2}%, Pain: {pain}/10
...

## Encounter History (most recent 10)
{date}: {type} at {facility} — {chief_complaint}
  Dx: {diagnosis_description} ({diagnosis_code})
  Disposition: {disposition}, Triage: CTAS {triage_level}
...

## Utilization Summary
- Total encounters: {count}
- Emergency visits: {count}
- Last encounter: {date}
- Unique facilities: {list}
```

Also return the raw structured data (not just the string) so the comparator can use it.

**IMPORTANT — Context Truncation Rules:**
Patients can have 50+ encounters, 30+ meds, 20+ labs. The context string must stay within token limits (~4,000 words max). Apply these caps:
- **Encounters:** Last 10 only (most recent), sorted by date descending
- **Lab Results:** Latest value per unique test code only (deduplicate by LOINC code, keep most recent)
- **Vitals:** Latest record only
- **Medications:** Active medications only (where `active = true`). If more than 20 active meds, include all but note the count.
- **Conditions:** Deduplicate by diagnosis code. Show unique conditions with first/last seen dates and encounter count.

If the total context still looks large, prioritize: demographics > conditions > medications > labs > vitals > encounters (encounters are least information-dense).

#### `engine-tools.ts`

Create engine-specific tools (simpler than the interactive agent tools):

```typescript
import { tool } from 'ai';
import { z } from 'zod';
import { retrieve } from '@/lib/rag/retrieve';

export const engineTools = {
  searchGuidelines: tool({
    description: 'Search the clinical knowledge base for guidelines, screening recommendations, management protocols, and drug safety information. Use this to find evidence for your clinical assessment. Search multiple times with different queries to gather comprehensive evidence.',
    parameters: z.object({
      query: z.string().describe('Clinical search query — be specific (e.g., "Type 2 diabetes HbA1c monitoring interval guidelines Canada" or "hypertension blood pressure target elderly CKD")'),
      topK: z.number().optional().default(8).describe('Number of results (default 8)'),
    }),
    execute: async ({ query, topK }) => {
      const results = await retrieve(query, { mode: 'hybrid', topK: topK ?? 8 });
      return results.map(r => ({
        content: r.content,
        documentTitle: r.documentTitle,
        documentId: r.documentId,
        chunkId: r.id,
        heading: r.heading,
        pageNumber: r.pageNumber,
      }));
    },
  }),
};
```

#### `prompts.ts`

The engine system prompt. This is critical — it defines how the LLM reasons about patients.

Key instructions:
- You are a clinical assessment engine for BestPath
- Your job: determine what clinical actions (screenings, medication reviews, referrals, follow-ups) are recommended for this patient based on clinical guidelines
- You have a `searchGuidelines` tool — USE IT EXTENSIVELY. Search for guidelines relevant to each condition, medication, and risk factor. Search multiple times with different queries.
- For each recommended action, determine:
  - The recommended screening interval (from guidelines)
  - When it was last completed (from the patient data provided)
  - The risk tier based on the patient's profile
  - Your confidence level in this recommendation
- **CRITICAL: Every recommendation MUST cite specific evidence from the guidelines you retrieved. Include the document title, chunk ID, and a relevant excerpt. NEVER recommend an action without documentary evidence.**
- If the patient data is sparse or missing key information, note this in `missingDataTasks` and lower your confidence — but still provide recommendations where possible
- It is OK for a patient to have zero recommended actions. A healthy young person with no risk factors and up-to-date care should return an empty targets array. Do not invent unnecessary actions.
- If a patient has conditions found in encounters but no matching guideline evidence in the corpus, still note the condition but set confidence to `low` and explain why
- **Never diagnose. Never prescribe. Frame everything as "guidelines recommend..." and "based on available evidence..."**
- Output your assessment as a JSON object matching the provided schema

Include the exact JSON schema in the prompt so the LLM knows the expected format.

#### `assess-patient.ts`

The main pipeline function. Export `assessPatient(patientId: string, modelTier?: ModelTier)`:

1. Build patient context via `buildPatientContext(patientId)`
2. Generate a unique `runId` (use `crypto.randomUUID()`)
3. Insert an `engine_runs` row with status `running`
4. **Phase A — Evidence Gathering:** Call `generateText()` with:
   - `model: getEngineModel(modelTier)` — Sonnet for production, free models for testing
   - `system`: the engine system prompt from `prompts.ts`
   - `prompt`: the patient context markdown string + "Search for relevant clinical guidelines for this patient's conditions, then provide your assessment."
   - `tools`: engineTools (searchGuidelines)
   - `maxSteps: 8` — allow multiple tool calls but cap to control costs/latency
5. **Phase B — Structured Output:** Call `generateObject()` with:
   - `model: getEngineModel(modelTier)`
   - `schema`: `EngineOutputSchema` (Zod schema — this FORCES valid structured output, no JSON parsing needed)
   - `prompt`: the patient context + all evidence gathered from Phase A tool calls + "Based on the patient data and retrieved guidelines above, produce your clinical assessment."
   - No tools needed in this phase — it just structures the reasoning

   **Why two phases?** `generateObject` forces reliable structured output via Zod schema validation (no manual JSON parsing, no code fence extraction, no trailing comma bugs). But `generateObject` doesn't support tool calling well. So Phase A gathers evidence with tools, Phase B structures the output.

   **Alternative (simpler, slightly less reliable):** Use a single `generateText` call with tools, instruct the LLM to output JSON, then parse manually with Zod. Try this first — if JSON parsing fails >10% of the time, switch to the two-phase approach.

6. **Deduplicate targets:** Group by `condition + screeningType`. If duplicates exist, keep the one with the highest confidence and most evidence refs. LLMs sometimes produce duplicate targets for conditions mentioned in multiple encounters.
7. **Validate evidence citations:** For any target with `confidence: 'high'` but empty `evidenceRefs`, programmatically demote to `confidence: 'low'` and set `confidenceReason: 'No supporting evidence found in knowledge base'`. Never let a high-confidence recommendation ship without citations.
8. Run the deterministic comparator on each target
9. Run scoring and categorization
10. Persist all results via `persist.ts`
11. Update engine_runs with status `completed` and target count
12. Return the full results

Wrap in try/catch — on failure, update engine_runs with status `failed` and error message.

**Also wrap the `searchGuidelines` tool's execute function in try/catch.** If the Gemini embedding API or Supabase is down, return a structured error message: `[{ content: "Evidence search temporarily unavailable", documentTitle: "SYSTEM ERROR", ... }]` so the LLM can still produce low-confidence targets.

#### `comparator.ts`

Export `runComparator(targets, today = new Date())`:

For each target from the LLM output:
```typescript
if (target.lastCompletedDate && target.recommendedIntervalDays) {
  const lastDate = new Date(target.lastCompletedDate);
  const dueDate = addDays(lastDate, target.recommendedIntervalDays);
  const overdueDays = differenceInDays(today, dueDate);

  if (overdueDays > 0) status = 'overdue_now';
  else if (overdueDays >= -30) status = 'due_soon';
  else status = 'up_to_date';
} else {
  // No record of when this was last done
  status = 'unknown_due';
  overdueDays = 0;
  dueDate = null;
}
```

Use `date-fns` (already in package.json) for date math.

#### `scoring.ts`

Export `scoreAndCategorize(target)`:

**Action Value Score** (from spec):
```typescript
const riskPoints = { high: 300, medium: 200, low: 100 };
const statusPoints = { overdue_now: 80, due_soon: 40, unknown_due: 20, up_to_date: 0 };
const confidencePoints = { high: 20, medium: 10, low: 0 };

const actionValueScore =
  riskPoints[target.riskTier] +
  statusPoints[target.status] +
  Math.min(Math.max(target.overdueDays, 0), 180) +
  confidencePoints[target.confidence];
```

**Categorization:**
```typescript
if (target.status === 'overdue_now' && target.riskTier === 'high') category = 'red';
else if (target.status === 'overdue_now' || target.status === 'due_soon' || target.status === 'unknown_due') category = 'yellow';
else if (target.status === 'up_to_date') category = 'green';
```

**Priority Rank:** Sort all targets by actionValueScore DESC, assign rank 1, 2, 3...

#### `persist.ts`

Export `persistResults(runId, patientId, targets, generatedAt)`:

Insert one row per target into `pathway_target_run_facts`. Map fields directly from the comparator output to the schema columns. The `evidenceRefs` and `missingDataTasks` fields are JSONB — pass them as objects/arrays.

### API Endpoint

Create `src/app/api/engine/assess/route.ts`:

```typescript
// IMPORTANT: Set maxDuration for Vercel deployment
export const maxDuration = 300; // 5 minutes — engine needs time for multi-step tool calls

POST /api/engine/assess
Body: { patientId: string, modelTier?: 'production' | 'testing' | 'free' }
Response: { data: { runId, patientId, targets: [...], summary }, meta: null, error: null }
```

This calls `assessPatient(patientId)` and returns the results. Will be used for testing individual patients before batch runs.

### Also: Register Engine Agent Tools

Add these new tools to `src/lib/ai/tools.ts` so the **interactive agent** (chat panel) can access engine functionality:

**`assessPatient` tool:**
```typescript
assessPatient: tool({
  description: 'Run the BestPath assessment engine on a specific patient. Analyzes their data against clinical guidelines and determines overdue/recommended clinical actions. Returns structured targets with evidence citations.',
  parameters: z.object({
    patientId: z.string().describe('The patient ID (e.g., PAT-000123)'),
  }),
  execute: async ({ patientId }) => {
    const { assessPatient } = await import('@/lib/engine/assess-patient');
    const result = await assessPatient(patientId);
    return result;
  },
}),
```

**`getEngineResults` tool:**
```typescript
getEngineResults: tool({
  description: 'Get the latest assessment engine results for a patient — their recommended clinical actions, overdue status, evidence citations, and triage category (red/yellow/green).',
  parameters: z.object({
    patientId: z.string().describe('The patient ID (e.g., PAT-000123)'),
  }),
  execute: async ({ patientId }) => {
    const { getPatientEngineResults } = await import('@/lib/db/queries/engine-results');
    return await getPatientEngineResults(patientId);
  },
}),
```

Also update the system prompt in `src/lib/ai/system-prompt.ts` to list these new tools and their capabilities.

### Verification

After building:
1. Run `npm run typecheck` — must pass
2. Test with a single patient: pick a patient with interesting conditions (diabetes, hypertension, etc.)
3. Inspect the output: are evidence citations present? Are intervals reasonable? Does the comparator math check out?
4. Check that `engine_runs` and `pathway_target_run_facts` rows were created in Supabase

---

## Prompt 2: Batch Runner

**Goal:** Run the assessment engine on multiple patients efficiently, with progress tracking and error handling.

### Context

The assessment engine from Prompt 1 can process one patient at a time. We need to run it on 50-100 patients (potentially all 2,000 later) to populate the triage dashboard.

### Files to Create

```
src/lib/engine/batch.ts        — Batch processing logic
src/app/api/engine/batch/route.ts — API endpoint to trigger batch
```

### Implementation

#### `batch.ts`

Export `runBatch(options)`:

```typescript
interface BatchOptions {
  patientIds?: string[];  // specific patients, or...
  limit?: number;         // ...random sample of N patients
  concurrency?: number;   // parallel assessments (default: 3)
  force?: boolean;        // if true, delete existing results and re-assess
  modelTier?: ModelTier;  // production / testing / free
  onProgress?: (completed: number, total: number, current: string) => void;
}
```

1. If `patientIds` not provided, query the `patients` table for a sample:
   - Prefer patients with more encounters/conditions (more interesting for demo)
   - Use: `SELECT patient_id FROM patients ORDER BY (SELECT COUNT(*) FROM encounters WHERE encounters.patient_id = patients.patient_id) DESC LIMIT {limit}`
   - Or simpler: just grab patients who have encounters with interesting diagnosis codes (diabetes E11.*, hypertension I10.*, COPD J44.*, etc.)
2. Process patients with controlled concurrency (3 at a time to avoid API rate limits)
3. Use a simple promise pool pattern:
   ```typescript
   const queue = [...patientIds];
   const results = [];
   const inFlight = new Set();

   while (queue.length > 0 || inFlight.size > 0) {
     while (inFlight.size < concurrency && queue.length > 0) {
       const patientId = queue.shift()!;
       const promise = assessPatient(patientId)
         .then(result => { results.push(result); })
         .catch(err => { results.push({ patientId, error: err.message }); })
         .finally(() => { inFlight.delete(promise); });
       inFlight.add(promise);
     }
     await Promise.race(inFlight);
   }
   ```
4. Skip patients that already have a completed engine_run (idempotent — don't re-assess unless forced)
5. Return summary: total, completed, failed, list of errors

#### API Endpoint

`POST /api/engine/batch`:
```typescript
Body: { limit?: number, patientIds?: string[], concurrency?: number, force?: boolean }
Response: { data: { total, completed, failed, errors: [...] }, meta: null, error: null }
```

This will be a long-running request. For the hackathon, that's fine — we'll call it once and wait. Set a generous timeout.

#### Also create a CLI script

Create `scripts/run-batch.ts` that can be run via `npx tsx scripts/run-batch.ts --limit 50`:

- Parse CLI args for limit and concurrency
- Call `runBatch()` with progress logging to console
- Print summary when done

Add to package.json scripts: `"engine:batch": "tsx scripts/run-batch.ts"`

### Verification

1. Run batch on 5 patients first: `npx tsx scripts/run-batch.ts --limit 5`
2. Check Supabase: engine_runs should have 5 rows, pathway_target_run_facts should have multiple rows
3. Inspect results quality — do the recommendations make clinical sense?
4. Then scale up: `npx tsx scripts/run-batch.ts --limit 50`

---

## Prompt 3: Three-Column Triage Dashboard

**Goal:** Replace the current homepage with the Red/Yellow/Green triage view showing assessed patients.

### Context

- Current `src/app/(main)/page.tsx` has hardcoded demo data with tabs (Overview, Risk Analysis, Demographics, Audit Log)
- We are **completely replacing** this with the triage queue view
- Data comes from `pathway_target_run_facts` table (populated by the batch runner)
- The agent panel (right sidebar) should still be accessible

### Files to Create/Modify

```
src/app/(main)/page.tsx                    — REWRITE: triage dashboard
src/lib/db/queries/engine-results.ts       — Query functions for engine results
src/lib/db/queries/index.ts                — Export new query functions
```

### Query Functions (`engine-results.ts`)

Create these query functions:

**`getTriageQueue()`** — The main dashboard query.

**NOTE:** This uses PostgreSQL's `DISTINCT ON` which cannot be expressed in Drizzle's query builder. Use raw SQL via `db.execute(sql\`...\`)`:

```sql
-- Get the highest-value action per patient (latest run only)
-- This is the "patient_highest_value_action" view from the spec
SELECT DISTINCT ON (ptrf.patient_id)
  ptrf.*,
  p.first_name, p.last_name, p.age, p.sex, p.patient_id
FROM pathway_target_run_facts ptrf
JOIN patients p ON p.patient_id = ptrf.patient_id
WHERE ptrf.status IN ('overdue_now', 'due_soon', 'unknown_due')
ORDER BY ptrf.patient_id, ptrf.generated_at DESC, ptrf.action_value_score DESC
```

Drizzle implementation:
```typescript
import { sql } from 'drizzle-orm';
const results = await db.execute(sql`...`);
```

Type the results manually or use a helper type.

Then in application code, group results by `category` (red/yellow/green) and within each group split by `confidence` (high vs medium/low).

**`getPatientEngineResults(patientId: string)`** — All targets for a specific patient (for the detail page):
```sql
SELECT ptrf.*, cd.title as document_title
FROM pathway_target_run_facts ptrf
WHERE ptrf.patient_id = $1
ORDER BY ptrf.generated_at DESC, ptrf.action_value_score DESC
```

Return the latest run's results.

**`getDashboardStats()`** — Summary counts:
- Total patients assessed
- Red / Yellow / Green counts
- Total overdue actions

### Dashboard Page (`page.tsx`)

Server component (or client with `useEffect` fetch). Layout:

```
+------------------------------------------------------+
|  BestPath Triage Dashboard                           |
|  [Stats bar: X patients assessed | Y overdue | etc.] |
+------------------------------------------------------+
|                                                      |
|  RED (Overdue + High Risk)  |  YELLOW (Overdue +     |  GREEN (On Track)
|                             |   Lower Risk)          |
|  -- High Confidence --      |  -- High Confidence -- |  -- High Confidence --
|  [PatientCard]              |  [PatientCard]         |  [PatientCard]
|  [PatientCard]              |  [PatientCard]         |  [PatientCard]
|                             |                        |
|  -- Low Confidence --       |  -- Low Confidence --  |  -- Low Confidence --
|  [PatientCard]              |  [PatientCard]         |  [PatientCard]
+------------------------------------------------------+
```

Each patient card in the triage view shows:
- Patient name, age, sex
- Primary condition and recommended action
- Overdue days (e.g., "142 days overdue")
- Confidence badge
- Risk tier badge
- Click navigates to `/patients/{patientId}`

**Styling:**
- Red column: left border or subtle background using the error/red semantic color from the colour scheme (`#C93B3B` area — but use colour variables, never hardcode)
- Yellow column: warning colour (`#C27A15` area)
- Green column: success colour (`#0B7A5E` area)
- Use existing components where possible: RiskBadge, DataBadge, etc.
- The overall page uses the warm white background (`bg-background`)
- Cards use `bg-card` (white) per Peter's feedback about DataTable backgrounds

**Responsive:** On mobile, stack columns vertically (Red on top, then Yellow, then Green).

**Demo Analysis Animation (important for presentation):**

Rather than showing all precomputed results on page load, the dashboard should have a "theatrical" analysis flow for the demo:

1. **Initial state:** Show a clean hero area with a prominent "Analyze Patient Panel" button (teal, large, centered). Below it, brief copy: "BestPath will analyze your patient panel against clinical guidelines to identify overdue and high-value clinical actions."
2. **On click:** Trigger a ~5-second animation sequence:
   - Show the **Vector Cube** animation — a custom 3D voxel density field visualization that already exists at `Vector_Cube/vector_cube-main/vector_cube-main/`. This is a modular JS library with a 10x10x10 voxel field, kernel splatting, search/citation overlays, and decay curves. Import/adapt it into the project as a React component. It renders on a canvas and shows a visually stunning "semantic density" cube with glowing voxels. If integration is too complex, fall back to a simpler CSS animation — but the Vector Cube is preferred as it's unique and on-brand.
   - Show progress text cycling through: "Connecting patient data to clinical guidelines..." → "Running deterministic comparator..." → "Scoring and categorizing results..."
   - Small disclaimer text below: "Analysis accelerated for demonstration — real-world processing takes 2-3 minutes for a full patient panel"
3. **After animation:** Fade in the three-column triage view with the precomputed results from the database.
4. The animation state should be stored in React state or sessionStorage so refreshing the page doesn't replay it (once "analyzed", stay analyzed for the session).

This is purely cosmetic — the actual data is already in the DB from the batch run. But it gives the judges a moment to understand what's happening and makes the reveal more impactful.

**Fallback/empty state:** If no engine results exist in the DB at all, show the button but when clicked, actually trigger a small batch (5-10 patients) via `POST /api/engine/batch`. Show a real loading state with progress updates.

**Update system prompt page contexts** in `src/lib/ai/system-prompt.ts`:
- Change `/` context from "Dashboard page — population health metrics, risk distribution, encounter trends" to: "Triage Dashboard — shows patients grouped by urgency (Red: overdue + high risk, Yellow: overdue + lower risk, Green: on track). Use getEngineResults and assessPatient tools when asked about patient priorities."
- Add `/patients/[id]` context: "Patient Detail page — assessment results, evidence citations, and clinical data for a specific patient. Use getPatientDetail and searchDocuments tools."
- These updated contexts enable the interactive agent to give relevant answers on the new pages.

**Update command palette** in `src/components/navigation/command-palette.tsx`:
- Replace generic entries ("New Patient", "Export Data") with product-specific ones
- Add: "Care Navigator" (navigates to `/navigator`), "Run Patient Assessment" (trigger engine)
- Keep existing nav shortcuts (Cmd+D for dashboard, Cmd+P for patients, Cmd+R for research)

Also update `src/lib/db/queries/index.ts` to export the new engine-results query functions.

### Verification

1. Ensure batch runner has been run (at least 50 patients assessed)
2. Load the homepage — should show the three-column view with real patient data
3. Click a patient card — should navigate to `/patients/{patientId}`
4. Check responsive layout on mobile viewport
5. Run `npm run typecheck`

---

## Prompt 4: Patient Detail Page

**Goal:** Build the full patient detail page showing demographics, engine assessment results with reasoning and evidence citations, and an approve/send button.

### Context

- `src/app/(main)/patients/[id]/page.tsx` is currently a stub ("Coming soon")
- This page is reached by clicking a patient in the triage dashboard
- **Evidence citations with links to source documents are ABSOLUTELY CRITICAL**
- The page must show: patient info, all engine targets with full reasoning, evidence excerpts, and an approve button
- If the agent panel is open, it should have context about this patient

### Files to Create/Modify

```
src/app/(main)/patients/[id]/page.tsx  — REWRITE: full patient detail
```

### Page Layout

```
+--------------------------------------------------------------+
|  < Back to Dashboard          [Open Agent Panel]              |
+--------------------------------------------------------------+
|  Patient: John Smith                                          |
|  Age: 65 | Sex: M | ID: PAT-000123                          |
|  Last Encounter: 2024-08-01 at Royal Jubilee Hospital        |
+--------------------------------------------------------------+
|                                                               |
|  ASSESSMENT RESULTS (from engine run {date})                  |
|  Overall Confidence: HIGH                                     |
|                                                               |
|  +----------------------------------------------------------+|
|  | TARGET 1: HbA1c Monitoring                    [RED] HIGH  ||
|  | Condition: Type 2 Diabetes                                ||
|  | Action: Order HbA1c test                                  ||
|  | Status: 142 days overdue (due: 2024-09-15)               ||
|  |                                                           ||
|  | Why this action:                                          ||
|  | Patient has T2DM with last HbA1c of 8.2% (uncontrolled). ||
|  | Guidelines recommend HbA1c every 3 months for patients    ||
|  | not meeting targets.                                      ||
|  |                                                           ||
|  | Why now:                                                  ||
|  | Last HbA1c was 9 months ago. 142 days overdue.           ||
|  |                                                           ||
|  | Evidence:                                                 ||
|  | [1] "Diabetes Canada 2024 Guidelines" — "HbA1c should    ||
|  |     be measured every 3 months in patients not meeting    ||
|  |     glycemic targets..." (View source)                    ||
|  | [2] "BC Guidelines for Diabetes Management" — "..."       ||
|  |     (View source)                                         ||
|  |                                                           ||
|  | Provider Route: Family Physician / Walk-in                ||
|  |                                                           ||
|  | [Approve & Send to Patient]                               ||
|  +----------------------------------------------------------+|
|                                                               |
|  +----------------------------------------------------------+|
|  | TARGET 2: Blood Pressure Follow-up        [YELLOW] MEDIUM ||
|  | ...                                                       ||
|  +----------------------------------------------------------+|
|                                                               |
|  PATIENT DATA                                                 |
|  [Tabs: Encounters | Medications | Lab Results | Vitals]      |
|  ...                                                          |
+--------------------------------------------------------------+
```

### Key Implementation Details

**Evidence Citations (CRITICAL — this is a core differentiator):**
- Each evidence ref has a `documentId`, `chunkId`, `documentTitle`, and `excerpt`
- **Do NOT link to the research page** — it doesn't support deep-linking query params. Instead, use an **inline expandable/modal approach:**
  - Show each citation as a compact pill: `[1] Document Title` with a "View" button
  - On click "View": open a slide-over drawer or modal that fetches the full chunk content via `getChunkById(chunkId)` from `src/lib/db/queries/documents` and displays it with the document title, heading, page number, and full text
  - The excerpt from the engine output is always shown inline beneath the citation pill (no click needed to see the key quote)
- If evidence refs are missing doc IDs, show the excerpt with a note "(source document reference unavailable)"
- Citations should look like real academic/clinical references — not just grey boxes. Consider numbered superscripts in the reasoning text that correspond to the citation list below.

**Approve & Send Flow (demo feature — fake, but must look real):**
- Each target card has an "Approve & Send to Patient" button (teal primary colour, Send/Mail icon, should feel consequential)
- On click: show a modal/dialog with a preview of what would be sent:
  - Patient name and contact info
  - Recommended action and brief explanation (from `whyThisAction`)
  - Suggested provider/booking info (from `providerRoute`)
  - A preview of the "email" content (formatted like a real patient notification)
- On confirm:
  1. Show a success toast ("Notification sent to {patient name}")
  2. Change the button to "Sent" (disabled, green checkmark icon)
  3. **Add an entry to a visible Activity Log section on the page** — this is a key demo element. The activity log sits at the bottom of the assessment results section and shows:
     - Timestamp (formatted nicely, e.g., "Mar 28, 2026 at 10:42 AM")
     - Action: "Email sent to {patient name} re: {action}"
     - Clinician: "Dr. Demo User" (hardcoded for demo)
     - Status: "Delivered" with a green badge
  4. Store the activity in React state (no DB persistence needed — it's demo-only)
- The Activity Log should be visible even before any approvals — show an empty state like "No actions taken yet" or pre-seed with one entry like "Assessment completed — {date}"
- This flow demonstrates the clinician review → approve → communicate workflow that is central to the product's value prop

**Agent Panel Context:**
- When navigating to this page, the agent panel should know which patient is being viewed
- Update the system prompt page context for `/patients/[id]` to include: "The clinician is viewing patient {name}. If they ask questions, use getPatientDetail to fetch data and searchDocuments to find relevant guidelines."
- Ideally, pass the patientId to the agent panel so it can pre-load context. But this is a NICE-TO-HAVE, not critical.

**Data Tabs Section:**
- Below the engine results, show raw patient data in tabs
- Encounters tab: table with date, type, facility, diagnosis, triage level, disposition
- Medications tab: table with drug name, dosage, frequency, status (active/inactive), start date
- Lab Results tab: table with test name, value, unit, abnormal flag, date — highlight abnormal results
- Vitals tab: latest readings in a clean layout
- Use DataTable component (with white bg-card background per Peter's feedback)

### Verification

1. Navigate to a patient that has engine results
2. Verify all targets display with reasoning and evidence citations
3. Click "View source" on an evidence citation — verify it links correctly
4. Click "Approve & Send" — verify modal + toast
5. Check the data tabs show real patient data
6. Run `npm run typecheck`

---

## Prompt 5: Patient Navigator

**Goal:** Build a full-screen care navigator for people without a family doctor. Separate experience from the main dashboard.

### Context

- This is a completely separate full-screen chat experience
- Must be accessible via a link in the main navbar
- Uses the same RAG pipeline for evidence retrieval
- The LLM guides the user through a conversational intake, then provides cited recommendations with provider routing
- No engine pipeline / no DB persistence needed — this is a real-time chat

### Files to Create

```
src/app/(navigator)/layout.tsx      — Navigator layout (no dashboard chrome)
src/app/(navigator)/page.tsx        — Full-screen navigator chat
src/lib/ai/navigator-prompt.ts      — Navigator-specific system prompt
```

### Also Modify

```
src/components/navigation/navbar.tsx   — Add "Care Navigator" link
src/lib/ai/system-prompt.ts           — Add navigator page context (or use separate prompt)
src/app/api/chat/route.ts             — Handle navigator mode (different system prompt)
```

### Navigator Layout (`layout.tsx`)

Minimal layout — NO sidebar, NO dashboard navigation, NO agent panel. Just:
- A simple top bar with "BestPath Care Navigator" branding and a "Back to Dashboard" link
- Full-screen chat area below
- Clean, warm, approachable design (this is patient-facing, not clinician-facing)
- Use the same colour scheme but emphasize warmth and simplicity

### Navigator Page (`page.tsx`)

A full-screen chat interface using the existing `useChat` from `@ai-sdk/react`:
- Chat input at bottom
- Messages scroll area above
- Clean message bubbles (user on right, assistant on left)
- The assistant's first message should be a warm greeting that explains what this tool does and asks the user to share their health information

Call the same `/api/chat` endpoint but with `pageContext: '/navigator'`.

### Chat Route Update

Modify `src/app/api/chat/route.ts`:

1. **Add `maxDuration` export** at the top of the file:
```typescript
export const maxDuration = 300; // 5 min — needed for multi-step agent tool calls on Vercel
```

2. **Detect navigator mode** — use a different system prompt AND different tools:
```typescript
if (pageContext === '/navigator') {
  systemPrompt = buildNavigatorPrompt();
  tools = navigatorTools; // Only searchDocuments + keywordSearch — NO patient data tools
  // The navigator doesn't need queryPatients, getPatientDetail, assessPatient, etc.
  // Those are clinician tools. The navigator only needs corpus search.
}
```

The navigator's tool set should be limited to `searchDocuments` and `keywordSearch` (or the engine's `searchGuidelines`). A patient using the navigator should NOT have access to tools that query other patients' data.

### Navigator System Prompt (`navigator-prompt.ts`)

This prompt defines the navigator's personality and behavior:

**Identity:**
- You are BestPath Care Navigator — a free tool that helps people without a family doctor understand what clinical care they may need and where to get it
- You are NOT a doctor. You do NOT diagnose. You connect people to the right evidence and the right care provider.

**Conversation Flow:**
1. **Greeting:** Warm introduction. Explain that you'll ask about their health to provide personalized guidance.
2. **Intake:** Gather key information conversationally (not a form). Ask about:
   - Age, sex
   - Known conditions (diabetes, high blood pressure, etc.)
   - Current medications
   - Smoking status
   - Last time they saw a doctor / had bloodwork
   - Any current symptoms or concerns
   - Family history of major conditions
3. **Assessment:** Once you have enough information, search the clinical knowledge base for relevant guidelines using `searchGuidelines` tool. Make multiple searches for each condition/risk factor.
4. **Recommendations:** Provide clear, cited recommendations:
   - What clinical actions they likely need (screenings, monitoring, medication reviews)
   - WHO can help — route to the least-strained provider capable of addressing it:
     - Pharmacist: BP monitoring, medication reviews, minor ailment assessment (BC pharmacists can prescribe for minor conditions)
     - Dietitian: diabetes dietary management, weight management
     - Physiotherapist: MSK assessment (direct access in BC)
     - Walk-in clinic: lab requisitions, specialist referrals, acute concerns
     - LifeLabs: self-requested bloodwork (some tests available in BC without requisition)
     - Community health: mental health screening, counselling
     - ER: only for urgent flags (chest pain, severe symptoms, etc.)
   - Every recommendation MUST cite the guideline source. Use format: "According to [Document Title]: '...excerpt...'"
5. **Follow-up:** Ask if they have questions. Offer to explain any recommendation in more detail.

**Rules:**
- ALWAYS search the knowledge base before making recommendations. Never guess.
- Every recommendation must cite a specific document from the knowledge base
- Frame everything as "guidelines suggest" / "based on available evidence" — never "you should" / "you need"
- Include a clear disclaimer at the end: "This is decision support information, not medical advice. Please discuss these recommendations with a healthcare provider."
- Be empathetic and clear. Avoid medical jargon where possible.
- If the person describes urgent symptoms (chest pain, difficulty breathing, sudden weakness), immediately recommend calling 911 or going to the nearest ER.

**Tools available:** Same `searchGuidelines` tool from the engine, plus `keywordSearch` for specific lookups. Add these tools to the navigator's tool set.

### Navbar Update

Add a clearly visible link to the navigator in the main navbar:
- Label: "Care Navigator" or "Patient Navigator"
- Position: in the main nav links
- Style: could use a distinct colour or icon to differentiate it from clinician tools
- Links to `/navigator` (which uses the separate layout, so no dashboard chrome)

### Verification

1. Click "Care Navigator" in navbar — should open full-screen chat
2. Chat flow: introduce yourself, answer questions, get recommendations
3. Verify recommendations cite specific documents
4. Verify provider routing is appropriate (pharmacist for BP, dietitian for diabetes diet, etc.)
5. Verify "Back to Dashboard" link works
6. Verify disclaimer appears
7. Run `npm run typecheck`

---

## Prompt 6: Presentation & Demo Polish

**Goal:** Update presentation materials, ensure demo flow works end-to-end, and polish the experience.

### Context

- `docs/presentation/demo-script.md` and `docs/presentation/talking-points.md` are from an earlier version (generic dashboard + agent panel focus)
- `docs/presentation/pitch.html` exists as a reveal.js presentation but may need updates
- The demo script in `PLAN.md` (Act 1-5) is the canonical demo flow
- Code freeze: March 28, 3:30 PM

### Tasks

#### 1. Update Demo Script

Rewrite `docs/presentation/demo-script.md` to match the actual built product:

**Demo Flow (5 minutes):**

**Act 1: The Problem (30s)**
- 6.5M Canadians without a family doctor
- System is reactive — patients end up in ER because preventive care was missed
- "These are preventable emergencies"

**Act 2: Clinician View — Triage Dashboard (90s)**
- Open BestPath dashboard
- Show three-column view: Red (overdue + high risk), Yellow (overdue + lower risk), Green (on track)
- Point out confidence splitting (high vs low confidence)
- "BestPath analyzed 2,000 patients against clinical guidelines. Here's who needs action now."
- Click a Red/high-confidence patient

**Act 3: Patient Detail — The Reasoning (60s)**
- Show full assessment with targets
- Point to evidence citations: "Every recommendation is backed by specific clinical guidelines"
- Click "View source" to show the actual guideline text
- Show the deterministic logic: "Guidelines say what's needed, patient data shows what's been done, math confirms what's overdue"
- Click "Approve & Send" — show the notification flow
- "The clinician decides. The system supports."

**Act 4: Patient Navigator (60s)**
- "But what about the 6.5 million without a doctor?"
- Switch to Care Navigator
- Demo conversation: "I'm 55, I have high blood pressure, haven't seen a doctor in 3 years"
- Show how it asks follow-up questions
- Show cited recommendations with provider routing
- "You don't need a doctor for everything. A pharmacist can monitor your blood pressure. LifeLabs can do your bloodwork."

**Act 5: Architecture + Impact (30s)**
- Same engine, two interfaces
- Evidence retrieval + deterministic math, no AI guessing
- "Augment clinician capacity. Navigate patients to the right care. Prevent emergencies before they happen."

#### 2. Update Talking Points

Rewrite `docs/presentation/talking-points.md` to focus on the actual built product and the BestPath value proposition (not the generic "AI-powered dashboard" messaging).

**Include a section about how we sourced the clinical knowledge base.** This is a strong differentiator — we didn't just use ChatGPT or hardcode rules. Reference:
- `health-info-data/` — contains the full corpus acquisition pipeline
- `health-info-data/scripts/` — Python scripts that programmatically fetched, filtered, and packaged clinical guidelines
- `health-info-data/next-best-pathway-corpus/` — the curated corpus (4,026 selected documents from BC guidelines, national guidelines, specialty guidelines, Health Canada DPD, equity/demographic guidance, provincial quality resources)
- `health-info-data/scripts/next_best_pathway_selection_policy.json` — the selection criteria for which documents to include
- The pipeline fetched 4,026 documents, rejected 1,534, and captured 387 supplemental sources
- This isn't a toy — it's a systematic evidence base that could be updated and maintained

This should be a talking point in the demo: "We built a systematic pipeline to acquire and curate 4,000+ clinical guideline documents from BC and national sources. Every recommendation traces back to a specific guideline passage."

#### 3. Pre-Select Demo Patients

Query the engine results to find the 3-5 BEST patients for the live demo. Write them to `docs/presentation/demo-patients.md`. Criteria for a good demo patient:
- Multiple targets (shows the system finding several actions, not just one)
- At least one RED category target (dramatic, shows urgency)
- High confidence with good evidence citations (shows the citation flow)
- Recognizable conditions (diabetes, hypertension — things judges will understand)
- Variety: pick patients with different conditions so the demo shows breadth

```sql
-- Find best demo candidates
SELECT p.patient_id, p.first_name, p.last_name, p.age, p.sex,
       COUNT(*) as target_count,
       COUNT(*) FILTER (WHERE ptrf.category = 'red') as red_count,
       COUNT(*) FILTER (WHERE ptrf.confidence = 'high') as high_conf_count,
       MAX(ptrf.action_value_score) as max_score
FROM pathway_target_run_facts ptrf
JOIN patients p ON p.patient_id = ptrf.patient_id
GROUP BY p.patient_id, p.first_name, p.last_name, p.age, p.sex
HAVING COUNT(*) >= 2 AND COUNT(*) FILTER (WHERE ptrf.category = 'red') >= 1
ORDER BY red_count DESC, high_conf_count DESC, max_score DESC
LIMIT 10;
```

Write the output to `docs/presentation/demo-patients.md` with patient IDs and a brief note on why each is a good demo candidate. Peter will use this to know exactly which patients to click during the live demo.

#### 4. Verify End-to-End Demo Flow

Walk through the entire demo flow and fix any issues:
- Dashboard loads with real triage data
- Patient cards are clickable and navigate correctly
- Patient detail page shows assessment results with citations
- Navigator chat works with proper citations
- No console errors, no broken links, no loading states that hang

#### 4. Quick UI Polish

- Ensure the dashboard has a clear title: "BestPath Triage Dashboard" or similar
- Ensure column headers are clear: "Urgent — Overdue & High Risk", "Follow-up — Overdue & Lower Risk", "On Track"
- Ensure patient cards show enough info at a glance
- Ensure the navigator has a welcoming first message
- Check that the colour scheme is consistent (teal primary, warm whites, semantic colours for categories)
- Test on a projector-friendly resolution (1920x1080)

#### 5. Update pitch.html (if time permits)

Update the reveal.js slides to match the actual product. The current slides reference some stats and flows that may have changed.

### Verification

1. Run through the full 5-minute demo flow at least once
2. Time it — should fit in 5 minutes comfortably
3. Check on an external display if possible
4. Ensure all clickable elements work
5. Ensure no loading spinners hang longer than 2-3 seconds

---

## Prompt 7: UI/UX Audit — Kill the AI Smell

**Goal:** Make this look like a product, not a hackathon project. Eliminate every trace of generic AI-generated UI, default component styling, and template-ness. The judges should think "this team has a designer" — not "they scaffolded this with AI."

### What to Look For

**AI-Generated Giveaways (kill all of these):**
- Generic placeholder copy ("Welcome to...", "Get started by...", "Your data at a glance")
- Perfectly symmetrical 3-card or 4-card grid layouts with identical structure
- Gratuitous use of gradient backgrounds or glassmorphism
- Hero sections with vague taglines
- Emoji in headings or UI labels
- Lorem ipsum or suspiciously perfect sample data descriptions
- Components that all have exactly the same border-radius, padding, and shadow
- Buttons that say "Get Started" or "Learn More" with no specificity
- Generic loading skeletons that don't match the content shape
- Overly uniform spacing — real designs have visual hierarchy with intentional density variation

**Template/Scaffold Giveaways:**
- Default shadcn/ui styling with zero customization (the default zinc grey palette)
- Identical card components repeated with only the icon/number changed
- Navigation that says "Dashboard", "Settings", "Profile" in the default order
- Footer with "Built with Next.js" or similar
- Default toast positioning and styling
- Command palette with default entries that don't match the product
- Page titles that are just the route name capitalized ("Patients", "Research")

**What "Stands Out" Looks Like:**
- Intentional typography hierarchy (the triage dashboard headings should feel urgent, the navigator should feel warm)
- Colour used with meaning, not decoration (red/yellow/green categories should be immediately readable — but subtly, not screaming)
- Microinteractions: hover states on patient cards that reveal the action summary, smooth page transitions, badge animations
- Density appropriate to context: the triage dashboard should be dense (clinician tool, lots of info), the navigator should be spacious (patient-facing, calming)
- Real copy that sounds like a healthcare product, not a tech demo
- Data visualization that tells a story (the stats bar should say something meaningful, not just "Total: 2,000")

### Specific Areas to Audit

#### Triage Dashboard (`src/app/(main)/page.tsx`)
- Column headers should be specific and actionable: "Needs Urgent Action" / "Follow-up Required" / "On Track" — not "Red" / "Yellow" / "Green"
- Stats bar should show meaningful numbers: "47 patients need action this week" / "12 high-risk overdue" — not generic counts
- Patient cards should have visual weight proportional to urgency — red cards slightly more prominent, green cards quieter
- Empty state should be purposeful, not a sad-face icon with "Nothing here yet"
- Consider a subtle animated dot or pulse on the red column header to draw the eye

#### Patient Detail (`src/app/(main)/patients/[id]/page.tsx`)
- The evidence citation design should look like real academic/clinical citations, not just grey boxes with text
- The "Approve & Send" button should feel consequential — not a flat default button. Consider a confirmation colour (teal primary), slight size increase, and a clear icon (Send/Mail)
- Target cards should have distinct visual treatment by category — a left border colour accent (red/yellow/green) is more elegant than a full background colour
- The data tabs should feel like a real clinical record, not a generic DataTable dump

#### Navigator (`src/app/(navigator)/page.tsx`)
- This is patient-facing — the entire tone shifts. Warmer, more spacious, larger text, friendlier.
- Chat bubbles should look polished — not default white boxes. Consider the teal-tinted background for assistant messages, subtle shadows, rounded corners.
- The initial greeting should be visible without scrolling — consider a hero-style welcome area that collapses once chat begins.
- Input area should be inviting: larger, with a warm placeholder like "Tell me about your health concerns..." — not "Type a message..."
- The "Back to Dashboard" link should be subtle (this is patient-facing — they don't need dashboard access prominently)

#### Global / Layout
- Navbar should feel purposeful. "Care Navigator" link should have a distinct visual treatment (perhaps a subtle icon or different weight) since it's the patient-facing entry point.
- Page transitions: if possible, add subtle fade-in on route changes (even just CSS opacity transition)
- Ensure the warm white background (#FAFAF8) is actually being used — not defaulting to pure white everywhere
- Check that the teal primary (#0C8C8C) is consistent and not mixed with default blue links
- Scrollbar styling: if visible, style it to match the palette (subtle, thin)

### Implementation Approach

1. **Read every page** and every component that renders on those pages
2. **Screenshot mentally** (or describe) what each page looks like right now
3. **Apply fixes in order of visual impact:** copy > colour > spacing > microinteractions
4. Keep changes surgical — don't rewrite components, just refine their styling and copy
5. **Test at 1920x1080** (projector resolution for the demo)

### Colour Reference (from `docs/colour-scheme.md`)
- Primary: #0C8C8C (action), #0A7373 (hover), #085C5C (pressed)
- Tints: #E8F6F6 (soft), #D0EEEE (medium)
- Background: #FAFAF8 (page), #FFFFFF (card), #F5F4F0 (recessed), #EFEEE9 (inset)
- Borders: #E6E4DF (default), #D4D1CA (strong), #C1E8E8 (focused)
- Text: #1A2E44 (primary), #5A6578 (secondary), #8C919C (placeholder)
- Semantic: #0B7A5E (success/green), #C27A15 (warning/yellow), #C93B3B (error/red)
- Desaturated semantic colours are intentional — they shouldn't scream against the calm teal palette

### Verification

1. Every page looks intentionally designed, not scaffolded
2. No default shadcn zinc greys visible
3. Copy is specific to healthcare/BestPath, not generic
4. Colour palette is consistent across all pages
5. Navigator feels warm and patient-friendly (distinct from the dense clinician view)
6. Dashboard feels professional and clinical (not a toy)
7. Run `npm run typecheck` — styling changes shouldn't break types

---

## Prompt 8: Deployment & Submission Readiness

**Goal:** Deploy to Vercel, rewrite README for submission, ensure the GitHub repo meets all hackathon requirements.

### Context

Submission requirements (from PLAN.md):
- Single shareable link (GitHub repo) openable on organizer's laptop
- Slides (PDF or Google Slides link) in repo README
- README includes: team members, challenge track, problem statement, solution summary, tech stack, how to run/view demo
- Deployed to Vercel (live demo link)
- Code freeze: Saturday March 28, 3:30 PM

Env vars available: `VERCEL_TOKEN`, `VERCEL_PROJECT_URL`

### Tasks

#### 1. Ensure Production Build Passes

```bash
npm run build
```

Fix any build errors. The project uses webpack (not Turbopack) — check the build script in `package.json`.

#### 2. Deploy to Vercel

```bash
# Install CLI if needed
npm install -g vercel

# Link project if not already linked
vercel link --token=$VERCEL_TOKEN

# Set all required env vars on Vercel production environment
# Required: ANTHROPIC_API_KEY, DATABASE_URL, SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL,
#   SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY,
#   GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, LLAMAPARSE_API_KEY, OPENROUTER_API_KEY

# Deploy
vercel --prod --token=$VERCEL_TOKEN
```

After deployment, verify the live URL:
- Dashboard loads (with data or graceful empty state)
- `/navigator` route works
- No CORS or API errors in browser console
- Supabase connection works from Vercel

#### 3. Rewrite README.md

The current README is a generic setup guide. Rewrite it to be submission-ready:

**Required sections:**
- Project name + one-line description
- **Team members** (Peter Salmon, Capital Reasoning Solutions — leave placeholder for co-founder)
- **Challenge track:** Track 1: Clinical AI
- **Problem statement:** 6.5M Canadians without family doctors, reactive care model, preventable ER visits
- **Solution summary:** Dual-interface clinical intelligence engine (clinician triage + patient navigator), evidence-cited, deterministic
- **Tech stack:** Next.js 16, TypeScript, Tailwind v4, shadcn/ui, Supabase + pgvector, Drizzle ORM, Claude Sonnet/Opus, Vercel AI SDK, OpenUI, Gemini Embeddings, Hybrid RAG
- **Live demo link:** [Vercel URL]
- **Slides:** Link to `docs/presentation/pitch.html` or Google Slides (leave placeholder for Peter to fill in)
- **How to run locally:** Setup instructions (existing ones are fine, just clean them up)

#### 4. Repo Cleanup

- Verify `.env` is gitignored (it is)
- Check no secrets are committed in any tracked files
- Ensure `IMPLEMENTATION_PROMPTS.md`, `IMPLEMENTATION_OVERVIEW_PROMPT.md`, `DATA_LAYER_PLAN.md`, and `BUILD_LOG.md` are fine to be public (they contain no secrets, just plans)
- Remove or gitignore any large files that shouldn't be in the repo

### Verification

1. Visit the Vercel URL — app loads and works
2. README has all required sections
3. `git status` is clean (no uncommitted sensitive files)
4. Repo is shareable and openable on any laptop

---

## Appendix: Key Technical Reference

### Existing Patterns to Follow

**API response format:**
```typescript
{ data: T | T[], meta: { page, pageSize, total, totalPages } | null, error: string | null }
```

**Agent tool registration** (in `src/lib/ai/tools.ts`):
```typescript
export const agentTools: Record<string, CoreTool> = {
  toolName: tool({
    description: '...',
    parameters: z.object({ ... }),
    execute: async (params) => { ... },
  }),
};
```

**LLM calls** (in `src/app/api/chat/route.ts`):
```typescript
import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
// For engine (non-streaming): use generateText instead of streamText
import { generateText } from 'ai';
```

**Database queries** (in `src/lib/db/queries/*.ts`):
```typescript
import { db } from '@/lib/db';
import { patients, encounters, ... } from '@/lib/db/schema';
import { eq, and, desc, sql, count } from 'drizzle-orm';
```

**RAG retrieval:**
```typescript
import { retrieve } from '@/lib/rag/retrieve';
const results = await retrieve('query', { mode: 'hybrid', topK: 8 });
// Returns: { id, content, pageNumber, heading, documentId, documentTitle, score, source }
```

### Schema Quick Reference

**pathway_target_run_facts columns:**
runId, generatedAt, patientId, targetId, condition, screeningType, action, riskTier, status, overdueDays, dueDate, intervalDays, lastCompletedDate, priorityRank, confidence, confidenceReason, actionValueScore, whyThisAction, whyNow, evidenceRefs (jsonb), missingDataTasks (jsonb), providerRoute, category

**engine_runs columns:**
runId, patientId, startedAt, completedAt, corpusVersion, targetCount, status, error

### Colour Variables (Never Hardcode)

```
bg-background    — warm white (#FAFAF8)
bg-card          — white (#FFFFFF)
text-foreground  — navy (#1A2E44)
border-border    — subtle (#E6E4DF)
Primary: teal-500 (#0B8585)
Error/Red: use semantic error colour
Warning/Yellow: use semantic warning colour
Success/Green: use semantic success colour
```

### File Naming Conventions

- Components: PascalCase (`PatientCard.tsx`)
- Utilities/libs: kebab-case (`build-patient-context.ts`)
- Pages: `page.tsx` in route directory
- Query functions: camelCase exports (`getPatientById`)
