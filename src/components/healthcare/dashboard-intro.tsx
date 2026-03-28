'use client';

import { useState, type ReactNode } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { useAnalysisStore } from '@/stores/analysis-store';
import { AnalysisAnimation } from '@/components/healthcare/analysis-animation';
import { Button } from '@/components/ui/button';

type Stage = 'idle' | 'animating' | 'revealing' | 'done';

export function DashboardIntro({ children }: { children: ReactNode }) {
  const hasAnalyzed = useAnalysisStore((s) => s.hasAnalyzed);
  const setAnalyzed = useAnalysisStore((s) => s.setAnalyzed);
  const [stage, setStage] = useState<Stage>(hasAnalyzed ? 'done' : 'idle');

  // Already analyzed → render children immediately
  if (stage === 'done') return <>{children}</>;

  function handleSkipAll() {
    setAnalyzed();
    setStage('done');
  }

  function handleComplete() {
    setStage('revealing');
    // Let the CSS transitions play, then mark done
    setTimeout(() => {
      setAnalyzed();
      setStage('done');
    }, 800);
  }

  return (
    <>
      {/* Dashboard content — hidden until revealing */}
      <div
        className={
          stage === 'revealing'
            ? 'animate-[dashboard-reveal_500ms_ease-out_200ms_forwards] opacity-0'
            : 'hidden'
        }
      >
        {children}
      </div>

      {/* Idle: dark themed pre-analysis screen matching navbar / cube animation */}
      {stage === 'idle' && (
        <div
          className="fixed inset-0 top-14 z-40 flex items-center justify-center p-8"
          style={{ background: '#07101b' }}
        >
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-white/[0.07] px-12 py-10 text-center shadow-2xl backdrop-blur-xl">
            <div className="rounded-full bg-teal-500/15 p-5">
              <Sparkles className="size-10 text-teal-400" />
            </div>
            <div className="flex flex-col gap-2">
              <h2 className="text-h2 text-white">Clinical Triage Analysis</h2>
              <p className="max-w-md text-body-sm text-white/60">
                Run BestPath&apos;s AI engine across patient records to identify prioritized
                care actions from clinical guideline analysis.
              </p>
            </div>
            <Button size="lg" onClick={() => setStage('animating')} className="gap-2 px-8">
              <Sparkles className="size-4" />
              Analyze Data
            </Button>
          </div>
        </div>
      )}

      {/* Animating: full-screen vector cube overlay */}
      {stage === 'animating' && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          style={{ background: '#07101b' }}
        >
          <AnalysisAnimation onComplete={handleComplete} />
          <button
            onClick={handleComplete}
            className="absolute bottom-6 right-6 font-mono text-xs tracking-wide text-white/30 transition-colors hover:text-white/60"
          >
            Skip
          </button>
        </div>
      )}

      {/* Dev skip: tiny star in bottom-left to jump straight to data */}
      <button
        onClick={handleSkipAll}
        className="fixed bottom-4 right-4 z-[60] rounded-full p-1.5 text-muted-foreground/20 transition-colors hover:text-muted-foreground/60"
        title="Skip to dashboard"
      >
        <Star className="size-3.5" />
      </button>

      {/* Revealing: overlay fading out */}
      {stage === 'revealing' && (
        <div
          className="pointer-events-none fixed inset-0 z-50 animate-[cube-fade-out_600ms_ease-in_forwards]"
          style={{ background: '#07101b' }}
        />
      )}
    </>
  );
}
