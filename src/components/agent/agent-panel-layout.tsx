'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAgentStore } from '@/stores/agent-store';
import { useMediaQuery } from '@/lib/hooks/use-media-query';
import { AgentPanel } from './agent-panel';
import { cn } from '@/lib/utils';

const MIN_WIDTH = 360;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH_PERCENT = 0.4;

/**
 * Floating card wrapper with animated gradient border during streaming.
 */
/** Card radius in px — single source of truth for all layers */
const CARD_RADIUS = 16;

function PanelCard() {
  const isActive = useAgentStore((s) => s.isStreaming);

  return (
    <div className="relative h-full">
      {/* Animated gradient — Apple Intelligence style */}
      <div
        className={cn(
          'pointer-events-none absolute transition-opacity duration-700',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
        style={{
          inset: -3,
          borderRadius: CARD_RADIUS + 3,
          background: 'conic-gradient(from var(--gradient-angle, 0deg), #F97316, #EF4444, #A855F7, #6366F1, #0EA5E9, #F97316)',
          animation: isActive ? 'spin-gradient 2.5s linear infinite' : 'none',
          filter: 'blur(2px)',
        }}
      />

      {/* Static border when idle */}
      <div
        className={cn(
          'pointer-events-none absolute border border-border/40 transition-opacity duration-700',
          isActive ? 'opacity-0' : 'opacity-100',
        )}
        style={{
          inset: -1,
          borderRadius: CARD_RADIUS + 1,
        }}
      />

      {/* Card body */}
      <div
        className="relative flex h-full flex-col overflow-hidden bg-white shadow-lg glow-sm"
        style={{ borderRadius: CARD_RADIUS }}
      >
        <AgentPanel />
      </div>
    </div>
  );
}

export function AgentPanelLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useAgentStore();
  const isMobile = useMediaQuery('(max-width: 639px)');
  const [panelWidth, setPanelWidth] = useState(() =>
    typeof window !== 'undefined'
      ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(window.innerWidth * DEFAULT_WIDTH_PERCENT)))
      : 480,
  );
  const isResizing = useRef(false);

  // ⌘. keyboard shortcut to toggle panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        toggle();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = window.innerWidth - ev.clientX;
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, newWidth)));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <>
      {/* Main content — @container for responsive grid queries */}
      <main className="@container/main min-w-0 flex-1 overflow-y-auto p-6">
        {children}
      </main>

      {/* Desktop/tablet: floating card sidebar */}
      {!isMobile && (
        <>
          {/* Collapsed pull-tab — vertical bar with label to reopen */}
          {!isOpen && (
            <button
              type="button"
              onClick={toggle}
              className="group flex w-10 shrink-0 cursor-pointer flex-col items-center justify-start gap-2 border-l border-border/30 bg-white pt-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
              aria-label="Open BestPath AI"
            >
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-primary/50 to-primary/20 transition-colors group-hover:from-primary group-hover:to-primary/40" />
              <span
                className="text-[11px] font-bold tracking-wider text-foreground transition-colors group-hover:text-primary"
                style={{ writingMode: 'vertical-rl' }}
              >
                BestPath AI
              </span>
            </button>
          )}

          <aside
            className={cn(
              'relative flex-shrink-0 overflow-hidden transition-[width] duration-300 ease-out',
              isOpen ? '' : 'w-0',
            )}
            style={isOpen ? { width: panelWidth } : undefined}
          >
            {/* Resize handle */}
            <div
              onMouseDown={handleResizeStart}
              className="absolute inset-y-0 left-0 z-10 w-1.5 cursor-col-resize transition-colors hover:bg-primary/20 active:bg-primary/30"
            />

            {/* Floating card wrapper */}
            <div className="h-full py-3 pr-3 pl-1.5">
              <PanelCard />
            </div>
          </aside>
        </>
      )}

      {/* Mobile: bottom bar + slide-up panel */}
      {isMobile && (
        <>
          {/* Bottom bar to summon the agent panel */}
          <button
            type="button"
            onClick={toggle}
            className={cn(
              'fixed inset-x-0 bottom-0 z-30 flex h-[52px] items-center gap-2.5 rounded-t-2xl bg-white px-5',
              'shadow-[0_-4px_20px_rgba(11,133,133,0.12)] border-t border-primary/20',
              'transition-all duration-300 ease-out',
              isOpen
                ? 'pointer-events-none translate-y-full opacity-0'
                : 'translate-y-0 opacity-100',
            )}
          >
            <span className="inline-block size-2 rounded-full bg-primary" />
            <span className="text-body-sm font-medium text-foreground">
              Ask BestPath AI
            </span>
          </button>
          <AgentPanel />
        </>
      )}
    </>
  );
}
