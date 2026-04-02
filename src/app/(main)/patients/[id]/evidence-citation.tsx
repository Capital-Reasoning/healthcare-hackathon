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
  textAsHtml: string | null;
  pageNumber: number | null;
  heading: string | null;
  chunkIndex: number;
  documentId: string | null;
  documentTitle: string;
  sourceUrl: string | null;
}

/**
 * Safely decode a URI-encoded string.
 * Returns the original string if decoding fails (malformed encoding).
 */
function safeDecodeTitle(title: string): string {
  try {
    return decodeURIComponent(title);
  } catch {
    return title;
  }
}

export function EvidenceCitation({ refs }: { refs: EvidenceRef[] }) {
  const [selectedChunk, setSelectedChunk] = useState<ChunkData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!refs || refs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Evidence sources being updated
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
        <ul className="space-y-2.5">
          {refs.map((ref, idx) => (
            <li
              key={idx}
              className="border-l-2 border-primary/30 pl-3"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {safeDecodeTitle(ref.documentTitle)}
                </span>
                {ref.chunkId && (
                  <Button
                    variant="link"
                    size="xs"
                    className="ml-1 h-auto p-0 text-xs"
                    onClick={() => handleViewSource(ref.chunkId)}
                    disabled={loading}
                  >
                    <FileText className="size-3" data-icon="inline-start" />
                    View full text
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                {ref.excerpt}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="size-4" />
              {safeDecodeTitle(selectedChunk?.documentTitle ?? 'Source Document')}
            </DialogTitle>
            {selectedChunk?.heading && (
              <DialogDescription>
                Section: {selectedChunk.heading}
                {selectedChunk.pageNumber != null &&
                  ` | Page ${selectedChunk.pageNumber}`}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedChunk?.textAsHtml ? (
            <div
              className="rounded-md border border-border bg-gray-50 p-4 text-sm leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedChunk.textAsHtml }}
            />
          ) : (
            <div className="rounded-md border border-border bg-gray-50 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {selectedChunk?.content ?? 'Loading...'}
            </div>
          )}

          <DialogFooter showCloseButton>
            {selectedChunk?.sourceUrl && (
              <a
                href={selectedChunk.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
              >
                <ExternalLink className="size-4" />
                View Full Document
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
