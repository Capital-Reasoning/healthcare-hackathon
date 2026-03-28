import { NextResponse } from 'next/server';
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';
import { getLabResults } from '@/lib/db/queries/lab-results';

/**
 * Legacy /api/observations endpoint — now serves lab results.
 * Vitals are available via /api/vitals (if needed).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const sort = parseSortParams(searchParams);
    const filters = {
      patientId: searchParams.get('patientId') ?? undefined,
      encounterId: searchParams.get('encounterId') ?? undefined,
      testCode: searchParams.get('code') ?? searchParams.get('testCode') ?? undefined,
    };

    const { data, total } = await getLabResults({
      ...pagination,
      sort,
      filters,
    });
    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/observations error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to fetch lab results'),
      { status: 500 },
    );
  }
}
