import { eq, and, asc, desc, count } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { encounters } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'encounterDate': return encounters.encounterDate;
    case 'encounterType': return encounters.encounterType;
    case 'disposition': return encounters.disposition;
    case 'facility': return encounters.facility;
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
    disposition?: string;
    encounterType?: string;
  };
}

export async function getEncounters(params: GetEncountersParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.patientId) {
    conditions.push(eq(encounters.patientId, filters.patientId));
  }

  if (filters?.disposition) {
    conditions.push(eq(encounters.disposition, filters.disposition));
  }

  if (filters?.encounterType) {
    conditions.push(eq(encounters.encounterType, filters.encounterType));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(encounters.encounterDate);

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(encounters).where(whereClause),
    db
      .select({
        id: encounters.id,
        encounterId: encounters.encounterId,
        patientId: encounters.patientId,
        encounterDate: encounters.encounterDate,
        encounterType: encounters.encounterType,
        facility: encounters.facility,
        chiefComplaint: encounters.chiefComplaint,
        diagnosisCode: encounters.diagnosisCode,
        diagnosisDescription: encounters.diagnosisDescription,
        triageLevel: encounters.triageLevel,
        disposition: encounters.disposition,
        lengthOfStayHours: encounters.lengthOfStayHours,
        attendingPhysician: encounters.attendingPhysician,
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
    },
  });

  return encounter ?? null;
}
