import { eq, desc, sql, count, inArray } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import {
  patients,
  encounters,
  labResults,
  vitals,
  medications,
  engineRuns,
  pathwayTargetRunFacts,
} from '@/lib/db/schema';

// ── Shared helper ──────────────────────────────────────────────────────────

/**
 * Returns the latest completed engine run ID per patient.
 * Exported so callers can fetch once and pass to multiple queries,
 * avoiding redundant DB round-trips.
 */
export async function getLatestRunIds(): Promise<string[]> {
  const rows = await db.execute(sql`
    SELECT DISTINCT ON (patient_id) run_id
    FROM engine_runs
    WHERE status = 'completed'
    ORDER BY patient_id, started_at DESC
  `);
  return ([...rows] as unknown as { run_id: string }[]).map((r) => r.run_id);
}

// ── Analytics queries ──────────────────────────────────────────────────────
// Queries that touch pathwayTargetRunFacts accept an optional pre-fetched
// runIds array. When omitted they fall back to getLatestRunIds() internally,
// but callers should prefer passing runIds to avoid redundant DB hits.

/**
 * Age distribution across the patient panel.
 * Returns buckets: 0-17, 18-39, 40-64, 65+
 */
export async function getAgeMixStats() {
  const result = await db
    .select({
      bucket: sql<string>`
        CASE
          WHEN ${patients.age} < 18 THEN '0-17'
          WHEN ${patients.age} < 40 THEN '18-39'
          WHEN ${patients.age} < 65 THEN '40-64'
          ELSE '65+'
        END
      `.as('bucket'),
      value: count(),
    })
    .from(patients)
    .where(sql`${patients.age} IS NOT NULL`)
    .groupBy(sql`bucket`);

  // Ensure all buckets are present in order
  const bucketOrder = ['0-17', '18-39', '40-64', '65+'];
  const map = new Map(result.map((r) => [r.bucket, r.value]));
  return bucketOrder.map((name) => ({ name, value: map.get(name) ?? 0 }));
}

/**
 * Deduplicate targets to one per patient (highest score wins).
 * Returns the winning target for each patient — used by queries
 * that need to count patients, not individual targets.
 */
async function getBestTargetPerPatient(runIds: string[]) {
  if (runIds.length === 0) return [];

  const inList = sql.join(
    runIds.map((id) => sql`${id}`),
    sql`, `,
  );

  const rows = await db.execute(sql`
    SELECT DISTINCT ON (patient_id)
      patient_id, category, status
    FROM pathway_target_run_facts
    WHERE run_id IN (${inList})
    ORDER BY patient_id, action_value_score DESC NULLS LAST
  `);

  return (
    [...rows] as unknown as {
      patient_id: string;
      category: string | null;
      status: string | null;
    }[]
  ).map((r) => ({
    patientId: r.patient_id,
    category: r.category,
    status: r.status,
  }));
}

/**
 * Red/Yellow/Green triage category split — counts distinct patients,
 * each assigned to the category of their highest-value target.
 */
export async function getCategorySplit(runIds?: string[]) {
  const ids = runIds ?? (await getLatestRunIds());
  const bestPerPatient = await getBestTargetPerPatient(ids);

  const counts: Record<string, number> = {};
  for (const { category } of bestPerPatient) {
    if (category) counts[category] = (counts[category] ?? 0) + 1;
  }

  const colorMap: Record<string, string> = {
    red: '#E8A0A0',
    yellow: '#E8D5A0',
    green: '#A0D8C0',
  };

  const labelMap: Record<string, string> = {
    red: 'Urgent',
    yellow: 'Follow-up',
    green: 'On Track',
  };

  return Object.entries(counts).map(([cat, value]) => ({
    name: labelMap[cat] ?? cat,
    value,
    color: colorMap[cat],
  }));
}

/**
 * Top N next actions needed across the patient panel.
 */
export async function getTopActions(limit = 10, runIds?: string[]) {
  const ids = runIds ?? (await getLatestRunIds());
  if (ids.length === 0) return [];

  const result = await db
    .select({
      action: pathwayTargetRunFacts.action,
      value: count(),
    })
    .from(pathwayTargetRunFacts)
    .where(
      sql`${pathwayTargetRunFacts.runId} IN ${ids} AND ${pathwayTargetRunFacts.action} IS NOT NULL`,
    )
    .groupBy(pathwayTargetRunFacts.action)
    .orderBy(desc(count()))
    .limit(limit);

  return result
    .filter((r) => r.action)
    .map((r) => ({
      name: r.action!.length > 40 ? r.action!.slice(0, 37) + '...' : r.action!,
      value: r.value,
    }));
}

/**
 * Provider route distribution from latest engine runs.
 */
export async function getProviderRouteMix(runIds?: string[]) {
  const ids = runIds ?? (await getLatestRunIds());
  if (ids.length === 0) return [];

  const result = await db
    .select({
      route: pathwayTargetRunFacts.providerRoute,
      value: count(),
    })
    .from(pathwayTargetRunFacts)
    .where(
      sql`${pathwayTargetRunFacts.runId} IN ${ids} AND ${pathwayTargetRunFacts.providerRoute} IS NOT NULL`,
    )
    .groupBy(pathwayTargetRunFacts.providerRoute)
    .orderBy(desc(count()));

  return result
    .filter((r) => r.route)
    .map((r) => ({ name: r.route!, value: r.value }));
}

/**
 * Due horizon — counts distinct patients by the status of their
 * highest-value target: overdue_now / due_soon / up_to_date / unknown_due.
 */
export async function getDueHorizonStats(runIds?: string[]) {
  const ids = runIds ?? (await getLatestRunIds());
  const bestPerPatient = await getBestTargetPerPatient(ids);

  const counts: Record<string, number> = {};
  for (const { status } of bestPerPatient) {
    if (status) counts[status] = (counts[status] ?? 0) + 1;
  }

  const labelMap: Record<string, string> = {
    overdue_now: 'Overdue Now',
    due_soon: 'Due Soon',
    up_to_date: 'Up to Date',
    unknown_due: 'Unknown',
  };

  const colorMap: Record<string, string> = {
    overdue_now: '#E8A0A0',
    due_soon: '#E8D5A0',
    up_to_date: '#A0D8C0',
    unknown_due: '#C4C9D0',
  };

  const order = ['overdue_now', 'due_soon', 'up_to_date', 'unknown_due'];

  return order.map((key) => ({
    name: labelMap[key] ?? key,
    value: counts[key] ?? 0,
    color: colorMap[key],
  }));
}

/**
 * Triage category breakdown by age group.
 * Each row is an age bucket with counts for red/yellow/green (patient-level).
 */
export async function getTriageByAge(runIds?: string[]) {
  const ids = runIds ?? (await getLatestRunIds());
  const bestPerPatient = await getBestTargetPerPatient(ids);
  if (bestPerPatient.length === 0) return [];

  // Fetch ages for these patients
  const patientIds = bestPerPatient.map((p) => p.patientId);
  const patientRows = await db
    .select({ patientId: patients.patientId, age: patients.age })
    .from(patients)
    .where(inArray(patients.patientId, patientIds));

  const ageMap = new Map(patientRows.map((p) => [p.patientId, p.age]));

  const bucketAge = (age: number | null) => {
    if (age == null) return null;
    if (age < 18) return '0-17';
    if (age < 40) return '18-39';
    if (age < 65) return '40-64';
    return '65+';
  };

  // Count category × age bucket
  const grid = new Map<string, { Urgent: number; 'Follow-up': number; 'On Track': number }>();
  const labelMap: Record<string, keyof { Urgent: number; 'Follow-up': number; 'On Track': number }> = {
    red: 'Urgent',
    yellow: 'Follow-up',
    green: 'On Track',
  };

  for (const { patientId, category } of bestPerPatient) {
    const bucket = bucketAge(ageMap.get(patientId) ?? null);
    if (!bucket || !category) continue;
    if (!grid.has(bucket)) grid.set(bucket, { Urgent: 0, 'Follow-up': 0, 'On Track': 0 });
    const label = labelMap[category];
    if (label) grid.get(bucket)![label]++;
  }

  const order = ['0-17', '18-39', '40-64', '65+'];
  return order
    .filter((b) => grid.has(b))
    .map((b) => ({ age: b, ...grid.get(b)! }));
}

/**
 * Encounter counts by facility.
 */
export async function getEncountersByFacility() {
  const result = await db
    .select({
      facility: encounters.facility,
      value: count(),
    })
    .from(encounters)
    .where(sql`${encounters.facility} IS NOT NULL`)
    .groupBy(encounters.facility)
    .orderBy(desc(count()))
    .limit(12);

  return result
    .filter((r) => r.facility)
    .map((r) => ({ name: r.facility!, value: r.value }));
}

/**
 * Encounter disposition distribution (care-engagement friction).
 */
export async function getDispositionStats() {
  const result = await db
    .select({
      disposition: encounters.disposition,
      value: count(),
    })
    .from(encounters)
    .where(sql`${encounters.disposition} IS NOT NULL`)
    .groupBy(encounters.disposition)
    .orderBy(desc(count()));

  return result
    .filter((r) => r.disposition)
    .map((r) => ({ name: r.disposition!, value: r.value }));
}

/**
 * Data completeness score (0-100).
 * Measures what percentage of patients have data across 5 categories:
 * encounters, lab results, vitals, medications, and engine runs.
 */
export async function getDataCompletenessScore() {
  const [totalResult, ...categoryCounts] = await Promise.all([
    db.select({ total: count() }).from(patients),
    db
      .select({ c: sql<number>`COUNT(DISTINCT ${encounters.patientId})` })
      .from(encounters),
    db
      .select({ c: sql<number>`COUNT(DISTINCT ${labResults.patientId})` })
      .from(labResults),
    db
      .select({ c: sql<number>`COUNT(DISTINCT ${vitals.patientId})` })
      .from(vitals),
    db
      .select({ c: sql<number>`COUNT(DISTINCT ${medications.patientId})` })
      .from(medications),
    db
      .select({ c: sql<number>`COUNT(DISTINCT ${engineRuns.patientId})` })
      .from(engineRuns)
      .where(eq(engineRuns.status, 'completed')),
  ]);

  const total = totalResult[0]?.total ?? 0;
  if (total === 0) return 0;

  const sum = categoryCounts.reduce(
    (acc, row) => acc + Number(row[0]?.c ?? 0),
    0,
  );
  return Math.round((sum / (total * 5)) * 100);
}

/**
 * Lab result abnormality distribution: Normal / High / Low.
 */
export async function getLabAbnormalityStats() {
  const result = await db
    .select({
      flag: labResults.abnormalFlag,
      value: count(),
    })
    .from(labResults)
    .where(sql`${labResults.abnormalFlag} IS NOT NULL`)
    .groupBy(labResults.abnormalFlag)
    .orderBy(desc(count()));

  const labelMap: Record<string, string> = {
    N: 'Normal',
    H: 'High',
    L: 'Low',
  };

  const colorMap: Record<string, string> = {
    N: '#0B7A5E',
    H: '#C93B3B',
    L: '#C27A15',
  };

  return result
    .filter((r) => r.flag)
    .map((r) => ({
      name: labelMap[r.flag!] ?? r.flag!,
      value: r.value,
      color: colorMap[r.flag!],
    }));
}

/**
 * Condition → Provider route matrix for the Sankey alternative.
 * Returns top 8 conditions with counts per provider route.
 */
export async function getConditionProviderMatrix(runIds?: string[]) {
  const ids = runIds ?? (await getLatestRunIds());
  if (ids.length === 0) return { data: [], providerRoutes: [] };

  // Get all condition × provider route pairs
  const result = await db
    .select({
      condition: pathwayTargetRunFacts.condition,
      providerRoute: pathwayTargetRunFacts.providerRoute,
      value: count(),
    })
    .from(pathwayTargetRunFacts)
    .where(
      sql`${pathwayTargetRunFacts.runId} IN ${ids}
        AND ${pathwayTargetRunFacts.condition} IS NOT NULL
        AND ${pathwayTargetRunFacts.providerRoute} IS NOT NULL`,
    )
    .groupBy(
      pathwayTargetRunFacts.condition,
      pathwayTargetRunFacts.providerRoute,
    )
    .orderBy(desc(count()));

  // Find top 8 conditions by total count
  const conditionTotals = new Map<string, number>();
  for (const row of result) {
    const c = row.condition!;
    conditionTotals.set(c, (conditionTotals.get(c) ?? 0) + row.value);
  }
  const topConditions = Array.from(conditionTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([c]) => c);
  const topSet = new Set(topConditions);

  // Collect unique provider routes
  const routeSet = new Set<string>();
  for (const row of result) {
    if (topSet.has(row.condition!)) {
      routeSet.add(row.providerRoute!);
    }
  }
  const providerRoutes = Array.from(routeSet);

  // Build matrix rows
  const data = topConditions.map((condition) => {
    const row: Record<string, unknown> = {
      condition:
        condition.length > 30 ? condition.slice(0, 27) + '...' : condition,
    };
    for (const route of providerRoutes) {
      row[route] = 0;
    }
    for (const r of result) {
      if (r.condition === condition && topSet.has(condition)) {
        row[r.providerRoute!] = r.value;
      }
    }
    return row;
  });

  return { data, providerRoutes };
}
