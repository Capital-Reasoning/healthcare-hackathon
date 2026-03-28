import * as React from 'react';
import { cn } from '@/lib/utils';

/** Props for the Stack flexbox helper. */
interface StackProps extends React.ComponentProps<'div'> {
  /** Flex direction */
  direction?: 'row' | 'column';
  /** Gap between items */
  gap?: 'xs' | 'sm' | 'default' | 'lg';
  /** Cross-axis alignment */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Main-axis justification */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Whether items should wrap */
  wrap?: boolean;
  children: React.ReactNode;
  className?: string;
}

const directionClasses: Record<NonNullable<StackProps['direction']>, string> = {
  row: 'flex-row',
  column: 'flex-col',
};

const gapClasses: Record<NonNullable<StackProps['gap']>, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  default: 'gap-4',
  lg: 'gap-6',
};

const alignClasses: Record<NonNullable<StackProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
};

const justifyClasses: Record<NonNullable<StackProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
};

/**
 * Flexbox helper that maps semantic props to Tailwind flex utilities.
 * Defaults to a vertical (column) stack with standard gap.
 *
 * This is a server component.
 */
export function Stack({
  direction = 'column',
  gap = 'default',
  align,
  justify,
  wrap = false,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      data-slot="stack"
      className={cn(
        'flex',
        directionClasses[direction],
        gapClasses[gap],
        align && alignClasses[align],
        justify && justifyClasses[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
