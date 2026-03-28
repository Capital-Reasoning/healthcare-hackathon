'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LayoutCard,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/layout/card';
import { Separator } from '@/components/ui/separator';

interface StatCardProps {
  /** Metric label (e.g., "TOTAL PATIENTS") — rendered as caption/overline */
  label: string;
  /** The metric value (large display number) */
  value: string | number;
  /** Icon rendered top-right with muted styling */
  icon?: React.ReactNode;
  /** Trend indicator */
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'flat';
    label: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
  };
  /** Visual variant */
  variant?: 'default' | 'glass';
  /** Click handler — makes the card interactive */
  onClick?: () => void;
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

function StatCard({
  label,
  value,
  icon,
  trend,
  variant = 'default',
  onClick,
  className,
}: StatCardProps) {
  const cardVariant = variant === 'glass'
    ? 'glass'
    : onClick
      ? 'interactive'
      : 'default';

  return (
    <LayoutCard
      data-slot="stat-card"
      variant={cardVariant}
      className={className}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-caption text-muted-foreground">
          {label}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground [&>svg]:size-5" aria-hidden="true">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-display text-foreground">{value}</div>
        {trend && (
          <>
            <Separator className="my-2" />
            <TrendIndicator {...trend} />
          </>
        )}
      </CardContent>
    </LayoutCard>
  );
}

function TrendIndicator({
  value,
  direction,
  label,
  sentiment = 'neutral',
}: NonNullable<StatCardProps['trend']>) {
  const Icon = trendIcons[direction];
  const color = sentimentColors[sentiment];

  return (
    <p className="flex items-center gap-1 text-body-sm text-muted-foreground">
      <Icon className={cn('size-3.5', color)} aria-hidden="true" />
      <span className={color}>{value}</span>
      <span>{label}</span>
    </p>
  );
}

export { StatCard, type StatCardProps };
