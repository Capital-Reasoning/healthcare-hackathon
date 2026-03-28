'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const TOOL_LABELS: Record<string, string> = {
  queryPatients: 'Searching patients',
  getPatientDetail: 'Loading patient details',
  searchDocuments: 'Searching documents',
  keywordSearch: 'Keyword search',
  listDocuments: 'Listing documents',
  getDocumentChunk: 'Reading document chunk',
  getMetrics: 'Fetching metrics',
};

interface ToolInvocationDisplayProps {
  toolName: string;
  state: string;
  input?: unknown;
  output?: unknown;
  /** When true, no outer border/bg — parent container handles grouping */
  grouped?: boolean;
}

export function ToolInvocationDisplay({
  toolName,
  state,
  input,
  output,
  grouped,
}: ToolInvocationDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolName] ?? toolName;

  const isComplete = state === 'output-available';
  const isError = state === 'error';

  return (
    <div
      className={cn(
        'text-xs',
        !grouped && 'my-1.5 rounded-lg border border-border/50 bg-bg-muted/40',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left transition-colors hover:bg-bg-muted/60"
      >
        {isError ? (
          <AlertCircle className="size-3 text-destructive" />
        ) : isComplete ? (
          <Check className="size-3 text-success" />
        ) : (
          <Loader2 className="size-3 animate-spin text-primary" />
        )}

        <span
          className={cn(
            'flex-1 font-medium',
            isComplete ? 'text-text-secondary' : 'text-text-primary',
          )}
        >
          {label}
          {!isComplete && !isError && (
            <span className="ml-1 text-text-muted shimmer">…</span>
          )}
        </span>

        {expanded ? (
          <ChevronDown className="size-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border/30 px-2.5 py-2 animate-expand">
          {input != null && (
            <div className="mb-1.5">
              <span className="font-semibold text-text-muted">Input:</span>
              <pre className="mt-0.5 overflow-x-auto rounded bg-bg-inset p-1.5 font-mono text-[10px] leading-relaxed text-text-secondary">
                {JSON.stringify(input, null, 2)}
              </pre>
            </div>
          )}

          {isComplete && output != null && (
            <div>
              <span className="font-semibold text-text-muted">Result:</span>
              <pre className="mt-0.5 overflow-x-auto rounded bg-bg-inset p-1.5 font-mono text-[10px] leading-relaxed text-text-secondary">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
