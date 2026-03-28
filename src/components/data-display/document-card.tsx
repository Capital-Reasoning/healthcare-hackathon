'use client';

import { FileText, Trash2, Loader2 } from 'lucide-react';
import { DataBadge } from './badge';

interface DocumentCardProps {
  id: string;
  title: string;
  filename?: string | null;
  pageCount?: number | null;
  tags?: string[] | null;
  createdAt?: Date | string | null;
  chunkCount?: number;
  status?: 'processing' | 'ready' | 'error';
  onDelete?: (id: string) => void;
}

export function DocumentCard({
  id,
  title,
  filename,
  pageCount,
  tags,
  createdAt,
  chunkCount,
  status = 'ready',
  onDelete,
}: DocumentCardProps) {
  const date = createdAt
    ? new Date(createdAt).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-tint">
        {status === 'processing' ? (
          <Loader2 className="size-5 animate-spin text-primary" />
        ) : (
          <FileText className="size-5 text-primary" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-foreground">
          {title}
        </h3>
        {filename && (
          <p className="truncate text-xs text-muted-foreground">{filename}</p>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {pageCount != null && <span>{pageCount} pages</span>}
          {chunkCount != null && <span>{chunkCount} chunks</span>}
          {date && <span>{date}</span>}
          {status === 'processing' && (
            <DataBadge variant="warning" size="sm">
              Processing
            </DataBadge>
          )}
          {status === 'error' && (
            <DataBadge variant="error" size="sm">
              Error
            </DataBadge>
          )}
        </div>

        {tags && tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <DataBadge key={tag} variant="default" size="sm">
                {tag}
              </DataBadge>
            ))}
          </div>
        )}
      </div>

      {onDelete && status !== 'processing' && (
        <button
          onClick={() => onDelete(id)}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  );
}
