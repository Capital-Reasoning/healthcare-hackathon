'use client';

import {
  RadarChart as RRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartLegend,
  CHART_ANIMATION,
  chartTooltipStyle,
  chartTooltipItemStyle,
  getColor,
} from './chart-config';

interface RadarChartProps {
  /** Data array — each item should have a key for each axis + value keys */
  data: Record<string, unknown>[];
  /** The key used for axis labels (e.g., 'subject', 'metric') */
  axisKey: string;
  /** Keys for the value series (supports multi-series overlay) */
  valueKeys: string[];
  /** Custom colors for each series */
  colors?: string[];
  /** Chart height in pixels */
  height?: number;
  /** Show legend */
  showLegend?: boolean;
  className?: string;
}

function RadarChart({
  data,
  axisKey,
  valueKeys,
  colors,
  height = 300,
  showLegend = valueKeys.length > 1,
  className,
}: RadarChartProps) {
  return (
    <ChartContainer height={height} className={cn('w-full', className)}>
      <RRadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey={axisKey} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <PolarRadiusAxis tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
        <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} />
        {showLegend && <Legend content={ChartLegend} />}
        {valueKeys.map((key, i) => (
          <Radar
            key={key}
            name={key}
            dataKey={key}
            stroke={colors?.[i] ?? getColor(i)}
            fill={colors?.[i] ?? getColor(i)}
            fillOpacity={0.2}
            animationDuration={CHART_ANIMATION.duration}
          />
        ))}
      </RRadarChart>
    </ChartContainer>
  );
}

export { RadarChart, type RadarChartProps };
