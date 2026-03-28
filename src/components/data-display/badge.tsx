'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dataBadgeVariants = cva(
  'inline-flex items-center gap-1.5 font-medium whitespace-nowrap rounded-full border transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground border-transparent',
        primary:
          'bg-primary text-primary-foreground border-transparent',
        secondary:
          'bg-secondary text-secondary-foreground border-border',
        success:
          'bg-success-tint text-success border-transparent',
        warning:
          'bg-warning-tint text-warning border-transparent',
        error:
          'bg-error-tint text-error border-transparent',
        outline:
          'bg-transparent text-foreground border-border',
      },
      size: {
        sm: 'text-xs h-5 px-1.5',
        default: 'text-[13px] h-6 px-2.5',
        lg: 'text-sm h-7 px-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

const dotColors: Record<string, string> = {
  default: 'bg-primary-foreground',
  primary: 'bg-primary-foreground',
  secondary: 'bg-secondary-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  outline: 'bg-foreground',
};

interface DataBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'>,
    VariantProps<typeof dataBadgeVariants> {
  /** Show a small colored dot before text */
  dot?: boolean;
  /** Make the badge dismissible with an X button */
  dismissible?: boolean;
  /** Called when the dismiss button is clicked */
  onDismiss?: () => void;
  children: React.ReactNode;
}

function DataBadge({
  variant = 'default',
  size = 'default',
  dot,
  dismissible,
  onDismiss,
  className,
  children,
  ...props
}: DataBadgeProps) {
  return (
    <span
      data-slot="data-badge"
      data-variant={variant}
      className={cn(dataBadgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn('size-1.5 rounded-full shrink-0', dotColors[variant ?? 'default'])}
          aria-hidden="true"
        />
      )}
      {children}
      {dismissible && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.();
          }}
          className="ml-0.5 -mr-1 rounded-full p-0.5 hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export { DataBadge, dataBadgeVariants, type DataBadgeProps };
