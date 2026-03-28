import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { corpusDocuments, corpusChunks } from '@/lib/db/schema';
import { parseDocument } from './parse';
import { chunkMarkdown } from './chunk';
import { embedDocuments } from './embed';
import type { ChunkOptions } from './chunk';

const EMBED_BATCH_SIZE = 100;

export interface IngestionResult {
  documentId: string;
  chunksCreated: number;
  pageCount: number;
}

interface IngestOptions {
  title: string;
  chunkOptions?: ChunkOptions;
  /** Skip LlamaParse and use this markdown directly */
  precomputedMarkdown?: string;
}

/**
 * Full document ingestion pipeline:
 * create record -> parse -> chunk -> embed -> store
 */
export async function ingestDocument(
  file: File | Buffer,
  filename: string,
  mimeType: string,
  fileSize: number,
  options: IngestOptions,
): Promise<IngestionResult> {
  // Determine file type from mime or extension
  const fileType = mimeType.includes('pdf')
    ? 'pdf'
    : mimeType.includes('html')
      ? 'html'
      : filename.split('.').pop() ?? 'unknown';

  // 1. Create document record
  const [doc] = await db
    .insert(corpusDocuments)
    .values({
      documentTitle: options.title,
      filename,
      fileType,
      sourceBucket: 'manual_upload',
      fileSizeBytes: fileSize,
    })
    .returning();

  if (!doc) throw new Error('Failed to create document record');

  try {
    // 2. Parse document (or use precomputed markdown)
    let markdown: string;
    let pageCount = 0;

    if (options.precomputedMarkdown) {
      markdown = options.precomputedMarkdown;
    } else {
      const parsed = await parseDocument(file, filename);
      markdown = parsed.markdown;
      pageCount = parsed.pageCount;
    }

    // 3. Update page count
    if (pageCount > 0) {
      await db
        .update(corpusDocuments)
        .set({ pageCount })
        .where(eq(corpusDocuments.id, doc.id));
    }

    // 4. Chunk the parsed markdown
    const chunks = chunkMarkdown(markdown, options.chunkOptions);

    if (chunks.length === 0) {
      await db
        .update(corpusDocuments)
        .set({ chunkCount: 0 })
        .where(eq(corpusDocuments.id, doc.id));
      return { documentId: doc.id, chunksCreated: 0, pageCount };
    }

    // 5. Generate embeddings in batches
    const allEmbeddings: number[][] = [];
    const chunkTexts = chunks.map((c) => c.content);

    for (let i = 0; i < chunkTexts.length; i += EMBED_BATCH_SIZE) {
      const batch = chunkTexts.slice(i, i + EMBED_BATCH_SIZE);
      const embeddings = await embedDocuments(batch);
      allEmbeddings.push(...embeddings);
    }

    // 6. Store chunks with embeddings
    const chunkRecords = chunks.map((chunk, i) => ({
      documentId: doc.id,
      content: chunk.content,
      pageNumber: chunk.pageNumber,
      chunkIndex: chunk.chunkIndex,
      heading: chunk.heading,
      embedding: allEmbeddings[i],
      metadata: chunk.metadata,
    }));

    // Insert in batches to avoid query size limits
    for (let i = 0; i < chunkRecords.length; i += 50) {
      await db
        .insert(corpusChunks)
        .values(chunkRecords.slice(i, i + 50));
    }

    // 7. Update document chunk count
    await db
      .update(corpusDocuments)
      .set({ chunkCount: chunks.length })
      .where(eq(corpusDocuments.id, doc.id));

    return {
      documentId: doc.id,
      chunksCreated: chunks.length,
      pageCount,
    };
  } catch (error) {
    // Delete failed document record (cascade will remove any partial chunks)
    await db.delete(corpusDocuments).where(eq(corpusDocuments.id, doc.id));
    throw error;
  }
}
