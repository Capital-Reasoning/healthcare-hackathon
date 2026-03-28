import { Users } from 'lucide-react';
import { getPatients } from '@/lib/db/queries/patients';
import { PatientListTable } from './patient-list-table';

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === 'string' ? params.search : '';
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const pageSize = 25;

  let data: Awaited<ReturnType<typeof getPatients>>['data'] = [];
  let total = 0;

  try {
    const result = await getPatients({
      page,
      pageSize,
      filters: search ? { search } : undefined,
      sort: { field: 'lastName', direction: 'asc' },
    });
    data = result.data;
    total = result.total;
  } catch {
    // Database may not be available — show empty state
  }

  return (
    <div className="space-y-6 p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-primary" />
          <h1 className="text-h1 text-foreground">Patient Panel</h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Browse and search your patient panel. Click a patient to view their
          record and assessment results.
        </p>
      </header>

      <PatientListTable
        patients={data}
        total={total}
        page={page}
        pageSize={pageSize}
        search={search}
      />
    </div>
  );
}
