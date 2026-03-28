# Demo Script — BestPath (2-3 Minutes)

> **Goal:** Show that BestPath fuses powerful data visualization with an AI co-pilot that generates native UI on the fly — not a chatbot, not a static dashboard, but both working together.

---

## Opening (15 seconds)

> "Healthcare organizations are drowning in data but starving for insights. Everyone's building chatbots or dashboards. We built both — and made them speak the same language."

## Act 1: The Data Platform (30 seconds)

**Action:** Show the dashboard.

- Point out the stat cards: "Real-time metrics across the population — 2,847 patients, 384 active cases."
- Point out the notification: "The platform flags model bias automatically — this risk model has an 18% higher false-positive rate for patients over 65."
- Navigate to Patients → show the DataTable
- Click column headers to sort, apply a filter (Risk Level = High)
- "This is a fully functional, production-grade data platform. Clean, fast, well-organized. But watch what happens when we bring in the AI."

## Act 2: The AI Co-Pilot (45 seconds)

**Action:** Open the agent panel (⌘.).

- Glass panel slides in — pause briefly to let the aesthetic land
- Type: **"Show me patients at high risk for readmission"**
- Agent calls `queryPatients` → generates a DataTable with RiskBadge components
- "Notice something? These aren't screenshots or templates. The AI just generated real UI components — the same components that power the rest of the app."
- Type: **"Visualize the readmission trend over the last 6 months"**
- Agent generates a LineChart
- "Every chart, every table, every card — generated on the fly using our component library."

## Act 3: Deep Analysis with RAG (30 seconds)

**Action:** Continue in the agent panel.

- Type: **"Why might readmissions be increasing? Check our clinical guidelines."**
- Agent searches documents (show the "Searching documents..." thinking indicator)
- Agent returns cited answer: "According to [Clinical Guidelines, p.23]..." with CitationPills
- Click a citation → popover shows the source text
- "The AI has access to all our uploaded documents. Hybrid search — semantic and keyword — with full citations."

## Act 4: The Wow Moment (20 seconds)

**Action:** One more prompt.

- Type: **"Compare treatment outcomes — which medications correlate with lower readmission rates?"**
- Agent generates a BarChart or ComparisonTable
- "Every healthcare org needs this. Data they can trust. AI that speaks their visual language. Built in a weekend."

## Closing (10 seconds)

> "BestPath: where data meets intelligence. Thank you."

- Show the dashboard one more time — full circle

---

## Backup Prompts (if something goes wrong or we need alternatives)

- "Summarize the patient population demographics"
- "What are the most common conditions in our dataset?"
- "Show me the distribution of risk levels as a chart"
- "Find patients on [specific medication] and show their outcomes"
- "Create a summary card for patient [name]"

## Technical Talking Points (if judges ask)

- **Architecture:** Next.js + React, Claude Opus 4.6 with OpenUI for generative components
- **Data:** Supabase PostgreSQL with pgvector for hybrid search
- **RAG:** LlamaParse + semantic chunking + Gemini embeddings + hybrid retrieval (vector + keyword)
- **Differentiator:** OpenUI — the AI generates native UI components, not raw text. 47-67% fewer tokens than JSON alternatives. Streaming renders progressively.
- **Business viability:** Every healthcare org has both a "data dashboard" problem and an "AI assistant" problem. We solve both in one product. The component library is reusable across any healthcare dataset.
