# Challenge Brief Intake

> Fill this in when the challenge brief is revealed at hackathon kickoff (Friday evening, March 27).
> Then, feed this to Claude Code with the prompt:
> "Read docs/challenge-intake.md. Analyze the challenge, map it to our existing scaffold, identify gaps, and generate a sprint plan for the next ~18 hours of building."

---

## Raw Challenge Brief
> [Paste the exact challenge brief text here]

## Dataset Description
- **What data is provided?**
  >
- **Format?** (CSV, JSON, FHIR, database dump, API access, PDFs?)
  >
- **Size?** (rows, documents, number of patients/records?)
  >
- **Sensitive data?** (real patient data, synthetic, anonymized?)
  >
- **Access method?** (download, API endpoint, database connection?)
  >

## Key Requirements
- [ ] Requirement 1:
- [ ] Requirement 2:
- [ ] Requirement 3:
- [ ] Requirement 4:
- [ ] Requirement 5:

## Which Track Best Fits?
- [ ] Research Data Platform
- [ ] Healthcare Data Insights
- [ ] Ethical AI & Data Governance

**Why?**
>

## Judging Criteria Mapping
| Criteria                | How we address it                                      |
| ----------------------- | ------------------------------------------------------ |
| Innovation & Creativity | Generative UI — AI builds native components, not text  |
| Technical Execution     | Full-stack: Next.js + Supabase + Claude + OpenUI + RAG |
| Business Viability      | [fill in based on challenge]                           |
| Presentation Quality    | Polished demo with clear narrative arc                 |

## Mapping to Our Scaffold

### Existing Components We Can Use
> [List which of our pre-built components are relevant]

### New Components Needed
> [List any new components the challenge requires]

### New API Endpoints Needed
> [List endpoints we need to add]

### Data Transformations Required
> [How to get from their data format to our schema]

### Documents to Upload for RAG
> [Which provided materials should go into the RAG pipeline]

### Agent Tools to Add
> [New tools the agent needs for this specific challenge]

## Sprint Plan

### Friday Evening (after kickoff, ~2 hours)
**Goal:** Understand the challenge, load data, adapt schema

- [ ] Read and annotate the challenge brief
- [ ] Examine the provided dataset
- [ ] Map data to our schema (patients, encounters, observations, etc.)
- [ ] Write data import script (CSV/JSON → Supabase)
- [ ] Run import, verify data is in the database
- [ ] Upload any PDF/document materials to RAG pipeline
- [ ] Identify which pre-built components map to requirements
- [ ] Plan any new components needed
- [ ] Update the demo script with challenge-specific narrative

### Saturday Morning (4 hours)
**Goal:** Build challenge-specific features

- [ ] Hour 1-2: New API endpoints + agent tools
- [ ] Hour 2-3: New/modified components
- [ ] Hour 3-4: Agent integration — ensure the agent can answer challenge-relevant questions

### Saturday Early Afternoon (2 hours)
**Goal:** Polish and integrate

- [ ] Wire everything together end-to-end
- [ ] Test the full demo flow
- [ ] Fix any bugs or visual issues
- [ ] Add challenge-specific demo data if needed

### Saturday Late Afternoon (1 hour)
**Goal:** Demo prep

- [ ] Run through demo script 2-3 times
- [ ] Time it (must be under 3 minutes)
- [ ] Prepare backup prompts in case something fails
- [ ] Ensure deployed version on Vercel is up to date
- [ ] Prepare any slides if needed (probably not — live demo is better)

## Notes & Ideas
> [Space for thoughts, pivot ideas, things that come up during building]
