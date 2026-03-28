# Demo Script — BestPath (5 Minutes)

> **Goal:** Show that BestPath solves the preventive care crisis with a deterministic, evidence-cited engine that serves both clinicians (triage dashboard) and unattached patients (care navigator) through one shared architecture.

---

## Act 1: The Problem (30s)

> "6.5 million Canadians don't have a family doctor. When preventive care gets missed, conditions escalate — and patients end up in the ER."

- Pause for emphasis.

> "A diabetic who hasn't had their A1C checked in two years. A 55-year-old who's never been screened for colorectal cancer. These aren't edge cases. These are preventable emergencies."

> "We built BestPath to fix this."

---

## Act 2: Clinician View — Triage Dashboard (90s)

**Action:** Open the BestPath dashboard (`/`).

- Click **"Analyze Patient Panel"** — the animation runs through "Connecting patient data to clinical guidelines... Running deterministic comparator... Scoring and categorizing results..."
- Three columns appear: **Needs Urgent Action** (red), **Follow-up Required** (yellow), **On Track** (green).
- Point out the stats bar: patients assessed, patients needing action this week, patients on track.

> "BestPath analyzed the patient panel against clinical guidelines. Here's who needs action now."

- Point to a red-column card — note the overdue badge ("245d overdue"), the confidence badge, the condition and action summary.
- Point out the confidence splitting within each column: "High Confidence" targets at the top, "Lower Confidence" below.

> "High-confidence targets have strong evidence from the clinical guidelines and clear patient data. Lower-confidence ones may need chart review."

- **Click a patient card** to navigate to the patient detail page.

---

## Act 3: Patient Detail — The Reasoning (60s)

**Action:** Show the patient detail page (`/patients/[id]`).

- Point to the patient header: name, age, sex, last encounter.
- Scroll to the **Assessment Results** section.
- Point to a target card with the red left border — note the "Action Required" badge, the screening type, the recommended action.

> "Every recommendation is backed by specific clinical guidelines."

- Point to the **Evidence** section on the card — show the citation with document title and excerpt.
- **Click "View source"** — the dialog opens showing the full guideline text with section heading and page number.

> "This isn't AI guessing. The guidelines say what's needed. The patient data shows what's been done. The math confirms what's overdue."

- Point to the **Why this action** and **Why now** boxes.
- **Click "Approve & Send to Patient"** — the confirmation dialog appears with the notification preview.
- Click **Send Notification** — toast appears, the button changes to "Sent", and the Activity Log updates.

> "The clinician decides. The system supports."

---

## Act 4: Patient Navigator (60s)

**Action:** Click **Navigator** in the top nav bar.

> "But what about the 6.5 million without a doctor?"

- The Care Navigator opens — separate layout, patient-facing design.
- Note the welcome message: "I help people without a family doctor understand what clinical care they may need and where to get it in British Columbia."

**Type:** "I'm 55 years old, male, I have high blood pressure and type 2 diabetes. I haven't seen a doctor in about 3 years."

- Wait for the response. The navigator will ask follow-up questions about medications, last screenings, etc.

**Type a follow-up** with more details (e.g., "I take metformin and lisinopril. I don't remember my last blood test.")

- The navigator provides cited recommendations with specific actions and provider routing.

> "You don't need a doctor for everything. A pharmacist can monitor your blood pressure. A walk-in clinic can order your A1C. BestPath tells you what you need and where to go."

- Point to the disclaimer at the bottom: "This is decision support information, not medical advice."

---

## Act 5: Architecture + Impact (30s)

> "Same engine, two interfaces. One for clinicians triaging their panel. One for patients navigating their own care."

- If time, quickly switch back to the dashboard to show the visual contrast.

> "The engine is deterministic: clinical guidelines define what's needed, patient data shows what's been done, simple math confirms what's overdue. Every recommendation traces to a specific guideline passage — no AI hallucination."

> "We built a pipeline that curated over 4,000 clinical guideline documents from BC and national sources. Every recommendation you saw today links back to those documents."

> "Augment clinician capacity. Navigate patients to the right care. Prevent emergencies before they happen."

> "This is BestPath. Thank you."

---

## Backup Talking Points (if judges ask)

- **Architecture:** Next.js 16, TypeScript, Supabase PostgreSQL + pgvector, Drizzle ORM, Claude Opus 4.6, Vercel AI SDK
- **Clinical knowledge base:** 4,026 documents selected, 1,534 rejected, 387 supplemental — systematically acquired via Python pipeline from BC guidelines, CTFPHC, specialty guidelines, Health Canada DPD
- **RAG pipeline:** LlamaParse parsing, semantic chunking, Gemini 3072-dim embeddings, pgvector hybrid search (vector + BM25 with Reciprocal Rank Fusion)
- **Deterministic engine:** No LLM in the scoring loop. Guidelines define targets, patient data provides inputs, math produces the triage category. AI is used only for explanation text and the navigator conversation.
- **Regulatory:** Engine design aligns with Health Canada SaMD exclusion criteria — the system provides information for clinician decision-making, not autonomous clinical decisions.
- **Data:** Synthea-generated synthetic patients (FHIR-based), imported via CSV pipeline. Real data would come from EMR integration.

## Demo Recovery (if something breaks)

- **Dashboard empty:** Click "Analyze Patient Panel" — if no engine data, it will trigger a batch run.
- **Patient has no results:** Click "Run Assessment" on the patient detail page to trigger a single-patient engine run.
- **Navigator slow:** Pre-type a message and have it ready to paste.
- **General:** Have a second browser tab open on a patient detail page with existing results as a fallback.
