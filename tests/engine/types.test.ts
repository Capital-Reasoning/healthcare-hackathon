import { describe, it, expect } from 'vitest';
import {
  EngineTargetSchema,
  EvidenceRefSchema,
  EngineOutputSchema,
  ComparatorResultSchema,
} from '@/lib/engine/types';

describe('EvidenceRefSchema', () => {
  it('parses valid evidence ref with populated fields', () => {
    const result = EvidenceRefSchema.safeParse({
      docId: 'doc-abc-123',
      chunkId: 'chunk-xyz-456',
      documentTitle: 'ADA Standards of Care 2025',
      excerpt: 'HbA1c should be measured every 3 months',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.docId).toBe('doc-abc-123');
      expect(result.data.chunkId).toBe('chunk-xyz-456');
    }
  });

  it('parses evidence ref with null docId and chunkId', () => {
    const result = EvidenceRefSchema.safeParse({
      docId: null,
      chunkId: null,
      documentTitle: 'Expert consensus',
      excerpt: 'Based on clinical experience',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.docId).toBeNull();
      expect(result.data.chunkId).toBeNull();
    }
  });

  it('fails when documentTitle is missing', () => {
    const result = EvidenceRefSchema.safeParse({
      docId: null,
      chunkId: null,
      excerpt: 'Some excerpt',
    });

    expect(result.success).toBe(false);
  });

  it('fails when excerpt is missing', () => {
    const result = EvidenceRefSchema.safeParse({
      docId: null,
      chunkId: null,
      documentTitle: 'Title',
    });

    expect(result.success).toBe(false);
  });
});

describe('EngineTargetSchema', () => {
  const validTarget = {
    condition: 'Type 2 Diabetes',
    screeningType: 'HbA1c',
    action: 'Order HbA1c lab',
    riskTier: 'high',
    recommendedIntervalDays: 90,
    lastCompletedDate: '2025-01-15',
    whyThisAction: 'Guideline-recommended monitoring',
    whyNow: 'Overdue by 30 days',
    confidence: 'high',
    confidenceReason: 'Clear guideline match with lab data',
    evidenceRefs: [
      {
        docId: 'doc-1',
        chunkId: 'chunk-1',
        documentTitle: 'ADA 2025',
        excerpt: 'Measure HbA1c every 3 months',
      },
    ],
    missingDataTasks: ['Verify current medications'],
    providerRoute: '/patients/p-123',
  };

  it('parses a fully valid EngineTarget', () => {
    const result = EngineTargetSchema.safeParse(validTarget);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.condition).toBe('Type 2 Diabetes');
      expect(result.data.riskTier).toBe('high');
      expect(result.data.recommendedIntervalDays).toBe(90);
      expect(result.data.evidenceRefs).toHaveLength(1);
    }
  });

  it('parses with null lastCompletedDate and providerRoute', () => {
    const result = EngineTargetSchema.safeParse({
      ...validTarget,
      lastCompletedDate: null,
      providerRoute: null,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lastCompletedDate).toBeNull();
      expect(result.data.providerRoute).toBeNull();
    }
  });

  it('parses with empty evidenceRefs and missingDataTasks arrays', () => {
    const result = EngineTargetSchema.safeParse({
      ...validTarget,
      evidenceRefs: [],
      missingDataTasks: [],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.evidenceRefs).toEqual([]);
      expect(result.data.missingDataTasks).toEqual([]);
    }
  });

  it('fails when required field "condition" is missing', () => {
    const { condition, ...rest } = validTarget;
    const result = EngineTargetSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when required field "action" is missing', () => {
    const { action, ...rest } = validTarget;
    const result = EngineTargetSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails when required field "riskTier" is missing', () => {
    const { riskTier, ...rest } = validTarget;
    const result = EngineTargetSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('fails with invalid riskTier enum value', () => {
    const result = EngineTargetSchema.safeParse({
      ...validTarget,
      riskTier: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('fails with invalid confidence enum value', () => {
    const result = EngineTargetSchema.safeParse({
      ...validTarget,
      confidence: 'uncertain',
    });
    expect(result.success).toBe(false);
  });

  it('fails when recommendedIntervalDays is a string instead of number', () => {
    const result = EngineTargetSchema.safeParse({
      ...validTarget,
      recommendedIntervalDays: '90',
    });
    expect(result.success).toBe(false);
  });

  it('fails when evidenceRefs is not an array', () => {
    const result = EngineTargetSchema.safeParse({
      ...validTarget,
      evidenceRefs: 'not an array',
    });
    expect(result.success).toBe(false);
  });
});

describe('EngineOutputSchema', () => {
  const validOutput = {
    targets: [
      {
        condition: 'Type 2 Diabetes',
        screeningType: 'HbA1c',
        action: 'Order HbA1c lab',
        riskTier: 'high',
        recommendedIntervalDays: 90,
        lastCompletedDate: null,
        whyThisAction: 'Monitoring',
        whyNow: 'Overdue',
        confidence: 'high',
        confidenceReason: 'Clear match',
        evidenceRefs: [],
        missingDataTasks: [],
        providerRoute: null,
      },
    ],
    patientSummary: 'Patient with uncontrolled diabetes',
    overallConfidence: 'high',
  };

  it('parses a valid EngineOutput', () => {
    const result = EngineOutputSchema.safeParse(validOutput);
    expect(result.success).toBe(true);
  });

  it('fails with invalid overallConfidence', () => {
    const result = EngineOutputSchema.safeParse({
      ...validOutput,
      overallConfidence: 'very_high',
    });
    expect(result.success).toBe(false);
  });

  it('fails when patientSummary is missing', () => {
    const { patientSummary, ...rest } = validOutput;
    const result = EngineOutputSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});

describe('ComparatorResultSchema', () => {
  const validComparatorResult = {
    condition: 'Type 2 Diabetes',
    screeningType: 'HbA1c',
    action: 'Order HbA1c lab',
    riskTier: 'high',
    recommendedIntervalDays: 90,
    lastCompletedDate: '2025-01-15',
    whyThisAction: 'Monitoring',
    whyNow: 'Overdue',
    confidence: 'high',
    confidenceReason: 'Clear match',
    evidenceRefs: [],
    missingDataTasks: [],
    providerRoute: null,
    status: 'overdue_now',
    overdueDays: 10,
    dueDate: '2025-04-15',
    actionValueScore: 500,
    priorityRank: 1,
    category: 'red',
    targetId: '550e8400-e29b-41d4-a716-446655440000',
  };

  it('parses a valid ComparatorResult', () => {
    const result = ComparatorResultSchema.safeParse(validComparatorResult);
    expect(result.success).toBe(true);
  });

  it('fails with invalid status enum value', () => {
    const result = ComparatorResultSchema.safeParse({
      ...validComparatorResult,
      status: 'expired',
    });
    expect(result.success).toBe(false);
  });

  it('fails with invalid category enum value', () => {
    const result = ComparatorResultSchema.safeParse({
      ...validComparatorResult,
      category: 'blue',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null dueDate', () => {
    const result = ComparatorResultSchema.safeParse({
      ...validComparatorResult,
      dueDate: null,
    });
    expect(result.success).toBe(true);
  });

  it('fails when targetId is missing', () => {
    const { targetId, ...rest } = validComparatorResult;
    const result = ComparatorResultSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });
});
