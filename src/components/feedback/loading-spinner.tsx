import { cn } from '@/lib/utils';

/** Props for the LoadingSpinner component. */
interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

const sizeConfig: Record<
  NonNullable<LoadingSpinnerProps['size']>,
  { outer: string; stroke: number; r: number; viewBox: number }
> = {
  sm: { outer: 'size-4', stroke: 2, r: 6, viewBox: 16 },
  default: { outer: 'size-6', stroke: 2.5, r: 9.5, viewBox: 24 },
  lg: { outer: 'size-8', stroke: 3, r: 12.5, viewBox: 32 },
};

/**
 * Animated spinner with a visible track ring.
 * Uses SVG circles for pixel-perfect alignment between track and spinner arc.
 */
function LoadingSpinner({ size = 'default', className }: LoadingSpinnerProps) {
  const { outer, stroke, r, viewBox } = sizeConfig[size];
  const center = viewBox / 2;
  const circumference = 2 * Math.PI * r;

  return (
    <span
      data-slot="loading-spinner"
      role="status"
      aria-label="Loading"
      className={cn('inline-flex', className)}
    >
      <svg
        className={cn('animate-spin text-primary', outer)}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        fill="none"
        aria-hidden="true"
      >
        {/* Track ring */}
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          className="opacity-15"
        />
        {/* Spinning arc */}
        <circle
          cx={center}
          cy={center}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.7}
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </span>
  );
}

export { LoadingSpinner, type LoadingSpinnerProps };
