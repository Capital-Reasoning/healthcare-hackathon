'use client';

import { DonutChart } from '@/components/charts/donut-chart';
import { BarChart } from '@/components/charts/bar-chart';
import { Grid } from '@/components/layout/grid';
import {
  LayoutCard,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/layout/card';

interface DashboardVizSummaryProps {
  categorySplit: { name: string; value: number; color?: string }[];
  dueHorizon: { name: string; value: number; color?: string }[];
  triageByAge: Record<string, unknown>[];
}

export function DashboardVizSummary({
  categorySplit,
  dueHorizon,
  triageByAge,
}: DashboardVizSummaryProps) {
  const hasData =
    categorySplit.length > 0 ||
    dueHorizon.length > 0 ||
    triageByAge.length > 0;

  if (!hasData) return null;

  const totalPatients = categorySplit.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col gap-3 pb-4">
      <Grid cols={3} gap="sm">
        {/* Triage Distribution */}
        <LayoutCard>
          <CardHeader className="pb-0">
            <CardTitle className="text-body-sm font-medium text-muted-foreground">
              Triage Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={categorySplit}
              height={200}
              innerRadius={0.65}
              label={
                <span className="text-h2 font-bold">{totalPatients}</span>
              }
              showLegend
            />
          </CardContent>
        </LayoutCard>

        {/* Due Horizon */}
        <LayoutCard>
          <CardHeader className="pb-0">
            <CardTitle className="text-body-sm font-medium text-muted-foreground">
              Due Horizon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={dueHorizon}
              height={200}
              innerRadius={0.65}
              label={
                <span className="text-h2 font-bold">{totalPatients}</span>
              }
              showLegend
            />
          </CardContent>
        </LayoutCard>

        {/* Triage by Age */}
        <LayoutCard>
          <CardHeader className="pb-0">
            <CardTitle className="text-body-sm font-medium text-muted-foreground">
              Triage by Age Group
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={triageByAge}
              xKey="age"
              yKeys={['Urgent', 'Follow-up', 'On Track']}
              stacked
              colors={['#E8A0A0', '#E8D5A0', '#A0D8C0']}
              height={200}
              showLegend
            />
          </CardContent>
        </LayoutCard>
      </Grid>
    </div>
  );
}
