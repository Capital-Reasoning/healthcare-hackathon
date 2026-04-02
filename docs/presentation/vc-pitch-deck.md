# BestPath — VC Pitch Deck (Read-Alone)
### Capital Reasoning Systems | April 2026

> **Format:** Self-contained — designed to be read without a presenter
> **File:** `BestPath-VC-Pitch.pptx` (same directory)
> **Slides:** 12

---

## Slide 1 — Title

**BestPath**
Early Detection. Better Outcomes.

Identifying overdue screenings and connecting patients with the care they need — powered by clinical guidelines and vector database technology.

Capital Reasoning Systems | Victoria, BC
Peter Salmon · Nicholas Miller
capitalreasoning.com | April 2026

---

## Slide 2 — The Problem

### 6.5 million
**Canadians have no family doctor.**

Clinicians managing panels of 1,500+ patients cannot manually track who is overdue for which screening against hundreds of clinical guidelines. When preventive care is missed, conditions escalate into emergencies — a diabetic without an A1C check in two years, a 55-year-old never screened for colorectal cancer. These aren't edge cases.

**These are preventable emergencies.**

*4,620 people died on BC waitlists last year. Every missed screening matters.*

---

## Slide 3 — A Technology Inflection Point

| BEFORE | NOW |
|--------|-----|
| Clinical guidelines published as PDFs | LLMs parse and understand guideline documents |
| Patient records locked in EMR systems | Vector databases index them by meaning |
| Matching them: manual chart review | RAG pipelines match patients to relevant guidelines |
| Time to screen 1,500 patients: **Months** | Time to screen 1,500 patients: **Minutes** |

*The convergence of large language models, vector databases, and retrieval-augmented generation makes this a deployable product — not a research project — for the first time.*

---

## Slide 4 — Two Inputs. One Output.

### INPUT: Health Guidelines
4,000+ provincial and federal clinical guidelines — BC clinical practice guidelines, CTFPHC, BC Cancer, Diabetes Canada, Hypertension Canada, and more.

### INPUT: Patient Data
Individual patient demographics, active conditions, medications, vitals, and encounter history — imported from EMR systems.

### OUTPUT: Targeted, Evidence-Cited Outreach
The system analyzes patient profiles against condition-specific screening recommendations and intervals. It determines what's overdue, prioritizes by clinical urgency, and — with a single action — initiates outreach via email and SMS, informing patients what needs to be done and where to access care.

Deterministic comparison. Every recommendation traced to a specific guideline passage. No AI in the clinical scoring loop.

*The AI reads the guidelines. The math makes the decisions. The clinician stays in control.*

---

## Slide 5 — Care Review Dashboard

*(Screenshot: three-column triage dashboard with charts and patient table)*

375 patients analyzed against clinical guidelines in minutes. Three-column triage view: **Urgent** · **Follow-up** · **On Track** — with confidence scoring and evidence citations on every recommendation.

---

## Slide 6 — From Assessment to Patient Outreach

A single action initiates targeted outreach via email and SMS.

*(Left: Patient assessment with evidence citations → Right: Notification modal with email and SMS)*

Every recommendation cites its source guideline — section and page number. The clinician reviews, approves, and sends. The patient receives clear instructions: what needs to be done and where to access care.

---

## Slide 7 — Built for Clinical Trust

| CLINICAL GUIDELINES | PATIENT DATA | DETERMINISTIC MATH |
|---|---|---|
| Define what's needed | Show what's been done | Confirm what's overdue |
| 4,000+ documents, cited to section and page | EMR records with timestamped observations | Auditable scoring — no black box |

> *AI reads the guidelines and generates explanations. It never determines the triage category — the math does.*

**Regulatory Positioning:** Designed for Health Canada SaMD exclusion — provides information for clinician decision-making, not autonomous clinical decisions. Clinicians explicitly approve every recommendation. Fully auditable chain from recommendation to source guideline.

---

## Slide 8 — Market Opportunity

**PRIMARY CARE CLINICS** — Entry Market
50,000+ clinics across Canada. Every family practice managing patient panels too large to manually screen.

**HEALTH AUTHORITIES** — Scale Market
Provincial systems managing population-level preventive care — with real budgets and mandates for digital health adoption.

**PRIVATE & SENIOR CARE** — Premium Market
Concierge clinics offering deep preventive medicine. Retirement homes ensuring residents get timely screenings — a care quality and liability imperative.

**200 clinics x $8K/year = $1.6M ARR** — before health authorities, premium tiers, or international expansion.

**Expansion:** Now: BC guidelines, family practice. Next: National (CTFPHC), any Canadian clinic. Then: International — UK, Australia, NZ. The engine is guideline-agnostic.

---

## Slide 9 — On-Premise. Privacy-First.

**Patient data never leaves the clinic's network.**

Most AI health tools are cloud-based. BestPath deploys on the clinic's own infrastructure, eliminating privacy and compliance barriers entirely.

| Revenue Stream | Type | Description |
|---|---|---|
| Installation & Integration | One-time | Deploy on clinic hardware, integrate with EMR |
| Annual Platform License | Recurring | Software updates, security patches, support |
| Guideline Corpus Updates | Recurring | We maintain the clinical knowledge base |

*The curated guideline knowledge base is the product. Clinics subscribe to the intelligence — not the compute.*

---

## Slide 10 — The Team

**Peter Salmon** — Software Development · AI & Information Retrieval
Contract developer building AI-powered products. Creator of AirDocs (AI document processing). Expertise in semantic search and full-stack development.
capitalreasoning.com · airdocs.ca

**Nicholas Miller** — Client Experience · Operations & Service Design
AV Manager at Delta Hotels Victoria. Designing customer-facing systems and service delivery workflows. Drives UX and product design.

**Capital Reasoning Systems** — Victoria, BC. AI-powered information retrieval products since 2024.

We're AI specialists who found a healthcare problem our exact skill set can solve. **Clinical domain expertise is the first gap we're addressing with funding.**

---

## Slide 11 — The Ask

### $50,000
**From hackathon project to first paying customer.**

| Bucket | Allocation | Purpose |
|--------|-----------|---------|
| **Clinical Expertise** | ~40% · $20K | Healthcare researcher to validate and expand the guideline corpus. Domain credibility — the most critical hire. |
| **Infrastructure** | ~35% · $17.5K | On-premise demo hardware, production deployment. Harden for real clinical use. |
| **Go-to-Market** | ~25% · $12.5K | Clinic pilot program with 2-3 practices. Outreach to health authority innovation teams. |

**Target: first paying clinic within 6 months** — validates the product, generates revenue, positions for a seed round.

*This is bridge capital — we're not building a company on $50K. We're proving it works in the real world.*

---

## Slide 12 — Close

**BestPath**
Early Detection. Better Outcomes.

The guidelines exist. The patient data exists. **We built the engine that connects them.**

peter@capitalreasoning.com · capitalreasoning.com

*Live product demo available on request.*

---

## Appendix — Q&A Reference

### Technical Architecture
Next.js 16, TypeScript (strict), Supabase PostgreSQL + pgvector, Drizzle ORM, Claude Opus 4.6 via Vercel AI SDK. RAG: LlamaParse → semantic chunking → Gemini embeddings → pgvector hybrid search. Deterministic comparator: no LLM in scoring loop.

### Clinical Knowledge Base
4,026 documents selected, 1,534 rejected, 387 supplemental. Sources: BC guidelines, CTFPHC, BC Cancer, Diabetes Canada, Hypertension Canada, Health Canada DPD, immunization schedules, specialty guidelines.

### Patient Care Navigator (if asked)
Second interface for unattached patients — conversational, same engine. "What care am I due for? Where can I get it?" Decision support, not medical advice.

### Competitive Landscape
- Manual chart review: doesn't scale, doesn't happen
- EMR reminders (Oscar, MOIS, Telus Health): rule-based, not evidence-linked
- Enterprise tools (Cerner, Epic): $100K+, long implementation cycles
- BestPath: full guideline corpus, on-premise, evidence-cited, affordable

### Deal Structure
SAFE (YC post-money) is standard. Typical $50K pre-seed: $300K-$500K cap. Let the VC propose terms first if possible.
