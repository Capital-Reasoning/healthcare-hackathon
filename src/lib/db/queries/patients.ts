import { eq, or, ilike, and, asc, desc, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { patients, encounters, medications, observations } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'lastName': return patients.lastName;
    case 'firstName': return patients.firstName;
    case 'dateOfBirth': return patients.dateOfBirth;
    case 'riskLevel': return patients.riskLevel;
    case 'createdAt': return patients.createdAt;
    case 'primaryCondition': return patients.primaryCondition;
    default: return null;
  }
}

interface GetPatientsParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    search?: string;
    riskLevel?: string;
    gender?: string;
    condition?: string;
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
        ilike(patients.mrn, term),
        ilike(patients.primaryCondition, term),
      )!,
    );
  }

  if (filters?.riskLevel) {
    conditions.push(
      eq(patients.riskLevel, filters.riskLevel as 'low' | 'medium' | 'high' | 'critical'),
    );
  }

  if (filters?.gender) {
    conditions.push(
      eq(patients.gender, filters.gender as 'male' | 'female' | 'other' | 'unknown'),
    );
  }

  if (filters?.condition) {
    conditions.push(ilike(patients.primaryCondition, `%${filters.condition}%`));
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
        mrn: patients.mrn,
        firstName: patients.firstName,
        lastName: patients.lastName,
        dateOfBirth: patients.dateOfBirth,
        gender: patients.gender,
        riskLevel: patients.riskLevel,
        primaryCondition: patients.primaryCondition,
        email: patients.email,
        phone: patients.phone,
        address: patients.address,
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

export async function getPatientById(id: string) {
  const patient = await db.query.patients.findFirst({
    where: eq(patients.id, id),
    with: {
      encounters: {
        orderBy: [desc(encounters.startDate)],
        limit: 10,
        with: {
          provider: true,
        },
      },
      medications: {
        where: eq(medications.status, 'active'),
        orderBy: [desc(medications.createdAt)],
      },
      observations: {
        orderBy: [desc(observations.effectiveDate)],
        limit: 20,
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
        ilike(patients.mrn, term),
        ilike(patients.primaryCondition, term),
      ),
    )
    .limit(limit);

  return data;
}

export async function getPatientStats() {
  const [totalResult, riskResult, genderResult] = await Promise.all([
    db.select({ total: count() }).from(patients),
    db
      .select({ level: patients.riskLevel, count: count() })
      .from(patients)
      .groupBy(patients.riskLevel),
    db
      .select({ gender: patients.gender, count: count() })
      .from(patients)
      .groupBy(patients.gender),
  ]);

  const total = totalResult[0]?.total ?? 0;

  const byRiskLevel: Record<string, number> = {};
  for (const row of riskResult) {
    if (row.level) byRiskLevel[row.level] = row.count;
  }

  const byGender: Record<string, number> = {};
  for (const row of genderResult) {
    if (row.gender) byGender[row.gender] = row.count;
  }

  return { total, byRiskLevel, byGender };
}
