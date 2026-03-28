# Risk Prompt + Screening Comparator Framework

Generated: 2026-03-22

## Objective
Create one high-quality risk prompt from patient risk confluences, then compare the model's screening-frequency output against last screening dates deterministically.

## Core Inputs
- `RCV` (Risk Confluence Vector)
- `SRV` (Screening Recency Vector)
- `KnowledgeDB` retrieval context
- `RCV` must be a composite risk-confluence metric built from all available high-signal patient information, not a demographics-only summary.
- `RCV` should include, when available: `date_of_birth`, `sex_at_birth`, `gender_identity`, `height`, `weight`, explicit BP values with date, smoking/tobacco/vaping status, `last_primary_care_visit_date`, and `next_scheduled_visit_date`.
- `SRV` should include last-completed dates plus result detail (`result_status`, `result_value`, `abnormality_severity`) when available.

## RCV Construction Standard (Normative)
Build `RCV` from the broadest reliable patient evidence available at run time.

Required domain coverage (use all available):
1. identity and anthropometrics:
   - DOB/age, sex at birth, gender identity when available, height, weight, BMI
2. clinical burden:
   - active conditions/problem list, key comorbidities, pregnancy status when applicable
3. physiological state and trend:
   - explicit BP, pulse/O2/weight trend, condition-relevant labs and recent trajectories
4. medication and treatment context:
   - active medications/allergies, high-risk medication classes, refill/adherence signals
5. utilization and care engagement:
   - ED/hospital use, no-shows/cancellations, last PCP visit, next scheduled visit
6. risk behaviors and contextual modifiers:
   - smoking/tobacco/vaping status, quit date, other high-impact modifiers when present
7. prior preventive findings that alter near-term risk:
   - recent abnormal screening/monitoring results from trusted history sources

Derived risk signals (required when source fields exist):
- `bmi_band`
- `bp_control_state`
- `metabolic_risk_state` (for diabetes/cardiometabolic patterns)
- `cardiorenal_risk_state`
- `respiratory_exacerbation_risk_state`
- `medication_adherence_risk_state`
- `care_engagement_risk_state`

RCV confidence rules:
- `high` only when multiple high-signal domains are populated with recent data.
- `medium` when core domains exist but trend or engagement data are partial.
- `low` when vector is sparse or stale.
- demographics + anthropometrics alone can never produce `high` confidence.

## Prompt Construction (Single-Core Prompt)
Prompt should be comprehensive but concise.

Required sections:
1. patient profile summary (include DOB/age, sex at birth, gender identity where available, height, weight, and derived BMI)
2. synthesized risk-confluence summary using derived risk signals (not raw fields only)
3. active conditions + risk modifiers
4. recent clinically relevant findings (including explicit systolic/diastolic BP and weight trend where available)
5. medication and adherence context
6. utilization pattern and missed care (include last PCP visit and next scheduled visit)
7. explicit ask:
   - which preventable/treatable conditions are most likely to escalate to emergency care if unaddressed
   - recommended screening/monitoring frequency for each

Prompt quality rule:
- If `RCV` confidence is `low`, include an explicit uncertainty statement and missing-data asks in the prompt so the model does not over-assert.

## Required Model Response Schema
```json
{
  "targets": [
    {
      "condition": "string",
      "risk_tier": "high|medium|low",
      "screening_type": "string",
      "interval_days": 0,
      "rationale": "string",
      "evidence_refs": ["string"]
    }
  ]
}
```

## Deterministic Comparator Matrix
For each output row:
1. map `condition + screening_type` to SRV row
2. compute:
   - `due_date = last_completed_date + interval_days`
   - `overdue_days = today - due_date`
3. assign status:
   - `overdue_now`
   - `due_soon` (<=30 days)
   - `up_to_date`
   - `unknown_due`

Priority matrix:
- Primary sort: `risk_tier` (`high > medium > low`)
- Secondary sort: `overdue_days` descending
- Tertiary sort: data confidence

## Missing-Data Rules
- no last date => `unknown_due` + data completion task
- conflicting dates => choose by source precedence and mark uncertainty
- missing evidence refs => retain row but reduce confidence and require review
- missing baseline risk fields => keep deterministic processing, lower confidence tier, and emit targeted completion tasks (`capture_bp`, `confirm_smoking_status`, `confirm_screening_history`, etc.)

## Output (Core)
For each prioritized condition:
- risk tier
- recommended screening and interval
- last completed date
- due date
- status
- overdue days
- rationale and evidence references

## Sidecar Constraint
Post-core sidecar can only:
- rephrase summaries
- assign owner/channel
- add operational notes

Sidecar cannot change:
- selected conditions
- interval days
- due/overdue computation
- risk tier ordering
