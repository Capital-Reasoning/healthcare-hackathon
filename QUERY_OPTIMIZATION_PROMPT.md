# BestPath — Dashboard Query Optimization

The dashboard page (`/`) takes 5-10 seconds to load because `getTriageQueueWithPatients()` in `src/lib/db/queries/engine-results.ts` does expensive in-memory deduplication across hundreds of engine runs and thousands of target facts.

## Files to read:
1. `src/lib/db/queries/engine-results.ts` — the query functions (getTriageQueue, getTriageQueueWithPatients, getDashboardStats, getPatientEngineResults)
2. `src/lib/db/schema.ts` — the schema (engine_runs, pathway_target_run_facts, patients tables)
3. `src/app/(main)/page.tsx` — the dashboard server component that calls these queries

## Problem

`getTriageQueueWithPatients()` currently:
1. Fetches ALL completed engine_runs, deduplicates latest per patient in JS
2. Fetches ALL pathway_target_run_facts for those runs
3. Deduplicates to highest-scoring target per patient in JS
4. Fetches patient demographics for each
5. Sorts in JS

With 400+ runs and 1500+ facts, this fetches the entire dataset into Node memory on every page load.

## Fix

### 1. Replace the JS deduplication with a single efficient SQL query using `DISTINCT ON`

Replace `getTriageQueueWithPatients()` with a single raw SQL query:

```sql
SELECT DISTINCT ON (ptrf.patient_id)
  ptrf.id, ptrf.run_id, ptrf.patient_id, ptrf.target_id,
  ptrf.condition, ptrf.screening_type, ptrf.action, ptrf.risk_tier,
  ptrf.status, ptrf.overdue_days, ptrf.due_date, ptrf.confidence,
  ptrf.confidence_reason, ptrf.action_value_score, ptrf.why_this_action,
  ptrf.why_now, ptrf.provider_route, ptrf.category,
  p.first_name, p.last_name, p.age, p.sex
FROM pathway_target_run_facts ptrf
JOIN engine_runs er ON er.run_id = ptrf.run_id AND er.status = 'completed'
JOIN patients p ON p.patient_id = ptrf.patient_id
ORDER BY ptrf.patient_id, ptrf.action_value_score DESC
```

This does all deduplication in Postgres (much faster than JS) and joins patients in one query.

### 2. Add database indexes

Create indexes to speed up the query:

```sql
CREATE INDEX IF NOT EXISTS idx_ptrf_patient_score ON pathway_target_run_facts (patient_id, action_value_score DESC);
CREATE INDEX IF NOT EXISTS idx_engine_runs_status ON engine_runs (status, patient_id);
```

You can add these via a script or directly in `src/lib/db/schema.ts` index definitions, then run `npm run db:push`.

### 3. Add LIMIT to the dashboard query

The dashboard doesn't need to show ALL patients. Cap results:
- Top 30 per category (red, yellow, green) = max 90 patients displayed
- Or just top 100 overall ordered by score

Add `LIMIT 100` to the query, or better: let the dashboard page pass a limit parameter.

### 4. Also optimize `getDashboardStats()`

Same issue — it fetches all runs to deduplicate. Replace with:

```sql
SELECT category, COUNT(*) as n FROM (
  SELECT DISTINCT ON (ptrf.patient_id) ptrf.category
  FROM pathway_target_run_facts ptrf
  JOIN engine_runs er ON er.run_id = ptrf.run_id AND er.status = 'completed'
  ORDER BY ptrf.patient_id, ptrf.action_value_score DESC
) sub
GROUP BY category
```

### 5. Consider caching

For a hackathon demo, the data doesn't change during the presentation. Consider:
- Using `unstable_cache` from Next.js to cache the query result for 60 seconds
- Or computing the triage view once and storing it in a materialized view

## After fixing:
- Run `npm run typecheck` — zero errors
- Run `npm run build` — must pass
- Test: `curl -w "\n%{time_total}s" http://localhost:3000/` — should be under 2 seconds
- Verify the dashboard still shows correct data with the same categories and patient cards
