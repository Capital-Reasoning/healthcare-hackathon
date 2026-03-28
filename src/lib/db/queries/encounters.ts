import { eq, and, asc, desc, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { encounters, observations } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'startDate': return encounters.startDate;
    case 'endDate': return encounters.endDate;
    case 'status': return encounters.status;
    case 'type': return encounters.type;
    case 'createdAt': return encounters.createdAt;
    default: return null;
  }
}

interface GetEncountersParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    patientId?: string;
    status?: string;
    type?: string;
  };
}

export async function getEncounters(params: GetEncountersParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.patientId) {
    conditions.push(eq(encounters.patientId, filters.patientId));
  }

  if (filters?.status) {
    conditions.push(
      eq(encounters.status, filters.status as 'planned' | 'in_progress' | 'completed' | 'cancelled'),
    );
  }

  if (filters?.type) {
    conditions.push(eq(encounters.type, filters.type));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(encounters.startDate);

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(encounters).where(whereClause),
    db
      .select({
        id: encounters.id,
        patientId: encounters.patientId,
        providerId: encounters.providerId,
        organizationId: encounters.organizationId,
        type: encounters.type,
        status: encounters.status,
        startDate: encounters.startDate,
        endDate: encounters.endDate,
        reasonCode: encounters.reasonCode,
        reasonDisplay: encounters.reasonDisplay,
        notes: encounters.notes,
        createdAt: encounters.createdAt,
      })
      .from(encounters)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

export async function getEncounterById(id: string) {
  const encounter = await db.query.encounters.findFirst({
    where: eq(encounters.id, id),
    with: {
      patient: true,
      provider: true,
      organization: true,
      observations: {
        orderBy: [desc(observations.effectiveDate)],
      },
    },
  });

  return encounter ?? null;
}
