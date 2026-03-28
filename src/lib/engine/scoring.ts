import { createEngineLogger } from './logger';
import type { ComparatorResult } from './types';

const log = createEngineLogger('scoring');

type ComparatorInput = Omit<ComparatorResult, 'actionValueScore' | 'priorityRank' | 'category'>;

const RISK_POINTS: Record<string, number> = {
  high: 300,
  medium: 200,
  low: 100,
};

const STATUS_POINTS: Record<string, number> = {
  overdue_now: 80,
  due_soon: 40,
  unknown_due: 20,
  up_to_date: 0,
};

const CONFIDENCE_POINTS: Record<string, number> = {
  high: 20,
  medium: 10,
  low: 0,
};

/**
 * Compute actionValueScore, assign category (red/yellow/green),
 * then sort and assign priorityRank.
 */
export function scoreAndCategorize(
  targets: ComparatorInput[],
): ComparatorResult[] {
  log.info('Scoring targets', { count: targets.length });

  const scored = targets.map((t) => {
    const actionValueScore =
      (RISK_POINTS[t.riskTier] ?? 0) +
      (STATUS_POINTS[t.status] ?? 0) +
      Math.min(Math.max(t.overdueDays, 0), 180) +
      (CONFIDENCE_POINTS[t.confidence] ?? 0);

    let category: 'red' | 'yellow' | 'green';
    if (t.status === 'overdue_now' && t.riskTier === 'high') {
      category = 'red';
    } else if (['overdue_now', 'due_soon', 'unknown_due'].includes(t.status)) {
      category = 'yellow';
    } else {
      category = 'green';
    }

    return {
      ...t,
      actionValueScore,
      category,
      priorityRank: 0, // placeholder, set after sort
    };
  });

  // Sort by actionValueScore DESC
  scored.sort((a, b) => b.actionValueScore - a.actionValueScore);

  // Assign priorityRank
  scored.forEach((t, i) => {
    t.priorityRank = i + 1;
  });

  log.info('Scoring complete', {
    red: scored.filter((t) => t.category === 'red').length,
    yellow: scored.filter((t) => t.category === 'yellow').length,
    green: scored.filter((t) => t.category === 'green').length,
  });

  return scored;
}
