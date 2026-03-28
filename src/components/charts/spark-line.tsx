'use client';

import * as React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';

interface SparkLineProps {
  /** Array of numeric values */
  data: number[];
  /** Line color. Defaults to primary teal */
  color?: string;
  /** Height in pixels. Default: 32 */
  height?: number;
  /** Width — defaults to 100% of container */
  width?: number | string;
  /** Show a dot on the last data point */
  showDot?: boolean;
  className?: string;
}

function SparkLine({
  data,
  color = 'var(--chart-1)',
  height = 32,
  width = '100%',
  showDot = false,
  className,
}: SparkLineProps) {
  const chartData = React.useMemo(
    () => data.map((value, index) => ({ value, index })),
    [data],
  );

  // Custom dot that only renders on the last point
  const lastDot = showDot
    ? (props: { cx?: number; cy?: number; index?: number }) => {
        if (props.index !== data.length - 1) return null;
        return (
          <circle
            cx={props.cx}
            cy={props.cy}
            r={3}
            fill={color}
            stroke="var(--card)"
            strokeWidth={2}
          />
        );
      }
    : false;

  return (
    <div data-slot="spark-line" className={cn('inline-block', className)} style={{ height, width }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={lastDot}
            activeDot={false}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export { SparkLine, type SparkLineProps };
