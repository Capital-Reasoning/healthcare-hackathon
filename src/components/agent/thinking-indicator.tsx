'use client';

import { cn } from '@/lib/utils';

interface ThinkingIndicatorProps {
  toolName?: string;
}

const TOOL_LABELS: Record<string, string> = {
  queryPatients: 'Searching patients…',
  getPatientDetail: 'Loading patient details…',
  searchDocuments: 'Searching documents…',
  keywordSearch: 'Searching by keyword…',
  getMetrics: 'Fetching metrics…',
};

export function ThinkingIndicator({ toolName }: ThinkingIndicatorProps) {
  const label = toolName ? (TOOL_LABELS[toolName] ?? 'Processing…') : 'Thinking…';

  return (
    <div className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 glass-subtle animate-fade-in">
      {/* Three-dot pulse */}
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cn(
              'size-1.5 rounded-full bg-primary',
              'animate-pulse-subtle',
            )}
            style={{ animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>

      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
