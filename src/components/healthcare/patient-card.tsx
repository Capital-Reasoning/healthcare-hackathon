'use client';
import { cn, formatDate } from '@/lib/utils';
import {
  LayoutCard,
  CardContent,
  CardHeader,
} from '@/components/layout/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RiskBadge, type RiskLevel } from './risk-badge';

interface PatientCardProps {
  name: string;
  /** Medical Record Number or patient ID */
  id: string;
  age: number;
  gender: string;
  /** Primary diagnosis / condition */
  condition?: string;
  riskLevel?: RiskLevel;
  lastVisit?: Date | string;
  /** Avatar image URL */
  avatar?: string;
  onClick?: () => void;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function PatientCard({
  name,
  id,
  age,
  gender,
  condition,
  riskLevel,
  lastVisit,
  avatar,
  onClick,
  className,
}: PatientCardProps) {
  return (
    <LayoutCard
      data-slot="patient-card"
      variant={onClick ? 'interactive' : 'default'}
      className={cn('relative', className)}
      onClick={onClick}
    >
      {/* Risk badge — top right */}
      {riskLevel && (
        <div className="absolute top-3 right-3">
          <RiskBadge level={riskLevel} size="sm" />
        </div>
      )}

      <CardHeader className="flex-row items-center gap-3 space-y-0">
        <Avatar className="size-10">
          {avatar && <AvatarImage src={avatar} alt={name} />}
          <AvatarFallback className="bg-primary-tint text-primary text-body-sm font-medium">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-h3 text-foreground truncate">{name}</p>
          <p className="text-caption text-muted-foreground">MRN: {id}</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-col gap-1 text-body-sm text-muted-foreground">
          <p>
            {age} y/o · {gender}
          </p>
          {condition && (
            <p className="text-foreground font-medium">{condition}</p>
          )}
          {lastVisit && (
            <p className="text-caption mt-1">
              Last visit: {formatDate(lastVisit)}
            </p>
          )}
        </div>
      </CardContent>
    </LayoutCard>
  );
}

export { PatientCard, type PatientCardProps };
