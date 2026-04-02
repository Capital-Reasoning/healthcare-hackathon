'use client';

import { DataBadge } from '@/components/data-display/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TriageItem } from '@/lib/db/queries/engine-results';
import {
  CheckCircle2,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

/* ─── Types ─────────────────────────────────────────── */

interface TriageDashboardProps {
  items: TriageItem[];
}

type ConfidenceFilter = 'all' | 'high' | 'lower';

const CONFIDENCE_FILTERS: { value: ConfidenceFilter; label: string }[] = [
  { value: 'all', label: 'All Results' },
  { value: 'high', label: 'High Confidence' },
  { value: 'lower', label: 'Needs Review' },
];

/* ─── Helpers ───────────────────────────────────────── */

const AVATAR_COLORS = [
  'bg-teal-100 text-teal-700',
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-emerald-100 text-emerald-700',
  'bg-indigo-100 text-indigo-700',
  'bg-cyan-100 text-cyan-700',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

function getCategoryAccent(category: string | null): string {
  switch (category) {
    case 'red': return 'border-l-red-400';
    case 'yellow': return 'border-l-amber-400';
    case 'green': return 'border-l-emerald-400';
    default: return 'border-l-gray-300';
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
  const fullName = `${item.firstName} ${item.lastName}`;
  const initials = `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`;
  const avatarColor = getAvatarColor(fullName);
  const accentBorder = getCategoryAccent(item.category);

  return (
    <Link
      href={`/patients/${item.patientId}`}
      className={`group block rounded-md border border-l-[3px] ${accentBorder} p-4 transition-colors ${dealtWith
        ? 'border-border/50 bg-gray-50 opacity-60'
        : 'border-border bg-white hover:bg-gray-50/80'
        }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <span className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${avatarColor}`}>
          {initials}
        </span>

        <div className="min-w-0 flex-1">
          {/* Name + demographics */}
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{fullName}</p>
            <span className="text-xs text-muted-foreground">
              {item.age != null ? `${item.age}y` : ''}
              {item.sex ? ` ${item.sex}` : ''}
            </span>
            <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 shrink-0 ml-auto" />
          </div>

          {/* Condition */}
          {item.condition && (
            <p className="text-xs font-medium text-foreground mt-1">{item.condition}</p>
          )}

          {/* Action */}
          {item.action && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.action}</p>
          )}

          {/* Badges — simplified */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
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
                {item.confidence.charAt(0).toUpperCase() + item.confidence.slice(1)} confidence
              </DataBadge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Triage List Row ─────────────────────────────── */

function TriageListRow({ item, dealtWith }: { item: TriageItem; dealtWith: boolean }) {
  const fullName = `${item.firstName} ${item.lastName}`;
  const initials = `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`;
  const avatarColor = getAvatarColor(fullName);
  const accentBorder = getCategoryAccent(item.category);

  return (
    <Link
      href={`/patients/${item.patientId}`}
      className={`group flex items-center gap-4 border-b border-border px-4 py-3 transition-colors ${dealtWith
        ? 'opacity-50'
        : 'hover:bg-gray-50'
        }`}
    >
      {/* Patient: accent dot + avatar + name */}
      <div className="flex items-center gap-2.5 w-44 shrink-0">
        <div className={`w-1 self-stretch rounded-full ${accentBorder.replace('border-l-', 'bg-')}`} />
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${avatarColor}`}>
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate">{fullName}</p>
          <p className="text-xs text-muted-foreground">
            {item.age != null ? `${item.age}y` : ''}{item.sex ? ` ${item.sex}` : ''}
          </p>
        </div>
      </div>

      {/* Condition */}
      <div className="w-48 shrink-0">
        <p className="text-xs font-medium text-foreground truncate">{item.condition ?? '--'}</p>
      </div>

      {/* Action — flexible */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{item.action ?? '--'}</p>
      </div>

      {/* Overdue */}
      <div className="w-20 shrink-0 text-right">
        {item.overdueDays != null && item.overdueDays > 0 ? (
          <DataBadge variant="error" size="sm">{item.overdueDays}d</DataBadge>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </div>

      {/* Confidence */}
      <div className="w-16 shrink-0 text-right">
        {item.confidence ? (
          <span className={`text-xs font-medium ${
            item.confidence === 'high' ? 'text-success' : item.confidence === 'medium' ? 'text-warning' : 'text-muted-foreground'
          }`}>
            {item.confidence.charAt(0).toUpperCase() + item.confidence.slice(1)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">--</span>
        )}
      </div>

      {/* Chevron */}
      <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
    </Link>
  );
}

/* ─── Paginated Content ──────────────────────────── */

const PAGE_SIZE = 30;
const PAGE_INCREMENT = 30;

/** Round up to the next multiple of 3 so the grid always fills evenly */
function nextMultipleOf3(n: number, total: number): number {
  const next = Math.ceil(n / 3) * 3;
  return Math.min(next, total);
}

function PaginatedContent({
  items,
  doneIds,
  viewMode,
}: {
  items: TriageItem[];
  doneIds: Set<string>;
  viewMode: 'list' | 'grid';
}) {
  const [visibleCount, setVisibleCount] = useState(() =>
    nextMultipleOf3(PAGE_SIZE, items.length),
  );

  // Reset visible count when items change (e.g. confidence filter switch)
  useEffect(() => {
    setVisibleCount(nextMultipleOf3(PAGE_SIZE, items.length));
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

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        No patients in this category
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((item) => (
            <TriageCard key={item.id} item={item} dealtWith={doneIds.has(item.patientId)} />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-white overflow-hidden">
          {/* List header */}
          <div className="flex items-center gap-4 border-b border-border bg-gray-50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <div className="w-44 pl-4">Patient</div>
            <div className="w-48">Primary Condition</div>
            <div className="flex-1">Recommended Action</div>
            <div className="w-20 text-right">Overdue</div>
            <div className="w-16 text-right">Conf.</div>
            <div className="w-4" />
          </div>
          {visible.map((item) => (
            <TriageListRow key={item.id} item={item} dealtWith={doneIds.has(item.patientId)} />
          ))}
        </div>
      )}
      {remaining > 0 && (
        <button
          type="button"
          onClick={() => setVisibleCount((c) => nextMultipleOf3(c + PAGE_INCREMENT, sorted.length))}
          className="mt-1 self-start rounded border border-border bg-gray-50 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Show more ({remaining} remaining)
        </button>
      )}
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

/* ─── Completed Tab Content ────────────────────────── */

function CompletedTabContent({
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

  if (Object.keys(doneMap).length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground py-6">
        No completed patients yet
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Time filter + rerun controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center rounded border border-border bg-gray-50 p-0.5 gap-0.5">
          {TIME_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTimeFilter(f.value)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${timeFilter === f.value
                ? 'bg-white text-foreground'
                : 'text-muted-foreground hover:text-foreground'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>

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

      {doneItems.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No completed patients in this time range
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {doneItems.map((item) => {
            const ts = doneMap[item.patientId];
            const isRerunning = rerunningId === item.patientId;
            return (
              <div
                key={item.patientId}
                className="flex items-center gap-3 rounded border border-border bg-gray-50 p-3"
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

export function TriageDashboard({ items }: TriageDashboardProps) {
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [doneMap, setDoneMap] = useState<Record<string, number>>({});
  const [confidenceFilter, setConfidenceFilter] = useState<ConfidenceFilter>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sexFilter, setSexFilter] = useState<string>('all');
  const [ageFilter, setAgeFilter] = useState<string>('all');

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

  // Apply all filters
  let filtered = items;

  // Sex filter
  if (sexFilter !== 'all') {
    filtered = filtered.filter((i) => i.sex?.toLowerCase() === sexFilter);
  }

  // Age filter
  if (ageFilter !== 'all') {
    filtered = filtered.filter((i) => {
      if (i.age == null) return false;
      switch (ageFilter) {
        case '0-18': return i.age <= 18;
        case '19-40': return i.age >= 19 && i.age <= 40;
        case '41-65': return i.age >= 41 && i.age <= 65;
        case '65+': return i.age > 65;
        default: return true;
      }
    });
  }

  // Confidence filter
  const afterConfidence = confidenceFilter === 'all'
    ? filtered
    : confidenceFilter === 'high'
      ? filtered.filter((i) => i.confidence === 'high')
      : filtered.filter((i) => i.confidence !== 'high');

  const red = afterConfidence.filter((i) => i.category === 'red');
  const yellow = afterConfidence.filter((i) => i.category === 'yellow');
  const green = afterConfidence.filter((i) => i.category === 'green');

  const doneCount = useMemo(() => Object.keys(doneMap).length, [doneMap]);

  const hasActiveFilters = sexFilter !== 'all' || ageFilter !== 'all';

  function clearFilters() {
    setSexFilter('all');
    setAgeFilter('all');
  }

  // Default to the first tab that has items, falling back to "urgent"
  const defaultTab = red.length > 0
    ? 'urgent'
    : yellow.length > 0
      ? 'followup'
      : green.length > 0
        ? 'ontrack'
        : 'urgent';

  /* ── Results view ── */
  return (
    <div className="flex flex-col gap-6 animate-fade-in-up">
      {/* Tabbed triage view */}
      <Tabs defaultValue={defaultTab}>
        {/* Tabs header: triggers on left, confidence filter on right */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-px">
          <TabsList variant="line">
            <TabsTrigger value="urgent">Urgent Action ({red.length})</TabsTrigger>
            <TabsTrigger value="followup">Follow-up ({yellow.length})</TabsTrigger>
            <TabsTrigger value="ontrack">On Track ({green.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({doneCount})</TabsTrigger>
          </TabsList>

          {/* Confidence filter */}
          <div className="flex items-center rounded border border-border bg-gray-50 p-0.5 gap-0.5">
            {CONFIDENCE_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setConfidenceFilter(f.value)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition-colors ${confidenceFilter === f.value
                  ? 'bg-white text-foreground shadow-sm border border-border'
                  : 'text-gray-500 hover:text-foreground'
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar: filters + view toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 pb-2">
          <div className="flex items-center gap-2">
            {/* Sex filter */}
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring cursor-pointer"
            >
              <option value="all">All sexes</option>
              <option value="m">Male</option>
              <option value="f">Female</option>
            </select>

            {/* Age filter */}
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="h-8 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring cursor-pointer"
            >
              <option value="all">All ages</option>
              <option value="0-18">0–18</option>
              <option value="19-40">19–40</option>
              <option value="41-65">41–65</option>
              <option value="65+">65+</option>
            </select>

            {/* Clear filters button — only shown when filters active */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3" />
                Clear
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-border p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <ListIcon className="size-3.5" />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <LayoutGrid className="size-3.5" />
              Grid
            </button>
          </div>
        </div>

        {/* Tab panels */}
        <TabsContent value="urgent" className="pt-2">
          <PaginatedContent items={red} doneIds={doneIds} viewMode={viewMode} />
        </TabsContent>

        <TabsContent value="followup" className="pt-2">
          <PaginatedContent items={yellow} doneIds={doneIds} viewMode={viewMode} />
        </TabsContent>

        <TabsContent value="ontrack" className="pt-2">
          <PaginatedContent items={green} doneIds={doneIds} viewMode={viewMode} />
        </TabsContent>

        <TabsContent value="completed" className="pt-2">
          <CompletedTabContent items={items} doneMap={doneMap} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
