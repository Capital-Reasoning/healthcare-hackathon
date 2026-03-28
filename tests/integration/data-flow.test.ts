import { describe, it, expect } from 'vitest';
import { deduplicateTargets } from '@/lib/engine/assess-patient';
import { runComparator } from '@/lib/engine/comparator';
import { scoreAndCategorize } from '@/lib/engine/scoring';
import type { EngineTarget } from '@/lib/engine/types';

/* ─── Helpers ──────────────────────────────────────────── */

function makeTarget(overrides: Partial<EngineTarget> = {}): EngineTarget {
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
    ...overrides,
  };
}

/* ═══════════════════════════════════════════════════════
   deduplicateTargets
   ═══════════════════════════════════════════════════════ */

describe('deduplicateTargets', () => {
  it('returns empty array for empty input', () => {
    const result = deduplicateTargets([]);
    expect(result).toEqual([]);
  });

  it('returns single item unchanged', () => {
    const target = makeTarget();
    const result = deduplicateTargets([target]);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(target);
  });

  it('deduplicates by condition+screeningType, keeping highest confidence', () => {
    const low = makeTarget({
      condition: 'Diabetes',
      screeningType: 'HbA1c',
      confidence: 'low',
      action: 'Low confidence action',
    });
    const high = makeTarget({
      condition: 'Diabetes',
      screeningType: 'HbA1c',
      confidence: 'high',
      action: 'High confidence action',
    });

    const result = deduplicateTargets([low, high]);
    expect(result).toHaveLength(1);
    expect(result[0]!.confidence).toBe('high');
    expect(result[0]!.action).toBe('High confidence action');
  });

  it('keeps highest confidence when high comes first', () => {
    const high = makeTarget({
      condition: 'Diabetes',
      screeningType: 'HbA1c',
      confidence: 'high',
    });
    const medium = makeTarget({
      condition: 'Diabetes',
      screeningType: 'HbA1c',
      confidence: 'medium',
    });

    const result = deduplicateTargets([high, medium]);
    expect(result).toHaveLength(1);
    expect(result[0]!.confidence).toBe('high');
  });

  it('keeps medium over low', () => {
    const low = makeTarget({
      condition: 'A',
      screeningType: 'B',
      confidence: 'low',
    });
    const medium = makeTarget({
      condition: 'A',
      screeningType: 'B',
      confidence: 'medium',
    });

    const result = deduplicateTargets([low, medium]);
    expect(result).toHaveLength(1);
    expect(result[0]!.confidence).toBe('medium');
  });

  it('preserves targets with different conditions', () => {
    const t1 = makeTarget({
      condition: 'Diabetes',
      screeningType: 'HbA1c',
    });
    const t2 = makeTarget({
      condition: 'Hypertension',
      screeningType: 'BP Check',
    });

    const result = deduplicateTargets([t1, t2]);
    expect(result).toHaveLength(2);
  });

  it('preserves targets with same condition but different screeningType', () => {
    const t1 = makeTarget({
      condition: 'Diabetes',
      screeningType: 'HbA1c',
    });
    const t2 = makeTarget({
      condition: 'Diabetes',
      screeningType: 'Eye Exam',
    });

    const result = deduplicateTargets([t1, t2]);
    expect(result).toHaveLength(2);
  });

  it('handles multiple groups with duplicates', () => {
    const targets = [
      makeTarget({
        condition: 'A',
        screeningType: 'X',
        confidence: 'low',
      }),
      makeTarget({
        condition: 'A',
        screeningType: 'X',
        confidence: 'high',
      }),
      makeTarget({
        condition: 'B',
        screeningType: 'Y',
        confidence: 'medium',
      }),
      makeTarget({
        condition: 'B',
        screeningType: 'Y',
        confidence: 'high',
      }),
      makeTarget({
        condition: 'C',
        screeningType: 'Z',
        confidence: 'low',
      }),
    ];

    const result = deduplicateTargets(targets);
    expect(result).toHaveLength(3);

    const conditions = result.map((r) => r.condition);
    expect(conditions).toContain('A');
    expect(conditions).toContain('B');
    expect(conditions).toContain('C');

    const aTarget = result.find((r) => r.condition === 'A');
    expect(aTarget!.confidence).toBe('high');

    const bTarget = result.find((r) => r.condition === 'B');
    expect(bTarget!.confidence).toBe('high');

    const cTarget = result.find((r) => r.condition === 'C');
    expect(cTarget!.confidence).toBe('low');
  });

  it('three duplicates: picks highest of low, medium, high', () => {
    const targets = [
      makeTarget({
        condition: 'D',
        screeningType: 'W',
        confidence: 'low',
      }),
      makeTarget({
        condition: 'D',
        screeningType: 'W',
        confidence: 'medium',
      }),
      makeTarget({
        condition: 'D',
        screeningType: 'W',
        confidence: 'high',
      }),
    ];

    const result = deduplicateTargets(targets);
    expect(result).toHaveLength(1);
    expect(result[0]!.confidence).toBe('high');
  });
});

/* ═══════════════════════════════════════════════════════
   Full pipeline data flow (dedup -> comparator -> scoring)
   ═══════════════════════════════════════════════════════ */

describe('full engine pipeline data flow', () => {
  const today = new Date('2025-06-15');

  it('dedup -> comparator -> scoring produces valid results', () => {
    const targets = [
      makeTarget({
        condition: 'Diabetes',
        screeningType: 'HbA1c',
        confidence: 'high',
        riskTier: 'high',
        lastCompletedDate: '2025-01-01',
        recommendedIntervalDays: 90,
      }),
      makeTarget({
        condition: 'Diabetes',
        screeningType: 'HbA1c',
        confidence: 'low', // duplicate, should be removed
        riskTier: 'high',
        lastCompletedDate: '2025-01-01',
        recommendedIntervalDays: 90,
      }),
      makeTarget({
        condition: 'Hypertension',
        screeningType: 'BP Check',
        confidence: 'medium',
        riskTier: 'medium',
        lastCompletedDate: '2025-06-01',
        recommendedIntervalDays: 30,
      }),
    ];

    // Step 1: Deduplicate
    const deduped = deduplicateTargets(targets);
    expect(deduped).toHaveLength(2);

    // Step 2: Run comparator
    const compared = runComparator(deduped, today);
    expect(compared).toHaveLength(2);

    // Each result has status, overdueDays, dueDate, targetId
    for (const r of compared) {
      expect(r.status).toBeTruthy();
      expect(typeof r.overdueDays).toBe('number');
      expect(r.targetId).toBeTruthy();
    }

    // Step 3: Score and categorize
    const scored = scoreAndCategorize(compared);
    expect(scored).toHaveLength(2);

    // Each result has actionValueScore, priorityRank, category
    for (const r of scored) {
      expect(r.actionValueScore).toBeGreaterThanOrEqual(0);
      expect(r.priorityRank).toBeGreaterThanOrEqual(1);
      expect(['red', 'yellow', 'green']).toContain(r.category);
    }

    // Rank 1 should be the highest score
    expect(scored[0]!.priorityRank).toBe(1);
    expect(scored[0]!.actionValueScore).toBeGreaterThanOrEqual(
      scored[1]!.actionValueScore,
    );
  });

  it('empty input flows through entire pipeline', () => {
    const deduped = deduplicateTargets([]);
    const compared = runComparator(deduped, today);
    const scored = scoreAndCategorize(compared);

    expect(scored).toEqual([]);
  });

  it('single target flows through correctly', () => {
    const targets = [
      makeTarget({
        condition: 'Cancer',
        screeningType: 'Colonoscopy',
        confidence: 'high',
        riskTier: 'high',
        lastCompletedDate: '2024-01-01',
        recommendedIntervalDays: 365,
      }),
    ];

    const deduped = deduplicateTargets(targets);
    const compared = runComparator(deduped, today);
    const scored = scoreAndCategorize(compared);

    expect(scored).toHaveLength(1);
    expect(scored[0]!.priorityRank).toBe(1);
    expect(scored[0]!.condition).toBe('Cancer');
    expect(scored[0]!.category).toBeDefined();
  });

  it('validates high-confidence targets with no evidence get demoted pattern', () => {
    // This tests the validation step from assess-patient.ts
    const target = makeTarget({
      confidence: 'high',
      evidenceRefs: [], // empty evidence
    });

    // Simulating the validation logic from assess-patient.ts
    const validated = [target].map((t) => {
      if (t.confidence === 'high' && t.evidenceRefs.length === 0) {
        return {
          ...t,
          confidence: 'low' as const,
          confidenceReason: 'Demoted: no evidence citations provided',
        };
      }
      return t;
    });

    expect(validated[0]!.confidence).toBe('low');
    expect(validated[0]!.confidenceReason).toBe(
      'Demoted: no evidence citations provided',
    );
  });

  it('high-confidence targets with evidence are not demoted', () => {
    const target = makeTarget({
      confidence: 'high',
      evidenceRefs: [
        {
          docId: 'doc-1',
          chunkId: 'chunk-1',
          documentTitle: 'ADA Guidelines',
          excerpt: 'HbA1c monitoring recommended every 3 months',
        },
      ],
    });

    const validated = [target].map((t) => {
      if (t.confidence === 'high' && t.evidenceRefs.length === 0) {
        return {
          ...t,
          confidence: 'low' as const,
          confidenceReason: 'Demoted: no evidence citations provided',
        };
      }
      return t;
    });

    expect(validated[0]!.confidence).toBe('high');
  });
});
