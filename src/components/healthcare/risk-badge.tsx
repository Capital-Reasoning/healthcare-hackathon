import { Shield, AlertTriangle, ShieldAlert } from 'lucide-react';
import { DataBadge, type DataBadgeProps } from '@/components/data-display/badge';
import { cn } from '@/lib/utils';

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskBadgeProps {
  level: RiskLevel;
  /** Custom label — defaults to the level name (capitalised) */
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  /** Show an icon before the label */
  showIcon?: boolean;
  className?: string;
}

const levelConfig: Record<
  RiskLevel,
  { variant: DataBadgeProps['variant']; icon: typeof Shield; defaultLabel: string }
> = {
  low: { variant: 'success', icon: Shield, defaultLabel: 'Low' },
  medium: { variant: 'warning', icon: AlertTriangle, defaultLabel: 'Medium' },
  high: { variant: 'error', icon: AlertTriangle, defaultLabel: 'High' },
  critical: { variant: 'error', icon: ShieldAlert, defaultLabel: 'Critical' },
};

function RiskBadge({
  level,
  label,
  size = 'default',
  showIcon = true,
  className,
}: RiskBadgeProps) {
  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <DataBadge
      data-slot="risk-badge"
      variant={config.variant}
      size={size}
      dot={level === 'critical'}
      className={cn(level === 'critical' && 'font-bold', className)}
    >
      {showIcon && <Icon className="size-3" aria-hidden="true" />}
      {label ?? config.defaultLabel}
    </DataBadge>
  );
}

export { RiskBadge, type RiskBadgeProps, type RiskLevel };
