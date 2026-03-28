'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/* ---------------------------------- Context --------------------------------- */

const PageTabsContext = React.createContext<string>('');

/* ---------------------------------- Types ----------------------------------- */

/** Props for the PageTabs component */
export interface PageTabsProps {
  /** Tab definitions (value is used as the key, label is displayed) */
  tabs: { value: string; label: string }[];
  /** The tab value to select by default */
  defaultValue?: string;
  /** Callback fired when the active tab changes */
  onChange?: (value: string) => void;
  /** Tab panel content — use PageTabsContent for each tab */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/** Props for PageTabsContent */
export interface PageTabsContentProps {
  /** The tab value this panel corresponds to */
  value: string;
  children: React.ReactNode;
  className?: string;
}

/* -------------------------------- PageTabs --------------------------------- */

/**
 * Modern pill-style page tabs with a sliding active indicator that smoothly
 * animates between tabs. Shares active state with PageTabsContent via React
 * context.
 */
export function PageTabs({
  tabs,
  defaultValue,
  onChange,
  children,
  className,
}: PageTabsProps) {
  const [activeTab, setActiveTab] = React.useState(
    defaultValue ?? tabs[0]?.value ?? '',
  );
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const tabRefs = React.useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0 });
  const [ready, setReady] = React.useState(false);

  // Measure and position the sliding indicator
  const updateIndicator = React.useCallback(() => {
    const container = tabsRef.current;
    if (!container) return;
    const activeEl = tabRefs.current.get(activeTab);
    if (!activeEl) return;

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    setIndicator({
      left: activeRect.left - containerRect.left,
      width: activeRect.width,
    });
    setReady(true);
  }, [activeTab]);

  React.useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Recalculate on resize
  React.useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const handleChange = (value: string) => {
    setActiveTab(value);
    onChange?.(value);
  };

  return (
    <PageTabsContext value={activeTab}>
      <div data-slot="page-tabs" className={cn('w-full', className)}>
        {/* Tab bar */}
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Page tabs"
          className="relative inline-flex items-center gap-1 rounded-lg border border-border bg-bg-muted p-1"
        >
          {/* Sliding indicator */}
          <div
            className={cn(
              'absolute top-1 h-[calc(100%-8px)] rounded-md bg-white shadow-sm',
              ready ? 'transition-all duration-200 ease-out' : '',
            )}
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden="true"
          />

          {tabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                ref={(el) => {
                  if (el) {
                    tabRefs.current.set(tab.value, el);
                  } else {
                    tabRefs.current.delete(tab.value);
                  }
                }}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`page-tab-panel-${tab.value}`}
                id={`page-tab-${tab.value}`}
                data-tab-value={tab.value}
                onClick={() => handleChange(tab.value)}
                className={cn(
                  'relative z-10 rounded-md px-3.5 py-1.5 text-caption transition-colors duration-150 outline-none',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                  isActive
                    ? 'text-foreground font-semibold'
                    : 'text-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab panels */}
        {children}
      </div>
    </PageTabsContext>
  );
}

/* ----------------------------- PageTabsContent ----------------------------- */

/**
 * Content panel for a single PageTabs tab.
 * Only renders when the parent PageTabs has this value active.
 */
export function PageTabsContent({
  value,
  className,
  children,
}: PageTabsContentProps) {
  const activeTab = React.useContext(PageTabsContext);
  const isActive = activeTab === value;

  return (
    <div
      id={`page-tab-panel-${value}`}
      role="tabpanel"
      aria-labelledby={`page-tab-${value}`}
      data-slot="page-tabs-content"
      hidden={!isActive}
      className={cn('mt-4', className)}
    >
      {isActive && children}
    </div>
  );
}
