'use client';

import { useState, useCallback } from 'react';
import { Search, FileText, Loader2 } from 'lucide-react';
import { Page } from '@/components/layout/page';
import { Section } from '@/components/layout/section';
import { LayoutCard, CardContent } from '@/components/layout/card';
import { SearchBar } from '@/components/forms/search-bar';
import { CitationPill } from '@/components/agent/citation-pill';
import { Button } from '@/components/ui/button';

type SearchMode = 'hybrid' | 'vector' | 'keyword';

interface SearchResult {
  id: string;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  documentId: string | null;
  documentTitle: string;
  score: number;
  source: string;
}

export default function ResearchPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<SearchMode>('hybrid');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        query: query.trim(),
        mode,
        topK: '10',
      });
      const res = await fetch(`/api/documents/search?${params}`);
      const json = await res.json();
      setResults(json.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [query, mode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <Page
      title="Research"
      description="Search through uploaded clinical documents using AI-powered retrieval"
    >
      <Section>
        <div className="space-y-4">
          {/* Search controls */}
          <div className="flex gap-3" onKeyDown={handleKeyDown}>
            <div className="flex-1">
              <SearchBar
                placeholder="Search clinical documents..."
                value={query}
                onChange={setQuery}
                debounce={0}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className="shrink-0"
            >
              {isSearching ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Search className="mr-2 size-4" />
              )}
              Search
            </Button>
          </div>

          {/* Mode selector */}
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            {(
              [
                { value: 'hybrid', label: 'Hybrid' },
                { value: 'vector', label: 'Semantic' },
                { value: 'keyword', label: 'Keyword' },
              ] as const
            ).map((m) => (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === m.value
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* Results */}
      <Section>
        {isSearching && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-text-muted">
              Searching documents...
            </span>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <FileText className="size-12 text-text-muted/40" />
            <p className="mt-3 text-sm font-medium text-text-secondary">
              No results found
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Try a different query or search mode. Upload documents in Settings
              to build your knowledge base.
            </p>
          </div>
        )}

        {!isSearching && !hasSearched && (
          <div className="flex flex-col items-center py-12 text-center">
            <Search className="size-12 text-text-muted/40" />
            <p className="mt-3 text-sm font-medium text-text-secondary">
              Search your document library
            </p>
            <p className="mt-1 text-xs text-text-muted">
              Use semantic search to find relevant clinical guidelines, protocols,
              and research across all uploaded documents.
            </p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>

            {results.map((result) => (
              <LayoutCard key={result.id}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <CitationPill
                      documentTitle={result.documentTitle}
                      page={result.pageNumber ?? undefined}
                    />
                    <span className="shrink-0 text-[10px] text-text-muted">
                      {(result.score * 100).toFixed(0)}% match
                    </span>
                  </div>

                  {result.heading && (
                    <p className="mb-1 text-xs font-semibold text-text-secondary">
                      {result.heading}
                    </p>
                  )}

                  <p className="text-sm leading-relaxed text-text-primary">
                    {expandedId === result.id
                      ? result.content
                      : result.content.slice(0, 300) +
                        (result.content.length > 300 ? '...' : '')}
                  </p>

                  {result.content.length > 300 && (
                    <button
                      onClick={() =>
                        setExpandedId(
                          expandedId === result.id ? null : result.id,
                        )
                      }
                      className="mt-1 text-xs font-medium text-primary hover:underline"
                    >
                      {expandedId === result.id ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </CardContent>
              </LayoutCard>
            ))}
          </div>
        )}
      </Section>
    </Page>
  );
}
