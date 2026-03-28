import * as React from 'react';
import { cn } from '@/lib/utils';

/** Props for the responsive Grid component. */
interface GridProps extends React.ComponentProps<'div'> {
  /** Number of columns at the widest breakpoint (always 1 on mobile) */
  cols?: 1 | 2 | 3 | 4;
  /** Gap between grid items */
  gap?: 'sm' | 'default' | 'lg';
  children: React.ReactNode;
  className?: string;
}

/**
 * Uses @container queries so grids respond to their container width,
 * not the viewport — works correctly when the agent panel is open.
 */
const colClasses: Record<NonNullable<GridProps['cols']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @sm/main:grid-cols-2',
  3: 'grid-cols-1 @sm/main:grid-cols-2 @3xl/main:grid-cols-3',
  4: 'grid-cols-1 @sm/main:grid-cols-2 @3xl/main:grid-cols-4',
};

const gapClasses: Record<NonNullable<GridProps['gap']>, string> = {
  sm: 'gap-3',
  default: 'gap-5',
  lg: 'gap-8',
};

/**
 * Responsive CSS grid that collapses to a single column on mobile and expands
 * to the specified column count at wider breakpoints.
 *
 * This is a server component.
 */
export function Grid({
  cols = 3,
  gap = 'default',
  className,
  children,
  ...props
}: GridProps) {
  return (
    <div
      data-slot="grid"
      className={cn('grid', colClasses[cols], gapClasses[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
}
