import { Activity } from 'lucide-react';
import { getTriageQueueWithPatients } from '@/lib/db/queries/engine-results';
import {
  getLatestRunIds,
  getCategorySplit,
  getDueHorizonStats,
  getTriageByAge,
} from '@/lib/db/queries/analytics';
import { TriageDashboard } from '@/components/healthcare/triage-dashboard';
import { DashboardVizSummary } from '@/components/healthcare/dashboard-viz-summary';
import { DashboardIntro } from '@/components/healthcare/dashboard-intro';

export default async function DashboardPage() {
  // Fetch triage data + analytics in parallel
  // Run IDs are fetched once and shared across all engine-based queries
  let items: Awaited<ReturnType<typeof getTriageQueueWithPatients>> = [];
  let categorySplit: Awaited<ReturnType<typeof getCategorySplit>> = [];
  let dueHorizon: Awaited<ReturnType<typeof getDueHorizonStats>> = [];
  let triageByAge: Awaited<ReturnType<typeof getTriageByAge>> = [];

  try {
    const [triageItems, runIds] = await Promise.all([
      getTriageQueueWithPatients(),
      getLatestRunIds(),
    ]);
    items = triageItems;

    [categorySplit, dueHorizon, triageByAge] = await Promise.all([
      getCategorySplit(runIds),
      getDueHorizonStats(runIds),
      getTriageByAge(runIds),
    ]);
  } catch {
    // Database may not be seeded yet — show empty state
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
    <DashboardIntro>
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

        {/* Data visualization summary */}
        <DashboardVizSummary
          categorySplit={categorySplit}
          dueHorizon={dueHorizon}
          triageByAge={triageByAge}
        />

        {/* Triage dashboard (client component with animation) */}
        <TriageDashboard items={items} stats={stats} />
      </div>
    </DashboardIntro>
  );
}
