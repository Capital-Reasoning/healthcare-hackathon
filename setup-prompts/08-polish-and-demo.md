# Phase 08 — Polish, Demo Prep & Hackathon Acceleration

## Context
Phases 01-07 are complete. The app has a full UI component library, working agent panel with OpenUI generative UI, database with seeded data, REST API, and RAG pipeline. This is the final prep phase before the hackathon.

Read `CLAUDE.md` for conventions.

**This phase is about polish, preparation, and acceleration tooling. We want to walk into the hackathon with a scaffold that is not only functional but looks great, demos well, and has tooling that lets us move at 10x speed.**

**Ask me about any demo flow decisions, priority calls, or if you think something should be cut vs. kept.**

## Objective
Polish the UI (responsive pass, glass effects, animations), create demo data and presentation materials, build a challenge brief intake system, create Claude Code skills for rapid development, and do a final documentation pass.

## Step-by-Step Instructions

### 1. Responsive Polish Pass

Go through every page and component at these breakpoints:
- **1440px** (desktop) — should look polished and spacious
- **1024px** (tablet/small desktop) — agent panel pushes content, content goes to narrow layout
- **768px** (tablet portrait) — stacked layouts, simplified navigation
- **640px** (mobile) — mobile-optimized, bottom sheet agent panel

Fix any layout issues.

### 2. Glass & Gradient Polish

Refine the agent panel aesthetic:
- Ensure the frosted glass is consistent across light/dark elements
- Verify glass effects work across browsers (Safari, Chrome, Firefox)
- Agent-generated components should have a subtle shimmer on first appearance (then settle)
- ThinkingIndicator should feel alive but not distracting

### 3. Animation Polish

- Panel open/close: smooth 300ms transition, no layout jank
- Chat messages: staggered fade-in-up
- Agent-generated components: subtle scale-in
- Page transitions: simple fade between routes (optional, but nice)
- Skeleton loading: synchronized shimmer direction (all shimmer left-to-right together)
- Tooltips: quick fade-in (150ms), no bounce

### 4. Demo Data Enhancement

Update the seed script to create a compelling demo narrative:

**Create a "story" in the data:**
- A cluster of 5-6 patients with diabetes (varying risk levels) — enables "show me diabetic patients" demo
- One high-risk patient with multiple encounters and declining metrics — enables "tell me about this patient" deep dive
- A recent trend of increasing ER visits — enables "why are ER visits up?" analysis
- A medication that shows a correlation with improved outcomes — enables "which treatments are most effective?" analysis

**Upload 2-3 sample documents** (if the RAG pipeline is working):
- A clinical guideline document (publicly available)
- A policy/procedure document (can be synthetic)
- A research summary (can be synthetic)

These enable the "search our documents for..." demo.

### 5. Presentation & Demo Materials

**Create `docs/presentation/demo-script.md`:**

```markdown
# Demo Script — Rithm Healthcare Platform (2-3 minutes)

## Opening (15 seconds)
"Healthcare organizations drown in data but starve for insights.
Rithm fuses powerful data visualization with an AI co-pilot that speaks
the same visual language as the rest of the platform."

## Act 1: The Dashboard (30 seconds)
- Show the dashboard with real-time metrics (stat cards, notifications)
- Click through to Patients → point out DataTable with filtering, sorting
- Filter by risk level = High → show filtered results
- "This is a fully functional data platform — but watch what happens
  when we bring in the AI..."

## Act 2: The AI Co-Pilot (45 seconds)
- Click the agent panel open (smooth glass slide-in)
- Type: "Show me patients at high risk for readmission"
- Agent queries database → generates a filtered DataTable + RiskBadge components
- "Notice: these aren't screenshots or mockups. The AI is generating
  real UI components — the same components that power the rest of the app."

## Act 3: Deep Analysis (30 seconds)
- Type: "Visualize the readmission trend over the last 6 months"
- Agent generates a LineChart with trend data
- Type: "Why is this trending up? Check our clinical guidelines."
- Agent searches documents → generates cited answer with [Doc, p.X] citations

## Act 4: The Wow Moment (20 seconds)
- Type: "Compare treatment outcomes for these patients — show me which
  medications correlate with lower readmission rates"
- Agent generates a ComparisonTable or BarChart with medication effectiveness data
- "Every visualization you've seen was generated on the fly.
  No templates. No hardcoded layouts. Native components, infinite combinations."

## Closing (10 seconds)
- "Rithm: where data meets intelligence."
- Show the dashboard one more time — full circle
```

**Create `docs/presentation/talking-points.md`:**
- Key differentiators (generative UI, not a chatbot)
- Business viability angle (every healthcare org wants this)
- Technical architecture overview (one-liner)
- Future potential (any dataset, any domain)
- Team intro (Capital Reasoning)

### 6. Challenge Brief Intake System

**Create `docs/challenge-intake.md`:**

A template that Peter can fill in when the challenge brief is revealed at the hackathon kickoff:

```markdown
# Challenge Brief Intake

## Raw Challenge (paste the brief here)
> [Paste the exact challenge brief text here]

## Dataset Description
- **What data is provided?**
- **Format?** (CSV, JSON, FHIR, database dump, API access?)
- **Size?** (rows, documents, etc.)
- **Sensitive data?** (real patient data, synthetic, anonymized?)

## Key Requirements
- [ ] Requirement 1
- [ ] Requirement 2
- [ ] Requirement 3

## Which Track?
- [ ] Research Data Platform
- [ ] Healthcare Data Insights
- [ ] Ethical AI & Data Governance

## Mapping to Our Scaffold
- **Which existing components can we use?**
- **What new components do we need?**
- **What API endpoints do we need to add?**
- **What data transformations are needed?**
- **What RAG documents should we upload?**

## Sprint Plan (fill in during hackathon)
### Hour 1-2: Data Ingestion
- [ ] Load provided dataset into Supabase
- [ ] Create any new schema needed
- [ ] Seed data pipeline

### Hour 3-4: Feature Building
- [ ] ...

### Hour 5-6: Agent Integration
- [ ] ...

### Hour 7-8: Polish & Demo Prep
- [ ] ...
```

**Create a `/challenge-intake` skill** (or prompt) that, when given the challenge brief text:
1. Analyzes which track it best fits
2. Maps existing components/APIs to requirements
3. Identifies gaps (what new things need to be built)
4. Generates a sprint plan with time estimates
5. Suggests demo script modifications
6. Identifies which data from the provided dataset to prioritize loading

### 7. Claude Code Skills

Create custom Claude Code skills in `.claude/skills/` (or document them as reusable prompts in `docs/skills/`):

**`/scaffold-page`** — Generate a new page:
- Creates the route file in `src/app/(main)/[name]/page.tsx`
- Pre-wires: Page layout, data loading, agent panel integration
- Creates associated API route stub
- Adds navigation link in Navbar

**`/add-component`** — Create a new component:
- Creates component file in appropriate directory
- Adds TypeScript props interface
- Creates OpenUI `defineComponent` wrapper
- Registers in the OpenUI library
- Adds to barrel export

**`/add-api-route`** — Create a new API endpoint:
- Creates route file following conventions
- Creates Drizzle query functions
- Registers as agent tool
- Updates MCP tool registry
- Follows pagination/sort/filter patterns

**`/add-agent-tool`** — Register a new agent tool:
- Creates tool definition with Zod schema
- Adds to tools registry
- Updates system prompt context
- Documents the tool

**`/test-review-commit`** — Pre-commit quality check:
- Runs TypeScript type checking (`npm run typecheck`)
- Runs ESLint (`npm run lint`)
- Runs any tests if they exist
- Checks for console.log statements in committed code
- If all pass: stages changes, generates commit message, commits
- If failures: shows the errors, suggests fixes, asks to proceed or fix

For each skill, create a markdown file that can be referenced by Claude Code. The file should contain:
- The full prompt/instructions
- Example usage
- Expected output

Store these in `docs/skills/` or `.claude/commands/` (whichever is the standard for custom Claude Code skills).

### 8. CLAUDE.md Final Pass

Do a comprehensive update of CLAUDE.md and all nested CLAUDE.md files:
- Ensure all patterns are documented with examples
- Add a "Quick Start" section at the top
- Add a "During Hackathon" section with common tasks and how to do them
- Document all available npm scripts
- Document all agent tools
- Document the OpenUI component library
- Add a "Troubleshooting" section for common issues
- Verify all file paths referenced in the docs still exist

### 9. Ideas & Stretch Goals Document

**Create `docs/ideas.md`:**

Document ideas for the hackathon that we thought of but didn't build yet:

```markdown
# Ideas & Stretch Goals

## If Time Allows
- Healthcare MCP server (FDA, PubMed, ICD-10 lookups)
- Real-time data pipeline with Supabase Realtime subscriptions
- PDF report generation (export analysis as PDF)
- Collaborative annotations (tag data points, share insights)
- Audit log page (track all data access and agent interactions)
- Model bias detection dashboard (track prediction fairness)
- FHIR import/export module (standard data exchange)

## Potential Data Visualizations (depending on challenge)
- Geographic heatmap (patient distribution)
- Network graph (care team relationships)
- Sankey diagram (patient flow through departments)
- Gantt chart (treatment timelines)
- Survival curves (outcome analysis)

## Agent Capabilities to Add
- Write-back with approval (agent suggests DB updates, user approves)
- Alert generation (agent identifies concerning trends, creates alerts)
- Report scheduling (generate weekly summaries)
- Multi-modal (agent can analyze uploaded images/charts)
```

### 10. Pre-flight Checklist

Run through this checklist and fix any issues:

**Build & Deploy:**
- [ ] `npm run build` succeeds with no errors
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes (warnings OK, errors not)
- [ ] Deploy to Vercel succeeds (or is ready to deploy)
- [ ] Environment variables configured on Vercel (if deploying)

**UI:**
- [ ] Dashboard looks polished at 1440px
- [ ] Dashboard looks good at 1024px
- [ ] Dashboard is usable at 640px
- [ ] Agent panel opens/closes smoothly
- [ ] Agent panel glass effect looks good
- [ ] Chat messages stream properly
- [ ] No broken images, missing fonts, or layout glitches
- [ ] ⌘K command palette works
- [ ] ⌘. agent panel toggle works

**Backend:**
- [ ] All API routes return correct data
- [ ] Seed data is loaded
- [ ] Database has proper indexes
- [ ] Agent tools return real data

**RAG:**
- [ ] Document upload works (or pipeline is ready to work)
- [ ] Search returns relevant results (or is properly mocked)

**Documentation:**
- [ ] CLAUDE.md is comprehensive and accurate
- [ ] All nested CLAUDE.md files are up to date
- [ ] Skills/prompts are ready for hackathon use
- [ ] Demo script is written
- [ ] Challenge intake template is ready

### 11. Git Commit

Once everything is verified, commit the complete scaffold. Do NOT push yet — ask me before pushing. Create a well-structured commit (or series of commits) with clear messages describing what was built.

## Success Criteria
- [ ] All responsive breakpoints look good
- [ ] Glass/gradient effects are polished
- [ ] Animations feel smooth and intentional
- [ ] Demo data tells a compelling story
- [ ] Demo script exists in docs/presentation/
- [ ] Challenge intake template exists
- [ ] Claude Code skills are documented and ready
- [ ] CLAUDE.md is comprehensive
- [ ] `npm run build` passes
- [ ] The app looks and feels like something that could win a hackathon
