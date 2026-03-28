import { z } from 'zod';

export const EvidenceRefSchema = z.object({
  docId: z.string().nullable(),
  chunkId: z.string().nullable(),
  documentTitle: z.string(),
  excerpt: z.string(),
});

export const EngineTargetSchema = z.object({
  condition: z.string(),
  screeningType: z.string(),
  action: z.string(),
  riskTier: z.enum(['high', 'medium', 'low']),
  recommendedIntervalDays: z.number(),
  lastCompletedDate: z.string().nullable(),
  whyThisAction: z.string(),
  whyNow: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  confidenceReason: z.string(),
  evidenceRefs: z.array(EvidenceRefSchema),
  missingDataTasks: z.array(z.string()),
  providerRoute: z.string().nullable(),
});

export const EngineOutputSchema = z.object({
  targets: z.array(EngineTargetSchema),
  patientSummary: z.string(),
  overallConfidence: z.enum(['high', 'medium', 'low']),
});

// After comparator
export const ComparatorResultSchema = EngineTargetSchema.extend({
  status: z.enum(['overdue_now', 'due_soon', 'up_to_date', 'unknown_due']),
  overdueDays: z.number(),
  dueDate: z.string().nullable(),
  actionValueScore: z.number(),
  priorityRank: z.number(),
  category: z.enum(['red', 'yellow', 'green']),
  targetId: z.string(),
});

export type EngineTarget = z.infer<typeof EngineTargetSchema>;
export type EngineOutput = z.infer<typeof EngineOutputSchema>;
export type ComparatorResult = z.infer<typeof ComparatorResultSchema>;
export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
