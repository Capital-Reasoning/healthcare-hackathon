import { NextResponse } from 'next/server';
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';
import { getMedications } from '@/lib/db/queries/medications';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const sort = parseSortParams(searchParams);
    const filters = {
      patientId: searchParams.get('patientId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    };

    const { data, total } = await getMedications({
      ...pagination,
      sort,
      filters,
    });
    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/medications error:', error);
    return NextResponse.json(
      buildErrorResponse('Failed to fetch medications'),
      { status: 500 },
    );
  }
}
