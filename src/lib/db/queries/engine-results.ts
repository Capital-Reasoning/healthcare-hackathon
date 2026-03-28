import { eq, desc, sql, count } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pathwayTargetRunFacts, engineRuns } from '@/lib/db/schema';

/**
 * Get the latest engine results for a patient,
 * ordered by most recent run, then by score.
 */
export async function getPatientEngineResults(patientId: string) {
  const results = await db
    .select()
    .from(pathwayTargetRunFacts)
    .where(eq(pathwayTargetRunFacts.patientId, patientId))
    .orderBy(
      desc(pathwayTargetRunFacts.generatedAt),
      desc(pathwayTargetRunFacts.actionValueScore),
    )
    .limit(50);

  return results;
}

/**
 * Get the triage queue — all patients with active targets,
 * grouped by category (red/yellow/green), sorted by score.
 * Stub for Phase 3.
 */
export async function getTriageQueue() {
  // Get latest run per patient using a subquery
  const results = await db.execute(sql`
    WITH latest_runs AS (
      SELECT DISTINCT ON (patient_id)
        run_id, patient_id
      FROM engine_runs
      WHERE status = 'completed'
      ORDER BY patient_id, started_at DESC
    )
    SELECT ptrf.*
    FROM pathway_target_run_facts ptrf
    INNER JOIN latest_runs lr ON ptrf.run_id = lr.run_id
    ORDER BY
      CASE ptrf.category
        WHEN 'red' THEN 1
        WHEN 'yellow' THEN 2
        WHEN 'green' THEN 3
        ELSE 4
      END,
      ptrf.action_value_score DESC
  `);

  return results;
}

/**
 * Get dashboard-level stats from engine results.
 * Stub for Phase 3.
 */
export async function getDashboardStats() {
  const [categoryStats, runStats] = await Promise.all([
    db
      .select({
        category: pathwayTargetRunFacts.category,
        count: count(),
      })
      .from(pathwayTargetRunFacts)
      .groupBy(pathwayTargetRunFacts.category),
    db
      .select({
        status: engineRuns.status,
        count: count(),
      })
      .from(engineRuns)
      .groupBy(engineRuns.status),
  ]);

  const categories: Record<string, number> = {};
  for (const row of categoryStats) {
    if (row.category) categories[row.category] = row.count;
  }

  const runs: Record<string, number> = {};
  for (const row of runStats) {
    if (row.status) runs[row.status] = row.count;
  }

  return { categories, runs };
}
