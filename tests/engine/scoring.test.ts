import { describe, it, expect } from 'vitest';
import { scoreAndCategorize } from '@/lib/engine/scoring';
import type { ComparatorResult } from '@/lib/engine/types';

/** Build a minimal ComparatorInput (without actionValueScore, priorityRank, category). */
type ComparatorInput = Omit<
  ComparatorResult,
  'actionValueScore' | 'priorityRank' | 'category'
>;

function makeInput(overrides: Partial<ComparatorInput> = {}): ComparatorInput {
  return {
    condition: 'Type 2 Diabetes',
    screeningType: 'HbA1c',
    action: 'Order HbA1c lab',
    riskTier: 'high',
    recommendedIntervalDays: 90,
    lastCompletedDate: null,
    whyThisAction: 'Guideline-recommended monitoring',
    whyNow: 'Overdue per ADA guidelines',
    confidence: 'high',
    confidenceReason: 'Clear guideline match',
    evidenceRefs: [],
    missingDataTasks: [],
    providerRoute: null,
    status: 'overdue_now',
    overdueDays: 100,
    dueDate: '2025-03-01',
    targetId: crypto.randomUUID(),
    ...overrides,
  };
}

describe('scoreAndCategorize', () => {
  // -------------------------------------------------------------------
  // Score formula tests
  // -------------------------------------------------------------------

  it('computes correct score: high risk + overdue_now + 100 overdue days + high confidence = 500', () => {
    const input = makeInput({
      riskTier: 'high',
      status: 'overdue_now',
      overdueDays: 100,
      confidence: 'high',
    });

    const [result] = scoreAndCategorize([input]);

    // 300 + 80 + 100 + 20 = 500
    expect(result!.actionValueScore).toBe(500);
  });

  it('computes correct score: low risk + up_to_date + 0 overdue + low confidence = 100', () => {
    const input = makeInput({
      riskTier: 'low',
      status: 'up_to_date',
      overdueDays: 0,
      confidence: 'low',
    });

    const [result] = scoreAndCategorize([input]);

    // 100 + 0 + 0 + 0 = 100
    expect(result!.actionValueScore).toBe(100);
  });

  it('computes medium risk + due_soon + 0 overdue + medium confidence = 250', () => {
    const input = makeInput({
      riskTier: 'medium',
      status: 'due_soon',
      overdueDays: 0,
      confidence: 'medium',
    });

    const [result] = scoreAndCategorize([input]);

    // 200 + 40 + 0 + 10 = 250
    expect(result!.actionValueScore).toBe(250);
  });

  // -------------------------------------------------------------------
  // Overdue days clamping
  // -------------------------------------------------------------------

  it('caps overdue days contribution at 180', () => {
    const input = makeInput({
      riskTier: 'high',
      status: 'overdue_now',
      overdueDays: 999,
      confidence: 'high',
    });

    const [result] = scoreAndCategorize([input]);

    // 300 + 80 + 180 (capped) + 20 = 580
    expect(result!.actionValueScore).toBe(580);
  });

  it('clamps negative overdue days to 0', () => {
    const input = makeInput({
      riskTier: 'low',
      status: 'up_to_date',
      overdueDays: -45,
      confidence: 'low',
    });

    const [result] = scoreAndCategorize([input]);

    // 100 + 0 + 0 (clamped from -45) + 0 = 100
    expect(result!.actionValueScore).toBe(100);
  });

  // -------------------------------------------------------------------
  // Category assignment
  // -------------------------------------------------------------------

  it('assigns red category when overdue_now + high risk', () => {
    const input = makeInput({
      riskTier: 'high',
      status: 'overdue_now',
    });

    const [result] = scoreAndCategorize([input]);

    expect(result!.category).toBe('red');
  });

  it('assigns yellow category when overdue_now + medium risk', () => {
    const input = makeInput({
      riskTier: 'medium',
      status: 'overdue_now',
    });

    const [result] = scoreAndCategorize([input]);

    expect(result!.category).toBe('yellow');
  });

  it('assigns yellow category when overdue_now + low risk', () => {
    const input = makeInput({
      riskTier: 'low',
      status: 'overdue_now',
    });

    const [result] = scoreAndCategorize([input]);

    expect(result!.category).toBe('yellow');
  });

  it('assigns yellow category for due_soon regardless of risk tier', () => {
    for (const riskTier of ['high', 'medium', 'low'] as const) {
      const input = makeInput({
        riskTier,
        status: 'due_soon',
      });

      const [result] = scoreAndCategorize([input]);

      expect(result!.category).toBe('yellow');
    }
  });

  it('assigns yellow category for unknown_due regardless of risk tier', () => {
    for (const riskTier of ['high', 'medium', 'low'] as const) {
      const input = makeInput({
        riskTier,
        status: 'unknown_due',
      });

      const [result] = scoreAndCategorize([input]);

      expect(result!.category).toBe('yellow');
    }
  });

  it('assigns green category when up_to_date', () => {
    for (const riskTier of ['high', 'medium', 'low'] as const) {
      const input = makeInput({
        riskTier,
        status: 'up_to_date',
        overdueDays: -30,
      });

      const [result] = scoreAndCategorize([input]);

      expect(result!.category).toBe('green');
    }
  });

  // -------------------------------------------------------------------
  // Priority ranking
  // -------------------------------------------------------------------

  it('assigns priority ranks correctly (highest score = rank 1)', () => {
    const inputs = [
      makeInput({
        riskTier: 'low',
        status: 'up_to_date',
        overdueDays: 0,
        confidence: 'low',
        condition: 'Low priority',
      }),
      makeInput({
        riskTier: 'high',
        status: 'overdue_now',
        overdueDays: 100,
        confidence: 'high',
        condition: 'High priority',
      }),
      makeInput({
        riskTier: 'medium',
        status: 'due_soon',
        overdueDays: 0,
        confidence: 'medium',
        condition: 'Medium priority',
      }),
    ];

    const results = scoreAndCategorize(inputs);

    // Highest score first
    expect(results[0]!.condition).toBe('High priority');
    expect(results[0]!.priorityRank).toBe(1);

    expect(results[1]!.condition).toBe('Medium priority');
    expect(results[1]!.priorityRank).toBe(2);

    expect(results[2]!.condition).toBe('Low priority');
    expect(results[2]!.priorityRank).toBe(3);
  });

  it('handles a single target (rank 1)', () => {
    const input = makeInput();
    const [result] = scoreAndCategorize([input]);
    expect(result!.priorityRank).toBe(1);
  });

  it('handles an empty array', () => {
    const results = scoreAndCategorize([]);
    expect(results).toEqual([]);
  });

  it('assigns sequential ranks to targets with equal scores', () => {
    const a = makeInput({
      riskTier: 'medium',
      status: 'due_soon',
      overdueDays: 0,
      confidence: 'medium',
      condition: 'A',
    });
    const b = makeInput({
      riskTier: 'medium',
      status: 'due_soon',
      overdueDays: 0,
      confidence: 'medium',
      condition: 'B',
    });

    const results = scoreAndCategorize([a, b]);

    expect(results[0]!.priorityRank).toBe(1);
    expect(results[1]!.priorityRank).toBe(2);
    expect(results[0]!.actionValueScore).toBe(results[1]!.actionValueScore);
  });

  // -------------------------------------------------------------------
  // Score boundary: overdue days at exactly 180
  // -------------------------------------------------------------------

  it('uses exactly 180 when overdue days are exactly 180', () => {
    const input = makeInput({
      riskTier: 'high',
      status: 'overdue_now',
      overdueDays: 180,
      confidence: 'high',
    });

    const [result] = scoreAndCategorize([input]);

    // 300 + 80 + 180 + 20 = 580
    expect(result!.actionValueScore).toBe(580);
  });

  // -------------------------------------------------------------------
  // unknown_due status scoring
  // -------------------------------------------------------------------

  it('unknown_due status gets 20 status points', () => {
    const input = makeInput({
      riskTier: 'low',
      status: 'unknown_due',
      overdueDays: 0,
      confidence: 'low',
    });

    const [result] = scoreAndCategorize([input]);

    // 100 + 20 + 0 + 0 = 120
    expect(result!.actionValueScore).toBe(120);
  });
});
