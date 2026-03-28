'use client';

import { Treemap as RTreemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { CHART_ANIMATION, chartTooltipStyle, chartTooltipItemStyle, getColor } from './chart-config';

interface TreeMapItem {
  name: string;
  value: number;
  children?: TreeMapItem[];
  [key: string]: unknown;
}

interface TreeMapProps {
  data: TreeMapItem[];
  /** Chart height in pixels */
  height?: number;
  /** Custom colors */
  colors?: string[];
  className?: string;
}

interface ContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
  depth?: number;
  colors?: string[];
}

function CustomContent({
  x = 0,
  y = 0,
  width = 0,
  height: h = 0,
  name,
  index = 0,
  depth = 0,
  colors,
}: ContentProps) {
  if (width < 4 || h < 4) return null;

  // depth 0 = root wrapper, depth 1+ = actual data cells
  if (depth < 1) return null;

  const fill = colors?.[index] ?? getColor(index);

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={h}
        fill={fill}
        stroke="var(--card)"
        strokeWidth={3}
        rx={6}
      />
      {width > 50 && h > 24 && (
        <text
          x={x + width / 2}
          y={y + h / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontSize={Math.min(13, width / 8)}
          fontWeight={600}
        >
          {name}
        </text>
      )}
    </g>
  );
}

function TreeMap({
  data,
  height = 300,
  colors,
  className,
}: TreeMapProps) {
  return (
    <div data-slot="tree-map" className={cn('w-full', className)}>
      <ResponsiveContainer width="100%" height={height}>
        <RTreemap
          data={data}
          dataKey="value"
          nameKey="name"
          aspectRatio={4 / 3}
          animationDuration={CHART_ANIMATION.duration}
          content={<CustomContent colors={colors} />}
        >
          <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} />
        </RTreemap>
      </ResponsiveContainer>
    </div>
  );
}

export { TreeMap, type TreeMapProps, type TreeMapItem };
