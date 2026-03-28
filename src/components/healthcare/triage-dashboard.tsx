'use client';

import { DataBadge } from '@/components/data-display/badge';
import { ErrorBoundary } from '@/components/feedback/error-boundary';
import type { RiskLevel } from '@/components/healthcare/risk-badge';
import { RiskBadge } from '@/components/healthcare/risk-badge';
import { Button } from '@/components/ui/button';
import type { TriageItem } from '@/lib/db/queries/engine-results';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────── */

interface TriageDashboardProps {
  items: TriageItem[];
  stats: {
    assessed: number;
    needAction: number;
    onTrack: number;
  };
}

type ConfidenceFilter = 'all' | 'high' | 'lower';

const CONFIDENCE_FILTERS: { value: ConfidenceFilter; label: string }[] = [
  { value: 'all', label: 'All Results' },
  { value: 'high', label: 'High Confidence' },
  { value: 'lower', label: 'Needs Review' },
];

/* ─── Helpers ───────────────────────────────────────── */

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
      className={`group block rounded-lg border p-4 shadow-sm transition-all ${dealtWith
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
        {(() => {
          const level = riskTierToLevel(item.riskTier);
          return <RiskBadge
            level={level}
            label={`Risk: ${level.charAt(0).toUpperCase()}${level.slice(1)}`}
            size="sm"
            showIcon={false}
          />;
        })()}
      </div>
    </Link>
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

const PAGE_SIZE = 10;

function TriageColumn({ title, icon, accentClass, items, doneIds }: TriageColumnProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Reset visible count when items change (e.g. confidence filter switch)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items.length]);

  // Sort: non-done first, then by actionValueScore descending
  const sorted = [...items].sort((a, b) => {
    const aDone = doneIds.has(a.patientId) ? 1 : 0;
    const bDone = doneIds.has(b.patientId) ? 1 : 0;
    if (aDone !== bDone) return aDone - bDone;
    return (b.actionValueScore ?? 0) - (a.actionValueScore ?? 0);
  });

  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visibleCount;

  return (
    <div
      className={`flex flex-col rounded-lg border border-border bg-card shadow-sm p-4 ${accentClass}`}
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className="text-h3 text-foreground">{title}</h3>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-6">
          No patients in this category
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {visible.map((item) => (
            <TriageCard key={item.id} item={item} dealtWith={doneIds.has(item.patientId)} />
          ))}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="mt-1 rounded-md border border-border bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Show more ({remaining} remaining)
            </button>
          )}
        </div>
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
        <span className="text-muted-foreground">need action</span>
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

/* ─── Time filter options ──────────────────────────── */

type TimeFilter = 'all' | 'week' | 'month' | 'year';

const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'week', label: 'Last week' },
  { value: 'month', label: 'Last month' },
  { value: 'year', label: 'Last year' },
];

function filterByTime(doneMap: Record<string, number>, filter: TimeFilter): Set<string> {
  const now = Date.now();
  const entries = Object.entries(doneMap);
  if (filter === 'all') return new Set(entries.map(([id]) => id));

  const cutoff = filter === 'week'
    ? now - 7 * 24 * 60 * 60 * 1000
    : filter === 'month'
      ? now - 30 * 24 * 60 * 60 * 1000
      : now - 365 * 24 * 60 * 60 * 1000;

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
    toast.info('Running assessment — this may take a minute or two', { duration: 5000 });
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
    toast.info('Rerunning all assessments — this will take several minutes', { duration: 8000 });
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
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${timeFilter === f.value
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
                  aria-label={`Rerun analysis for ${item.firstName} ${item.lastName}`}
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
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [doneMap, setDoneMap] = useState<Record<string, number>>({});
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');

  const syncDoneState = useCallback(() => {
    setDoneIds(getDoneIds());
    setDoneMap(getDoneMap());
  }, []);

  // Sync on mount and whenever the page becomes visible again (covers soft nav back)
  useEffect(() => {
    syncDoneState();
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncDoneState();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [syncDoneState]);

  // Apply confidence filter then group by category
  const filtered = confidenceFilter === 'all'
    ? items
    : confidenceFilter === 'high'
      ? items.filter((i) => i.confidence === 'high')
      : items.filter((i) => i.confidence !== 'high');

  const red = filtered.filter((i) => i.category === 'red');
  const yellow = filtered.filter((i) => i.category === 'yellow');
  const green = filtered.filter((i) => i.category === 'green');

  /* ── Results view ── */
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Stats bar + confidence filter */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <StatsBar stats={stats} />

        <div className="flex items-center rounded-md border border-border bg-muted p-0.5 gap-0.5">
          {CONFIDENCE_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setConfidenceFilter(f.value)}
              className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${confidenceFilter === f.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Three-column triage grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ErrorBoundary>
          <TriageColumn
            title="Needs Urgent Action"
            icon={<AlertCircle className="size-5 text-error" />}
            accentClass="border-t-[5px] border-t-error"
            items={red}
            doneIds={doneIds}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TriageColumn
            title="Follow-up Soon"
            icon={<Clock className="size-5 text-warning" />}
            accentClass="border-t-[5px] border-t-amber-400"
            items={yellow}
            doneIds={doneIds}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TriageColumn
            title="On Track"
            icon={<CheckCircle2 className="size-5 text-success" />}
            accentClass="border-t-[5px] border-t-success"
            items={green}
            doneIds={doneIds}
          />
        </ErrorBoundary>
      </div>

      {/* Completed patients section */}
      <CompletedSection items={items} doneMap={doneMap} />
    </div>
  );
}
