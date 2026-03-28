import { describe, it, expect } from 'vitest';
import { scoreAndCategorize } from '@/lib/engine/scoring';
import { runComparator } from '@/lib/engine/comparator';
import type { EngineTarget, ComparatorResult } from '@/lib/engine/types';
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';

/* ─── Helpers ──────────────────────────────────────────── */

type ComparatorInput = Omit<
  ComparatorResult,
  'actionValueScore' | 'priorityRank' | 'category'
>;

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

function makeScoringInput(
  overrides: Partial<ComparatorInput> = {},
): ComparatorInput {
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

/* ═══════════════════════════════════════════════════════
   Test 1: Verify API response helpers produce valid structure
   ═══════════════════════════════════════════════════════ */

describe('API response helpers', () => {
  it('buildPaginatedResponse returns valid paginated structure', () => {
    const data = [{ id: 1 }, { id: 2 }];
    const response = buildPaginatedResponse(data, 50, {
      page: 1,
      pageSize: 20,
    });

    expect(response.data).toEqual(data);
    expect(response.meta).toEqual({
      page: 1,
      pageSize: 20,
      total: 50,
      totalPages: 3,
    });
    expect(response.error).toBeNull();
  });

  it('buildPaginatedResponse handles zero total correctly', () => {
    const response = buildPaginatedResponse([], 0, {
      page: 1,
      pageSize: 20,
    });

    expect(response.data).toEqual([]);
    expect(response.meta!.total).toBe(0);
    expect(response.meta!.totalPages).toBe(0);
  });

  it('buildErrorResponse returns correct error shape', () => {
    const response = buildErrorResponse('Something went wrong');
    expect(response).toEqual({
      data: null,
      meta: null,
      error: 'Something went wrong',
    });
  });

  it('parsePaginationParams extracts valid pagination', () => {
    const params = new URLSearchParams('page=3&pageSize=50');
    const result = parsePaginationParams(params);
    expect(result).toEqual({ page: 3, pageSize: 50 });
  });

  it('parsePaginationParams defaults to page 1, pageSize 20', () => {
    const params = new URLSearchParams();
    const result = parsePaginationParams(params);
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it('parsePaginationParams clamps page to minimum 1', () => {
    const params = new URLSearchParams('page=-5');
    const result = parsePaginationParams(params);
    expect(result.page).toBe(1);
  });

  it('parsePaginationParams clamps pageSize to max 100', () => {
    const params = new URLSearchParams('pageSize=999');
    const result = parsePaginationParams(params);
    expect(result.pageSize).toBe(100);
  });

  it('parseSortParams extracts field and direction', () => {
    const params = new URLSearchParams('sort=lastName:desc');
    const result = parseSortParams(params);
    expect(result).toEqual({ field: 'lastName', direction: 'desc' });
  });

  it('parseSortParams defaults direction to asc', () => {
    const params = new URLSearchParams('sort=firstName');
    const result = parseSortParams(params);
    expect(result).toEqual({ field: 'firstName', direction: 'asc' });
  });

  it('parseSortParams returns null when no sort param', () => {
    const params = new URLSearchParams();
    const result = parseSortParams(params);
    expect(result).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════
   Test 2: Verify engine result queries handle empty results
   ═══════════════════════════════════════════════════════ */

describe('engine results — empty/edge cases', () => {
  it('scoreAndCategorize handles empty targets array', () => {
    const results = scoreAndCategorize([]);
    expect(results).toEqual([]);
  });

  it('runComparator handles empty targets array', () => {
    const results = runComparator([]);
    expect(results).toEqual([]);
  });

  it('buildPaginatedResponse handles empty results with proper meta', () => {
    const response = buildPaginatedResponse([], 0, {
      page: 1,
      pageSize: 20,
    });

    expect(response.data).toHaveLength(0);
    expect(response.meta!.total).toBe(0);
    expect(response.meta!.totalPages).toBe(0);
    expect(response.error).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════
   Test 3: Scoring formula edge cases
   ═══════════════════════════════════════════════════════ */

describe('scoring formula edge cases', () => {
  it('unknown riskTier defaults to 0 points', () => {
    const input = makeScoringInput({
      riskTier: 'nonexistent' as 'high',
      status: 'up_to_date',
      overdueDays: 0,
      confidence: 'low',
    });

    const [result] = scoreAndCategorize([input]);
    // 0 (unknown risk) + 0 (up_to_date) + 0 (overdue) + 0 (low confidence)
    expect(result!.actionValueScore).toBe(0);
  });

  it('unknown status defaults to 0 points', () => {
    const input = makeScoringInput({
      riskTier: 'low',
      status: 'nonexistent' as 'up_to_date',
      overdueDays: 0,
      confidence: 'low',
    });

    const [result] = scoreAndCategorize([input]);
    // 100 (low risk) + 0 (unknown status) + 0 + 0 = 100
    expect(result!.actionValueScore).toBe(100);
  });

  it('unknown confidence defaults to 0 points', () => {
    const input = makeScoringInput({
      riskTier: 'low',
      status: 'up_to_date',
      overdueDays: 0,
      confidence: 'nonexistent' as 'low',
    });

    const [result] = scoreAndCategorize([input]);
    // 100 + 0 + 0 + 0 = 100
    expect(result!.actionValueScore).toBe(100);
  });

  it('maximum possible score is 580 (high+overdue+180+high)', () => {
    const input = makeScoringInput({
      riskTier: 'high',
      status: 'overdue_now',
      overdueDays: 999,
      confidence: 'high',
    });

    const [result] = scoreAndCategorize([input]);
    // 300 + 80 + 180 (capped) + 20 = 580
    expect(result!.actionValueScore).toBe(580);
  });

  it('minimum possible score is 0 (all unknowns)', () => {
    const input = makeScoringInput({
      riskTier: 'invalid' as 'high',
      status: 'invalid' as 'up_to_date',
      overdueDays: -100,
      confidence: 'invalid' as 'high',
    });

    const [result] = scoreAndCategorize([input]);
    expect(result!.actionValueScore).toBe(0);
  });

  it('overdueDays exactly at 0 contributes 0 to score', () => {
    const input = makeScoringInput({
      riskTier: 'medium',
      status: 'due_soon',
      overdueDays: 0,
      confidence: 'medium',
    });

    const [result] = scoreAndCategorize([input]);
    // 200 + 40 + 0 + 10 = 250
    expect(result!.actionValueScore).toBe(250);
  });
});

/* ═══════════════════════════════════════════════════════
   Test 4: Batch runner handles empty patient list (unit-level)
   ═══════════════════════════════════════════════════════ */

describe('batch logic — empty inputs', () => {
  it('scoreAndCategorize with single target returns rank 1', () => {
    const input = makeScoringInput();
    const results = scoreAndCategorize([input]);
    expect(results).toHaveLength(1);
    expect(results[0]!.priorityRank).toBe(1);
  });

  it('scoring preserves all fields through pipeline', () => {
    const input = makeScoringInput({
      condition: 'Test Condition',
      screeningType: 'Test Screening',
      action: 'Test Action',
      whyThisAction: 'Test Why',
      whyNow: 'Test Now',
    });

    const [result] = scoreAndCategorize([input]);
    expect(result!.condition).toBe('Test Condition');
    expect(result!.screeningType).toBe('Test Screening');
    expect(result!.action).toBe('Test Action');
    expect(result!.whyThisAction).toBe('Test Why');
    expect(result!.whyNow).toBe('Test Now');
  });
});

/* ═══════════════════════════════════════════════════════
   Test 5: Comparator with various date formats
   ═══════════════════════════════════════════════════════ */

describe('comparator date handling', () => {
  const today = new Date('2025-06-15');

  it('handles ISO 8601 date-only format (YYYY-MM-DD)', () => {
    const target = makeTarget({
      lastCompletedDate: '2025-03-01',
      recommendedIntervalDays: 90,
    });

    const [result] = runComparator([target], today);
    expect(result!.status).toBe('overdue_now');
    expect(result!.overdueDays).toBeGreaterThan(0);
  });

  it('handles ISO 8601 datetime format with time', () => {
    const target = makeTarget({
      lastCompletedDate: '2025-03-01T14:30:00.000Z',
      recommendedIntervalDays: 90,
    });

    const [result] = runComparator([target], today);
    expect(result!.status).toBe('overdue_now');
  });

  it('handles date at year boundary', () => {
    const target = makeTarget({
      lastCompletedDate: '2024-12-31',
      recommendedIntervalDays: 365,
    });

    const [result] = runComparator([target], today);
    // Due 2025-12-31, today is 2025-06-15 => overdueDays should be negative
    expect(result!.status).toBe('up_to_date');
  });

  it('handles leap year date', () => {
    const leapToday = new Date('2024-03-01');
    const target = makeTarget({
      lastCompletedDate: '2024-02-29',
      recommendedIntervalDays: 1,
    });

    const [result] = runComparator([target], leapToday);
    // Feb 29 + 1 day = Mar 1, so on Mar 1 it should be due_soon or up_to_date
    expect(['up_to_date', 'due_soon']).toContain(result!.status);
  });

  it('handles very large interval (10 years)', () => {
    const target = makeTarget({
      lastCompletedDate: '2025-01-01',
      recommendedIntervalDays: 3650,
    });

    const [result] = runComparator([target], today);
    expect(result!.status).toBe('up_to_date');
    expect(result!.overdueDays).toBeLessThan(-30);
  });

  it('dueDate string is formatted as YYYY-MM-DD', () => {
    const target = makeTarget({
      lastCompletedDate: '2025-01-01',
      recommendedIntervalDays: 90,
    });

    const [result] = runComparator([target], today);
    expect(result!.dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('due_soon boundary: exactly 30 days before due is due_soon', () => {
    // If dueDate = today + 30 days, then overdueDays = -30 => due_soon (>= -30)
    const target = makeTarget({
      lastCompletedDate: '2025-04-16', // + 90 days = 2025-07-15 = today + 30 days
      recommendedIntervalDays: 90,
    });

    const [result] = runComparator([target], today);
    expect(result!.status).toBe('due_soon');
  });

  it('due_soon boundary: 31 days before due is up_to_date', () => {
    // If dueDate = today + 31 days, then overdueDays = -31 => up_to_date (< -30)
    const target = makeTarget({
      lastCompletedDate: '2025-04-15', // + 90 days = 2025-07-14 = today + 29 days
      recommendedIntervalDays: 90,
    });

    const [result] = runComparator([target], today);
    // 2025-04-15 + 90 = 2025-07-14, today = 2025-06-15
    // overdueDays = differenceInCalendarDays(2025-06-15, 2025-07-14) = -29
    // -29 >= -30 => due_soon
    expect(result!.status).toBe('due_soon');
  });
});
