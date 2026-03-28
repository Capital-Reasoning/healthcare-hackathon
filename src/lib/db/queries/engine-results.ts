import { eq, desc, sql, count, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { pathwayTargetRunFacts, engineRuns, patients } from '@/lib/db/schema';

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
 */
export async function getTriageQueueWithPatients(): Promise<TriageItem[]> {
  // Step 1: Get all triage items from getTriageQueue()
  const items = await getTriageQueue();
  if (items.length === 0) return [];

  // Step 2: Deduplicate — keep only highest-scoring target per patient
  const bestByPatient = new Map<string, (typeof items)[number]>();
  for (const item of items) {
    if (!bestByPatient.has(item.patientId)) {
      bestByPatient.set(item.patientId, item);
    }
  }

  // Step 3: Fetch patient demographics
  const patientIds = Array.from(bestByPatient.keys());
  const patientRows = await db
    .select({
      patientId: patients.patientId,
      firstName: patients.firstName,
      lastName: patients.lastName,
      age: patients.age,
      sex: patients.sex,
    })
    .from(patients)
    .where(inArray(patients.patientId, patientIds));

  const patientMap = new Map(patientRows.map((p) => [p.patientId, p]));

  // Step 4: Merge
  const result: TriageItem[] = [];
  for (const item of bestByPatient.values()) {
    const patient = patientMap.get(item.patientId);
    if (!patient) continue; // skip orphaned records
    result.push({
      id: item.id,
      runId: item.runId,
      patientId: item.patientId,
      targetId: item.targetId,
      condition: item.condition,
      screeningType: item.screeningType,
      action: item.action,
      riskTier: item.riskTier,
      status: item.status,
      overdueDays: item.overdueDays,
      dueDate: item.dueDate,
      confidence: item.confidence,
      confidenceReason: item.confidenceReason,
      actionValueScore: item.actionValueScore,
      whyThisAction: item.whyThisAction,
      whyNow: item.whyNow,
      providerRoute: item.providerRoute,
      category: item.category,
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.age,
      sex: patient.sex,
    });
  }

  // Sort by category priority then score
  const categoryOrder: Record<string, number> = {
    red: 1,
    yellow: 2,
    green: 3,
  };
  result.sort((a, b) => {
    const catA = categoryOrder[a.category ?? ''] ?? 4;
    const catB = categoryOrder[b.category ?? ''] ?? 4;
    if (catA !== catB) return catA - catB;
    return (b.actionValueScore ?? 0) - (a.actionValueScore ?? 0);
  });

  return result;
}

/**
 * Get dashboard-level stats from engine results.
 * Only counts targets from the latest completed run per patient.
 */
export async function getDashboardStats() {
  // Step 1: Find latest completed run per patient (same pattern as getTriageQueue)
  const completedRuns = await db
    .select({
      runId: engineRuns.runId,
      patientId: engineRuns.patientId,
    })
    .from(engineRuns)
    .where(eq(engineRuns.status, 'completed'))
    .orderBy(desc(engineRuns.startedAt));

  const latestRunByPatient = new Map<string, string>();
  for (const run of completedRuns) {
    if (!latestRunByPatient.has(run.patientId)) {
      latestRunByPatient.set(run.patientId, run.runId);
    }
  }
  const latestRunIds = Array.from(latestRunByPatient.values());

  // Step 2: Count categories only from latest runs, and count all runs by status
  const [categoryStats, runStats] = await Promise.all([
    latestRunIds.length > 0
      ? db
          .select({
            category: pathwayTargetRunFacts.category,
            count: count(),
          })
          .from(pathwayTargetRunFacts)
          .where(inArray(pathwayTargetRunFacts.runId, latestRunIds))
          .groupBy(pathwayTargetRunFacts.category)
      : Promise.resolve([]),
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
