# Patient Vector Triage Framework (Balanced)

## Objective
Anchor the model on a high-impact core, then expand in a controlled way so decisions stay precise without overloading or context-poisoning the model.

## Design Principle
- signal-first, not field-maximal
- confidence-gated expansion, not always-on enrichment
- concise model context, not exhaustive chart dumping

## Default Balance Profile
Use this as the default operating profile:
- 70% anchor context, 20% targeted branches, 10% uncertainty handling
- anchor target size: 10-14 high-impact patient signals
- branch expansion: 0 to 3 branch packs, only when warranted
- hard context caps: <=20 total patient signals and <=12 retrieved evidence chunks per run

## 1) Build the Anchor RCV (Always)
The anchor `RCV` should include only high-impact information that most clinics usually have:
- demographics and anthropometrics: DOB/age, sex at birth, height, weight, BMI
- active clinical burden: active conditions/problem list, key comorbidities
- current physiological state: explicit BP with date, recent key labs/vitals
- treatment context: active meds/allergies, obvious adherence/refill gaps
- care engagement: ED/hospital recency, missed visits, last PCP visit, next scheduled visit
- core risk behaviors: smoking/tobacco/vaping status
- preventive history signal: recent abnormal screening/monitoring findings (if available)

Anchor quality target:
- include 10-14 signals, prioritized by recency and expected impact on next-step ranking

## 2) Decide if Anchor RCV Is Sufficient
Use anchor-only reasoning when all are true:
1. Anchor completeness is at least 70%.
2. At least one recent physiological signal exists (BP or condition-relevant lab).
3. At least one engagement/utilization signal exists.
4. No critical unknown blocks risk interpretation.
5. Estimated action-rank volatility from missing data is low (no obvious branch expected to reorder top actions).

If any condition fails, branch out to targeted supplemental context.

## 3) Branch Out Only When Needed (Up to 3)
Branch packs below are examples, not an exhaustive list. The framework is intentionally open so any escalation-relevant branch can be added if it passes the admission criteria.

Example branch packs:
- cardiometabolic branch: when diabetes/HTN/CKD/CVD signals are ambiguous or conflicting
- respiratory branch: when COPD/asthma risk is suspected but exacerbation context is sparse
- medication safety branch: when regimen risk or adherence uncertainty is high
- engagement/access branch: when no-show/contact friction may block follow-up success
- behavioral/substance branch: when acute retention/safety risk is suggested but under-specified

Other valid branch families can include (as needed): oncology progression, infectious deterioration, frailty/falls, neurologic risk, pregnancy/postpartum risk, pediatric deterioration, or any other escalation domain supported by evidence.

Branch admission criteria (required):
1. Targets a concrete uncertainty tied to escalation risk.
2. Uses available trusted signals (or emits explicit missing-data tasks if unavailable).
3. Has expected decision impact (for example, likely to change top action rank by >=15% or raise confidence tier).
4. Adds bounded context only (no broad chart dump).

Branch rule:
- each activated branch must answer one concrete uncertainty, otherwise do not include it
- activate branch 2 only if branch 1 did not raise confidence to `high` or left a critical unknown unresolved
- activate branch 3 only if there is still high expected decision impact (for example, likely to change top action ranking by >=15%)
- never exceed 3 active branches in one run

Branch specification contract (for new branches):
- `branch_id`
- `trigger_condition`
- `required_signals`
- `optional_signals`
- `decision_impact_test`
- `fallback_if_missing`

## 4) Prompt Assembly Rule (Avoid Context Poisoning)
Send a compact synthesized RCV to the model:
- top 10-14 anchor signals by impact and recency
- branch signals only for active branches (do not include dormant branches)
- explicit trend statements (for example, BP uncontrolled trend) instead of raw event lists
- explicit critical unknowns that limit confidence
- no low-impact narrative details
- stay within caps: <=20 total patient signals and <=12 evidence chunks

## 5) Missing-Data and Confidence Policy
- Never block output due to missing fields.
- If anchor is sparse, lower confidence and emit targeted data-capture tasks.
- Do not let demographics/anthropometrics alone produce high-confidence inference.
- Source precedence for conflicts: EHR/claims > pharmacy feed > patient-reported > ecological context.
- If confidence remains low after up to 3 branches, stop expansion and emit:
  - conservative next-best action
  - explicit uncertainty reason
  - prioritized data-completion bundle

## 6) Operational Output (Per Patient)
Each run should emit:
- `rcv_confidence` (`high|medium|low`)
- `used_anchor_signals`
- `activated_branch_packs`
- `branch_count` (0-3)
- `context_budget_usage` (patient signals used, evidence chunks used)
- `next_best_actions`
- `missing_data_tasks`
