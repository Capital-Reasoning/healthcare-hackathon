import { NextResponse } from 'next/server';
import { buildErrorResponse } from '@/lib/db/queries/helpers';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, modelTier } = body as {
      patientId: string;
      modelTier?: 'production' | 'testing' | 'free';
    };

    if (!patientId) {
      return NextResponse.json(
        buildErrorResponse('patientId is required'),
        { status: 400 },
      );
    }

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
    console.error('POST /api/engine/assess error:', error);
    return NextResponse.json(
      buildErrorResponse(
        error instanceof Error ? error.message : 'Engine assessment failed',
      ),
      { status: 500 },
    );
  }
}
