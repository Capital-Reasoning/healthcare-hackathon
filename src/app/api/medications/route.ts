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

    // Support both ?active=true and legacy ?status=active
    const activeParam = searchParams.get('active');
    const statusParam = searchParams.get('status');
    let active: boolean | undefined;
    if (activeParam !== null) {
      active = activeParam === 'true';
    } else if (statusParam !== null) {
      active = statusParam === 'active' ? true : statusParam === 'discontinued' ? false : undefined;
    }

    const filters = {
      patientId: searchParams.get('patientId') ?? undefined,
      active,
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
