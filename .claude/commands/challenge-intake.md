# Challenge Brief Intake & Sprint Planning

Analyse the hackathon challenge brief and generate a sprint plan. The user will either paste the challenge text directly or tell you to read `docs/challenge-intake.md`.

## Steps

### 1. Read the challenge brief
If the user hasn't pasted it directly, read `docs/challenge-intake.md` for the raw brief.

### 2. Identify the track
Determine which track best fits:
- **Research Data Platform** — focus on data exploration, search, analysis
- **Healthcare Data Insights** — focus on visualization, trends, predictions
- **Ethical AI & Data Governance** — focus on fairness, transparency, audit

### 3. Map to existing scaffold

**Existing components available:**
- Data Display: StatCard, DataBadge, List, DataTable, ImageCard, ComparisonTable, MetricRow
- Charts: BarChart, LineChart, DonutChart, SparkLine, AreaChart, HeatMap, ScatterPlot, RadarChart, GaugeChart
- Healthcare: PatientCard, RiskBadge, Timeline, VitalSign, MedicationCard
- Layout: Row, Card, Tabs, Page, Section, Grid
- Feedback: StatusAlert

**Existing API endpoints:**
- GET/POST `/api/patients` — patient CRUD with search, filter, pagination
- GET `/api/encounters` — encounter listing with patient/status/type filters
- GET `/api/observations` — clinical observations with patient/encounter filters
- GET `/api/medications` — medication listing with patient/status filters
- GET/POST `/api/documents` — document CRUD
- GET `/api/documents/search` — hybrid semantic + keyword search
- POST `/api/chat` — AI agent streaming endpoint

**Existing agent tools:** queryPatients, getPatientDetail, searchDocuments, keywordSearch, listDocuments, getDocumentChunk, getMetrics

**Existing pages:** Dashboard, Patients (stub), Research, Settings

### 4. Identify gaps
List:
- New components needed
- New API endpoints needed
- New agent tools needed
- Schema changes required
- Data transformations required (their format → our schema)
- Documents to upload to RAG pipeline

### 5. Generate sprint plan

**Friday Evening (~2 hours after kickoff):**
- Load the provided dataset into Supabase
- Write data import/transformation script
- Upload any PDF/document materials to RAG
- Identify which pre-built components map to requirements

**Saturday Morning (4 hours):**
- Hour 1-2: New API endpoints + agent tools (use `/add-api-route` and `/add-agent-tool`)
- Hour 2-3: New/modified pages and components (use `/scaffold-page` and `/add-component`)
- Hour 3-4: Agent integration — ensure agent can answer challenge-relevant questions

**Saturday Early Afternoon (2 hours):**
- Wire everything end-to-end
- Test the full demo flow
- Fix bugs and visual issues

**Saturday Late Afternoon (1 hour):**
- Run through demo script 2-3 times
- Time it (under 3 minutes)
- Deploy to Vercel
- Prepare backup prompts

### 6. Update demo script
Suggest modifications to `docs/presentation/demo-script.md` based on the challenge. Keep the same narrative arc (platform → agent → RAG → wow moment) but swap in challenge-specific data and queries.

### 7. Fill in the intake doc
Update `docs/challenge-intake.md` with your analysis so it's captured for reference.

## Output
Provide:
1. Track recommendation with reasoning
2. Component/API mapping table
3. Gap analysis (what's missing)
4. Prioritized sprint plan with time estimates
5. Updated demo script suggestions
6. Risk areas (what might go wrong, what to deprioritize if behind)
