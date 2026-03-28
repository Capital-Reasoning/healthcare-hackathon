import { eq, and, asc, desc, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { vitals } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'recordedAt': return vitals.recordedAt;
    case 'createdAt': return vitals.createdAt;
    default: return null;
  }
}

interface GetVitalsParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    patientId?: string;
    encounterId?: string;
  };
}

export async function getVitals(params: GetVitalsParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.patientId) {
    conditions.push(eq(vitals.patientId, filters.patientId));
  }

  if (filters?.encounterId) {
    conditions.push(eq(vitals.encounterId, filters.encounterId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(vitals.recordedAt);

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(vitals).where(whereClause),
    db
      .select()
      .from(vitals)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

/** Get the most recent vitals record for a patient */
export async function getLatestVitals(patientId: string) {
  const result = await db
    .select()
    .from(vitals)
    .where(eq(vitals.patientId, patientId))
    .orderBy(desc(vitals.recordedAt))
    .limit(1);

  return result[0] ?? null;
}
