import { describe, it, expect } from 'vitest';
import { runComparator } from '@/lib/engine/comparator';
import type { EngineTarget } from '@/lib/engine/types';

/** Helper to build a minimal valid EngineTarget with overrides. */
function makeTarget(overrides: Partial<EngineTarget> = {}): EngineTarget {
  return {
    condition: 'Type 2 Diabetes',
    screeningType: 'HbA1c',
    action: 'Order HbA1c lab',
    riskTier: 'high',
    recommendedIntervalDays: 90,
    lastCompletedDate: null,
    whyThisAction: 'Guideline recommended monitoring',
    whyNow: 'Overdue for screening',
    confidence: 'high',
    confidenceReason: 'Based on clinical guidelines',
    evidenceRefs: [],
    missingDataTasks: [],
    providerRoute: null,
    ...overrides,
  };
}

describe('runComparator', () => {
  // Fixed reference date so tests are deterministic
  const today = new Date('2025-06-15');

  it('returns overdue_now when last HbA1c was 100 days ago with 90-day interval', () => {
    // 100 days before today => 2025-03-07
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() - 100);
    const target = makeTarget({
      lastCompletedDate: lastDate.toISOString().split('T')[0],
      recommendedIntervalDays: 90,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('overdue_now');
    expect(result.overdueDays).toBe(10);
    expect(result.targetId).toBeTruthy();
    // targetId should be a valid UUID format
    expect(result.targetId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('returns due_soon when last screening was 60 days ago with 90-day interval', () => {
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() - 60);
    const target = makeTarget({
      lastCompletedDate: lastDate.toISOString().split('T')[0],
      recommendedIntervalDays: 90,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('due_soon');
    // Due in 30 days => overdueDays should be -30
    expect(result.overdueDays).toBe(-30);
    expect(result.dueDate).toBeTruthy();
  });

  it('returns up_to_date when last screening was 10 days ago with 365-day interval', () => {
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() - 10);
    const target = makeTarget({
      lastCompletedDate: lastDate.toISOString().split('T')[0],
      recommendedIntervalDays: 365,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('up_to_date');
    // Due in 355 days => overdueDays = -(365 - 10) = -355
    expect(result.overdueDays).toBe(-355);
  });

  it('returns unknown_due when lastCompletedDate is null', () => {
    const target = makeTarget({
      lastCompletedDate: null,
      recommendedIntervalDays: 90,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('unknown_due');
    expect(result.overdueDays).toBe(0);
    expect(result.dueDate).toBeNull();
    expect(result.targetId).toBeTruthy();
  });

  it('edge: lastCompletedDate is today => up_to_date, overdueDays = -intervalDays', () => {
    const target = makeTarget({
      lastCompletedDate: today.toISOString().split('T')[0],
      recommendedIntervalDays: 90,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('up_to_date');
    expect(result.overdueDays).toBe(-90);
  });

  it('edge: interval 0 => unknown_due (0 is falsy, skips date math)', () => {
    // The comparator checks `target.recommendedIntervalDays` which is falsy when 0,
    // so it falls through to the unknown_due branch.
    const lastDate = new Date(today);
    lastDate.setDate(lastDate.getDate() - 5);
    const target = makeTarget({
      lastCompletedDate: lastDate.toISOString().split('T')[0],
      recommendedIntervalDays: 0,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('unknown_due');
    expect(result.overdueDays).toBe(0);
    expect(result.dueDate).toBeNull();
  });

  it('edge: future lastCompletedDate => handled gracefully (up_to_date)', () => {
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 30);
    const target = makeTarget({
      lastCompletedDate: futureDate.toISOString().split('T')[0],
      recommendedIntervalDays: 90,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    // dueDate = futureDate + 90 days, which is 120 days from today
    // overdueDays = today - dueDate = -120
    expect(result.status).toBe('up_to_date');
    expect(result.overdueDays).toBeLessThan(-30);
  });

  it('each result includes a unique targetId (UUID)', () => {
    const targets = [
      makeTarget({ condition: 'Diabetes' }),
      makeTarget({ condition: 'Hypertension' }),
      makeTarget({ condition: 'Cancer screening' }),
    ];
    // Give them all lastCompletedDate so they all go through the date logic path
    const withDates = targets.map((t) => ({
      ...t,
      lastCompletedDate: '2025-01-01',
    }));

    const results = runComparator(withDates, today);

    expect(results).toHaveLength(3);
    const ids = results.map((r) => r.targetId);
    // All unique
    expect(new Set(ids).size).toBe(3);
    // All valid UUIDs
    for (const id of ids) {
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  it('handles empty targets array', () => {
    const results = runComparator([], today);
    expect(results).toEqual([]);
  });

  it('preserves all original EngineTarget fields in the output', () => {
    const target = makeTarget({
      lastCompletedDate: '2025-01-01',
      recommendedIntervalDays: 90,
      condition: 'Asthma',
      whyThisAction: 'Need monitoring',
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.condition).toBe('Asthma');
    expect(result.whyThisAction).toBe('Need monitoring');
    expect(result.screeningType).toBe('HbA1c');
    expect(result.riskTier).toBe('high');
    expect(result.evidenceRefs).toEqual([]);
    expect(result.missingDataTasks).toEqual([]);
  });

  it('edge: interval 0 with lastCompletedDate today => unknown_due (0 is falsy)', () => {
    // recommendedIntervalDays = 0 is falsy in JS, so the comparator
    // skips date math entirely and returns unknown_due.
    const target = makeTarget({
      lastCompletedDate: today.toISOString().split('T')[0],
      recommendedIntervalDays: 0,
    });

    const results = runComparator([target], today);
    const result = results[0]!;

    expect(result.status).toBe('unknown_due');
    expect(result.overdueDays).toBe(0);
    expect(result.dueDate).toBeNull();
  });
});
