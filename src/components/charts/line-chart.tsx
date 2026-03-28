'use client';

import {
  LineChart as RLineChart,
  AreaChart as RAreaChart,
  Line,
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

interface LineChartProps {
  data: Record<string, unknown>[];
  /** Key for the X axis */
  xKey: string;
  /** Keys for the line series */
  yKeys: string[];
  /** Use smooth curves (monotone). Default: true */
  curved?: boolean;
  /** Fill area under the lines */
  area?: boolean;
  /** Custom colors for each series */
  colors?: string[];
  /** Chart height in pixels */
  height?: number;
  /** Show dots on data points (only on hover by default) */
  showDots?: boolean;
  /** Show legend */
  showLegend?: boolean;
  /** Show grid lines */
  showGrid?: boolean;
  className?: string;
}

function LineChart({
  data,
  xKey,
  yKeys,
  curved = true,
  area,
  colors,
  height = 300,
  showDots = false,
  showLegend = yKeys.length > 1,
  showGrid = true,
  className,
}: LineChartProps) {
  const curveType = curved ? 'monotone' : 'linear';

  const sharedChildren = (
    <>
      {showGrid && <CartesianGrid {...chartGridStyle} />}
      <XAxis dataKey={xKey} {...chartAxisStyle} />
      <YAxis {...chartAxisStyle} />
      <Tooltip contentStyle={chartTooltipStyle} />
      {showLegend && <Legend content={ChartLegend} />}
    </>
  );

  if (area) {
    return (
      <ChartContainer height={height} className={cn('w-full', className)}>
        <RAreaChart data={data} margin={CHART_MARGINS}>
          <defs>
            {yKeys.map((key, i) => (
              <linearGradient key={key} id={`line-area-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors?.[i] ?? getColor(i)} stopOpacity={0.3} />
                <stop offset="100%" stopColor={colors?.[i] ?? getColor(i)} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {sharedChildren}
          {yKeys.map((key, i) => (
            <Area
              key={key}
              type={curveType}
              dataKey={key}
              fill={`url(#line-area-${key})`}
              stroke={colors?.[i] ?? getColor(i)}
              strokeWidth={2}
              dot={showDots}
              activeDot={{ r: 5 }}
              animationDuration={CHART_ANIMATION.duration}
            />
          ))}
        </RAreaChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer height={height} className={cn('w-full', className)}>
      <RLineChart data={data} margin={CHART_MARGINS}>
        {sharedChildren}
        {yKeys.map((key, i) => (
          <Line
            key={key}
            type={curveType}
            dataKey={key}
            stroke={colors?.[i] ?? getColor(i)}
            strokeWidth={2}
            dot={showDots}
            activeDot={{ r: 5 }}
            animationDuration={CHART_ANIMATION.duration}
          />
        ))}
      </RLineChart>
    </ChartContainer>
  );
}

export { LineChart, type LineChartProps };
