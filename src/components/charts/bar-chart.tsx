'use client';

import {
  BarChart as RBarChart,
  Bar,
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

interface BarChartProps {
  data: Record<string, unknown>[];
  /** Key for the X axis (category) */
  xKey: string;
  /** Keys for the Y axis values (supports multi-series) */
  yKeys: string[];
  /** Bar orientation */
  layout?: 'vertical' | 'horizontal';
  /** Stack bars on top of each other */
  stacked?: boolean;
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

function BarChart({
  data,
  xKey,
  yKeys,
  layout = 'horizontal',
  stacked,
  colors,
  height = 300,
  showLegend = yKeys.length > 1,
  showGrid = true,
  className,
}: BarChartProps) {
  const isVertical = layout === 'vertical';

  // Auto-rotate labels when many categories or long labels
  const shouldRotate =
    !isVertical &&
    (data.length > 4 ||
      data.some((d) => String(d[xKey] ?? '').length > 8));
  const rotatedMargin = shouldRotate
    ? { ...CHART_MARGINS, bottom: 50 }
    : CHART_MARGINS;

  return (
    <ChartContainer height={height} className={cn('w-full', className)}>
      <RBarChart
        data={data}
        layout={isVertical ? 'vertical' : 'horizontal'}
        margin={rotatedMargin}
      >
        {showGrid && <CartesianGrid {...chartGridStyle} />}
        {isVertical ? (
          <>
            <XAxis type="number" {...chartAxisStyle} />
            <YAxis dataKey={xKey} type="category" {...chartAxisStyle} width={80} />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              {...chartAxisStyle}
              angle={shouldRotate ? -45 : 0}
              textAnchor={shouldRotate ? 'end' : 'middle'}
              height={shouldRotate ? 60 : undefined}
              interval={0}
            />
            <YAxis {...chartAxisStyle} />
          </>
        )}
        <Tooltip contentStyle={chartTooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
        {showLegend && <Legend content={ChartLegend} />}
        {yKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            fill={colors?.[i] ?? getColor(i)}
            stackId={stacked ? 'stack' : undefined}
            radius={stacked ? undefined : isVertical ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            animationDuration={CHART_ANIMATION.duration}
          />
        ))}
      </RBarChart>
    </ChartContainer>
  );
}

export { BarChart, type BarChartProps };
