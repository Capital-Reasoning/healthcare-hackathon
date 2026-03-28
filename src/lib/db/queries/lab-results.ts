import { eq, and, asc, desc, count, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { labResults } from '@/lib/db/schema';

function getSortColumn(field: string) {
  switch (field) {
    case 'collectedDate': return labResults.collectedDate;
    case 'testName': return labResults.testName;
    case 'testCode': return labResults.testCode;
    case 'createdAt': return labResults.createdAt;
    default: return null;
  }
}

interface GetLabResultsParams {
  page: number;
  pageSize: number;
  sort?: { field: string; direction: 'asc' | 'desc' } | null;
  filters?: {
    patientId?: string;
    encounterId?: string;
    testCode?: string;
  };
}

export async function getLabResults(params: GetLabResultsParams) {
  const { page, pageSize, sort, filters } = params;
  const conditions: SQL[] = [];

  if (filters?.patientId) {
    conditions.push(eq(labResults.patientId, filters.patientId));
  }

  if (filters?.encounterId) {
    conditions.push(eq(labResults.encounterId, filters.encounterId));
  }

  if (filters?.testCode) {
    conditions.push(eq(labResults.testCode, filters.testCode));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn = sort?.field ? getSortColumn(sort.field) : null;
  const orderBy = sortColumn
    ? sort?.direction === 'desc'
      ? desc(sortColumn)
      : asc(sortColumn)
    : desc(labResults.collectedDate);

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(labResults).where(whereClause),
    db
      .select()
      .from(labResults)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

/** Get the most recent result per unique testCode for a patient */
export async function getLatestLabResults(patientId: string) {
  const results = await db.execute(sql`
    SELECT DISTINCT ON (test_code)
      id, lab_id, patient_id, encounter_id,
      test_name, test_code, value, unit,
      reference_range_low, reference_range_high,
      abnormal_flag, collected_date, created_at
    FROM lab_results
    WHERE patient_id = ${patientId}
    ORDER BY test_code, collected_date DESC NULLS LAST
  `);

  return results as unknown as Array<{
    id: string;
    lab_id: string;
    patient_id: string;
    encounter_id: string | null;
    test_name: string | null;
    test_code: string | null;
    value: string | null;
    unit: string | null;
    reference_range_low: string | null;
    reference_range_high: string | null;
    abnormal_flag: string | null;
    collected_date: string | null;
    created_at: string | null;
  }>;
}
