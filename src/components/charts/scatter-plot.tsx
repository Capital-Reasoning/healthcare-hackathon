'use client';

import * as React from 'react';
import {
  ScatterChart as RScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  CHART_MARGINS,
  CHART_ANIMATION,
  chartTooltipStyle,
  chartAxisStyle,
  chartGridStyle,
  getColor,
} from './chart-config';

interface ScatterPlotProps {
  data: Record<string, unknown>[];
  /** Key for the X axis */
  xKey: string;
  /** Key for the Y axis */
  yKey: string;
  /** Key for bubble sizing (optional) */
  sizeKey?: string;
  /** Key for colour grouping (optional) */
  colorKey?: string;
  /** Chart height in pixels */
  height?: number;
  /** Show grid lines */
  showGrid?: boolean;
  className?: string;
}

function ScatterPlot({
  data,
  xKey,
  yKey,
  sizeKey,
  colorKey,
  height = 300,
  showGrid = true,
  className,
}: ScatterPlotProps) {
  // Group data by colorKey if provided
  const groups = React.useMemo(() => {
    if (!colorKey) return [{ name: 'data', items: data }];
    const map = new Map<string, Record<string, unknown>[]>();
    for (const d of data) {
      const key = String(d[colorKey] ?? 'default');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    }
    return Array.from(map.entries()).map(([name, items]) => ({ name, items }));
  }, [data, colorKey]);

  return (
    <ChartContainer height={height} className={cn('w-full', className)}>
      <RScatterChart margin={CHART_MARGINS}>
        {showGrid && <CartesianGrid {...chartGridStyle} />}
        <XAxis dataKey={xKey} type="number" name={xKey} {...chartAxisStyle} />
        <YAxis dataKey={yKey} type="number" name={yKey} {...chartAxisStyle} />
        {sizeKey && <ZAxis dataKey={sizeKey} type="number" range={[40, 400]} />}
        <Tooltip contentStyle={chartTooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
        {groups.map((group, i) => (
          <Scatter
            key={group.name}
            name={group.name}
            data={group.items}
            fill={getColor(i)}
            animationDuration={CHART_ANIMATION.duration}
          />
        ))}
      </RScatterChart>
    </ChartContainer>
  );
}

export { ScatterPlot, type ScatterPlotProps };
