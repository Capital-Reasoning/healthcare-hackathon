'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Stethoscope,
  Clock,
  FileText,
  FileQuestion,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { DataBadge } from '@/components/data-display/badge';
import { PatientDataTabs } from './patient-data-tabs';
import {
  TargetCard,
  type TargetFact,
  type ActivityEntry,
} from './assessment-results';
import { RunAssessmentButton } from './run-assessment-button';

interface PatientContentProps {
  engineResults: TargetFact[];
  runDate: string | null;
  patientName: string;
  patientId: string;
  encounters: any[];
  medications: any[];
  labResults: any[];
  vitals: any[];
}

export function PatientContent({
  engineResults,
  runDate,
  patientName,
  patientId,
  encounters,
  medications,
  labResults,
  vitals,
}: PatientContentProps) {
  const [activityLog, setActivityLog] = useState<ActivityEntry[]>(() =>
    runDate
      ? [{ timestamp: new Date(runDate), message: 'Assessment completed' }]
      : [],
  );
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
    for (const t of engineResults) {
      if (t.status === 'up_to_date' && t.category === 'green') {
        onTrack.push(t);
      } else {
        actionable.push(t);
      }
    }
    return { actionableTargets: actionable, onTrackTargets: onTrack };
  }, [engineResults]);

  const hasResults = engineResults.length > 0;

  const assessedDate = runDate
    ? new Date(runDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '--';

  // Empty state: no engine results at all
  if (!hasResults) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Summary row — all zeros */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-md border border-border bg-white">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Findings
            </p>
            <p className="text-2xl font-semibold text-foreground mt-1">0</p>
          </div>
          <div className="p-4 rounded-md border border-border bg-white">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Action Required
            </p>
            <p className="text-2xl font-semibold text-error mt-1">0</p>
          </div>
          <div className="p-4 rounded-md border border-border bg-white">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              On Track
            </p>
            <p className="text-2xl font-semibold text-success mt-1">0</p>
          </div>
          <div className="p-4 rounded-md border border-border bg-white">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Last Assessed
            </p>
            <p className="text-sm font-medium text-foreground mt-1">--</p>
          </div>
        </div>

        {/* Empty state message */}
        <div className="rounded-md border border-border bg-white p-8 text-center">
          <FileQuestion className="size-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-h3 text-foreground mb-1">
            No assessment results yet
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Run the BestPath engine to generate care pathway recommendations for
            this patient.
          </p>
          <RunAssessmentButton patientId={patientId} />
        </div>

        {/* Clinical Record always available */}
        <div className="space-y-4">
          <h2 className="text-h2 text-foreground flex items-center gap-2">
            <FileText className="size-5" />
            Clinical Record
          </h2>
          <PatientDataTabs
            encounters={encounters}
            medications={medications}
            labResults={labResults}
            vitals={vitals}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Summary stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-md border border-border bg-white">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Total Findings
          </p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {engineResults.length}
          </p>
        </div>
        <div className="p-4 rounded-md border border-border bg-white">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Action Required
          </p>
          <p className="text-2xl font-semibold text-error mt-1">
            {actionableTargets.length}
          </p>
        </div>
        <div className="p-4 rounded-md border border-border bg-white">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            On Track
          </p>
          <p className="text-2xl font-semibold text-success mt-1">
            {onTrackTargets.length}
          </p>
        </div>
        <div className="p-4 rounded-md border border-border bg-white">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Last Assessed
          </p>
          <p className="text-sm font-medium text-foreground mt-1">{assessedDate}</p>
        </div>
      </div>

      {/* Top-level tabs */}
      <Tabs defaultValue="assessment">
        <TabsList variant="line">
          <TabsTrigger value="assessment">
            <Stethoscope className="size-4" />
            Assessment ({actionableTargets.length + onTrackTargets.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Clock className="size-4" />
            Activity ({activityLog.length})
          </TabsTrigger>
          <TabsTrigger value="clinical">
            <FileText className="size-4" />
            Clinical Record
          </TabsTrigger>
        </TabsList>

        {/* ── Assessment Tab ─────────────────────────────────────── */}
        <TabsContent value="assessment">
          <div className="space-y-4 pt-2">
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

            {/* If no targets at all in this tab */}
            {actionableTargets.length === 0 && onTrackTargets.length === 0 && (
              <div className="rounded-md border border-border bg-white p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No assessment targets found.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Activity Tab ───────────────────────────────────────── */}
        <TabsContent value="activity">
          <div className="rounded-md border border-border bg-white p-5 mt-2">
            {activityLog.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center">
                No activity recorded yet.
              </p>
            ) : (
              <div className="space-y-2">
                {activityLog.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm">
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
            )}
          </div>
        </TabsContent>

        {/* ── Clinical Record Tab ────────────────────────────────── */}
        <TabsContent value="clinical">
          <div className="pt-2">
            <PatientDataTabs
              encounters={encounters}
              medications={medications}
              labResults={labResults}
              vitals={vitals}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
