import * as React from 'react';
import { cn } from '@/lib/utils';

/** Props for the Panel container. */
interface PanelProps extends React.ComponentProps<'div'> {
  children: React.ReactNode;
  /** Internal padding preset */
  padding?: 'none' | 'sm' | 'default' | 'lg';
  className?: string;
}

const paddingClasses: Record<NonNullable<PanelProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-3',
  default: 'p-5',
  lg: 'p-8',
};

/**
 * A large container panel with white background, rounded corners, and a subtle
 * ring border. Use for grouping multiple cards or form sections.
 *
 * This is a server component.
 */
export function Panel({
  padding = 'default',
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      data-slot="panel"
      className={cn(
        'overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
