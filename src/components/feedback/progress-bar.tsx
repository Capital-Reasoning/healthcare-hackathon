import { cn } from '@/lib/utils';

/** Props for the ProgressBar indicator component. */
interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error';
  /** Whether to show the percentage label */
  showLabel?: boolean;
  /** Size variant */
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const variantClasses: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
};

const sizeClasses: Record<NonNullable<ProgressBarProps['size']>, string> = {
  sm: 'h-1',
  default: 'h-2',
  lg: 'h-3',
};

/**
 * Styled progress indicator built from scratch with divs for full
 * customisation. Supports `default`, `success`, `warning`, and `error`
 * color variants plus `sm`, `default`, and `lg` sizes.
 */
function ProgressBar({
  value,
  variant = 'default',
  showLabel = false,
  size = 'default',
  className,
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      data-slot="progress-bar"
      data-variant={variant}
      className={cn('flex items-center gap-3', className)}
    >
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${clampedValue}%`}
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-border',
          sizeClasses[size],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            variantClasses[variant],
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </div>

      {showLabel && (
        <span className="text-body-sm text-muted-foreground tabular-nums shrink-0">
          {clampedValue}%
        </span>
      )}
    </div>
  );
}

export { ProgressBar, type ProgressBarProps };
