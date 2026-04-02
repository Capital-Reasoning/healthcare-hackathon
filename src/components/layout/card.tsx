import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Card as ShadcnCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
} from '@/components/ui/card';

/** Props for the extended layout Card. */
interface LayoutCardProps extends React.ComponentProps<'div'> {
  /**
   * Visual variant:
   * - `default` — standard white card (shadcn Card as-is)
   * - `muted` — muted background for secondary content
   * - `glass` — frosted glass effect (agent panel aesthetic)
   * - `interactive` — hover lift + shadow for clickable cards
   */
  variant?: 'default' | 'muted' | 'glass' | 'interactive';
  children: React.ReactNode;
}

const variantClasses: Record<'default' | 'muted' | 'interactive', string> = {
  default: '',
  muted: 'bg-muted',
  interactive:
    'transition-all duration-200 hover:shadow-sm cursor-pointer',
};

/**
 * Layout Card that wraps the shadcn Card and adds variant styling.
 *
 * The `glass` variant renders a plain div with glass styling instead of the
 * shadcn Card, to avoid border/radius conflicts.
 *
 * Re-exports all shadcn Card sub-components for convenience:
 * `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`,
 * `CardFooter`, `CardAction`.
 */
function LayoutCard({
  variant = 'default',
  className,
  children,
  ...props
}: LayoutCardProps) {
  // Glass variant uses a plain div to avoid shadcn Card border/radius conflicts
  if (variant === 'glass') {
    return (
      <div
        data-slot="layout-card"
        data-variant="glass"
        className={cn(
          'glass-strong flex flex-col gap-4 rounded-lg py-4 text-sm',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <ShadcnCard
      data-slot="layout-card"
      data-variant={variant}
      className={cn(variantClasses[variant], className)}
      {...props}
    >
      {children}
    </ShadcnCard>
  );
}

export {
  LayoutCard,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardAction,
};
