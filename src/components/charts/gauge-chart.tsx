'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface GaugeThreshold {
  /** Value at which this colour starts */
  value: number;
  /** Colour for this segment */
  color: string;
}

interface GaugeChartProps {
  /** Current value */
  value: number;
  /** Minimum value. Default: 0 */
  min?: number;
  /** Maximum value. Default: 100 */
  max?: number;
  /** Colour thresholds — sorted ascending by value */
  thresholds?: GaugeThreshold[];
  /** Label displayed below the value */
  label?: string;
  /** Size of the gauge in pixels. Default: 200 */
  size?: number;
  className?: string;
}

const DEFAULT_THRESHOLDS: GaugeThreshold[] = [
  { value: 0, color: '#0B7A5E' },   // green / success
  { value: 50, color: '#C27A15' },   // amber / warning
  { value: 75, color: '#C93B3B' },   // red / error
];

function GaugeChart({
  value,
  min = 0,
  max = 100,
  thresholds = DEFAULT_THRESHOLDS,
  label,
  size = 200,
  className,
}: GaugeChartProps) {
  const clamped = Math.max(min, Math.min(max, value));
  const ratio = (clamped - min) / (max - min);

  // SVG geometry — semicircle from left (π) to right (0)
  const cx = size / 2;
  const cy = size / 2 + 10;
  const r = size / 2 - 20;
  const strokeW = 14;

  // Build arc segments based on thresholds
  const segments = React.useMemo(() => {
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    const result: { startAngle: number; endAngle: number; color: string }[] = [];

    for (let i = 0; i < sorted.length; i++) {
      const current = sorted[i]!;
      const next = sorted[i + 1];
      const startVal = current.value;
      const endVal = next ? next.value : max;
      const startRatio = Math.max(0, (startVal - min) / (max - min));
      const endRatio = Math.min(1, (endVal - min) / (max - min));
      // Map ratio to angle: π (left) → 0 (right)
      result.push({
        startAngle: Math.PI * (1 - startRatio),
        endAngle: Math.PI * (1 - endRatio),
        color: current.color,
      });
    }
    return result;
  }, [thresholds, min, max]);

  const arcPath = (startAngle: number, endAngle: number) => {
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy - r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy - r * Math.sin(endAngle);
    const largeArc = Math.abs(startAngle - endAngle) > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle position
  const needleAngle = Math.PI * (1 - ratio);
  const needleLen = r - 10;
  const nx = cx + needleLen * Math.cos(needleAngle);
  const ny = cy - needleLen * Math.sin(needleAngle);

  // Current colour — reuse sorted segments to avoid duplicate sort
  const currentColor = React.useMemo(() => {
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    return sorted.filter((t) => clamped >= t.value).pop()?.color ?? 'var(--primary)';
  }, [thresholds, clamped]);

  return (
    <div data-slot="gauge-chart" className={cn('flex flex-col items-center', className)}>
      <svg width={size} height={size / 2 + 30} viewBox={`0 0 ${size} ${size / 2 + 30}`}>
        {/* Background track — single clean arc with round caps */}
        <path
          d={arcPath(Math.PI, 0)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          opacity={0.4}
        />
        {/* Coloured threshold segments — all butt caps to avoid overlap artifacts */}
        {segments.map((seg, i) => (
          <path
            key={i}
            d={arcPath(seg.startAngle, seg.endAngle)}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeLinecap="butt"
            opacity={0.2}
          />
        ))}
        {/* Active arc up to current value */}
        <path
          d={arcPath(Math.PI, needleAngle)}
          fill="none"
          stroke={currentColor}
          strokeWidth={strokeW}
          strokeLinecap="round"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke="var(--foreground)"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill="var(--foreground)" />
      </svg>
      <div className="text-center -mt-2">
        <span className="text-display" style={{ color: currentColor }}>
          {value}
        </span>
        {label && (
          <p className="text-body-sm text-muted-foreground mt-0.5">{label}</p>
        )}
      </div>
    </div>
  );
}

export { GaugeChart, type GaugeChartProps };
