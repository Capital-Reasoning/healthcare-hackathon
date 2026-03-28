import { generateText, generateObject } from 'ai';
import { db } from '@/lib/db/client';
import { engineRuns } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getEngineModel, type ModelTier } from './model-provider';
import { buildPatientContext } from './build-patient-context';
import { engineTools } from './engine-tools';
import { ENGINE_SYSTEM_PROMPT, ENGINE_PHASE_B_PROMPT } from './prompts';
import { EngineOutputSchema, type ComparatorResult } from './types';
import { runComparator } from './comparator';
import { scoreAndCategorize } from './scoring';
import { persistResults } from './persist';
import { createEngineLogger } from './logger';

const log = createEngineLogger('assess-patient');

export interface AssessmentResult {
  runId: string;
  patientId: string;
  targets: ComparatorResult[];
  summary: string;
  overallConfidence: 'high' | 'medium' | 'low';
}

/**
 * Main engine pipeline: context -> LLM tool-use -> structured output ->
 * comparator -> scoring -> persist.
 */
export async function assessPatient(
  patientId: string,
  modelTier?: ModelTier,
): Promise<AssessmentResult> {
  const runId = crypto.randomUUID();
  const generatedAt = new Date();
  const model = getEngineModel(modelTier ?? 'production');
  const timer = log.time('assessPatient');

  log.info('Starting assessment', { runId, patientId, modelTier });

  // Insert engine_runs row with status 'running'
  await db.insert(engineRuns).values({
    runId,
    patientId,
    status: 'running',
    startedAt: generatedAt,
  });

  try {
    // 1. Build patient context
    const context = await buildPatientContext(patientId);
    log.info('Patient context built', {
      patientId,
      markdownLength: context.markdown.length,
    });

    // 2. Phase A: Tool-use — gather evidence from the knowledge base
    const phaseATimer = log.time('Phase A (tool-use)');
    const phaseAResult = await generateText({
      model,
      system: ENGINE_SYSTEM_PROMPT,
      prompt: `Here is the patient record to assess:\n\n${context.markdown}\n\nPlease use the searchGuidelines tool extensively to find relevant clinical guidelines for this patient's conditions, medications, age, and risk factors. Search for every condition, every medication, and age-appropriate screening. Then provide your clinical assessment as JSON.`,
      tools: engineTools,
      maxSteps: 6, // each step ~30-60s, typically completes in 1-2 steps
    });
    phaseATimer.end({
      steps: phaseAResult.steps.length,
      toolCalls: phaseAResult.steps.reduce(
        (sum, s) => sum + (s.toolCalls?.length ?? 0),
        0,
      ),
    });

    // Collect all gathered evidence from tool calls for Phase B
    const gatheredEvidence: string[] = [];
    for (const step of phaseAResult.steps) {
      for (const toolResult of step.toolResults) {
        const toolName =
          step.toolCalls.find(
            (tc) => tc.toolCallId === toolResult.toolCallId,
          )?.toolName ?? 'searchGuidelines';
        gatheredEvidence.push(
          `Tool result for "${toolName}":\n${JSON.stringify(toolResult.output, null, 2)}`,
        );
      }
    }

    // 3. Phase B: Structured output — synthesise into EngineOutputSchema
    const phaseBTimer = log.time('Phase B (structured output)');
    const { object: engineOutput } = await generateObject({
      model,
      schema: EngineOutputSchema,
      system: ENGINE_PHASE_B_PROMPT,
      prompt: `Patient record:\n\n${context.markdown}\n\n---\n\nEvidence gathered from guideline search:\n\n${gatheredEvidence.join('\n\n---\n\n')}\n\n---\n\nPhase A assessment notes:\n${phaseAResult.text}\n\nProduce the structured JSON output now.`,
    });
    phaseBTimer.end({ targetCount: engineOutput.targets.length });

    // 4. Deduplicate targets: group by condition+screeningType, keep highest confidence
    const deduped = deduplicateTargets(engineOutput.targets);
    log.info('Deduplication', {
      before: engineOutput.targets.length,
      after: deduped.length,
    });

    // 5. Validate: demote high-confidence targets with empty evidenceRefs
    const validated = deduped.map((t) => {
      const refs = Array.isArray(t.evidenceRefs) ? t.evidenceRefs : [];
      if (t.confidence === 'high' && refs.length === 0) {
        return { ...t, confidence: 'low' as const, confidenceReason: 'Demoted: no evidence citations provided' };
      }
      return t;
    });

    // 6. Run comparator (pure date math)
    const compared = runComparator(validated);

    // 7. Score and categorize
    const scored = scoreAndCategorize(compared);

    // 8. Persist results
    await persistResults(runId, patientId, scored, generatedAt);

    // 9. Update engine_runs with status 'completed'
    await db
      .update(engineRuns)
      .set({
        status: 'completed',
        completedAt: new Date(),
        targetCount: scored.length,
      })
      .where(eq(engineRuns.runId, runId));

    const duration = timer.end({
      runId,
      patientId,
      targetCount: scored.length,
      red: scored.filter((t) => t.category === 'red').length,
      yellow: scored.filter((t) => t.category === 'yellow').length,
      green: scored.filter((t) => t.category === 'green').length,
    });

    log.info('Assessment complete', { runId, durationMs: duration });

    return {
      runId,
      patientId,
      targets: scored,
      summary: engineOutput.patientSummary,
      overallConfidence: engineOutput.overallConfidence,
    };
  } catch (error) {
    // Update engine_runs with status 'failed'
    await db
      .update(engineRuns)
      .set({
        status: 'failed',
        completedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      })
      .where(eq(engineRuns.runId, runId));

    log.error('Assessment failed', {
      runId,
      patientId,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Group targets by condition+screeningType, keep the one with highest confidence.
 */
export function deduplicateTargets(
  targets: import('./types').EngineTarget[],
): import('./types').EngineTarget[] {
  const confidenceRank = { high: 3, medium: 2, low: 1 };
  const map = new Map<string, import('./types').EngineTarget>();

  for (const t of targets) {
    const key = `${t.condition}::${t.screeningType}`;
    const existing = map.get(key);
    if (
      !existing ||
      confidenceRank[t.confidence] > confidenceRank[existing.confidence]
    ) {
      map.set(key, t);
    }
  }

  return Array.from(map.values());
}
