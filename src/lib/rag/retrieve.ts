import { embedQuery } from './embed';
import {
  searchDocumentChunks,
  keywordSearchChunks,
} from '@/lib/db/queries/documents';

export interface RetrievalResult {
  id: string;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  documentId: string | null;
  documentTitle: string;
  score: number;
  source: 'vector' | 'keyword' | 'hybrid';
}

export interface RetrievalOptions {
  mode?: 'vector' | 'keyword' | 'hybrid';
  topK?: number;
  documentId?: string;
  vectorWeight?: number;
  keywordWeight?: number;
}

/**
 * Unified retrieval entry point — performs vector, keyword, or hybrid search.
 * Used by both API routes and agent tools.
 */
export async function retrieve(
  query: string,
  options?: RetrievalOptions,
): Promise<RetrievalResult[]> {
  const mode = options?.mode ?? 'hybrid';
  const topK = options?.topK ?? 5;
  const documentId = options?.documentId;

  switch (mode) {
    case 'vector':
      return vectorSearch(query, topK, documentId);
    case 'keyword':
      return keywordSearch(query, topK, documentId);
    case 'hybrid':
      return hybridSearch(query, topK, documentId, options);
    default:
      return hybridSearch(query, topK, documentId, options);
  }
}

async function vectorSearch(
  query: string,
  topK: number,
  documentId?: string,
): Promise<RetrievalResult[]> {
  const queryEmbedding = await embedQuery(query);
  const results = await searchDocumentChunks(queryEmbedding, topK, documentId);

  return results.map((r) => ({
    id: r.id,
    content: r.content,
    pageNumber: r.pageNumber,
    heading: r.heading,
    documentId: r.documentId,
    documentTitle: r.documentTitle,
    score: r.similarity,
    source: 'vector' as const,
  }));
}

async function keywordSearch(
  query: string,
  topK: number,
  documentId?: string,
): Promise<RetrievalResult[]> {
  const results = await keywordSearchChunks(query, topK, documentId);

  return results.map((r) => ({
    id: r.id,
    content: r.content,
    pageNumber: r.pageNumber,
    heading: r.heading,
    documentId: r.documentId,
    documentTitle: r.documentTitle,
    score: r.rank,
    source: 'keyword' as const,
  }));
}

async function hybridSearch(
  query: string,
  topK: number,
  documentId?: string,
  options?: RetrievalOptions,
): Promise<RetrievalResult[]> {
  const vectorWeight = options?.vectorWeight ?? 1.0;
  const keywordWeight = options?.keywordWeight ?? 1.0;
  const fetchK = topK * 2; // Fetch more to allow RRF re-ranking

  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, fetchK, documentId),
    keywordSearch(query, fetchK, documentId),
  ]);

  return reciprocalRankFusion(
    vectorResults,
    keywordResults,
    topK,
    vectorWeight,
    keywordWeight,
  );
}

/**
 * Reciprocal Rank Fusion (RRF) — combines ranked results from two lists.
 * score(d) = Σ weight / (k + rank(d))
 * k = 60 (standard constant from the original RRF paper)
 */
function reciprocalRankFusion(
  vectorResults: RetrievalResult[],
  keywordResults: RetrievalResult[],
  topK: number,
  vectorWeight: number,
  keywordWeight: number,
): RetrievalResult[] {
  const k = 60;
  const scoreMap = new Map<string, number>();
  const resultMap = new Map<string, RetrievalResult>();

  // Score vector results
  vectorResults.forEach((result, rank) => {
    const rrfScore = vectorWeight / (k + rank + 1);
    scoreMap.set(result.id, (scoreMap.get(result.id) ?? 0) + rrfScore);
    resultMap.set(result.id, result);
  });

  // Score keyword results
  keywordResults.forEach((result, rank) => {
    const rrfScore = keywordWeight / (k + rank + 1);
    scoreMap.set(result.id, (scoreMap.get(result.id) ?? 0) + rrfScore);
    if (!resultMap.has(result.id)) {
      resultMap.set(result.id, result);
    }
  });

  // Sort by combined RRF score and take top K
  return Array.from(scoreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([id, score]) => ({
      ...resultMap.get(id)!,
      score,
      source: 'hybrid' as const,
    }));
}
