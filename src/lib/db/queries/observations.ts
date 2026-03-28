import { eq, and, asc, desc, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { observations } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'effectiveDate': return observations.effectiveDate;
    case 'code': return observations.code;
    case 'display': return observations.display;
    case 'createdAt': return observations.createdAt;
    default: return null;
  }
}

interface GetObservationsParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    patientId?: string;
    encounterId?: string;
    code?: string;
  };
}

export async function getObservations(params: GetObservationsParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.patientId) {
    conditions.push(eq(observations.patientId, filters.patientId));
  }

  if (filters?.encounterId) {
    conditions.push(eq(observations.encounterId, filters.encounterId));
  }

  if (filters?.code) {
    conditions.push(eq(observations.code, filters.code));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(observations.effectiveDate);

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(observations).where(whereClause),
    db
      .select()
      .from(observations)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

export async function getVitalSigns(patientId: string) {
  // Get the latest observation for each vital sign type
  const vitalCodes = [
    '85354-9', // Blood pressure
    '8867-4', // Heart rate
    '8310-5', // Body temperature
    '2708-6', // O2 saturation
    '29463-7', // Body weight
  ];

  const vitals = await Promise.all(
    vitalCodes.map((code) =>
      db
        .select()
        .from(observations)
        .where(
          and(
            eq(observations.patientId, patientId),
            eq(observations.code, code),
          ),
        )
        .orderBy(desc(observations.effectiveDate))
        .limit(1)
        .then((rows) => rows[0] ?? null),
    ),
  );

  return vitals.filter(Boolean);
}
