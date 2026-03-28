'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Loader2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataBadge } from '@/components/data-display/badge';
import { RiskBadge } from '@/components/healthcare/risk-badge';
import type { RiskLevel } from '@/components/healthcare/risk-badge';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import type { TriageItem } from '@/lib/db/queries/engine-results';

/* ─── Types ─────────────────────────────────────────── */

interface TriageDashboardProps {
  items: TriageItem[];
  stats: {
    assessed: number;
    needAction: number;
    onTrack: number;
  };
}

type AnimationPhase =
  | 'idle'
  | 'connecting'
  | 'comparing'
  | 'scoring'
  | 'done';

const PHASE_MESSAGES: Record<AnimationPhase, string> = {
  idle: '',
  connecting: 'Matching patient records to clinical guidelines...',
  comparing: 'Comparing care history against recommended pathways...',
  scoring: 'Categorizing findings by clinical priority...',
  done: '',
};

/* ─── Helpers ───────────────────────────────────────── */

function splitByConfidence(items: TriageItem[]) {
  const high: TriageItem[] = [];
  const lower: TriageItem[] = [];
  for (const item of items) {
    if (item.confidence === 'high') {
      high.push(item);
    } else {
      lower.push(item);
    }
  }
  return { high, lower };
}

function riskTierToLevel(tier: string | null): RiskLevel {
  switch (tier) {
    case 'high':
      return 'high';
    case 'medium':
      return 'medium';
    case 'low':
      return 'low';
    default:
      return 'medium';
  }
}

/* ─── Done-patient helpers ─────────────────────────── */

const DONE_KEY = 'bestpath-done';

/** Returns map of patientId → timestamp (ms) when marked done */
function getDoneMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(DONE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function getDoneIds(): Set<string> {
  return new Set(Object.keys(getDoneMap()));
}

export function markPatientDone(patientId: string) {
  const map = getDoneMap();
  map[patientId] = Date.now();
  sessionStorage.setItem(DONE_KEY, JSON.stringify(map));
}

export function unmarkPatientDone(patientId: string) {
  const map = getDoneMap();
  delete map[patientId];
  sessionStorage.setItem(DONE_KEY, JSON.stringify(map));
}

export function isPatientDone(patientId: string): boolean {
  return patientId in getDoneMap();
}

/* ─── Patient Triage Card ───────────────────────────── */

function TriageCard({ item, dealtWith }: { item: TriageItem; dealtWith: boolean }) {
  return (
    <Link
      href={`/patients/${item.patientId}`}
      className={`group block rounded-lg border p-4 shadow-sm transition-all ${
        dealtWith
          ? 'border-border/50 bg-card/60 opacity-50'
          : 'border-border bg-card hover:shadow-md hover:border-primary/30'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-foreground truncate">
            {item.firstName} {item.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {item.age != null ? `${item.age}y` : ''}
            {item.sex ? ` ${item.sex}` : ''}
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0 mt-0.5" />
      </div>

      {/* Condition + Action */}
      <div className="mt-2">
        {item.condition && (
          <p className="text-xs font-medium text-foreground">{item.condition}</p>
        )}
        {item.action && (
          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
            {item.action}
          </p>
        )}
      </div>

      {/* Badges row */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {dealtWith && (
          <DataBadge variant="secondary" size="sm">
            <CheckCircle2 className="size-3 mr-0.5" />
            Done
          </DataBadge>
        )}
        {item.overdueDays != null && item.overdueDays > 0 && (
          <DataBadge variant="error" size="sm">
            {item.overdueDays}d overdue
          </DataBadge>
        )}
        {item.confidence && (
          <DataBadge
            variant={item.confidence === 'high' ? 'success' : item.confidence === 'medium' ? 'warning' : 'secondary'}
            size="sm"
          >
            Confidence: {item.confidence}
          </DataBadge>
        )}
        <RiskBadge
          level={riskTierToLevel(item.riskTier)}
          label={`Risk: ${riskTierToLevel(item.riskTier).charAt(0).toUpperCase()}${riskTierToLevel(item.riskTier).slice(1)}`}
          size="sm"
          showIcon={false}
        />
      </div>
    </Link>
  );
}

/* ─── Confidence Sub-section ────────────────────────── */

function ConfidenceGroup({
  label,
  items,
  doneIds,
}: {
  label: string;
  items: TriageItem[];
  doneIds: Set<string>;
}) {
  if (items.length === 0) return null;

  // Sort: non-done first, done at the bottom
  const sorted = [...items].sort((a, b) => {
    const aDone = doneIds.has(a.patientId) ? 1 : 0;
    const bDone = doneIds.has(b.patientId) ? 1 : 0;
    return aDone - bDone;
  });

  return (
    <div className="mt-3">
      <p className="text-caption text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-col gap-2">
        {sorted.map((item) => (
          <TriageCard key={item.id} item={item} dealtWith={doneIds.has(item.patientId)} />
        ))}
      </div>
    </div>
  );
}

/* ─── Column ────────────────────────────────────────── */

interface TriageColumnProps {
  title: string;
  icon: React.ReactNode;
  accentClass: string;
  items: TriageItem[];
  doneIds: Set<string>;
}

function TriageColumn({ title, icon, accentClass, items, doneIds }: TriageColumnProps) {
  const { high, lower } = splitByConfidence(items);

  return (
    <div
      className={`flex flex-col rounded-lg border border-border bg-card shadow-sm p-4 ${accentClass}`}
    >
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <h3 className="text-h3 text-foreground">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-center text-sm text-muted-foreground py-6">
          No patients in this category
        </p>
      ) : (
        <>
          <ConfidenceGroup label="High Confidence" items={high} doneIds={doneIds} />
          <ConfidenceGroup label="Lower Confidence" items={lower} doneIds={doneIds} />
        </>
      )}
    </div>
  );
}

/* ─── Stats Bar ─────────────────────────────────────── */

function StatsBar({
  stats,
}: {
  stats: { assessed: number; needAction: number; onTrack: number };
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-body-sm">
      <div className="flex items-center gap-1.5 text-foreground">
        <ShieldCheck className="size-4 text-primary" />
        <span className="font-semibold">{stats.assessed}</span>
        <span className="text-muted-foreground">patients assessed</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-foreground">
        <AlertCircle className="size-4 text-error" />
        <span className="font-semibold">{stats.needAction}</span>
        <span className="text-muted-foreground">need action this week</span>
      </div>
      <div className="h-4 w-px bg-border" />
      <div className="flex items-center gap-1.5 text-foreground">
        <CheckCircle2 className="size-4 text-success" />
        <span className="font-semibold">{stats.onTrack}</span>
        <span className="text-muted-foreground">on track</span>
      </div>
    </div>
  );
}

/* ─── Analysis Animation ────────────────────────────── */

function AnalysisAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<AnimationPhase>('connecting');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 1: connecting (0-33%)
    timers.push(setTimeout(() => { setPhase('comparing'); setProgress(33); }, 1000));
    // Phase 2: comparing (33-66%)
    timers.push(setTimeout(() => { setPhase('scoring'); setProgress(66); }, 2000));
    // Phase 3: scoring (66-100%)
    timers.push(setTimeout(() => { setProgress(100); }, 2700));
    // Done
    timers.push(setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 3200));

    // Smooth progress increments
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        return prev + 1;
      });
    }, 30);

    return () => {
      timers.forEach(clearTimeout);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative mb-6">
        <div className="size-16 rounded-full border-4 border-primary/20 flex items-center justify-center">
          <Loader2 className="size-8 text-primary animate-spin" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64 h-1.5 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-body-sm text-muted-foreground text-center animate-pulse-subtle">
        {PHASE_MESSAGES[phase]}
      </p>
    </div>
  );
}

/* ─── Time filter options ──────────────────────────── */

type TimeFilter = 'all' | '1h' | 'today' | 'week';

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: '1h', label: 'Last hour' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This week' },
];

function filterByTime(doneMap: Record<string, number>, filter: TimeFilter): Set<string> {
  const now = Date.now();
  const entries = Object.entries(doneMap);
  if (filter === 'all') return new Set(entries.map(([id]) => id));

  const cutoff = filter === '1h'
    ? now - 60 * 60 * 1000
    : filter === 'today'
      ? new Date().setHours(0, 0, 0, 0)
      : now - 7 * 24 * 60 * 60 * 1000;

  return new Set(
    entries.filter(([, ts]) => ts >= cutoff).map(([id]) => id),
  );
}

function formatDoneTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/* ─── Completed Patients Section ───────────────────── */

function CompletedSection({
  items,
  doneMap,
}: {
  items: TriageItem[];
  doneMap: Record<string, number>;
}) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [rerunningAll, setRerunningAll] = useState(false);
  const [rerunningId, setRerunningId] = useState<string | null>(null);

  const doneIds = filterByTime(doneMap, timeFilter);
  // Deduplicate by patientId — one entry per patient
  const seen = new Set<string>();
  const doneItems = items.filter((i) => {
    if (!doneIds.has(i.patientId) || seen.has(i.patientId)) return false;
    seen.add(i.patientId);
    return true;
  });

  if (Object.keys(doneMap).length === 0) return null;

  async function rerunOne(patientId: string) {
    setRerunningId(patientId);
    try {
      const res = await fetch('/api/engine/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? 'Assessment failed');
      } else {
        toast.success('Assessment complete', {
          description: `Found ${json.data?.targets?.length ?? 0} targets`,
        });
      }
    } catch {
      toast.error('Failed to run assessment');
    } finally {
      setRerunningId(null);
    }
  }

  async function rerunAll() {
    setRerunningAll(true);
    const patientIds = doneItems.map((i) => i.patientId);
    let success = 0;
    for (const pid of patientIds) {
      try {
        const res = await fetch('/api/engine/assess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: pid }),
        });
        if (res.ok) success++;
      } catch {
        // continue with next
      }
    }
    toast.success(`Re-ran analysis for ${success}/${patientIds.length} patients`);
    setRerunningAll(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card shadow-sm p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-muted-foreground" />
          <h3 className="text-h3 text-foreground">
            Completed Patients
          </h3>
          <span className="text-xs text-muted-foreground font-medium">
            {doneItems.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Time filters */}
          <div className="flex items-center rounded-md border border-border bg-muted p-0.5 gap-0.5">
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setTimeFilter(f.value)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  timeFilter === f.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Rerun all */}
          <Button
            variant="outline"
            size="sm"
            disabled={rerunningAll || doneItems.length === 0}
            onClick={rerunAll}
            className="gap-1.5"
          >
            {rerunningAll ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Rerun All
          </Button>
        </div>
      </div>

      {doneItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No completed patients in this time range
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {doneItems.map((item) => {
            const ts = doneMap[item.patientId];
            const isRerunning = rerunningId === item.patientId;
            return (
              <div
                key={item.patientId}
                className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3"
              >
                <Link
                  href={`/patients/${item.patientId}`}
                  className="flex-1 min-w-0 hover:underline"
                >
                  <p className="text-body-sm font-medium text-foreground truncate">
                    {item.firstName} {item.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Done {ts ? formatDoneTime(ts) : ''}
                  </p>
                </Link>
                <button
                  type="button"
                  disabled={isRerunning || rerunningAll}
                  onClick={() => rerunOne(item.patientId)}
                  className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted disabled:opacity-40"
                  title="Rerun analysis"
                >
                  {isRerunning ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ────────────────────────────────── */

export function TriageDashboard({ items, stats }: TriageDashboardProps) {
  const [showResults, setShowResults] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [doneMap, setDoneMap] = useState<Record<string, number>>({});
  const liveItems = items;
  const liveStats = stats;

  // Load done state from sessionStorage on mount and after results appear
  useEffect(() => {
    setDoneIds(getDoneIds());
    setDoneMap(getDoneMap());
  }, [showResults]);

  // Listen for storage events (when patient is marked done from detail page)
  useEffect(() => {
    const onStorage = () => {
      setDoneIds(getDoneIds());
      setDoneMap(getDoneMap());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setAnimating(false);
    setShowResults(true);
  }, []);

  const handleAnalyze = useCallback(() => {
    // Always run the cosmetic animation — results are precomputed
    setAnimating(true);
  }, []);

  // Group items by category
  const red = liveItems.filter((i) => i.category === 'red');
  const yellow = liveItems.filter((i) => i.category === 'yellow');
  const green = liveItems.filter((i) => i.category === 'green');

  /* ── Analyze button (initial state) ── */
  if (!showResults && !animating) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary-tint">
            <Zap className="size-8 text-primary" />
          </div>
          <h2 className="text-h2 text-foreground mb-2">Analyze Patient Panel</h2>
          <p className="text-body-sm text-muted-foreground mb-8">
            BestPath will analyze your patient panel against clinical guidelines to
            identify overdue and high-value clinical actions.
          </p>

          <Button
            size="lg"
            onClick={handleAnalyze}
            className="min-w-48"
          >
            <Zap className="size-4" data-icon="inline-start" />
            Analyze Patient Panel
          </Button>
        </div>
      </div>
    );
  }

  /* ── Animation phase ── */
  if (animating) {
    return <AnalysisAnimation onComplete={handleAnimationComplete} />;
  }

  /* ── Results view ── */
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Stats bar */}
      <StatsBar stats={liveStats} />

      {/* Three-column triage grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ErrorBoundary>
          <TriageColumn
            title="Needs Urgent Action"
            icon={<AlertCircle className="size-5 text-error" />}
            accentClass="border-t-2 border-t-error"
            items={red}
            doneIds={doneIds}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TriageColumn
            title="Follow-up Required"
            icon={<Clock className="size-5 text-warning" />}
            accentClass="border-t-2 border-t-warning"
            items={yellow}
            doneIds={doneIds}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TriageColumn
            title="On Track"
            icon={<CheckCircle2 className="size-5 text-success" />}
            accentClass="border-t-2 border-t-success"
            items={green}
            doneIds={doneIds}
          />
        </ErrorBoundary>
      </div>

      {/* Completed patients section */}
      <CompletedSection items={liveItems} doneMap={doneMap} />
    </div>
  );
}
