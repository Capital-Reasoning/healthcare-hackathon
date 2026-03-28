import { NextResponse } from 'next/server';
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';
import { getObservations } from '@/lib/db/queries/observations';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const sort = parseSortParams(searchParams);
    const filters = {
      patientId: searchParams.get('patientId') ?? undefined,
      encounterId: searchParams.get('encounterId') ?? undefined,
      code: searchParams.get('code') ?? undefined,
    };

    const { data, total } = await getObservations({
      ...pagination,
      sort,
      filters,
    });
    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/observations error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to fetch observations'),
      { status: 500 },
    );
  }
}
