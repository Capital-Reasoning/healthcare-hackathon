import { eq, desc, count, cosineDistance, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { corpusDocuments, corpusChunks } from '@/lib/db/schema';

interface GetDocumentsParams {
  page: number;
  pageSize: number;
}

export async function getDocuments(params: GetDocumentsParams) {
  const { page, pageSize } = params;

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(corpusDocuments),
    db
      .select()
      .from(corpusDocuments)
      .orderBy(desc(corpusDocuments.ingestedAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

export async function getDocumentById(id: string) {
  const doc = await db.query.corpusDocuments.findFirst({
    where: eq(corpusDocuments.id, id),
  });

  if (!doc) return null;

  const [chunkCountResult] = await db
    .select({ count: count() })
    .from(corpusChunks)
    .where(eq(corpusChunks.documentId, id));

  return { ...doc, chunkCount: chunkCountResult?.count ?? 0 };
}

export async function searchDocumentChunks(
  queryEmbedding: number[],
  topK: number = 5,
  documentId?: string,
) {
  const similarity = sql<number>`1 - (${cosineDistance(corpusChunks.embedding, queryEmbedding)})`;

  const query = db
    .select({
      id: corpusChunks.id,
      content: corpusChunks.content,
      pageNumber: corpusChunks.pageNumber,
      heading: corpusChunks.heading,
      documentId: corpusChunks.documentId,
      documentTitle: corpusDocuments.documentTitle,
      similarity,
    })
    .from(corpusChunks)
    .innerJoin(corpusDocuments, eq(corpusChunks.documentId, corpusDocuments.id))
    .orderBy(cosineDistance(corpusChunks.embedding, queryEmbedding))
    .limit(topK);

  if (documentId) {
    return query.where(eq(corpusChunks.documentId, documentId));
  }

  return query;
}

export interface KeywordSearchResult {
  id: string;
  content: string;
  pageNumber: number | null;
  heading: string | null;
  documentId: string | null;
  documentTitle: string;
  rank: number;
}

/** Full-text keyword search using PostgreSQL tsvector/tsquery */
export async function keywordSearchChunks(
  query: string,
  limit: number = 10,
  documentId?: string,
): Promise<KeywordSearchResult[]> {
  const baseQuery = documentId
    ? sql`
        SELECT
          cc.id,
          cc.content,
          cc.page_number as "pageNumber",
          cc.heading,
          cc.document_id as "documentId",
          cd.document_title as "documentTitle",
          ts_rank(to_tsvector('english', cc.content), plainto_tsquery('english', ${query})) as rank
        FROM corpus_chunks cc
        JOIN corpus_documents cd ON cd.id = cc.document_id
        WHERE to_tsvector('english', cc.content) @@ plainto_tsquery('english', ${query})
          AND cc.document_id = ${documentId}
        ORDER BY rank DESC
        LIMIT ${limit}
      `
    : sql`
        SELECT
          cc.id,
          cc.content,
          cc.page_number as "pageNumber",
          cc.heading,
          cc.document_id as "documentId",
          cd.document_title as "documentTitle",
          ts_rank(to_tsvector('english', cc.content), plainto_tsquery('english', ${query})) as rank
        FROM corpus_chunks cc
        JOIN corpus_documents cd ON cd.id = cc.document_id
        WHERE to_tsvector('english', cc.content) @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC
        LIMIT ${limit}
      `;

  const results = await db.execute(baseQuery);
  return results as unknown as KeywordSearchResult[];
}

/** Retrieve a single chunk by ID with document info */
export async function getChunkById(chunkId: string) {
  const result = await db
    .select({
      id: corpusChunks.id,
      content: corpusChunks.content,
      pageNumber: corpusChunks.pageNumber,
      heading: corpusChunks.heading,
      chunkIndex: corpusChunks.chunkIndex,
      documentId: corpusChunks.documentId,
      documentTitle: corpusDocuments.documentTitle,
    })
    .from(corpusChunks)
    .innerJoin(corpusDocuments, eq(corpusChunks.documentId, corpusDocuments.id))
    .where(eq(corpusChunks.id, chunkId))
    .limit(1);

  return result[0] ?? null;
}

/** Delete a document and all its chunks (cascade) */
export async function deleteDocument(id: string) {
  await db.delete(corpusDocuments).where(eq(corpusDocuments.id, id));
}
