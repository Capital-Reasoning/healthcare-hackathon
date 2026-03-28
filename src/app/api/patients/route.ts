import { NextResponse } from 'next/server';
import {
  parsePaginationParams,
  parseSortParams,
  buildPaginatedResponse,
  buildErrorResponse,
} from '@/lib/db/queries/helpers';
import { getPatients } from '@/lib/db/queries/patients';
import { db } from '@/lib/db/client';
import { patients } from '@/lib/db/schema';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const sort = parseSortParams(searchParams);
    const filters = {
      search: searchParams.get('search') ?? undefined,
      riskLevel: searchParams.get('riskLevel') ?? undefined,
      gender: searchParams.get('gender') ?? undefined,
      condition: searchParams.get('condition') ?? undefined,
    };

    const { data, total } = await getPatients({ ...pagination, sort, filters });
    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/patients error:', error);
    return NextResponse.json(buildErrorResponse('Failed to fetch patients'), {
      status: 500,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const [created] = await db
      .insert(patients)
      .values({
        mrn: body.mrn,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        email: body.email,
        phone: body.phone,
        address: body.address,
        riskLevel: body.riskLevel,
        primaryCondition: body.primaryCondition,
        metadata: body.metadata,
      })
      .returning();

    return NextResponse.json(
      { data: created, meta: null, error: null },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/patients error:', error);
    return NextResponse.json(buildErrorResponse('Failed to create patient'), {
      status: 500,
    });
  }
}
