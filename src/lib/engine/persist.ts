import { db } from '@/lib/db/client';
import { pathwayTargetRunFacts } from '@/lib/db/schema';
import { createEngineLogger } from './logger';
import type { ComparatorResult } from './types';

const log = createEngineLogger('persist');

/**
 * Write scored engine results to the pathway_target_run_facts table.
 * Append-only — each run creates new rows.
 */
export async function persistResults(
  runId: string,
  patientId: string,
  targets: ComparatorResult[],
  generatedAt: Date,
): Promise<void> {
  const timer = log.time('persistResults');

  if (targets.length === 0) {
    log.info('No targets to persist', { runId, patientId });
    timer.end({ runId, count: 0 });
    return;
  }

  const rows = targets.map((t) => ({
    runId,
    generatedAt,
    patientId,
    targetId: t.targetId,
    condition: t.condition,
    screeningType: t.screeningType,
    action: t.action,
    riskTier: t.riskTier,
    status: t.status,
    overdueDays: t.overdueDays,
    dueDate: t.dueDate,
    intervalDays: t.recommendedIntervalDays,
    lastCompletedDate: t.lastCompletedDate,
    priorityRank: t.priorityRank,
    confidence: t.confidence,
    confidenceReason: t.confidenceReason,
    actionValueScore: t.actionValueScore,
    whyThisAction: t.whyThisAction,
    whyNow: t.whyNow,
    evidenceRefs: t.evidenceRefs,
    missingDataTasks: t.missingDataTasks,
    providerRoute: t.providerRoute,
    category: t.category,
  }));

  await db.insert(pathwayTargetRunFacts).values(rows);

  timer.end({ runId, count: rows.length });
}
