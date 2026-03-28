import { Activity } from 'lucide-react';
import { getTriageQueueWithPatients } from '@/lib/db/queries/engine-results';
import { TriageDashboard } from '@/components/healthcare/triage-dashboard';

export default async function DashboardPage() {
  // Fetch triage data server-side
  let items: Awaited<ReturnType<typeof getTriageQueueWithPatients>> = [];
  try {
    items = await getTriageQueueWithPatients();
  } catch {
    // Database may not be seeded yet — show empty state
    items = [];
  }

  // Compute stats
  const patientIds = new Set(items.map((i) => i.patientId));
  const red = items.filter((i) => i.category === 'red');
  const yellow = items.filter((i) => i.category === 'yellow');
  const green = items.filter((i) => i.category === 'green');

  const stats = {
    assessed: patientIds.size,
    needAction: red.length + yellow.length,
    onTrack: green.length,
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* Page header */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Activity className="size-5 text-primary" />
          <h1 className="text-h1 text-foreground">Clinical Triage</h1>
        </div>
        <p className="text-body-sm text-muted-foreground">
          Prioritized care actions identified from guideline analysis
        </p>
      </header>

      {/* Triage dashboard (client component with animation) */}
      <TriageDashboard items={items} stats={stats} />
    </div>
  );
}
