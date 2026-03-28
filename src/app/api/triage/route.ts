import { NextResponse } from 'next/server';
import { getTriageQueueWithPatients } from '@/lib/db/queries/engine-results';
import { buildErrorResponse } from '@/lib/db/queries/helpers';

export async function GET() {
  try {
    const items = await getTriageQueueWithPatients();

    const red = items.filter((i) => i.category === 'red');
    const yellow = items.filter((i) => i.category === 'yellow');
    const green = items.filter((i) => i.category === 'green');

    // Unique patients assessed
    const patientIds = new Set(items.map((i) => i.patientId));

    return NextResponse.json({
      data: {
        items,
        stats: {
          assessed: patientIds.size,
          needAction: red.length + yellow.length,
          onTrack: green.length,
        },
      },
      meta: null,
      error: null,
    });
  } catch (error) {
    console.error('GET /api/triage error:', error);
    return NextResponse.json(
      buildErrorResponse(
        error instanceof Error ? error.message : 'Failed to fetch triage data',
      ),
      { status: 500 },
    );
  }
}
