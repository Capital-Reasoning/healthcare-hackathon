import { eq, desc, sql, count, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pathwayTargetRunFacts, engineRuns } from '@/lib/db/schema';

/**
 * Get the latest completed engine run for a patient.
 */
export async function getLatestEngineRun(patientId: string) {
  const result = await db
    .select()
    .from(engineRuns)
    .where(
      sql`${engineRuns.patientId} = ${patientId} AND ${engineRuns.status} = 'completed'`,
    )
    .orderBy(desc(engineRuns.startedAt))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get the latest engine results for a patient — targets from the most recent
 * completed run only, ordered by score descending.
 */
export async function getPatientEngineResults(patientId: string) {
  // Find the latest completed run for this patient
  const latestRun = await db
    .select({ runId: engineRuns.runId })
    .from(engineRuns)
    .where(
      sql`${engineRuns.patientId} = ${patientId} AND ${engineRuns.status} = 'completed'`,
    )
    .orderBy(desc(engineRuns.startedAt))
    .limit(1);

  if (latestRun.length === 0) return [];

  const results = await db
    .select()
    .from(pathwayTargetRunFacts)
    .where(eq(pathwayTargetRunFacts.runId, latestRun[0]!.runId))
    .orderBy(desc(pathwayTargetRunFacts.actionValueScore));

  return results;
}

/**
 * Get the triage queue — all patients with active targets from their latest
 * completed run, grouped by category (red/yellow/green), sorted by score.
 */
export async function getTriageQueue() {
  // Step 1: Find latest completed run per patient using Drizzle
  const latestRuns = await db
    .select({
      runId: engineRuns.runId,
      patientId: engineRuns.patientId,
    })
    .from(engineRuns)
    .where(eq(engineRuns.status, 'completed'))
    .orderBy(desc(engineRuns.startedAt));

  // Deduplicate to keep only the latest run per patient
  const latestRunByPatient = new Map<string, string>();
  for (const run of latestRuns) {
    if (!latestRunByPatient.has(run.patientId)) {
      latestRunByPatient.set(run.patientId, run.runId);
    }
  }
  const runIds = Array.from(latestRunByPatient.values());

  if (runIds.length === 0) return [];

  // Step 2: Get all targets from those runs
  const results = await db
    .select()
    .from(pathwayTargetRunFacts)
    .where(inArray(pathwayTargetRunFacts.runId, runIds))
    .orderBy(desc(pathwayTargetRunFacts.actionValueScore));

  // Step 3: Sort by category priority then score
  const categoryOrder: Record<string, number> = {
    red: 1,
    yellow: 2,
    green: 3,
  };

  results.sort((a, b) => {
    const catA = categoryOrder[a.category ?? ''] ?? 4;
    const catB = categoryOrder[b.category ?? ''] ?? 4;
    if (catA !== catB) return catA - catB;
    return (b.actionValueScore ?? 0) - (a.actionValueScore ?? 0);
  });

  return results;
}

/**
 * Triage queue item enriched with patient demographics.
 */
export interface TriageItem {
  // From pathwayTargetRunFacts
  id: string;
  runId: string;
  patientId: string;
  targetId: string;
  condition: string | null;
  screeningType: string | null;
  action: string | null;
  riskTier: string | null;
  status: string | null;
  overdueDays: number | null;
  dueDate: string | null;
  confidence: string | null;
  confidenceReason: string | null;
  actionValueScore: number | null;
  whyThisAction: string | null;
  whyNow: string | null;
  providerRoute: string | null;
  category: string | null;
  // From patients table
  firstName: string;
  lastName: string;
  age: number | null;
  sex: string | null;
}

/**
 * Get the triage queue enriched with patient name/age/sex.
 * Returns the HIGHEST-VALUE single action per patient (deduped).
 * Uses DISTINCT ON to do all deduplication and joining in Postgres.
 */
export async function getTriageQueueWithPatients(): Promise<TriageItem[]> {
  const rows = await db.execute(sql`
    SELECT * FROM (
      SELECT DISTINCT ON (ptrf.patient_id)
        ptrf.id,
        ptrf.run_id AS "runId",
        ptrf.patient_id AS "patientId",
        ptrf.target_id AS "targetId",
        ptrf.condition,
        ptrf.screening_type AS "screeningType",
        ptrf.action,
        ptrf.risk_tier AS "riskTier",
        ptrf.status,
        ptrf.overdue_days AS "overdueDays",
        ptrf.due_date AS "dueDate",
        ptrf.confidence,
        ptrf.confidence_reason AS "confidenceReason",
        ptrf.action_value_score AS "actionValueScore",
        ptrf.why_this_action AS "whyThisAction",
        ptrf.why_now AS "whyNow",
        ptrf.provider_route AS "providerRoute",
        ptrf.category,
        p.first_name AS "firstName",
        p.last_name AS "lastName",
        p.age,
        p.sex
      FROM pathway_target_run_facts ptrf
      JOIN engine_runs er ON er.run_id = ptrf.run_id AND er.status = 'completed'
      JOIN patients p ON p.patient_id = ptrf.patient_id
      ORDER BY ptrf.patient_id, ptrf.action_value_score DESC NULLS LAST
    ) sub
    ORDER BY
      CASE sub.category WHEN 'red' THEN 1 WHEN 'yellow' THEN 2 WHEN 'green' THEN 3 ELSE 4 END,
      sub."actionValueScore" DESC NULLS LAST
  `);

  return [...rows] as unknown as TriageItem[];
}

/**
 * Get dashboard-level stats from engine results.
 * Only counts targets from the latest completed run per patient.
 * Uses DISTINCT ON to deduplicate in Postgres.
 */
export async function getDashboardStats() {
  const [categoryRows, runStats] = await Promise.all([
    db.execute(sql`
      SELECT category, COUNT(*)::int AS count FROM (
        SELECT DISTINCT ON (ptrf.patient_id) ptrf.category
        FROM pathway_target_run_facts ptrf
        JOIN engine_runs er ON er.run_id = ptrf.run_id AND er.status = 'completed'
        ORDER BY ptrf.patient_id, ptrf.action_value_score DESC NULLS LAST
      ) sub
      WHERE category IS NOT NULL
      GROUP BY category
    `),
    db
      .select({
        status: engineRuns.status,
        count: count(),
      })
      .from(engineRuns)
      .groupBy(engineRuns.status),
  ]);

  const categories: Record<string, number> = {};
  for (const row of categoryRows as unknown as {
    category: string;
    count: number;
  }[]) {
    categories[row.category] = Number(row.count);
  }

  const runs: Record<string, number> = {};
  for (const row of runStats) {
    if (row.status) runs[row.status] = row.count;
  }

  return { categories, runs };
}
