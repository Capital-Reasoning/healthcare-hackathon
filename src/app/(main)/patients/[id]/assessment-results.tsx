'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Shield,
  Activity,
  Stethoscope,
  ChevronDown,
  ChevronRight,
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
  lastCompletedDate: string | null;
  intervalDays: number | null;
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
      return 'border-l-success/50';
    default:
      return 'border-l-border';
  }
}

function getCategoryBadge(category: string | null, status: string | null) {
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
          <CheckCircle2 className="size-3" /> On Track
        </DataBadge>
      );
    default:
      // unknown_due should NOT show as "On Track"
      if (status === 'unknown_due') {
        return (
          <DataBadge variant="secondary" size="sm">
            <Clock className="size-3" /> Needs Review
          </DataBadge>
        );
      }
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

/**
 * Compute next due date string from lastCompletedDate + intervalDays,
 * or from dueDate if available.
 */
function getNextDueText(
  dueDate: string | null,
  lastCompletedDate: string | null,
  intervalDays: number | null,
): string | null {
  // Try to compute from interval
  if (lastCompletedDate && intervalDays && intervalDays > 0) {
    const lastDate = new Date(lastCompletedDate);
    const nextDate = new Date(lastDate.getTime() + intervalDays * 86400000);
    const now = new Date();
    const diffMs = nextDate.getTime() - now.getTime();
    const diffMonths = Math.round(diffMs / (30.44 * 86400000));

    const formatted = nextDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
    });

    if (diffMonths > 1) {
      return `Next check: ${formatted} (in ~${diffMonths} months)`;
    } else if (diffMonths === 1) {
      return `Next check: ${formatted} (in ~1 month)`;
    } else {
      return `Next check: ${formatted}`;
    }
  }

  // Fall back to due date
  if (dueDate) {
    const d = new Date(dueDate);
    return `Next check: ${d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`;
  }

  return null;
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
      return 'On Track';
    case 'unknown_due':
      return 'Due date unknown — needs review';
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

function TargetCard({
  target,
  patientName,
  isOnTrack,
  onApproved,
}: {
  target: TargetFact;
  patientName: string;
  isOnTrack: boolean;
  onApproved: (action: string | null) => void;
}) {
  const evidenceRefs = parseEvidenceRefs(target.evidenceRefs);
  const nextDueText = getNextDueText(
    target.dueDate,
    target.lastCompletedDate,
    target.intervalDays,
  );

  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-5 border-l-4',
        getCategoryBorder(target.category),
        isOnTrack
          ? 'border-border/60 opacity-80'
          : 'border-border',
      )}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <h3
            className={cn(
              'text-h3',
              isOnTrack ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {target.screeningType ?? target.condition ?? 'Target'}
          </h3>
          {target.condition && target.screeningType && (
            <p className="text-sm text-muted-foreground">
              Condition: {target.condition}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {getCategoryBadge(target.category, target.status)}
          {getConfidenceBadge(target.confidence)}
        </div>
      </div>

      {/* Action */}
      {target.action && (
        <div className="mb-3">
          {isOnTrack ? (
            <>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Last Action
              </span>
              <p className="text-sm text-muted-foreground mt-0.5">
                {target.action}
              </p>
            </>
          ) : (
            <>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recommended Action
              </span>
              <p className="text-sm text-foreground font-medium mt-0.5">
                {target.action}
              </p>
            </>
          )}
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
            target.status === 'unknown_due' && 'text-muted-foreground',
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

      {/* Next due date for on-track items */}
      {isOnTrack && nextDueText && (
        <div className="mb-4 text-sm text-foreground font-medium flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          {nextDueText}
        </div>
      )}

      {/* Why sections */}
      <div className="grid gap-3 sm:grid-cols-2 mb-4">
        {target.whyThisAction && (
          <div className="rounded-md bg-muted border border-border/50 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Why this action
            </p>
            <p className="text-sm text-foreground">
              {target.whyThisAction}
            </p>
          </div>
        )}
        {target.whyNow && (
          <div className="rounded-md bg-muted border border-border/50 p-3">
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
          {!isOnTrack && (
            <ApproveButton
              patientName={patientName}
              action={target.action ?? 'Recommendation'}
              condition={target.condition}
              providerRoute={target.providerRoute}
              whyThisAction={target.whyThisAction}
              onApproved={() => onApproved(target.action)}
            />
          )}
        </div>
      </div>
    </div>
  );
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
  const [onTrackExpanded, setOnTrackExpanded] = useState(false);

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

  // Split targets into actionable vs on-track
  const { actionableTargets, onTrackTargets } = useMemo(() => {
    const actionable: TargetFact[] = [];
    const onTrack: TargetFact[] = [];
    for (const t of targets) {
      if (t.status === 'up_to_date' && t.category === 'green') {
        onTrack.push(t);
      } else {
        actionable.push(t);
      }
    }
    return { actionableTargets: actionable, onTrackTargets: onTrack };
  }, [targets]);

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

      {/* Actionable Target Cards */}
      {actionableTargets.length > 0 && (
        <div className="space-y-4">
          {actionableTargets.map((target) => (
            <TargetCard
              key={target.id}
              target={target}
              patientName={patientName}
              isOnTrack={false}
              onApproved={handleApproved}
            />
          ))}
        </div>
      )}

      {/* On Track Items — collapsed by default */}
      {onTrackTargets.length > 0 && (
        <div>
          <button
            onClick={() => setOnTrackExpanded((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            {onTrackExpanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
            <CheckCircle2 className="size-4 text-success" />
            On Track Items ({onTrackTargets.length})
          </button>
          {onTrackExpanded && (
            <div className="space-y-4 mt-2">
              {onTrackTargets.map((target) => (
                <TargetCard
                  key={target.id}
                  target={target}
                  patientName={patientName}
                  isOnTrack={true}
                  onApproved={handleApproved}
                />
              ))}
            </div>
          )}
        </div>
      )}

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
