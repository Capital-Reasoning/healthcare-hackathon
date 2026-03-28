import { eq, desc, count, cosineDistance, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { documents, documentChunks } from '@/lib/db/schema';

interface GetDocumentsParams {
  page: number;
  pageSize: number;
}

export async function getDocuments(params: GetDocumentsParams) {
  const { page, pageSize } = params;

  const [countResult, data] = await Promise.all([
    db.select({ total: count() }).from(documents),
    db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  return { data, total: countResult[0]?.total ?? 0 };
}

export async function getDocumentById(id: string) {
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, id),
  });

  if (!doc) return null;

  const [chunkCount] = await db
    .select({ count: count() })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, id));

  return { ...doc, chunkCount: chunkCount?.count ?? 0 };
}

export async function searchDocumentChunks(
  queryEmbedding: number[],
  topK: number = 5,
  documentId?: string,
) {
  const similarity = sql<number>`1 - (${cosineDistance(documentChunks.embedding, queryEmbedding)})`;

  const query = db
    .select({
      id: documentChunks.id,
      content: documentChunks.content,
      pageNumber: documentChunks.pageNumber,
      heading: documentChunks.heading,
      documentId: documentChunks.documentId,
      documentTitle: documents.title,
      similarity,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .orderBy(cosineDistance(documentChunks.embedding, queryEmbedding))
    .limit(topK);

  if (documentId) {
    return query.where(eq(documentChunks.documentId, documentId));
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
          dc.id,
          dc.content,
          dc.page_number as "pageNumber",
          dc.heading,
          dc.document_id as "documentId",
          d.title as "documentTitle",
          ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', ${query})) as rank
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${query})
          AND dc.document_id = ${documentId}
        ORDER BY rank DESC
        LIMIT ${limit}
      `
    : sql`
        SELECT
          dc.id,
          dc.content,
          dc.page_number as "pageNumber",
          dc.heading,
          dc.document_id as "documentId",
          d.title as "documentTitle",
          ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', ${query})) as rank
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${query})
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
      id: documentChunks.id,
      content: documentChunks.content,
      pageNumber: documentChunks.pageNumber,
      heading: documentChunks.heading,
      chunkIndex: documentChunks.chunkIndex,
      documentId: documentChunks.documentId,
      documentTitle: documents.title,
    })
    .from(documentChunks)
    .innerJoin(documents, eq(documentChunks.documentId, documents.id))
    .where(eq(documentChunks.id, chunkId))
    .limit(1);

  return result[0] ?? null;
}

/** Delete a document and all its chunks (cascade) */
export async function deleteDocument(id: string) {
  await db.delete(documents).where(eq(documents.id, id));
}
