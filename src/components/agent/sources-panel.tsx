'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { CitationPill } from './citation-pill';

interface Source {
  documentTitle: string;
  pageNumber?: number | null;
  heading?: string | null;
  excerpt: string;
  score?: number;
}

interface SourcesPanelProps {
  sources: Source[];
}

export function SourcesPanel({ sources }: SourcesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (sources.length === 0) return null;

  return (
    <div className="mt-2 rounded-lg border border-border bg-card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <BookOpen className="size-3.5" />
        Sources ({sources.length})
        {isOpen ? (
          <ChevronDown className="ml-auto size-3.5" />
        ) : (
          <ChevronRight className="ml-auto size-3.5" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-2 border-t border-border px-3 py-2">
          {sources.map((source, i) => (
            <div key={i} className="space-y-1">
              <CitationPill
                documentTitle={source.documentTitle}
                page={source.pageNumber ?? undefined}
                excerpt={source.excerpt.slice(0, 200)}
              />
              {source.heading && (
                <p className="pl-1 text-[10px] text-text-muted">
                  {source.heading}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
