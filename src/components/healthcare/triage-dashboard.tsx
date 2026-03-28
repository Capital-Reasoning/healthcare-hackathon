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
} from 'lucide-react';
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

/* ─── Patient Triage Card ───────────────────────────── */

function TriageCard({ item }: { item: TriageItem }) {
  return (
    <Link
      href={`/patients/${item.patientId}`}
      className="group block rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
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
}: {
  label: string;
  items: TriageItem[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <p className="text-caption text-muted-foreground mb-2">{label}</p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <TriageCard key={item.id} item={item} />
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
}

function TriageColumn({ title, icon, accentClass, items }: TriageColumnProps) {
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
          <ConfidenceGroup label="High Confidence" items={high} />
          <ConfidenceGroup label="Lower Confidence" items={lower} />
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

/* ─── Main Component ────────────────────────────────── */

export function TriageDashboard({ items, stats }: TriageDashboardProps) {
  const [showResults, setShowResults] = useState(false);
  const [animating, setAnimating] = useState(false);
  const liveItems = items;
  const liveStats = stats;

  const hasData = liveItems.length > 0;

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const analyzed = sessionStorage.getItem('bestpath-analyzed');
      if (analyzed === 'true' && hasData) {
        setShowResults(true);
      }
    }
  }, [hasData]);

  const handleAnimationComplete = useCallback(() => {
    setAnimating(false);
    setShowResults(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bestpath-analyzed', 'true');
    }
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
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TriageColumn
            title="Follow-up Required"
            icon={<Clock className="size-5 text-warning" />}
            accentClass="border-t-2 border-t-warning"
            items={yellow}
          />
        </ErrorBoundary>

        <ErrorBoundary>
          <TriageColumn
            title="On Track"
            icon={<CheckCircle2 className="size-5 text-success" />}
            accentClass="border-t-2 border-t-success"
            items={green}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
