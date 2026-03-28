'use client';

import { useState, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Shield,
  Activity,
  Stethoscope,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataBadge } from '@/components/data-display/badge';
import { EvidenceCitation } from './evidence-citation';
import { ApproveButton } from './approve-button';

interface EvidenceRef {
  docId: string | null;
  chunkId: string | null;
  documentTitle: string;
  excerpt: string;
}

interface TargetFact {
  id: string;
  runId: string;
  targetId: string;
  condition: string | null;
  screeningType: string | null;
  action: string | null;
  riskTier: string | null;
  status: string | null;
  overdueDays: number | null;
  dueDate: string | null;
  confidence: string | null;
  confidenceReason: string | null;
  actionValueScore: number | null;
  whyThisAction: string | null;
  whyNow: string | null;
  evidenceRefs: unknown;
  providerRoute: string | null;
  category: string | null;
  generatedAt: Date | null;
}

interface ActivityEntry {
  timestamp: Date;
  message: string;
}

function parseEvidenceRefs(raw: unknown): EvidenceRef[] {
  if (!raw || !Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is EvidenceRef =>
      typeof r === 'object' &&
      r !== null &&
      'documentTitle' in r &&
      'excerpt' in r,
  );
}

function getCategoryBorder(category: string | null): string {
  switch (category) {
    case 'red':
      return 'border-l-destructive';
    case 'yellow':
      return 'border-l-warning';
    case 'green':
      return 'border-l-success';
    default:
      return 'border-l-border';
  }
}

function getCategoryBadge(category: string | null) {
  switch (category) {
    case 'red':
      return (
        <DataBadge variant="error" size="sm">
          <AlertCircle className="size-3" /> Action Required
        </DataBadge>
      );
    case 'yellow':
      return (
        <DataBadge variant="warning" size="sm">
          <AlertTriangle className="size-3" /> Due Soon
        </DataBadge>
      );
    case 'green':
      return (
        <DataBadge variant="success" size="sm">
          <CheckCircle2 className="size-3" /> Up to Date
        </DataBadge>
      );
    default:
      return (
        <DataBadge variant="secondary" size="sm">
          Unknown
        </DataBadge>
      );
  }
}

function getConfidenceBadge(confidence: string | null) {
  switch (confidence) {
    case 'high':
      return (
        <DataBadge variant="primary" size="sm">
          <Shield className="size-3" /> High Confidence
        </DataBadge>
      );
    case 'medium':
      return (
        <DataBadge variant="secondary" size="sm">
          Medium Confidence
        </DataBadge>
      );
    case 'low':
      return (
        <DataBadge variant="outline" size="sm">
          Low Confidence
        </DataBadge>
      );
    default:
      return null;
  }
}

function getStatusText(
  status: string | null,
  overdueDays: number | null,
  dueDate: string | null,
): string {
  switch (status) {
    case 'overdue_now':
      return `${overdueDays ?? '?'} days overdue${dueDate ? ` (due: ${dueDate})` : ''}`;
    case 'due_soon':
      return `Due soon${dueDate ? ` (${dueDate})` : ''}`;
    case 'up_to_date':
      return 'Up to date';
    case 'unknown_due':
      return 'Due date unknown';
    default:
      return 'Status unknown';
  }
}

function getStatusIcon(status: string | null) {
  switch (status) {
    case 'overdue_now':
      return <AlertCircle className="size-4 text-destructive" />;
    case 'due_soon':
      return <Clock className="size-4 text-warning" />;
    case 'up_to_date':
      return <CheckCircle2 className="size-4 text-success" />;
    default:
      return <Clock className="size-4 text-muted-foreground" />;
  }
}

export function AssessmentResults({
  targets,
  runDate,
  overallConfidence,
  patientName,
}: {
  targets: TargetFact[];
  runDate: string;
  overallConfidence: string | null;
  patientName: string;
}) {
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>([
    {
      timestamp: new Date(runDate),
      message: `Assessment completed`,
    },
  ]);

  const handleApproved = useCallback(
    (action: string | null) => {
      setActivityLog((prev) => [
        {
          timestamp: new Date(),
          message: `Email sent to ${patientName} re: ${action ?? 'recommendation'} — Dr. Demo User — Delivered`,
        },
        ...prev,
      ]);
    },
    [patientName],
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-h2 text-foreground flex items-center gap-2">
            <Stethoscope className="size-5" />
            Assessment Results
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Assessed{' '}
            {new Date(runDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {overallConfidence && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Overall Confidence:
            </span>
            {getConfidenceBadge(overallConfidence)}
          </div>
        )}
      </div>

      {/* Target Cards */}
      <div className="space-y-4">
        {targets.map((target) => {
          const evidenceRefs = parseEvidenceRefs(target.evidenceRefs);
          return (
            <div
              key={target.id}
              className={cn(
                'rounded-lg border border-border bg-card p-5 border-l-4',
                getCategoryBorder(target.category),
              )}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="space-y-1">
                  <h3 className="text-h3 text-foreground">
                    {target.screeningType ?? target.condition ?? 'Target'}
                  </h3>
                  {target.condition && target.screeningType && (
                    <p className="text-sm text-muted-foreground">
                      Condition: {target.condition}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {getCategoryBadge(target.category)}
                  {getConfidenceBadge(target.confidence)}
                </div>
              </div>

              {/* Action */}
              {target.action && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Recommended Action
                  </span>
                  <p className="text-sm text-foreground font-medium mt-0.5">
                    {target.action}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-2 mb-4 text-sm">
                {getStatusIcon(target.status)}
                <span
                  className={cn(
                    target.status === 'overdue_now' && 'text-destructive font-medium',
                    target.status === 'due_soon' && 'text-warning font-medium',
                    target.status === 'up_to_date' && 'text-success',
                    !target.status && 'text-muted-foreground',
                  )}
                >
                  {getStatusText(
                    target.status,
                    target.overdueDays,
                    target.dueDate,
                  )}
                </span>
              </div>

              {/* Why sections */}
              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                {target.whyThisAction && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Why this action
                    </p>
                    <p className="text-sm text-foreground">
                      {target.whyThisAction}
                    </p>
                  </div>
                )}
                {target.whyNow && (
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      Why now
                    </p>
                    <p className="text-sm text-foreground">{target.whyNow}</p>
                  </div>
                )}
              </div>

              {/* Evidence Citations */}
              <div className="mb-4">
                <EvidenceCitation refs={evidenceRefs} />
              </div>

              {/* Footer: Provider Route + Approve Button */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {target.providerRoute && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Activity className="size-4" />
                    <span>
                      Provider:{' '}
                      <span className="capitalize font-medium text-foreground">
                        {target.providerRoute}
                      </span>
                    </span>
                  </div>
                )}
                <div className="ml-auto">
                  <ApproveButton
                    patientName={patientName}
                    action={target.action ?? 'Recommendation'}
                    condition={target.condition}
                    providerRoute={target.providerRoute}
                    whyThisAction={target.whyThisAction}
                    onApproved={() => handleApproved(target.action)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Activity Log */}
      <div className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-h3 text-foreground mb-3 flex items-center gap-2">
          <Clock className="size-4" />
          Activity Log
        </h3>
        <div className="space-y-2">
          {activityLog.map((entry, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 text-sm"
            >
              <span className="text-muted-foreground whitespace-nowrap shrink-0">
                {entry.timestamp.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}{' '}
                at{' '}
                {entry.timestamp.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-foreground">{entry.message}</span>
              {entry.message.includes('Delivered') && (
                <DataBadge variant="success" size="sm">
                  Delivered
                </DataBadge>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
