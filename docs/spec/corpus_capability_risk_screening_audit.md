# Corpus Capability Audit: Risk-Confluence + Screening-Recency System

Generated: 2026-03-22

## Scope of Audit
This audit checks whether Input A (corpus content for vector retrieval) is sufficient for the current core function:
- infer likely preventable emergency-escalation conditions from patient risk confluences
- recommend screening/monitoring frequency
- support deterministic overdue comparison against last screening dates

## Build Snapshot
- baseline selected: `4026`
- supplemental captures: `387`
- failed supplemental fetches: `2` (both BCCSU PDF URLs)

Source:
- `next-best-pathway-corpus/00_manifest/build_log.md`
- `next-best-pathway-corpus/00_manifest/gap_sources.md`

## Coverage Matrix
| Required knowledge class | Corpus evidence | Status |
|---|---|---|
| Condition escalation risk (ED/acute relevance) | `emergency_risk_support` bucket with CIHI ED/ACSC assets and methodology docs | Covered |
| Condition-specific risk factors and prevention guidance | `bc_guidelines_core`, `specialty_guidelines_curated`, `primary_care_national_curated` | Covered |
| Screening cadence / interval guidance | `preventive_task_force`, `bc_cancer_screening`, `immunization_prevention`, plus condition-specific guideline buckets | Covered |
| Disease-specific national references (diabetes/HTN/respiratory/cardiorenal) | `diabetes_national_guidance`, `hypertension_guidance`, `respiratory_guidance`, `cardiovascular_guidance`, `renal_ckd_primary_care` | Covered |
| Referral/escalation criteria | `diagnostic_referral_guidance`, `oncology_referral_pathways`, guideline buckets | Covered |
| Medication safety context (supportive) | `drug_safety_support`, `medication_safety_guidance`, `medication_feasibility_guidance` | Covered |
| Terminology/normalization references for robust mapping | `interoperability_standards` | Covered |
| Patient-facing instruction layer | `patient_education_support` | Covered |

## Practical Sufficiency Verdict
For the current core system function, the corpus now contains the required knowledge classes and is capable of supporting delivery.

## Residual Gaps (Non-Blocking)
1. Two BCCSU links remain dead (`404`) in supplemental crawl.
2. `drug_safety_support` is very large and can dominate retrieval if not query-routed.
3. Deterministic comparator quality depends on maintaining the condition-to-screening mapping artifact:
   - `configs/condition_screening_mapping.csv`
   - currently scaffolded with starter rows and requires clinician curation to move rows from `draft` to `active`.

## Recommendation for Vector DB Upload
Use a targeted upload profile for core retrieval:
- include core clinical and screening buckets
- include emergency risk evidence bucket
- route medication and standards buckets only for specific query intents

See:
- `configs/vector_upload_profile_risk_screening.json`
