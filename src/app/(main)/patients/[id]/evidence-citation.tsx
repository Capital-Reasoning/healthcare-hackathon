'use client';

import { useState } from 'react';
import { BookOpen, FileText, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface EvidenceRef {
  docId: string | null;
  chunkId: string | null;
  documentTitle: string;
  excerpt: string;
}

interface ChunkData {
  id: string;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  chunkIndex: number;
  documentId: string | null;
  documentTitle: string;
}

export function EvidenceCitation({ refs }: { refs: EvidenceRef[] }) {
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!refs || refs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No supporting documents cited for this recommendation.
      </p>
    );
  }

  async function handleViewSource(chunkId: string | null) {
    if (!chunkId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chunks/${chunkId}`);
      const json = await res.json();
      if (json.data) {
        setSelectedChunk(json.data as ChunkData);
        setDialogOpen(true);
      }
    } catch {
      // silently fail — evidence is supplementary
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <BookOpen className="size-3" />
          Evidence
        </div>
        <ol className="space-y-2">
          {refs.map((ref, idx) => (
            <li
              key={idx}
              className="border-l-2 border-primary/30 pl-3 text-sm"
            >
              <span className="font-medium text-foreground">
                [{idx + 1}]
              </span>{' '}
              <span className="font-medium text-foreground/80">
                &ldquo;{ref.documentTitle}&rdquo;
              </span>{' '}
              <span className="text-muted-foreground">
                &mdash; &ldquo;{ref.excerpt}&rdquo;
              </span>
              {ref.chunkId && (
                <Button
                  variant="link"
                  size="xs"
                  className="ml-1 h-auto p-0 text-xs"
                  onClick={() => handleViewSource(ref.chunkId)}
                  disabled={loading}
                >
                  <ExternalLink className="size-3" data-icon="inline-start" />
                  View full text
                </Button>
              )}
            </li>
          ))}
        </ol>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              {selectedChunk?.documentTitle ?? 'Source Document'}
            </DialogTitle>
            {selectedChunk?.heading && (
              <DialogDescription>
                Section: {selectedChunk.heading}
                {selectedChunk.pageNumber != null &&
                  ` | Page ${selectedChunk.pageNumber}`}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
            {selectedChunk?.content ?? 'Loading...'}
          </div>
          <DialogFooter showCloseButton />
        </DialogContent>
      </Dialog>
    </>
  );
}
