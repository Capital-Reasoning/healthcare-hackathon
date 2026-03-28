import { NextResponse } from 'next/server';
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';
import { getEncounters } from '@/lib/db/queries/encounters';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const sort = parseSortParams(searchParams);
    const filters = {
      patientId: searchParams.get('patientId') ?? undefined,
      disposition: searchParams.get('disposition') ?? searchParams.get('status') ?? undefined,
      encounterType: searchParams.get('encounterType') ?? searchParams.get('type') ?? undefined,
    };

    const { data, total } = await getEncounters({
      ...pagination,
      sort,
      filters,
    });
    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/encounters error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to fetch encounters'),
      { status: 500 },
    );
  }
}
