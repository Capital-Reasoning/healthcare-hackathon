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
      sex: searchParams.get('sex') ?? undefined,
      ageMin: searchParams.get('ageMin') ? parseInt(searchParams.get('ageMin')!, 10) : undefined,
      ageMax: searchParams.get('ageMax') ? parseInt(searchParams.get('ageMax')!, 10) : undefined,
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
        patientId: body.patientId,
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ?? undefined,
        age: body.age ?? undefined,
        sex: body.sex ?? undefined,
        postalCode: body.postalCode ?? undefined,
        bloodType: body.bloodType ?? undefined,
        insuranceNumber: body.insuranceNumber ?? undefined,
        primaryLanguage: body.primaryLanguage ?? undefined,
        emergencyContactPhone: body.emergencyContactPhone ?? undefined,
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
