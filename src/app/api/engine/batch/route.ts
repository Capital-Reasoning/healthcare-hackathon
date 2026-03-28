import { NextResponse } from 'next/server';
import { runBatch } from '@/lib/engine/batch';
import { buildErrorResponse } from '@/lib/db/queries/helpers';
import { createEngineLogger } from '@/lib/engine/logger';
import type { ModelTier } from '@/lib/engine/model-provider';

const log = createEngineLogger('api/engine/batch');

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { limit, patientIds, concurrency, force, modelTier } = body as {
      limit?: number;
      patientIds?: string[];
      concurrency?: number;
      force?: boolean;
      modelTier?: ModelTier;
    };

    const result = await runBatch({
      limit: limit ?? 10,
      patientIds,
      concurrency: concurrency ?? 3,
      force: force ?? false,
      modelTier: modelTier ?? 'production',
    });

    return NextResponse.json({ data: result, meta: null, error: null });
  } catch (error) {
    log.error('Batch run failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      buildErrorResponse(
        error instanceof Error ? error.message : 'Batch run failed',
      ),
      { status: 500 },
    );
  }
}
