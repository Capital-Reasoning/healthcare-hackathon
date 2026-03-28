# Validation and Acceptance Plan

Generated: 2026-03-22

## Purpose
Define how we validate the next-best-pathway system before release, including gold-set quality checks, failure-mode testing, and clinician signoff.

## Scope
Applies to the current core flow:
- RCV/SRV construction
- evidence retrieval
- target generation
- deterministic due/overdue comparator
- queue-ready output object

## Gold Set Design
Use a labeled evaluation set of synthetic or safely de-identified cases.

Minimum composition:
- 20-40 total cases for MVP
- include at least:
  - diabetes pathway gaps
  - hypertension/ASCVD prevention
  - CKD/cardiorenal monitoring
  - COPD/asthma follow-up
  - preventive screening and immunization gaps

Per-case label requirements:
- expected top pathway direction (`condition + screening_type`)
- acceptable top 3 targets
- expected urgency band (`overdue_now`, `due_soon`, `unknown_due`, `up_to_date`)
- clinical rationale notes (1-3 lines)

## Acceptance Criteria (Release Gate)
1. Citation coverage:
   - 100% of emitted targets include at least one evidence reference.
2. Source policy compliance:
   - 0 targets cite licensed/restricted disallowed sources.
3. Schema validity:
   - 100% response payloads validate against canonical output keys.
4. Directional quality:
   - top target matches expected pathway direction on >=80% of gold-set cases.
5. Practical relevance:
   - at least one of expected top 3 appears in system top 3 on >=90% of cases.
6. Uncertainty behavior:
   - low-data cases must emit explicit uncertainty/missing-data tasks (no silent over-assertion).
7. Comparator correctness:
   - due/overdue status math is correct on 100% of tested cases.

## Failure-Mode Test Matrix
Run targeted tests for:
1. missing key labs/vitals
2. incomplete medication list
3. contradictory conditions/history
4. stale guidance retrieval
5. patient outside guideline scope
6. ambiguous referral/screening threshold
7. inconsistent screening dates across sources

Expected behavior for all:
- do not fail hard
- degrade confidence
- emit conservative target + missing-data tasks

## Clinical Reviewer Signoff Flow
1. Generate evaluation report from latest build.
2. Clinical reviewer checks:
   - target clinical direction
   - screening interval reasonableness
   - safety and escalation appropriateness
3. Product owner checks:
   - clarity of rationale/citations
   - queue actionability
4. Engineering checks:
   - schema conformance
   - reproducibility
   - no restricted-source leakage
5. Signoff recorded in release notes.

## Signoff Template
- Build ID:
- Corpus version:
- Ruleset version:
- Reviewer name and role:
- Decision (`approve` / `approve with conditions` / `reject`):
- Notes:
- Date:

## Deliverables Per Validation Cycle
- gold-set result table (case-level)
- aggregate metric summary
- failure-mode log
- open issues list
- final signoff record
