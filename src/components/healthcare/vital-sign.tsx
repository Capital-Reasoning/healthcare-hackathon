import { cn } from '@/lib/utils';
import { SparkLine } from '@/components/charts/spark-line';

type VitalStatus = 'normal' | 'warning' | 'critical';

interface VitalSignProps {
  /** Vital sign name (e.g., "Blood Pressure") */
  label: string;
  /** Current value (e.g., "120/80") */
  value: string;
  /** Unit of measurement (e.g., "mmHg") */
  unit?: string;
  /** Status indicator */
  status: VitalStatus;
  /** Array of recent values for the sparkline trend */
  trend?: number[];
  className?: string;
}

const statusConfig: Record<VitalStatus, { dot: string; text: string }> = {
  normal: { dot: 'bg-success', text: 'text-success' },
  warning: { dot: 'bg-warning', text: 'text-warning' },
  critical: { dot: 'bg-error', text: 'text-error' },
};

const sparkColors: Record<VitalStatus, string> = {
  normal: 'var(--success)',
  warning: 'var(--warning)',
  critical: 'var(--error)',
};

function VitalSign({
  label,
  value,
  unit,
  status,
  trend,
  className,
}: VitalSignProps) {
  const { dot, text } = statusConfig[status];

  return (
    <div
      data-slot="vital-sign"
      className={cn('flex items-center justify-between gap-4 py-2', className)}
    >
      {/* Left: status dot + label + value */}
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={cn('size-2 rounded-full shrink-0', dot)}
          aria-label={`Status: ${status}`}
        />
        <div className="min-w-0">
          <p className="text-body-sm text-muted-foreground">{label}</p>
          <p className="text-h3 text-foreground">
            <span className={text}>{value}</span>
            {unit && (
              <span className="text-body-sm text-muted-foreground ml-1">
                {unit}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right: sparkline */}
      {trend && trend.length > 1 && (
        <SparkLine
          data={trend}
          color={sparkColors[status]}
          height={28}
          width={80}
          showDot
        />
      )}
    </div>
  );
}

export { VitalSign, type VitalSignProps, type VitalStatus };
