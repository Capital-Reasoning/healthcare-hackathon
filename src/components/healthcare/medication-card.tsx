import { Pill } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { LayoutCard, CardContent } from '@/components/layout/card';
import { DataBadge } from '@/components/data-display/badge';

type MedicationStatus = 'active' | 'discontinued' | 'pending';

interface MedicationCardProps {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  startDate?: Date | string;
  status: MedicationStatus;
  className?: string;
}

const statusVariant: Record<MedicationStatus, 'success' | 'error' | 'warning'> = {
  active: 'success',
  discontinued: 'error',
  pending: 'warning',
};

function MedicationCard({
  name,
  dosage,
  frequency,
  prescriber,
  startDate,
  status,
  className,
}: MedicationCardProps) {
  return (
    <LayoutCard data-slot="medication-card" className={cn('', className)}>
      <CardContent className="flex items-start gap-3">
        <div className="flex items-center justify-center size-9 rounded-lg bg-primary-tint shrink-0">
          <Pill className="size-4 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-h3 text-foreground truncate">{name}</p>
            <DataBadge variant={statusVariant[status]} size="sm">
              {status}
            </DataBadge>
          </div>
          <p className="text-body-sm text-muted-foreground mt-0.5">
            {dosage} · {frequency}
          </p>
          {(prescriber || startDate) && (
            <p className="text-caption text-muted-foreground mt-1">
              {prescriber && <>Dr. {prescriber}</>}
              {prescriber && startDate && ' · '}
              {startDate && <>Started {formatDate(startDate)}</>}
            </p>
          )}
        </div>
      </CardContent>
    </LayoutCard>
  );
}

export { MedicationCard, type MedicationCardProps, type MedicationStatus };
