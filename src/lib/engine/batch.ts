import { assessPatient } from './assess-patient';
import type { ModelTier } from './model-provider';
import { createEngineLogger } from './logger';
import { db } from '@/lib/db/client';
import { sql } from 'drizzle-orm';

const log = createEngineLogger('batch-runner');

export interface BatchOptions {
  patientIds?: string[];
  limit?: number;
  concurrency?: number;
  force?: boolean;
  modelTier?: ModelTier;
  onProgress?: (completed: number, total: number, current: string) => void;
}

export interface BatchResult {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
  errors: Array<{ patientId: string; error: string }>;
  results: Array<{ patientId: string; targetCount: number }>;
}

export async function runBatch(options: BatchOptions = {}): Promise<BatchResult> {
  const {
    concurrency = 3,
    force = false,
    modelTier = 'production',
    onProgress,
  } = options;
  const limit = options.limit ?? 50;

  log.info('Starting batch run', { limit, concurrency, modelTier, force });
  const timer = log.time('batch-run');

  // Get patient IDs to process
  let patientIds: string[];

  if (options.patientIds?.length) {
    patientIds = options.patientIds;
  } else {
    // Prefer patients with more encounters (more interesting for demo)
    const result = await db.execute(sql`
      SELECT p.patient_id
      FROM patients p
      LEFT JOIN encounters e ON e.patient_id = p.patient_id
      GROUP BY p.patient_id
      ORDER BY COUNT(e.id) DESC
      LIMIT ${limit}
    `);
    patientIds = (result as unknown as Array<{ patient_id: string }>).map(
      (r) => r.patient_id,
    );
  }

  // Skip already-assessed patients unless force
  let skipped = 0;
  if (!force) {
    const assessed = await db.execute(sql`
      SELECT DISTINCT patient_id FROM engine_runs WHERE status = 'completed'
    `);
    const assessedIds = new Set(
      (assessed as unknown as Array<{ patient_id: string }>).map(
        (r) => r.patient_id,
      ),
    );
    const originalCount = patientIds.length;
    patientIds = patientIds.filter((id) => !assessedIds.has(id));
    skipped = originalCount - patientIds.length;
    if (skipped > 0) {
      log.info('Skipping already-assessed patients', {
        skipped,
        remaining: patientIds.length,
      });
    }
  } else {
    // If force, delete existing results for these patients
    for (const patientId of patientIds) {
      await db.execute(
        sql`DELETE FROM pathway_target_run_facts WHERE patient_id = ${patientId}`,
      );
      await db.execute(
        sql`DELETE FROM engine_runs WHERE patient_id = ${patientId}`,
      );
    }
    log.info('Force mode: cleared existing results', {
      count: patientIds.length,
    });
  }

  const total = patientIds.length;
  const result: BatchResult = {
    total,
    completed: 0,
    failed: 0,
    skipped,
    errors: [],
    results: [],
  };

  if (total === 0) {
    log.info('No patients to process');
    timer.end({ total: 0 });
    return result;
  }

  // Process with concurrency control
  const queue = [...patientIds];
  const inFlight = new Set<Promise<void>>();

  while (queue.length > 0 || inFlight.size > 0) {
    while (inFlight.size < concurrency && queue.length > 0) {
      const patientId = queue.shift()!;
      const idx = total - queue.length - inFlight.size;
      log.info(`Processing patient ${idx}/${total}`, { patientId });
      onProgress?.(result.completed + result.failed, total, patientId);

      const promise = assessPatient(patientId, modelTier)
        .then((res) => {
          result.completed++;
          result.results.push({
            patientId,
            targetCount: res.targets?.length ?? 0,
          });
          log.info('Patient assessment complete', {
            patientId,
            targetCount: res.targets?.length ?? 0,
          });
        })
        .catch((err) => {
          result.failed++;
          const errorMsg = err instanceof Error ? err.message : String(err);
          result.errors.push({ patientId, error: errorMsg });
          log.error('Patient assessment failed', {
            patientId,
            error: errorMsg,
          });
        })
        .finally(() => {
          inFlight.delete(promise);
        });
      inFlight.add(promise);
    }
    if (inFlight.size > 0) {
      await Promise.race(inFlight);
    }
  }

  timer.end({
    total,
    completed: result.completed,
    failed: result.failed,
    skipped,
  });
  return result;
}
