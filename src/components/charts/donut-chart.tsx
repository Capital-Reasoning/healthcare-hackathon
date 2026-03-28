'use client';

import * as React from 'react';
import { PieChart, Pie, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartLegend,
  chartTooltipStyle,
  chartTooltipItemStyle,
  getColor,
} from './chart-config';

interface DonutChartProps {
  data: { name: string; value: number; color?: string }[];
  /** Inner radius as percentage of outer (0–1). Default: 0.6 */
  innerRadius?: number;
  /** Content to display in the center of the donut */
  label?: React.ReactNode;
  /** Chart height in pixels */
  height?: number;
  /** Show legend */
  showLegend?: boolean;
  className?: string;
}

function DonutChart({
  data,
  innerRadius = 0.6,
  label,
  height = 300,
  showLegend = true,
  className,
}: DonutChartProps) {
  const normalizedIR = innerRadius > 1 ? Math.min(innerRadius / 100, 0.95) : innerRadius;
  // Chart area excludes legend; legend is rendered separately
  const chartHeight = showLegend ? height - 44 : height;
  const outerR = Math.min(Math.round(chartHeight * 0.4), 110);
  const innerR = Math.round(outerR * normalizedIR);

  // Filter out zero-value entries for the pie — they create invisible
  // segments but their paddingAngle still eats arc space, leaving gaps.
  const pieData = data.filter((d) => d.value > 0);

  return (
    <div data-slot="donut-chart" className={cn('w-full', className)}>
      {/* Chart + center label share the same container */}
      <div className="relative">
        <ChartContainer height={chartHeight}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={innerR}
              outerRadius={outerR}
              paddingAngle={2}
              isAnimationActive={false}
            >
              {pieData.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={entry.color ?? getColor(i)}
                  stroke="var(--card)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={chartTooltipStyle}
              itemStyle={chartTooltipItemStyle}
              wrapperStyle={{ zIndex: 50 }}
            />
          </PieChart>
        </ChartContainer>

        {/* Center label — same container as chart, so 50%/50% aligns perfectly */}
        {label && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Total
              </div>
              <div className="text-sm font-semibold leading-tight text-foreground">
                {label}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend rendered separately so it doesn't affect donut centering */}
      {showLegend && (
        <ChartLegend
          payload={data.map((entry, i) => ({
            value: entry.name,
            color: entry.color ?? getColor(i),
          }))}
        />
      )}
    </div>
  );
}

export { DonutChart, type DonutChartProps };
