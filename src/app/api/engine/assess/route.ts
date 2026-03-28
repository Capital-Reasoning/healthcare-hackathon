import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/lib/db/queries/helpers';
import { createEngineLogger } from '@/lib/engine/logger';

const log = createEngineLogger('api/engine/assess');

export const maxDuration = 300;

const PATIENT_ID_PATTERN = /^PAT-\d{1,10}$/;
const VALID_MODEL_TIERS = ['production', 'testing', 'free'] as const;
type ModelTier = (typeof VALID_MODEL_TIERS)[number];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, modelTier } = body as {
      patientId: string;
      modelTier?: ModelTier;
    };

    if (!patientId || typeof patientId !== 'string') {
      return NextResponse.json(
        buildErrorResponse('patientId is required and must be a string'),
        { status: 400 },
      );
    }

    if (!PATIENT_ID_PATTERN.test(patientId)) {
      return NextResponse.json(
        buildErrorResponse(
          'patientId must match format "PAT-000123"',
        ),
        { status: 400 },
      );
    }

    if (
      modelTier !== undefined &&
      !VALID_MODEL_TIERS.includes(modelTier as ModelTier)
    ) {
      return NextResponse.json(
        buildErrorResponse(
          `modelTier must be one of: ${VALID_MODEL_TIERS.join(', ')}`,
        ),
        { status: 400 },
      );
    }

    log.info('Assessment requested', { patientId, modelTier });

    const { assessPatient } = await import('@/lib/engine/assess-patient');
    const result = await assessPatient(patientId, modelTier);

    return NextResponse.json({
      data: {
        runId: result.runId,
        patientId: result.patientId,
        targets: result.targets,
        summary: result.summary,
        overallConfidence: result.overallConfidence,
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    log.error('Assessment failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      buildErrorResponse(
        error instanceof Error ? error.message : 'Engine assessment failed',
      ),
      { status: 500 },
    );
  }
}
