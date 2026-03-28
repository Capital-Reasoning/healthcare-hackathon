# BestPath — Pitch Deck

## Slide 1: The Problem (Three Fractures)

Across BC's healthcare system, care breaks down at three points:

**Many patients are without primary care.**
6.5 million Canadians have no family doctor. They don't know where to go, so they wait — or go to the ER.

**Many primary care providers are overloaded with reactive work.**
They spend time chasing follow-ups instead of preventing escalation.

**Many non-emergency health needs are routed into high-cost emergency pathways.**
The system pays crisis prices for problems that were preventable six months ago.

Where these fractures overlap, preventable issues become emergencies.

4,620 people died on BC waitlists last year.

---

## Slide 2: What BestPath Does

BestPath is a proactive care intelligence engine for patients, providers, and the BC health system.

It compares patient data with clinical guidelines to surface one clear next action — what to do, when to do it, and where care should happen.

Not a chatbot. Not a dashboard. A system that finds the single highest-value clinical action for each patient and makes it operational with one click.

---

## Slide 3: How It Works

BestPath builds two profiles per patient:

**Risk Confluence Vector (RCV)** — *who is this patient?*
Combines demographics, active conditions, vitals, medications, and utilization patterns into one risk profile. Derives key risk states. Assigns confidence based on data quality and recency.

**Screening Recency Vector (SRV)** — *what has been done, and when?*
Tracks each relevant action's last trusted completion date and result. Flags missing history explicitly.

Then a **deterministic comparator** — no AI guessing on the decision:

```
due_date = last_completed + guideline_interval
overdue_days = today - due_date
```

The output: a prioritized, evidence-cited action list. What to do. Why. When. Where to route care. Every recommendation traced back to published clinical guidelines.

---

## Slide 4: Proof This Is Real

This is a system problem, not a product idea.

**The attachment gap:** 6.5M Canadians lack a primary care provider. In BC, patients without attachment are 3x more likely to present at ED for preventable conditions.

**Workforce strain:** BC primary care physicians report spending 30–40% of clinical time on administrative follow-up and reactive triaging — time that could go to prevention.

**ED pressure:** Avoidable ED visits cost the BC system hundreds of millions annually. Many are screenings, medication reviews, or referrals that should have happened in community care.

---

## Slide 5: Real Perspectives

**The patient:**
*"I don't have a doctor. I don't know what I'm due for. I don't know where to go — so I wait until it's bad, then I go to Emergency."*

**The provider:**
*"I have a panel of 1,500 patients. I know some of them are overdue for something critical. I can't find them fast enough. I'm reacting, not preventing."*

BestPath serves both of them.

---

## Slide 6: Two Modes, One Engine

**Clinician mode — Panel Management:**
A triage dashboard. Patients sorted into three columns:
- **Red:** Overdue + high risk — act now.
- **Yellow:** Overdue + lower risk — needs attention.
- **Green:** Up to date — no action needed.

Each split by confidence (rich data vs. sparse). One click to approve an outreach with the patient's cited next step.

**Patient mode — Self-Service Navigator:**
For unattached Canadians. Enter your health information conversationally. Get your evidence-cited next step — and routing to the right provider. Not just "see a doctor." A pharmacist can monitor blood pressure. A dietitian can help manage diabetes. A walk-in clinic can initiate a referral.

---

## Slide 7: Why It Gets Adopted

**Invisible workflow.** No new systems to learn. No behavior change required.

**Deterministic, auditable reasoning.** Clinicians see the guideline, the date math, the citation. Not a black box — a transparent calculation they can trust and override.

**Confidence flags.** When data is sparse or uncertain, BestPath says so. Missing screening history is flagged, not guessed at.

**Concise output.** One prioritized action, not a wall of suggestions.

---

## Slide 8: Aligned With Where BC Is Investing

BC is spending $2.8B on healthcare transformation over three years. BestPath fits directly into their stated priorities:

- **Team-based primary care** — routes actions to the right provider role, not just physicians.
- **Expanded scope** — leverages pharmacists, nurses, and allied providers for preventive actions.
- **Community and virtual care** — the patient navigator works without a clinic attachment.
- **Centralized digital systems** — architecture is FHIR-compatible, deployable against any EHR.

---

## Slide 9: Impact

**For providers:** Saves clinical time by surfacing the highest-priority patients first. Prevents the "who am I forgetting?" problem.

**For patients:** Improves access continuity. Unattached patients get a next step instead of nothing.

**For the system:** Reduces avoidable ER reliance through better routing. Improves flow by prioritizing overdue high-risk actions before they become emergencies.

---

## Slide 10: Close

**BestPath makes proactive care operational: the right next step, at the right time, in the right place.**

It bridges patient data and public clinical evidence to deliver clear, cited actions that improve outcomes for patients, providers, and the health system.

Not a prototype. Built on 2,000 Synthea patients and real Canadian clinical guidelines. Works against any EHR via FHIR.

The system knows who's at risk. The guidelines say what should happen. BestPath connects the two — before it's too late.
