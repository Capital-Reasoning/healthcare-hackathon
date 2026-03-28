import { eq, or, ilike, and, asc, desc, count, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { patients, encounters, medications, labResults, vitals } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'lastName': return patients.lastName;
    case 'firstName': return patients.firstName;
    case 'dateOfBirth': return patients.dateOfBirth;
    case 'age': return patients.age;
    case 'sex': return patients.sex;
    case 'createdAt': return patients.createdAt;
    default: return null;
  }
}

interface GetPatientsParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    search?: string;
    sex?: string;
    ageMin?: number;
    ageMax?: number;
  };
}

export async function getPatients(params: GetPatientsParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.search) {
    const term = `%${filters.search}%`;
    conditions.push(
      or(
        ilike(patients.firstName, term),
        ilike(patients.lastName, term),
        ilike(patients.patientId, term),
      )!,
    );
  }

  if (filters?.sex) {
    conditions.push(eq(patients.sex, filters.sex));
  }

  if (filters?.ageMin !== undefined) {
    conditions.push(gte(patients.age, filters.ageMin));
  }

  if (filters?.ageMax !== undefined) {
    conditions.push(lte(patients.age, filters.ageMax));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort
  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(patients.createdAt);

  const [countResult, data] = await Promise.all([
    db
      .select({ total: count() })
      .from(patients)
      .where(whereClause),
    db
      .select({
        id: patients.id,
        patientId: patients.patientId,
        firstName: patients.firstName,
        lastName: patients.lastName,
        dateOfBirth: patients.dateOfBirth,
        age: patients.age,
        sex: patients.sex,
        postalCode: patients.postalCode,
        bloodType: patients.bloodType,
        insuranceNumber: patients.insuranceNumber,
        primaryLanguage: patients.primaryLanguage,
        emergencyContactPhone: patients.emergencyContactPhone,
        createdAt: patients.createdAt,
        updatedAt: patients.updatedAt,
      })
      .from(patients)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

export async function getPatientById(patientId: string) {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.patientId, patientId),
    with: {
      encounters: {
        orderBy: [desc(encounters.encounterDate)],
        limit: 10,
      },
      medications: {
        where: eq(medications.active, true),
        orderBy: [desc(medications.createdAt)],
      },
      labResults: {
        orderBy: [desc(labResults.collectedDate)],
        limit: 20,
      },
      vitals: {
        orderBy: [desc(vitals.recordedAt)],
        limit: 5,
      },
    },
  });

  return patient ?? null;
}

export async function searchPatients(query: string, limit: number = 20) {
  const term = `%${query}%`;
  const data = await db
    .select()
    .from(patients)
    .where(
      or(
        ilike(patients.firstName, term),
        ilike(patients.lastName, term),
        ilike(patients.patientId, term),
      ),
    )
    .limit(limit);

  return data;
}

export async function getPatientStats() {
  const [totalResult, sexResult] = await Promise.all([
    db.select({ total: count() }).from(patients),
    db
      .select({ sex: patients.sex, count: count() })
      .from(patients)
      .groupBy(patients.sex),
  ]);

  const total = totalResult[0]?.total ?? 0;

  const bySex: Record<string, number> = {};
  for (const row of sexResult) {
    if (row.sex) bySex[row.sex] = row.count;
  }

  return { total, bySex };
}
