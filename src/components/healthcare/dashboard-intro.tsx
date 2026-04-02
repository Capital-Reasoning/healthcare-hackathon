'use client';

import { type ReactNode } from 'react';
import {
  ArrowRight,
  ClipboardList,
  FileSearch,
  GitCompareArrows,
  ShieldCheck,
} from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysis-store';
import { Button } from '@/components/ui/button';

const PROCESS_STEPS = [
  {
    icon: ClipboardList,
    title: 'Ingest Patient Records',
    description:
      'Electronic health records — encounters, medications, lab results, and vitals — are loaded into a structured clinical data model.',
  },
  {
    icon: FileSearch,
    title: 'Match Against Guidelines',
    description:
      'Each patient profile is cross-referenced against uploaded clinical practice guidelines using AI-powered document analysis and retrieval.',
  },
  {
    icon: GitCompareArrows,
    title: 'Identify Care Gaps',
    description:
      'The engine detects overdue screenings, missed follow-ups, and recommended actions by comparing patient history to guideline timelines.',
  },
  {
    icon: ShieldCheck,
    title: 'Prioritize & Triage',
    description:
      'Results are categorized by urgency — urgent, follow-up, or on-track — with confidence scores and cited evidence for each recommendation.',
  },
];

export function DashboardIntro({ children }: { children: ReactNode }) {
  const hasAnalyzed = useAnalysisStore((s) => s.hasAnalyzed);
  const setAnalyzed = useAnalysisStore((s) => s.setAnalyzed);

  if (hasAnalyzed) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-h1 text-foreground">
            Care Review Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
            BestPath analyses patient records against clinical practice
            guidelines to surface prioritized care actions. Here&apos;s how it
            works.
          </p>
        </div>

        {/* Process steps */}
        <div className="mt-10 space-y-0">
          {PROCESS_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Connecting line */}
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="absolute left-[17px] top-10 bottom-0 w-px bg-border" />
                )}

                {/* Step number + icon */}
                <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white">
                  <Icon className="size-4 text-foreground" />
                </div>

                {/* Content */}
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Step {i + 1}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center">
          <Button
            size="lg"
            onClick={setAnalyzed}
            className="gap-2 px-6"
          >
            View Dashboard
            <ArrowRight className="size-4" />
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Assessment data has already been computed for all patients.
          </p>
        </div>
      </div>
    </div>
  );
}
