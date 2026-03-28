'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FileText } from 'lucide-react';

interface CitationPillProps {
  documentTitle: string;
  page?: number;
  excerpt?: string;
}

export function CitationPill({
  documentTitle,
  page,
  excerpt,
}: CitationPillProps) {
  const label = page ? `${documentTitle}, p.${page}` : documentTitle;

  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex items-center gap-1 rounded-full bg-primary-tint px-2 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-tint-medium"
      >
        <FileText className="size-2.5" />
        {label}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="max-w-[300px] text-xs"
      >
        <p className="font-semibold text-text-primary">{documentTitle}</p>
        {page && <p className="text-text-muted">Page {page}</p>}
        {excerpt && (
          <p className="mt-1.5 border-t border-border pt-1.5 leading-relaxed text-text-secondary">
            {excerpt}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
