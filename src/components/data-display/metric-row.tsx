'use client';

import { cn } from '@/lib/utils';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';

interface Metric {
  label: string;
  value: string | number;
  trendValue?: string;
  trendDirection?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  trendSentiment?: 'positive' | 'negative' | 'neutral';
}

interface MetricRowProps {
  metrics: Metric[];
  className?: string;
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
} as const;

const sentimentColors = {
  positive: 'text-success',
  negative: 'text-error',
  neutral: 'text-muted-foreground',
} as const;

/**
 * Compact metric display — full-width rows connected with thin dividers.
 * Each row: label + value on left, trend on right.
 * Much more space-efficient than StatCards in narrow panels.
 */
function MetricRow({ metrics, className }: MetricRowProps) {
  return (
    <div
      data-slot="metric-row"
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card',
        className,
      )}
    >
      {metrics.map((metric, i) => {
        const Icon = metric.trendDirection
          ? trendIcons[metric.trendDirection]
          : null;
        const color = metric.trendSentiment
          ? sentimentColors[metric.trendSentiment]
          : 'text-muted-foreground';

        return (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between px-3.5 py-2.5',
              i > 0 && 'border-t border-border/30',
            )}
          >
            {/* Left: label + value */}
            <div className="min-w-0">
              <div className="text-xs font-medium text-muted-foreground">
                {metric.label}
              </div>
              <div className="text-lg font-semibold text-foreground leading-tight">
                {metric.value}
              </div>
            </div>

            {/* Right: trend */}
            {metric.trendValue && (
              <div className="shrink-0 text-right">
                <div className={cn('flex items-center justify-end gap-1 text-sm font-medium', color)}>
                  {Icon && <Icon className="size-3.5" aria-hidden="true" />}
                  {metric.trendValue}
                </div>
                {metric.trendLabel && (
                  <div className="text-[11px] text-muted-foreground">
                    {metric.trendLabel}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export { MetricRow, type Metric, type MetricRowProps };

