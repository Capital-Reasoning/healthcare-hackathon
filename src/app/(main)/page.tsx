import Image from 'next/image';
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
  let items: Awaited<ReturnType<typeof getTriageQueueWithPatients>> = [];
  let categorySplit: Awaited<ReturnType<typeof getCategorySplit>> = [];
  let dueHorizon: Awaited<ReturnType<typeof getDueHorizonStats>> = [];
  let triageByAge: Awaited<ReturnType<typeof getTriageByAge>> = [];

  try {
    const [triageItems, bestPerPatient] = await Promise.all([
      getCachedTriageQueue(),
      getCachedBestTargets(),
    ]);
    items = triageItems;

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
      <div className="mx-auto max-w-7xl flex flex-col gap-6 p-6 pt-8">
        {/* Page header with logo */}
        <header>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-h1 text-foreground">Care Review</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Prioritized actions from clinical guideline analysis
              </p>
              {/* Compact inline stats */}
              <div className="flex items-center gap-3 mt-3 text-sm">
                <span><span className="font-semibold text-foreground">{stats.assessed}</span> <span className="text-muted-foreground">patients assessed</span></span>
                <span className="text-muted-foreground">&middot;</span>
                <span><span className="font-semibold text-error">{stats.needAction}</span> <span className="text-muted-foreground">need action</span></span>
                <span className="text-muted-foreground">&middot;</span>
                <span><span className="font-semibold text-success">{stats.onTrack}</span> <span className="text-muted-foreground">on track</span></span>
              </div>
            </div>
            <Image
              src="/logo-new.png"
              alt="BestPath"
              width={400}
              height={300}
              className="h-20 w-auto"
              priority
            />
          </div>
        </header>

        {/* Data visualization summary */}
        <DashboardVizSummary
          categorySplit={categorySplit}
          dueHorizon={dueHorizon}
          triageByAge={triageByAge}
        />

        {/* Triage dashboard — tabbed view */}
        <TriageDashboard items={items} />
      </div>
    </DashboardIntro>
  );
}
