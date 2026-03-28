# Minimal End-to-End System Blueprint

Generated: 2026-03-21

## Scope
This blueprint stays intentionally minimal:
- **Input 1:** knowledge corpus
- **Input 2:** patient data
- **Output (single object):** actionable recommendations

Primary design goal: **high explainability and clinician trust over model complexity**.

## System Modules
1. **Knowledge Loader**
   - Validates and indexes the knowledge corpus (guidelines, local pathways, safety rules).
   - Produces traceable evidence chunks with stable IDs.

2. **Patient Context Builder**
   - Validates and normalizes patient data into a compact feature profile.
   - Treats missing high-signal fields (`date_of_birth`, `sex_at_birth`, blood pressure, `height`, `weight`, smoking status, and screening recency dates) as high-priority data-completion tasks.
   - Flags missing critical fields without blocking the run.
   - Scales vector precision to available inputs (full specificity when present, conservative defaults plus explicit uncertainty when missing).

3. **Evidence Retriever**
   - Retrieves only the most relevant guideline/pathway chunks for the patient profile.
   - Returns evidence IDs and snippets for citation.

4. **Recommendation Engine**
   - Combines patient profile + retrieved evidence to produce candidate actions.
   - Applies deterministic safety rules first, then ranks actions by urgency/value.

5. **Trust + Explainability Layer**
   - Attaches rationale, citations, confidence, and uncertainty to every action.
   - Enforces clinician-review-required status before anything is considered final.

6. **Output Assembler**
   - Emits one `ActionableRecommendations` object in a stable schema.
   - Adds audit metadata for reproducibility.

7. **Run History + Queue Builder**
   - Persists all run outputs as append-only records (one row per recommendation target).
   - Materializes latest patient-target state and a patient-level highest-value action queue.
   - Supports deterministic sorting by overdue severity and action value.

## Data Contracts

### Input 1: `KnowledgeCorpus`
```json
{
  "corpus_version": "string",
  "documents": [
    {
      "doc_id": "string",
      "title": "string",
      "source_type": "guideline|pathway|policy",
      "jurisdiction": "string",
      "effective_date": "YYYY-MM-DD",
      "text": "string"
    }
  ]
}
```

### Input 2: `PatientData`
```json
{
  "patient_id": "string",
  "as_of": "YYYY-MM-DD",
  "demographics": {
    "date_of_birth": "YYYY-MM-DD",
    "age_years": 0,
    "sex_at_birth": "string",
    "gender_identity": "string|unknown",
    "height_cm": 0,
    "weight_kg": 0
  },
  "reproductive_context": {
    "pregnancy_status": "pregnant|not_pregnant|unknown|not_applicable"
  },
  "risk_behaviors": {
    "smoking_tobacco_vaping_status": "current|former|never|unknown",
    "quit_date": "YYYY-MM-DD|null"
  },
  "conditions": ["string"],
  "medications": ["string"],
  "recent_observations": {
    "blood_pressure": {
      "systolic_mmHg": 0,
      "diastolic_mmHg": 0,
      "date": "YYYY-MM-DD"
    },
    "vitals": [{"name": "string", "value": "number|string", "date": "YYYY-MM-DD"}],
    "labs": [{"name": "string", "value": "number|string", "date": "YYYY-MM-DD"}]
  },
  "utilization": {
    "ed_visits_30d": 0,
    "hospitalizations_90d": 0,
    "missed_visits_180d": 0,
    "last_primary_care_visit_date": "YYYY-MM-DD|null",
    "next_scheduled_visit_date": "YYYY-MM-DD|null"
  },
  "preventive_history": [
    {
      "item": "string",
      "last_completed": "YYYY-MM-DD",
      "result_status": "normal|abnormal|unknown",
      "result_value": "string|number|null",
      "abnormality_severity": "mild|moderate|severe|unknown"
    }
  ]
}
```

### Output: `ActionableRecommendations` (single object)
```json
{
  "patient_id": "string",
  "generated_at": "ISO-8601 timestamp",
  "triage_priority": "urgent|high|moderate|routine",
  "targets": [
    {
      "target_id": "string",
      "action": "string",
      "condition": "string",
      "screening_type": "string",
      "risk_tier": "high|medium|low",
      "status": "overdue_now|due_soon|up_to_date|unknown_due",
      "overdue_days": 0,
      "due_date": "YYYY-MM-DD|null",
      "interval_days": 0,
      "why_this_action": "string",
      "why_now": "string",
      "supporting_evidence": [
        {"doc_id": "string", "excerpt": "string"}
      ],
      "confidence": "high|medium|low",
      "uncertainty_reason": "string",
      "required_human_review": true
    }
  ],
  "missing_data": ["string"],
  "safety_flags": ["string"],
  "audit": {
    "corpus_version": "string",
    "ruleset_version": "string",
    "run_id": "string"
  }
}
```

## Operational Persistence (Required)
To combine outputs from all runs and prioritize the highest-value action:

1. Persist an append-only fact table with one row per recommendation target.
2. Build a `latest_target_state` view (newest row per `patient_id + condition + screening_type`).
3. Build a `patient_highest_value_action` view (top action per patient from latest state).
4. Build clinic queue from `patient_highest_value_action`, sorted by value and overdue severity.

### Suggested SQL Shape
```sql
-- 1) append-only fact table (one row per target per run)
-- pathway_target_run_facts(
--   run_id, generated_at, patient_id, target_id,
--   condition, screening_type, risk_tier, status,
--   overdue_days, due_date, interval_days,
--   priority_rank, confidence, missing_data_tasks_count,
--   evidence_refs_json
-- )

-- 2) latest state per patient-target
create view latest_target_state as
select *
from (
  select
    f.*,
    row_number() over (
      partition by patient_id, condition, screening_type
      order by generated_at desc, run_id desc
    ) as rn
  from pathway_target_run_facts f
) s
where rn = 1;

-- 3) patient highest-value action
create view patient_highest_value_action as
with scored as (
  select
    patient_id,
    condition,
    screening_type,
    risk_tier,
    status,
    overdue_days,
    (
      case risk_tier when 'high' then 300 when 'medium' then 200 else 100 end
      + case status when 'overdue_now' then 80 when 'due_soon' then 40 when 'unknown_due' then 20 else 0 end
      + least(greatest(overdue_days, 0), 180)
      + case confidence when 'high' then 20 when 'medium' then 10 else 0 end
    ) as action_value_score
  from latest_target_state
  where status in ('overdue_now', 'due_soon', 'unknown_due')
),
ranked as (
  select
    s.*,
    row_number() over (
      partition by patient_id
      order by action_value_score desc, overdue_days desc
    ) as rn
  from scored s
)
select *
from ranked
where rn = 1;

-- 4) clinic-wide operational queue
select *
from patient_highest_value_action
order by action_value_score desc, overdue_days desc;
```

## 9-Step End-to-End Flow
1. Load `KnowledgeCorpus` and validate schema/date/version fields.
2. Load `PatientData` and validate minimal required fields.
3. Build normalized patient profile and mark missing critical data.
4. Retrieve top relevant evidence chunks from the corpus.
5. Generate candidate actions using patient profile + retrieved evidence.
6. Apply deterministic safety checks and rank actions by clinical urgency.
7. Attach explainability fields to each action (`why`, citations, confidence, uncertainty).
8. Emit one `ActionableRecommendations` object with clinician-review-required markers.
9. Persist output rows, refresh latest-state view, and refresh patient highest-value queue.

## Clinician Trust Guardrails (Non-Negotiable)
- Every recommendation must include at least one evidence citation.
- Missing or stale data must be shown explicitly, not hidden.
- Confidence can reduce assertiveness but cannot suppress safety alerts.
- Recommendations are decision support only; clinician approval is always required.
- All runs are auditable with corpus/ruleset version and run ID.
