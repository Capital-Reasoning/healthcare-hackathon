'use client';

import {
  AreaChart as RAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartLegend,
  CHART_MARGINS,
  CHART_ANIMATION,
  chartTooltipStyle,
  chartAxisStyle,
  chartGridStyle,
  getColor,
} from './chart-config';

interface AreaChartProps {
  data: Record<string, unknown>[];
  /** Key for the X axis */
  xKey: string;
  /** Keys for the area series */
  yKeys: string[];
  /** Stack areas on top of each other */
  stacked?: boolean;
  /** Use smooth curves. Default: true */
  curved?: boolean;
  /** Custom colors for each series */
  colors?: string[];
  /** Chart height in pixels */
  height?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  className?: string;
}

function AreaChart({
  data,
  xKey,
  yKeys,
  stacked,
  curved = true,
  colors,
  height = 300,
  showLegend = yKeys.length > 1,
  showGrid = true,
  className,
}: AreaChartProps) {
  const curveType = curved ? 'monotone' : 'linear';

  return (
    <ChartContainer height={height} className={cn('w-full', className)}>
      <RAreaChart data={data} margin={CHART_MARGINS}>
        <defs>
          {yKeys.map((key, i) => (
            <linearGradient key={key} id={`area-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors?.[i] ?? getColor(i)} stopOpacity={0.4} />
              <stop offset="100%" stopColor={colors?.[i] ?? getColor(i)} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>
        {showGrid && <CartesianGrid {...chartGridStyle} />}
        <XAxis dataKey={xKey} {...chartAxisStyle} />
        <YAxis {...chartAxisStyle} />
        <Tooltip contentStyle={chartTooltipStyle} />
        {showLegend && <Legend content={ChartLegend} />}
        {yKeys.map((key, i) => (
          <Area
            key={key}
            type={curveType}
            dataKey={key}
            stroke={colors?.[i] ?? getColor(i)}
            strokeWidth={2}
            fill={`url(#area-fill-${key})`}
            stackId={stacked ? 'stack' : undefined}
            animationDuration={CHART_ANIMATION.duration}
          />
        ))}
      </RAreaChart>
    </ChartContainer>
  );
}

export { AreaChart, type AreaChartProps };
