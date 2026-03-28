'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface HeatMapProps {
  /** Array of data points with x, y labels and numeric values */
  data: { x: string; y: string; value: number }[];
  /** Labels for the X axis (columns) */
  xLabels: string[];
  /** Labels for the Y axis (rows) */
  yLabels: string[];
  /** Color scale — interpolates between min and max */
  colorScale?: { min: string; max: string };
  /** Chart height in pixels */
  height?: number;
  className?: string;
}

/** Linear interpolation between two hex colours */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string): [number, number, number] => {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function HeatMap({
  data,
  xLabels,
  yLabels,
  colorScale = { min: '#E8F6F6', max: '#0B8585' },
  height,
  className,
}: HeatMapProps) {
  const maxVal = React.useMemo(() => Math.max(...data.map((d) => d.value), 1), [data]);

  const lookup = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(`${d.y}__${d.x}`, d.value);
    }
    return map;
  }, [data]);

  return (
    <div data-slot="heat-map" className={cn('w-full overflow-x-auto', className)} style={height ? { maxHeight: height } : undefined}>
      <table className="border-collapse text-body-sm">
        <thead>
          <tr>
            <th className="p-2" />
            {xLabels.map((label) => (
              <th key={label} className="p-2 text-caption text-muted-foreground font-medium text-center">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {yLabels.map((yLabel) => (
            <tr key={yLabel}>
              <td className="p-2 text-caption text-muted-foreground font-medium whitespace-nowrap">
                {yLabel}
              </td>
              {xLabels.map((xLabel) => {
                const value = lookup.get(`${yLabel}__${xLabel}`) ?? 0;
                const t = maxVal > 0 ? value / maxVal : 0;
                return (
                  <td
                    key={xLabel}
                    className="p-1"
                  >
                    <div
                      className="rounded-sm min-w-8 min-h-8 flex items-center justify-center text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: lerpColor(colorScale.min, colorScale.max, t),
                        color: t > 0.5 ? '#FFFFFF' : 'var(--foreground)',
                      }}
                      title={`${yLabel} × ${xLabel}: ${value}`}
                    >
                      {value}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { HeatMap, type HeatMapProps };
