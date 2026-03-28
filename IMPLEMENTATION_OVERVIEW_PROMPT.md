# BestPath — Overnight Autonomous Build

You are the **primary orchestrating agent** for an overnight autonomous build of the BestPath healthcare intelligence platform. You will execute the full implementation by spawning specialized agent teams for each phase. Peter is asleep — you must work autonomously, make best-effort decisions, log everything, and commit working code after each phase.

---

## Mission

Build the complete BestPath system: a clinical assessment engine that analyzes patients against clinical guidelines, determines overdue/highest-value clinical actions, and presents results through a triage dashboard (clinician view) and a care navigator (patient view).

**Read these files first before doing anything else:**
1. `PLAN.md` — the canonical project spec (north-star objectives, architecture, demo script)
2. `IMPLEMENTATION_PROMPTS.md` — detailed implementation specs for each phase
3. `CLAUDE.md` — codebase patterns, conventions, and commands
4. `src/lib/db/schema.ts` — the database schema (your ground truth for data structures)
5. `src/app/api/chat/route.ts` — the existing chat API pattern
6. `src/lib/rag/retrieve.ts` — the existing RAG retrieval pipeline
7. `src/lib/ai/tools.ts` — the existing agent tools

---

## Current State (verified at prompt creation time)

**Database (Supabase — all populated):**
| Table                    | Rows                                                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| patients                 | 2,000                                                                                                    |
| encounters               | 10,000                                                                                                   |
| medications              | 5,000                                                                                                    |
| lab_results              | 3,000                                                                                                    |
| vitals                   | 2,000                                                                                                    |
| canadian_drug_reference  | 100                                                                                                      |
| corpus_documents         | 146+ (more have been ingested since, but still in-progress — but not a blocker for building out the app) |
| corpus_chunks            | 2,228+                                                                                                   |
| validation_cases         | 100 (AI-generated, NOT clinically validated)                                                             |
| validation_answer_keys   | 100 (AI-generated, NOT clinically validated)                                                             |
| engine_runs              | 0 (to be populated)                                                                                      |
| pathway_target_run_facts | 0 (to be populated)                                                                                      |

**Known issue:** `src/lib/db/queries/patients.ts` references nonexistent schema fields (`mrn`, `riskLevel`, `primaryCondition`, `gender`). Must be fixed in Phase 0.

**What exists and works:** Dashboard scaffold (hardcoded demo data), 7 agent tools, 23 OpenUI components, hybrid RAG pipeline (vector + keyword + RRF with Gemini 3072-dim embeddings), Zustand stores, chat API with Claude Opus, Drizzle ORM with full schema.

**Env vars available:** `ANTHROPIC_API_KEY`, `OPENROUTER_API_KEY`, `DATABASE_URL`, `GEMINI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, plus Supabase and other keys. All set in `.env`.

---

## Resource Constraints & Model Strategy

**Peter does not have unlimited Claude credits.** Be efficient with agent spawning. Combine roles where practical. Don't spawn agents for trivial tasks — just do them directly.

### OpenRouter Integration

The `OPENROUTER_API_KEY` is set. You must install and configure OpenRouter support early (Phase 0) so the engine can use multiple model providers.

**Install:** `npm install @ai-sdk/openai`

**Create `src/lib/engine/model-provider.ts`:**
```typescript
import { anthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

export type ModelTier = 'production' | 'testing' | 'free';

export function getEngineModel(tier: ModelTier = 'production') {
  switch (tier) {
    case 'production':
      // Claude Sonnet via Anthropic direct — best quality for demo
      return anthropic('claude-sonnet-4-6');
    case 'testing':
      // Claude Sonnet via OpenRouter — for development testing
      return openrouter('anthropic/claude-sonnet-4');
    case 'free':
      // Free models via OpenRouter — for iteration/testing during development
      // Try these in order of capability:
      //   nvidia/llama-3.3-nemotron-super-49b-v1:free
      //   minimax/minimax-m1-80k:free
      //   thudm/glm-4-32b:free
      // Check availability at runtime; fall back through the list.
      return openrouter('nvidia/llama-3.3-nemotron-super-49b-v1:free');
  }
}
```

**Usage in the engine:** The `assessPatient()` function should accept an optional `modelTier` parameter. Default to `'production'` but allow override for testing.

**Rule of thumb:**
- Use `free` tier models for testing the pipeline/plumbing (does data flow correctly? do tools get called? does output parse?)
- Use `testing` tier for quality checks (does the assessment make clinical sense?)
- Use `production` tier only for the final batch run that populates the demo dashboard
- The interactive chat agent (`/api/chat`) stays on `anthropic('claude-opus-4-6')` — don't change that

Also add `OPENROUTER_API_KEY` as optional to `src/config/env.ts`.

---

## Phase Execution Protocol

Execute phases **sequentially** (each depends on the previous). For each phase:

### 1. Plan
Spawn an agent (subagent_type: `Plan`) to:
- Read the relevant section of `IMPLEMENTATION_PROMPTS.md`
- Read all files that will be created or modified
- Produce a concrete plan: exact files, functions, types, imports, and approach
- Identify risks and edge cases

### 2. Build
Spawn an agent (subagent_type: `general-purpose`, mode: `auto`) to:
- Execute the plan from step 1
- Create/modify all files
- Add structured logging to every significant function (see Logging section)
- Run `npm run typecheck` at the end — fix any errors before returning

### 3. Critic
Spawn an agent (subagent_type: `general-purpose`) to:
- Read all files created/modified in step 2
- Check for: missing error handling, type safety gaps, potential runtime failures, missing imports, security issues, incorrect schema references, uncited recommendations (engine only)
- Check that logging was added
- Output a list of issues (if any)

If the critic finds issues, fix them directly (don't spawn another agent — just fix them yourself).

### 4. Test
Spawn an agent (subagent_type: `general-purpose`, mode: `auto`) to:
- Write comprehensive tests for the phase's code (see Testing section)
- Place tests in `__tests__/` directories adjacent to source files, or in a top-level `tests/` directory
- Include both unit tests (pure functions, mocked deps) and integration tests where feasible
- Run the tests and fix any failures

### 5. Verify
Run these commands directly (no agent needed):
```bash
npm run typecheck
npm run lint 2>/dev/null || true  # lint if configured, don't block on it
npx vitest run --reporter=verbose 2>&1 | tail -50  # run tests
```
If typecheck or critical tests fail, fix them before proceeding.

### 6. Commit
After verification passes:
```bash
git add -A  # OK for this autonomous build — Peter will review in the morning
git commit -m "Phase N: [description]"
```
**Commit after EVERY phase**, even if there are minor issues. Working, committed code that Peter can iterate on is infinitely better than perfect uncommitted code.

### 7. Log Progress
After each phase, append to `BUILD_LOG.md` (create it if it doesn't exist):
```markdown
## Phase N: [Name] — [STATUS: COMPLETE|PARTIAL|FAILED]
**Time:** [timestamp]
**Files created/modified:** [list]
**Tests:** [passed/failed count]
**Issues:** [any known issues or limitations]
**Notes:** [anything Peter should know]
```

---

## Testing Strategy

### Setup (do in Phase 0)

Install Vitest:
```bash
npm install -D vitest @vitejs/plugin-react
```

Create `vitest.config.ts` at project root:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['**/*.test.ts', '**/*.test.tsx', 'tests/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Add to `package.json` scripts: `"test": "vitest run", "test:watch": "vitest"`

### What to Test

**Phase 1 (Core Engine) — MOST CRITICAL TESTS:**

`tests/engine/comparator.test.ts` — Test the deterministic comparator thoroughly:
```
- Patient with last HbA1c 100 days ago, interval 90 days → overdue_now, overdueDays = 10
- Patient with last screening 60 days ago, interval 90 days → due_soon (30 days away)
- Patient with last screening 10 days ago, interval 365 days → up_to_date
- Patient with no lastCompletedDate → unknown_due
- Edge: lastCompletedDate is today → up_to_date, overdueDays = -intervalDays
- Edge: interval is 0 → always overdue_now
- Edge: future lastCompletedDate (data error) → handle gracefully
```

`tests/engine/scoring.test.ts` — Test the action value score formula:
```
- high risk + overdue_now + 100 overdue days + high confidence = 300+80+100+20 = 500
- low risk + up_to_date + 0 overdue + low confidence = 100+0+0+0 = 100
- Overdue days capped at 180
- Negative overdue days clamp to 0
```

`tests/engine/categorization.test.ts` — Test red/yellow/green assignment:
```
- overdue_now + high risk → red
- overdue_now + medium risk → yellow
- overdue_now + low risk → yellow
- due_soon + any risk → yellow
- unknown_due → yellow
- up_to_date → green
```

`tests/engine/build-patient-context.test.ts` — Test context assembly:
```
- Mock DB calls, verify output format
- Patient with no encounters → still produces valid context
- Patient with abnormal labs → correctly flags them
- Deduplication of diagnosis codes works
```

`tests/engine/assess-patient.test.ts` — Integration test:
```
- Mock the LLM call (return a known JSON output)
- Verify the full pipeline: context → (mocked) LLM → comparator → scoring → persist
- Verify DB rows are created correctly
- Verify error handling when LLM returns invalid JSON
```

**Phase 2 (Batch Runner):**
```
- Batch of 3 patients with mocked assessPatient → all succeed
- Batch with 1 failure → continues, reports error
- Concurrency control works (max 3 in flight)
- Skip already-assessed patients (idempotent)
```

**Phase 3 (Dashboard):**
```
- Query function returns correct grouping (red/yellow/green)
- Empty state renders when no results
- Stats computation is correct
```

**Phase 4 (Patient Detail):**
```
- Renders patient info correctly
- Evidence citations display with links
- Approve button shows toast
```

**Phase 5 (Navigator):**
```
- Navigator layout renders without dashboard chrome
- Chat messages display correctly
- System prompt includes navigator instructions
```

### Using Real Synthea Patients for Testing

**The 100 validation cases are AI-generated synthetic data — do NOT treat them as clinical ground truth.** They can be used for basic pipeline smoke tests (does the schema parse? does the pipeline run?) but nothing more.

For meaningful engine testing, **use real Synthea patients from the database** (the 2,000 patients with real encounters, labs, meds, vitals). Pick patients with interesting clinical profiles:

```typescript
// tests/engine/smoke.test.ts
// 1. Find a patient with diabetes encounters (diagnosis_code LIKE 'E11%')
// 2. Run the engine on them with a free model
// 3. Check: does the pipeline complete without errors?
// 4. Check: does the output parse against the Zod schema?
// 5. Check: are evidence citations present (non-empty evidenceRefs)?
// 6. Check: does the comparator produce valid status values?
// Do NOT assert clinical correctness — that requires human review
```

---

## Logging Strategy

Add a lightweight structured logger. Create `src/lib/engine/logger.ts`:

```typescript
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

export function createEngineLogger(component: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      log('info', component, message, data),
    warn: (message: string, data?: Record<string, unknown>) =>
      log('warn', component, message, data),
    error: (message: string, data?: Record<string, unknown>) =>
      log('error', component, message, data),
    debug: (message: string, data?: Record<string, unknown>) =>
      log('debug', component, message, data),
    time: (label: string) => {
      const start = performance.now();
      return {
        end: (data?: Record<string, unknown>) => {
          const duration = Math.round(performance.now() - start);
          log('info', component, `${label} completed`, { ...data, durationMs: duration });
          return duration;
        },
      };
    },
  };
}

function log(level: LogLevel, component: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    ...data && { data },
  };
  const prefix = { info: 'ℹ️', warn: '⚠️', error: '❌', debug: '🔍' }[level];
  console.log(`${prefix} [${entry.timestamp}] [${component}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}
```

**Usage in every engine function:**
```typescript
const log = createEngineLogger('assess-patient');

export async function assessPatient(patientId: string, modelTier: ModelTier = 'production') {
  log.info('Starting assessment', { patientId, modelTier });
  const timer = log.time('full-assessment');

  // ... build context
  log.info('Patient context built', { patientId, conditionCount: conditions.length, labCount: labs.length });

  // ... LLM call
  log.info('LLM assessment complete', { patientId, targetCount: targets.length, toolCallCount: result.steps.length });

  // ... comparator
  log.info('Comparator complete', { patientId, overdueCount: overdue.length, upToDateCount: upToDate.length });

  // ... persist
  log.info('Results persisted', { patientId, runId });

  timer.end({ patientId, targetCount: targets.length });
  return results;
}
```

Log at EVERY significant step: context building, each tool call, LLM response parsing, comparator results, DB writes, errors with full stack traces.

---

## Error Recovery Protocol

**If an LLM call fails:**
- Log the error with full details
- If it's a rate limit (429), wait 30 seconds and retry once
- If it's a model availability issue, fall back: production → testing → free
- If all fail, log and skip this patient/step, continue with next

**If JSON parsing fails on LLM output:**
- Try extracting JSON from markdown code fences (```json ... ```)
- Try extracting the first { ... } block from the response
- If still fails, log the raw response for debugging and skip this patient

**If typecheck fails after building:**
- Read the error messages carefully
- Fix the type errors (usually wrong imports, missing fields, or schema mismatches)
- Re-run typecheck
- Max 3 fix attempts per phase, then commit what you have and note the issues

**If tests fail:**
- Read failure messages
- Fix obvious issues (wrong assertions, missing mocks)
- If a test requires a real API call and fails due to network/credits, mark it as `.skip` with a comment explaining why
- Max 3 fix attempts, then commit passing tests and skip the rest

**If a phase is fundamentally blocked:**
- Log WHY it's blocked in BUILD_LOG.md
- Skip to the next phase if possible
- Some phases depend on previous ones — if Phase 1 (engine) fails completely, Phases 2-4 won't work. In that case, still build the UI shells (dashboard, patient detail, navigator) with mock data so Peter has something to iterate on.

---

## Detailed Phase Instructions

### Phase 0: Setup & Fix ALL Broken Query Files

**THIS IS THE BIGGEST PHASE. Estimated 3-4 hours. Do NOT underestimate it.**

The schema was rewritten for Synthea data but EVERY query file, API route, and agent tool still references the old FHIR-style schema. The build has 70+ type errors. Nothing works until this is fixed.

**Read IMPLEMENTATION_PROMPTS.md Prompt 0 for the complete field-by-field mapping.** It lists every file, every old field → new field change, and the exact tables involved.

Spawn a **Build** agent for this — it's too large to do inline. Give it the full Prompt 0 content.

**Files that MUST be fixed (in order):**

1. `src/lib/db/queries/documents.ts` — **Fix FIRST** (RAG pipeline depends on this). Change `documents` → `corpusDocuments`, `documentChunks` → `corpusChunks`, fix field names and raw SQL table names.
2. `src/lib/db/queries/patients.ts` — Complete rewrite. Use `patientId` (text like "PAT-000123") as the lookup key, not UUID.
3. `src/lib/db/queries/encounters.ts` — Complete rewrite. `startDate` → `encounterDate`, `type` → `encounterType`, `status` → `disposition`, etc.
4. `src/lib/db/queries/observations.ts` — Rewrite: `observations` table doesn't exist. Split into queries for `labResults` and `vitals` tables.
5. `src/lib/db/queries/medications.ts` — Fix: `name` → `drugName`, `status` → `active` (boolean).
6. `src/lib/db/queries/index.ts` — Update all exports.
7. `src/lib/ai/tools.ts` — Fix ALL agent tools: queryPatients, getPatientDetail, listDocuments, getMetrics.
8. `src/app/api/patients/route.ts` — Remove `mrn` reference.
9. `src/app/api/documents/route.ts` — Fix imports.
10. `src/lib/db/seed.ts` — Fix or delete (we have dedicated import scripts now).

**Also do in this phase:**

11. Install dependencies: `npm install @ai-sdk/openai && npm install -D vitest`
12. Create `vitest.config.ts` (see Testing section)
13. Add test scripts to package.json
14. Create `src/lib/engine/model-provider.ts` (see Model Strategy section)
15. Add `OPENROUTER_API_KEY: z.string().optional()` to `src/config/env.ts`
16. Create `src/lib/engine/logger.ts` (see Logging section)
17. Add `export const maxDuration = 300;` to `src/app/api/chat/route.ts`
18. Create `src/components/feedback/error-boundary.tsx`
19. Verify colour scheme CSS variables in globals.css

**Run `npm run typecheck` — MUST pass with 0 errors before moving on.**

Test that RAG works: search the corpus via the API or a quick script.

Commit: `"Phase 0: fix all broken query files, setup testing and OpenRouter"`

---

### Phase 1: Core Assessment Engine

**This is the most critical phase. Allocate the most effort here.**

Spawn a **Plan** agent to plan the implementation, reading IMPLEMENTATION_PROMPTS.md Prompt 1 thoroughly.

Then spawn a **Build** agent with the plan + full context. It must create:

```
src/lib/engine/
  types.ts                  — Zod schemas for engine I/O
  build-patient-context.ts  — Assemble patient data from DB
  engine-tools.ts           — searchGuidelines tool for the engine LLM
  prompts.ts                — Engine system prompt (CRITICAL — see IMPLEMENTATION_PROMPTS.md)
  comparator.ts             — Deterministic overdue calculation (pure math)
  scoring.ts                — Action value score + red/yellow/green categorization
  persist.ts                — Write to engine_runs + pathway_target_run_facts
  assess-patient.ts         — Main pipeline orchestrating everything above

src/app/api/engine/
  assess/route.ts           — POST endpoint to assess a single patient
```

**Key requirements for the Build agent:**
- Import `getEngineModel` from model-provider.ts, use it in assess-patient.ts
- Use `generateText` from `ai` package (not streaming — this is batch processing)
- The engine system prompt MUST instruct the LLM to cite sources with documentTitle, chunkId, excerpt
- The comparator MUST be pure math — no LLM calls. Use `date-fns` for date arithmetic.
- Every function must use the structured logger
- The Zod schema for engine output must match the `pathway_target_run_facts` table columns
- Handle the case where the LLM returns no targets (healthy patient with no overdue actions)
- **Patient context truncation:** Cap at last 10 encounters, latest value per lab type, active meds only, latest vitals only. Total context ~4,000 words max.
- **Add `export const maxDuration = 300;`** to the engine API route (`src/app/api/engine/assess/route.ts`)
- **Register agent tools:** Add `assessPatient` and `getEngineResults` tools to `src/lib/ai/tools.ts` so the interactive chat agent can trigger assessments and query results. Update the system prompt to document these tools.
- **Batch force flag:** The batch runner should support `force: true` to delete existing results and re-assess (needed when prompt/model changes make old results stale)

Then spawn **Critic**, **Tester**, **Verifier** agents as described in the Phase Execution Protocol.

**Test the engine on 1 real patient using a free model** to verify the pipeline works end-to-end. Use a patient with interesting conditions (query for patients with diabetes or hypertension encounters). Log everything.

Commit: `"Phase 1: core assessment engine with comparator and persistence"`

---

### Phase 2: Batch Runner

Spawn a **Build** agent to create:

```
src/lib/engine/batch.ts           — Batch processing with concurrency control
scripts/run-batch.ts              — CLI script for running batches
src/app/api/engine/batch/route.ts — API endpoint for batch runs
```

See IMPLEMENTATION_PROMPTS.md Prompt 2 for details. Key points:
- Concurrency of 3 (avoid API rate limits)
- Skip already-assessed patients (idempotent)
- Log progress: "Processing patient 15/50 (PAT-000423)..."
- Handle individual failures gracefully (log and continue)
- The CLI script should support: `npx tsx scripts/run-batch.ts --limit 5 --tier free`
- Add `export const maxDuration = 300;` to the batch API route
- Support `force: true` in batch options to clear existing results before re-assessing

**Run a batch of 5 patients with the free model tier** to verify the batch runner works. Don't run a large batch — save that for Peter to trigger with the production model.

Commit: `"Phase 2: batch runner with concurrency control and CLI script"`

---

### Phase 3: Three-Column Triage Dashboard

Spawn a **Build** agent to create:

```
src/lib/db/queries/engine-results.ts  — Query functions for engine results
src/app/(main)/page.tsx               — COMPLETE REWRITE: triage dashboard
```

See IMPLEMENTATION_PROMPTS.md Prompt 3 for full layout spec. Key points:
- **Completely replace** the current homepage (it has hardcoded demo data)
- Query `pathway_target_run_facts` for the highest-value action per patient
- Group by `category` (red/yellow/green), split by `confidence` within each
- Each patient card shows: name, age, sex, condition, action, overdue days, confidence badge
- Click a card → navigate to `/patients/{patientId}`
- **Demo analysis animation:** Instead of showing results on page load, show a prominent "Analyze Patient Panel" button. On click, play a ~5-second animation using the **Vector Cube** from `Vector_Cube/vector_cube-main/vector_cube-main/` (custom 3D voxel density visualization — import/adapt as React component). Show progress text cycling: "Connecting to guidelines..." → "Running comparator..." → "Scoring results...". Disclaimer: "Accelerated for demo." Then fade in precomputed results. Store animation state in sessionStorage. Fall back to simpler CSS animation if Vector Cube integration is too complex.
- If no engine results exist in DB at all, show empty state with a button that triggers a real small batch
- Use existing components where possible (RiskBadge, DataBadge, StatusAlert)
- Follow colour scheme: never hardcode colours, use CSS variables
- Cards use `bg-card` background (white)
- Responsive: stack columns vertically on mobile

Also update `src/lib/db/queries/index.ts` to export the new query functions.

**Update system prompt page contexts** in `src/lib/ai/system-prompt.ts`:
- `/` → "Triage Dashboard — patients grouped by urgency (Red/Yellow/Green). Use getEngineResults and assessPatient tools."
- `/patients/[id]` → "Patient Detail — assessment results and evidence citations for a specific patient. Use getPatientDetail, getEngineResults, searchDocuments."

**Update command palette** in `src/components/navigation/command-palette.tsx`:
- Replace "New Patient" / "Export Data" with product-relevant entries: "Care Navigator" → `/navigator`, "Run Assessment"
- Keep existing nav shortcuts

Wrap the triage columns in `<ErrorBoundary>` components so malformed engine data doesn't crash the whole page.

Commit: `"Phase 3: three-column triage dashboard replacing homepage"`

---

### Phase 4: Patient Detail Page

Spawn a **Build** agent to create:

```
src/app/(main)/patients/[id]/page.tsx — COMPLETE REWRITE: patient detail with engine results
```

See IMPLEMENTATION_PROMPTS.md Prompt 4 for full layout spec. Key requirements:

- Show patient demographics at top
- Show ALL engine targets (not just the top one) sorted by actionValueScore
- **EVIDENCE CITATIONS ARE NON-NEGOTIABLE.** Each target must show:
  - Document title, excerpt text inline, and a "View source" button
  - **Do NOT link to the research page** (it doesn't support deep-linking). Instead, on "View source" click, open a slide-over drawer or modal that fetches the full chunk content via `getChunkById(chunkId)` and displays the full text with heading and page number
  - Style citations like real clinical references — numbered superscripts in reasoning text, citation list below
- Each target card has an "Approve & Send" button:
  - On click: show a modal with preview of the "email" to the patient (name, action, explanation, provider/booking info)
  - On confirm: success toast + change button to "Sent" (disabled, checkmark) + **add entry to a visible Activity Log section on the page** showing timestamp, action taken, clinician name ("Dr. Demo User"), delivery status ("Delivered" with green badge)
  - Activity log persists in React state (demo-only, no DB) and shows chronological history of approved actions
  - This is fake but must look real — it demonstrates the clinician review → approve → communicate workflow
- Below the engine results, show raw patient data in tabs:
  - Encounters, Medications, Lab Results, Vitals
  - Use DataTable component with `bg-card` background
  - Highlight abnormal lab values
- Back link to dashboard
- If no engine results exist for this patient, show a "Run Assessment" button that calls `POST /api/engine/assess`
- Wrap the engine results section and data tabs in `<ErrorBoundary>` — engine data could have unexpected nulls or malformed JSONB in evidenceRefs. Defensive null checks on all JSONB fields.

Commit: `"Phase 4: patient detail page with evidence citations and approve flow"`

---

### Phase 5: Patient Navigator

Spawn a **Build** agent to create:

```
src/app/(navigator)/layout.tsx        — Minimal layout (no dashboard chrome)
src/app/(navigator)/page.tsx          — Full-screen chat interface
src/lib/ai/navigator-prompt.ts        — Navigator system prompt
```

Also modify:
```
src/components/navigation/navbar.tsx   — Add "Care Navigator" link
src/app/api/chat/route.ts             — Handle navigator mode (pageContext === '/navigator')
```

See IMPLEMENTATION_PROMPTS.md Prompt 5 for full spec. Key points:

- **Completely separate layout** — no sidebar, no dashboard nav, no agent panel. Just a top bar with "BestPath Care Navigator" branding and a "Back to Dashboard" link, then full-screen chat below.
- Uses the existing `/api/chat` route but with `pageContext: '/navigator'`
- When pageContext is `/navigator`, use `buildNavigatorPrompt()` instead of the normal system prompt
- The navigator prompt defines a conversational care advisor that:
  1. Greets warmly and explains the tool
  2. Asks about health info conversationally (age, sex, conditions, meds, smoking, last doctor visit, symptoms, family history)
  3. Searches guidelines using `searchGuidelines` tool (give it the same engine tools as the engine, or at minimum the existing `searchDocuments` tool from agentTools)
  4. Provides cited recommendations with provider routing (pharmacist, dietitian, walk-in, LifeLabs, etc.)
  5. Includes disclaimer: "This is decision support information, not medical advice"
- Provider routing is part of the LLM's output, backed by document evidence — not hardcoded
- **Use filtered tools for the navigator** — NOT the full agentTools. The navigator should only have `searchDocuments` and `keywordSearch` (corpus search tools). It should NOT have `queryPatients`, `getPatientDetail`, `assessPatient`, etc. — those are clinician tools. Switch tool set in the chat route: `const tools = pageContext === '/navigator' ? navigatorTools : agentTools;`
- The chat should work with the existing `useChat` hook from `@ai-sdk/react`
- Style the chat with warm, approachable aesthetics. Patient-facing, not clinician-facing.
- Add a "Care Navigator" link to the main navbar (`src/components/navigation/navbar.tsx`)

**Test:** Have a quick test conversation to make sure the navigator responds, searches documents, and provides cited answers.

Commit: `"Phase 5: patient care navigator with separate layout and conversational flow"`

---

### Phase 6: Presentation & Demo Polish

**This phase is lighter — do it directly or with one agent.**

1. Rewrite `docs/presentation/demo-script.md` to match the actual built product (see IMPLEMENTATION_PROMPTS.md Prompt 6 for the 5-act demo flow)

2. Rewrite `docs/presentation/talking-points.md` to focus on BestPath's value prop. **Include a section about how we sourced the clinical knowledge base** — reference `health-info-data/` (contains Python scripts that programmatically acquired, filtered, and packaged 4,026 clinical guideline documents from BC and national sources, with 1,534 rejected and 387 supplemental captures). This is a strong differentiator: "We built a systematic pipeline to curate 4,000+ clinical guidelines. Every recommendation traces to a specific passage."

3. **Pre-select demo patients.** Query engine results for the 3-5 best patients to click during the live demo (multiple targets, at least one RED, high confidence, good citations, recognizable conditions like diabetes/hypertension). Write them to `docs/presentation/demo-patients.md` with patient IDs and brief notes on why each is a good demo candidate.

4. Walk through the entire app and fix any obvious UI issues:
   - Dashboard loads and shows data (or graceful empty state)
   - Patient cards are clickable
   - Patient detail shows assessment results
   - Navigator chat works
   - No console errors on any page
   - Navigation between pages works

4. Ensure the `/navigator` link is visible and prominent in the navbar

5. Quick check: does `npm run build` succeed? If not, fix build errors.

Commit: `"Phase 6: presentation materials and demo polish"`

---

### Phase 7: UI/UX Audit — Kill the AI Smell

**This phase is about polish, not features. Spawn a single focused agent.**

The goal: make this look like a product with a designer, not an AI-scaffolded hackathon project. Read IMPLEMENTATION_PROMPTS.md Prompt 7 for the full audit checklist. Summary of what to hunt for and fix:

**Kill these AI giveaways:**
- Generic copy ("Welcome to...", "Get started by...", "Your data at a glance")
- Perfectly symmetrical card grids with identical structure
- Default shadcn zinc greys (should be warm whites and teal from the colour scheme)
- Buttons that say "Get Started" or "Learn More"
- Uniform spacing everywhere (real designs have intentional density variation)
- Emoji in UI labels

**Make these shine:**
- Triage dashboard: dense, clinical, professional. Column headers should be actionable ("Needs Urgent Action") not generic ("Red"). Stats should say something meaningful ("47 patients need action this week").
- Patient detail: evidence citations should look like real clinical citations. Left-border colour accents on target cards (red/yellow/green). "Approve & Send" button should feel consequential.
- Navigator: warm, spacious, patient-friendly. Larger text, inviting input placeholder ("Tell me about your health concerns..."), teal-tinted assistant bubbles.
- Global: warm white background (#FAFAF8) actually used everywhere, teal primary consistent, no default blue links.

**Approach:**
1. Read every page component
2. Fix copy first (highest visual impact), then colours, then spacing, then microinteractions
3. Keep changes surgical — refine, don't rewrite
4. Test at 1920x1080 (demo projector resolution)

Commit: `"Phase 7: UI/UX audit — kill generic AI aesthetics"`

---

### Phase 8: Deployment & Submission Readiness

**Goal:** Deploy to Vercel with a working live demo link, update README to meet submission requirements, and ensure the GitHub repo is submission-ready.

**Submission requirements (from PLAN.md):**
- [ ] Single shareable link (GitHub repo) openable on organizer's laptop
- [ ] Slides (PDF or Google Slides link) in repo README
- [ ] README includes: team members, challenge track, problem statement, solution summary, tech stack, how to run/view demo
- [ ] Deployed to Vercel (live demo link)
- [ ] Code freeze: Saturday March 28, 3:30 PM

#### 1. Vercel Deployment

The project has `VERCEL_TOKEN` and `VERCEL_PROJECT_URL` in `.env`. Use the Vercel CLI to deploy:

```bash
# Install Vercel CLI if needed
npm install -g vercel

# Build first — fix any build errors
npm run build

# Deploy to production
# If the project is already linked (check vercel.json or .vercel/):
vercel --prod --token=$VERCEL_TOKEN

# If not linked yet, link first:
vercel link --token=$VERCEL_TOKEN
vercel --prod --token=$VERCEL_TOKEN
```

**Environment variables on Vercel:** All env vars from `.env` must be set in the Vercel project settings. Use the Vercel CLI or dashboard:
```bash
# Set each required env var on Vercel (read from local .env):
# ANTHROPIC_API_KEY, DATABASE_URL, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY,
# SUPABASE_SECRET_KEY, GEMINI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY,
# LLAMAPARSE_API_KEY, OPENROUTER_API_KEY
# Also set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

vercel env add ANTHROPIC_API_KEY production --token=$VERCEL_TOKEN
# ... repeat for each var, or do it via the Vercel dashboard
```

**If the build fails on Vercel:**
- Check the build logs: `vercel logs --token=$VERCEL_TOKEN`
- Common issues: missing env vars (Vercel needs them set in project settings), Node version mismatch, build memory limits
- The project uses `--webpack` flag for builds — ensure the build script in `package.json` includes this
- Fix and redeploy

**After deployment, verify the live URL:**
- Dashboard loads
- Navigator route (`/navigator`) works
- No CORS or API errors in browser console
- Supabase connection works from Vercel's edge (the DATABASE_URL must be accessible)

#### 2. Rewrite README.md

Rewrite the root `README.md` to meet all submission requirements:

```markdown
# BestPath — Proactive Care Intelligence Platform

> Identifies the next-step highest-value clinical action for patients based on all available information — the screening, medication start, referral, or follow-up most likely to prevent an emergency — and surfaces it with evidence so clinicians can act before conditions escalate.

## Team
- Peter Salmon — Capital Reasoning Solutions, Victoria, BC
- [Co-founder name if applicable]

## Challenge Track
**Track 1: Clinical AI** — "Build an AI-powered tool that improves clinical workflows, patient care, or healthcare delivery using the provided Synthea patient dataset."

## Problem
6.5 million Canadians have no family doctor. Clinics are overwhelmed with reactive care. Patients end up in the ER because a blood pressure medication wasn't started, a referral wasn't made, a follow-up after an abnormal result never happened. These are preventable emergencies.

## Solution
BestPath is a dual-interface clinical intelligence engine:

1. **Clinician View** — A proactive triage dashboard. The system analyzes patients against clinical guidelines, determines the next best clinical action for each, and surfaces a prioritized queue: Red (overdue + high risk), Yellow (overdue + lower risk), Green (on track). Every recommendation is cited against specific clinical guidelines.

2. **Patient View** — A care navigator for people without a family doctor. Enter your health information conversationally, get evidence-based guidance on what you need and who can help — pharmacist, dietitian, walk-in clinic, LifeLabs — not just "see a doctor."

Both interfaces run on the same core: patient data + clinical guidelines via RAG → deterministic comparison → prioritized, evidence-backed next best actions.

## Tech Stack
Next.js 16 · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Postgres + pgvector) · Drizzle ORM · Claude Sonnet (assessment engine) + Opus (interactive agent) · Vercel AI SDK · OpenUI (generative UI) · Gemini Embeddings · Hybrid RAG (vector + keyword + RRF)

## Live Demo
[Vercel deployment URL]

## Slides
[Link to PDF or Google Slides]

## How to Run Locally
[... existing setup instructions ...]
```

**Important:** Fill in the actual Vercel URL after deployment. Leave a placeholder for slides that Peter can fill in (or link to `docs/presentation/pitch.html` if that's the plan).

#### 3. Ensure GitHub Repo is Clean

```bash
# Make sure .env is NOT committed
git check-ignore .env

# Make sure no secrets are in tracked files
grep -r "sk-or-v1\|sk-ant-\|sbp_\|eyJ" --include="*.ts" --include="*.tsx" --include="*.md" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v .env

# Ensure .gitignore covers:
# .env, .env.local, node_modules, .next, .vercel
```

If any secrets are found in tracked files, remove them and amend the relevant commit.

#### 4. Link slides in README

If `docs/presentation/pitch.html` is the presentation, note in the README:
- "Slides: Open `docs/presentation/pitch.html` in a browser, or [Google Slides link]"
- Peter may add a Google Slides link in the morning — leave a clear placeholder

Commit: `"Phase 8: Vercel deployment, README for submission, repo cleanup"`

---

## Final Checklist (after all phases)

Run these as the very last step:

```bash
# Typecheck
npm run typecheck

# Tests
npm run test 2>&1 | tail -100

# Build
npm run build 2>&1 | tail -50

# Check DB has engine results
npx tsx -e "
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL);
const runs = await sql\`SELECT count(*) FROM engine_runs\`;
const facts = await sql\`SELECT count(*) FROM pathway_target_run_facts\`;
console.log('engine_runs:', runs[0].count);
console.log('pathway_target_run_facts:', facts[0].count);
await sql.end();
"
```

Append final status to BUILD_LOG.md:

```markdown
## Final Status
**Typecheck:** PASS/FAIL
**Tests:** X passed, Y failed
**Build:** PASS/FAIL
**Engine data:** X runs, Y target facts
**Known issues:** [list anything Peter needs to know]
**Recommended next steps for Peter:** [what to test, what to fix, what to run]
```

If the build passes, also run: `git add -A && git commit -m "Final: typecheck + build passing"`

---

## Critical Reminders

1. **COMMIT OFTEN.** After every phase. Uncommitted code that Peter can't access is worthless.
2. **Log everything.** Peter will read BUILD_LOG.md first thing in the morning.
3. **Evidence citations are non-negotiable.** Every engine recommendation must link to a source document.
4. **Don't blow the budget.** Use free models for testing. Use Claude Sonnet (not Opus) for the engine. Only run the production-tier batch if everything else is working.
5. **Fix forward, don't block.** If a phase partially fails, commit what works, log what's broken, and move on. Peter can iterate in the morning.
6. **The demo matters most.** If you're running low on time/credits, prioritize: working dashboard > working patient detail > working navigator > UI polish > passing tests > deployment > presentation.
7. **Never hardcode colours** — use CSS variables from the colour scheme.
8. **Never hardcode clinical data** — always retrieve from vector DB.
9. **patient_id is TEXT, not UUID** — it's a string like "PAT-000001". Schema uses `text('patient_id')`.
10. **Use existing patterns.** Follow the code patterns in `src/app/api/chat/route.ts`, `src/lib/rag/retrieve.ts`, and `src/lib/ai/tools.ts`. Don't reinvent patterns that already exist in the codebase.
11. **Field name mapping.** The engine output Zod schema uses `recommendedIntervalDays` but the DB column is `intervalDays`. Map carefully when persisting. Always read `src/lib/db/schema.ts` to verify column names before writing insert queries.
12. **Stub before you need it.** If Phase 1 creates agent tools that import from `engine-results.ts` (a Phase 3 file), create a minimal stub with TODO implementations so the build doesn't break between phases.
13. **Deduplicate engine targets.** LLMs produce duplicate recommendations for conditions mentioned in multiple encounters. After LLM output, group by `condition + screeningType` and keep the highest-confidence one.
14. **Validate citations exist.** Any target with `confidence: 'high'` but empty `evidenceRefs` must be demoted to `confidence: 'low'` programmatically. Never ship high-confidence without evidence.
