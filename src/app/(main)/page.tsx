import { Activity } from 'lucide-react';
import { unstable_cache } from 'next/cache';
import { getTriageQueueWithPatients } from '@/lib/db/queries/engine-results';
import {
  getBestTargetPerPatient,
  getCategorySplit,
  getDueHorizonStats,
  getTriageByAge,
} from '@/lib/db/queries/analytics';
import { TriageDashboard } from '@/components/healthcare/triage-dashboard';
import { DashboardVizSummary } from '@/components/healthcare/dashboard-viz-summary';
import { DashboardIntro } from '@/components/healthcare/dashboard-intro';

// Cache dashboard data for 60s — data doesn't change during demo
const getCachedTriageQueue = unstable_cache(
  getTriageQueueWithPatients,
  ['triage-queue'],
  { revalidate: 60 },
);
const getCachedBestTargets = unstable_cache(
  getBestTargetPerPatient,
  ['best-targets'],
  { revalidate: 60 },
);

export default async function DashboardPage() {
  // Fetch triage data + analytics in parallel
  // Run IDs are fetched once and shared across all engine-based queries
  let items: Awaited<ReturnType<typeof getTriageQueueWithPatients>> = [];
  let categorySplit: Awaited<ReturnType<typeof getCategorySplit>> = [];
  let dueHorizon: Awaited<ReturnType<typeof getDueHorizonStats>> = [];
  let triageByAge: Awaited<ReturnType<typeof getTriageByAge>> = [];

  try {
    // Fetch triage items + best-target-per-patient in parallel (2 queries, cached 60s)
    const [triageItems, bestPerPatient] = await Promise.all([
      getCachedTriageQueue(),
      getCachedBestTargets(),
    ]);
    items = triageItems;

    // Derive all three chart datasets from the single bestPerPatient result
    [categorySplit, dueHorizon, triageByAge] = await Promise.all([
      getCategorySplit(undefined, bestPerPatient),
      getDueHorizonStats(undefined, bestPerPatient),
      getTriageByAge(undefined, bestPerPatient),
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
