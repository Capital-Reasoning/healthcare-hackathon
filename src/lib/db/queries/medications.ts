import { eq, and, asc, desc, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { medications } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'name': return medications.name;
    case 'status': return medications.status;
    case 'startDate': return medications.startDate;
    case 'createdAt': return medications.createdAt;
    default: return null;
  }
}

interface GetMedicationsParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    patientId?: string;
    status?: string;
  };
}

export async function getMedications(params: GetMedicationsParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.patientId) {
    conditions.push(eq(medications.patientId, filters.patientId));
  }

  if (filters?.status) {
    conditions.push(
      eq(medications.status, filters.status as 'active' | 'discontinued' | 'pending'),
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(medications.createdAt);

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(medications).where(whereClause),
    db
      .select()
      .from(medications)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

export async function getActiveMedications(patientId: string) {
  return db
    .select()
    .from(medications)
    .where(
      and(
        eq(medications.patientId, patientId),
        eq(medications.status, 'active'),
      ),
    )
    .orderBy(desc(medications.createdAt));
}
