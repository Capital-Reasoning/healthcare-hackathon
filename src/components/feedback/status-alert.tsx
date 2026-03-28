'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Info, CircleCheck, TriangleAlert, CircleX, X } from 'lucide-react';

/** Visual variant for the StatusAlert component. */
type AlertVariant = 'info' | 'success' | 'warning' | 'error';

/** Props for the StatusAlert notification banner. */
interface StatusAlertProps {
  /** Visual variant determining color and icon */
  variant: AlertVariant;
  /** Alert title (bold) */
  title: string;
  /** Alert description/body text */
  description?: string;
  /** Custom icon (defaults to variant-appropriate icon) */
  icon?: React.ReactNode;
  /** Callback when dismiss button is clicked */
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<
  AlertVariant,
  { strip: string; bg: string; iconColor: string }
> = {
  info: {
    strip: 'bg-primary',
    bg: 'bg-primary-tint',
    iconColor: 'text-primary',
  },
  success: {
    strip: 'bg-success',
    bg: 'bg-success-tint',
    iconColor: 'text-success',
  },
  warning: {
    strip: 'bg-warning',
    bg: 'bg-warning-tint',
    iconColor: 'text-warning',
  },
  error: {
    strip: 'bg-error',
    bg: 'bg-error-tint',
    iconColor: 'text-error',
  },
};

const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="size-5" />,
  success: <CircleCheck className="size-5" />,
  warning: <TriangleAlert className="size-5" />,
  error: <CircleX className="size-5" />,
};

/**
 * Notification banner with left border accent and variant-colored backgrounds.
 *
 * Supports info, success, warning, and error variants with appropriate default
 * icons. Optionally dismissible via the `onDismiss` callback.
 */
function StatusAlert({
  variant,
  title,
  description,
  icon,
  onDismiss,
  className,
}: StatusAlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      data-slot="status-alert"
      data-variant={variant}
      role="alert"
      className={cn(
        'flex overflow-hidden rounded-lg',
        styles.bg,
        className,
      )}
    >
      <div className={cn('w-1 shrink-0 self-stretch', styles.strip)} />
      <div className="flex flex-1 items-start gap-3 p-4">
        <span className={cn('mt-0.5 shrink-0', styles.iconColor)} aria-hidden="true">
          {icon ?? defaultIcons[variant]}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-body-sm font-medium text-navy-800">{title}</p>
          {description && (
            <p className="text-body-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
            aria-label="Dismiss alert"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export { StatusAlert, type StatusAlertProps, type AlertVariant };
