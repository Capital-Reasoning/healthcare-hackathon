import { addDays, differenceInCalendarDays } from 'date-fns';
import { createEngineLogger } from './logger';
import type { EngineTarget } from './types';

const log = createEngineLogger('comparator');

export interface ComparatorOutput {
  status: 'overdue_now' | 'due_soon' | 'up_to_date' | 'unknown_due';
  overdueDays: number;
  dueDate: string | null;
  targetId: string;
}

/**
 * Pure deterministic overdue calculation.
 * No LLM involved — just date math.
 */
export function runComparator(
  targets: EngineTarget[],
  today?: Date,
): (EngineTarget & ComparatorOutput)[] {
  const now = today ?? new Date();
  log.info('Running comparator', { targetCount: targets.length });

  return targets.map((target) => {
    const targetId = crypto.randomUUID();

    if (target.lastCompletedDate && target.recommendedIntervalDays) {
      const lastDate = new Date(target.lastCompletedDate);
      const dueDate = addDays(lastDate, target.recommendedIntervalDays);
      const overdueDays = differenceInCalendarDays(now, dueDate);

      let status: ComparatorOutput['status'];
      if (overdueDays > 0) {
        status = 'overdue_now';
      } else if (overdueDays >= -30) {
        status = 'due_soon';
      } else {
        status = 'up_to_date';
      }

      const dueDateStr = dueDate.toISOString().split('T')[0]!;

      return {
        ...target,
        status,
        overdueDays,
        dueDate: dueDateStr,
        targetId,
      };
    }

    // No last-completed date or no interval — unknown
    return {
      ...target,
      status: 'unknown_due' as const,
      overdueDays: 0,
      dueDate: null,
      targetId,
    };
  });
}
