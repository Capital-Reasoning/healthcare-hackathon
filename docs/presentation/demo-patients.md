# Demo Patient Selection Guide

## How to Select Demo Patients

After running the batch assessment (`npx tsx scripts/run-batch.ts --limit 50 --tier production`), run this SQL to find the best demo candidates:

```sql
SELECT p.patient_id, p.first_name, p.last_name, p.age, p.sex,
       COUNT(*) as target_count,
       COUNT(*) FILTER (WHERE ptrf.category = 'red') as red_count,
       COUNT(*) FILTER (WHERE ptrf.category = 'yellow') as yellow_count,
       COUNT(*) FILTER (WHERE ptrf.confidence = 'high') as high_conf_count,
       MAX(ptrf.action_value_score) as max_score
FROM pathway_target_run_facts ptrf
JOIN patients p ON p.patient_id = ptrf.patient_id
GROUP BY p.patient_id, p.first_name, p.last_name, p.age, p.sex
HAVING COUNT(*) >= 2 AND COUNT(*) FILTER (WHERE ptrf.category = 'red') >= 1
ORDER BY red_count DESC, high_conf_count DESC, max_score DESC
LIMIT 10;
```

## What Makes a Good Demo Patient

- **Multiple targets** (3+) — shows breadth of the engine across different screening types
- **At least one RED category target** — shows urgency, makes the triage story compelling
- **High confidence with good evidence citations** — the "View source" click should show real guideline text
- **Recognizable conditions** — diabetes, hypertension, overdue cancer screenings land well with judges
- **Variety across demo patients** — pick one cardiovascular/metabolic case and one cancer screening case
- **Clear overdue days** — "245 days overdue" is more impactful than "12 days overdue"
- **Provider route variety** — showing "pharmacist" and "walk-in clinic" routing reinforces the care navigation story

## Ideal Demo Patient Profiles

### Patient A: The Metabolic Case
- Age 50-65, multiple chronic conditions (diabetes + hypertension)
- RED targets: overdue A1C, overdue lipid panel, possibly overdue kidney function
- HIGH confidence on at least 2 targets
- Provider route: mix of family doctor and pharmacist
- **Demo value:** Shows how the engine catches cascading risks in chronic disease management

### Patient B: The Cancer Screening Case
- Age 55-70, otherwise healthy
- RED target: overdue colorectal cancer screening (FIT/FOBT)
- YELLOW targets: other age-appropriate screenings coming due
- HIGH confidence with CTFPHC guideline citations
- **Demo value:** Shows the preventive care gap story — "this patient hasn't been screened in 4 years"

## Quick Check: Verify Demo Patients Have Good Data

Before the demo, verify each selected patient has:

```sql
-- Check evidence citations exist for the patient's targets
SELECT ptrf.screening_type, ptrf.category, ptrf.confidence,
       ptrf.evidence_refs::text
FROM pathway_target_run_facts ptrf
WHERE ptrf.patient_id = '<PATIENT_ID>'
  AND ptrf.category IN ('red', 'yellow')
ORDER BY ptrf.category, ptrf.action_value_score DESC;
```

```sql
-- Check the patient has encounters and observations (for the data tabs)
SELECT
  (SELECT COUNT(*) FROM encounters WHERE patient_id = '<PATIENT_ID>') as encounter_count,
  (SELECT COUNT(*) FROM medications WHERE patient_id = '<PATIENT_ID>') as med_count,
  (SELECT COUNT(*) FROM lab_results WHERE patient_id = '<PATIENT_ID>') as lab_count,
  (SELECT COUNT(*) FROM vitals WHERE patient_id = '<PATIENT_ID>') as vital_count;
```

## Selected Patients

[To be filled after batch run]

| Role | Patient ID | Name | Age | Sex | Red Targets | Key Conditions | Notes |
|------|-----------|------|-----|-----|-------------|----------------|-------|
| Patient A (metabolic) | | | | | | | |
| Patient B (screening) | | | | | | | |
| Backup | | | | | | | |
