'use client';

import * as React from 'react';
import { ResponsiveContainer } from 'recharts';

/* ─── Colour palette ────────────────────────────────── */

export const CHART_COLORS = [
  'var(--chart-1)', // teal #0B8585
  'var(--chart-4)', // amber #C27A15
  'var(--chart-3)', // navy #2A4365
  'var(--chart-5)', // green #0B7A5E
  '#8B5CF6',        // purple
  '#EC4899',        // pink
  '#6366F1',        // indigo
  'var(--chart-2)', // dark teal #0A7373
] as const;

export function getColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length] as string;
}

/* ─── Layout constants ──────────────────────────────── */

export const CHART_MARGINS = { top: 5, right: 20, bottom: 5, left: 0 };

export const CHART_ANIMATION = { duration: 400, easing: 'ease-out' as const };

/* ─── Shared styles ─────────────────────────────────── */

export const chartTooltipStyle: React.CSSProperties = {
  backgroundColor: 'var(--card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-md)',
  padding: '8px 12px',
  fontSize: '13px',
  color: 'var(--foreground)',
};

/** Force tooltip item text to use foreground color instead of series fill */
export const chartTooltipItemStyle: React.CSSProperties = {
  color: 'var(--foreground)',
};

export const chartAxisStyle = {
  tick: { fill: 'var(--muted-foreground)', fontSize: 12 },
  axisLine: { stroke: 'var(--border)' },
  tickLine: false as const,
};

export const chartGridStyle = {
  strokeDasharray: '3 3',
  stroke: 'var(--border)',
  opacity: 0.5,
};

/* ─── ChartContainer ────────────────────────────────── */

interface ChartContainerProps {
  height?: number;
  width?: string | number;
  aspect?: number;
  children: React.ReactNode;
  className?: string;
}

function ChartContainer({
  height = 300,
  width = '100%',
  aspect,
  children,
  className,
}: ChartContainerProps) {
  return (
    <div data-slot="chart-container" className={className}>
      <ResponsiveContainer
        width={width as number | `${number}%`}
        height={aspect ? undefined : height}
        aspect={aspect}
      >
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Custom Legend ──────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartLegend(props: any) {
  const payload = props?.payload as { value?: string; color?: string }[] | undefined;
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 pt-2">
      {payload.map((entry) => (
        <span key={entry.value ?? ''} className="inline-flex items-center gap-1.5 text-body-sm text-foreground">
          <span
            className="size-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </span>
      ))}
    </div>
  );
}

export { ChartContainer, ChartLegend };
