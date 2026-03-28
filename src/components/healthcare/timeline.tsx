'use client';

import * as React from 'react';
import {
  Stethoscope,
  Pill,
  TestTube,
  Scissors,
  FileText,
  Circle,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { SkeletonVariant } from '@/components/feedback/skeleton-variants';

/* ─── Types ──────────────────────────────────────────── */

type EventType = 'encounter' | 'medication' | 'lab' | 'procedure' | 'note';
type EventStatus = 'completed' | 'pending' | 'cancelled';

interface TimelineEventProps {
  title: string;
  description?: string;
  timestamp: Date | string;
  type?: EventType;
  status?: EventStatus;
  icon?: React.ReactNode;
}

interface TimelineProps {
  events: TimelineEventProps[];
  isLoading?: boolean;
  className?: string;
}

/* ─── Config ─────────────────────────────────────────── */

const typeIcons: Record<EventType, typeof Stethoscope> = {
  encounter: Stethoscope,
  medication: Pill,
  lab: TestTube,
  procedure: Scissors,
  note: FileText,
};

const statusStyles: Record<EventStatus, { bg: string; text: string }> = {
  completed: { bg: 'bg-success', text: 'text-success' },
  pending: { bg: 'bg-warning', text: 'text-warning' },
  cancelled: { bg: 'bg-error', text: 'text-error' },
};

/* ─── TimelineEvent ──────────────────────────────────── */

function TimelineEvent({
  title,
  description,
  timestamp,
  type,
  status = 'completed',
  icon,
}: TimelineEventProps) {
  const IconComp = type ? typeIcons[type] : Circle;
  const { bg, text } = statusStyles[status];

  return (
    <div data-slot="timeline-event" className="relative flex gap-4 pb-6 last:pb-0">
      {/* Connecting line */}
      <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border last:hidden" />

      {/* Icon dot */}
      <div
        className={cn(
          'relative z-10 flex items-center justify-center size-8 rounded-full border-2 border-card shrink-0',
          bg + '/15',
        )}
      >
        {icon ?? (
          <IconComp
            className={cn('size-4', text)}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <p
            className={cn(
              'text-body-sm font-medium text-foreground',
              status === 'cancelled' && 'line-through text-muted-foreground',
            )}
          >
            {title}
          </p>
          <time className="text-caption text-muted-foreground whitespace-nowrap">
            {formatDate(timestamp)}
          </time>
        </div>
        {description && (
          <p className="text-body-sm text-muted-foreground mt-0.5">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Timeline ───────────────────────────────────────── */

function Timeline({ events, isLoading, className }: TimelineProps) {
  if (isLoading) {
    return (
      <div data-slot="timeline" className={cn('flex flex-col gap-4', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonVariant key={i} variant="text" />
        ))}
      </div>
    );
  }

  return (
    <div data-slot="timeline" className={cn('flex flex-col', className)}>
      {events.map((event, i) => (
        <TimelineEvent key={i} {...event} />
      ))}
    </div>
  );
}

export {
  Timeline,
  TimelineEvent,
  type TimelineProps,
  type TimelineEventProps,
  type EventType,
  type EventStatus,
};
