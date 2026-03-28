import { embed, embedMany } from 'ai';
import { google } from '@ai-sdk/google';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const DIMENSIONS = 3072;

function embeddingModel() {
  return google.embedding(EMBEDDING_MODEL);
}

/** Embed a single query string (asymmetric retrieval — query side) */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel(),
    value: text,
    providerOptions: {
      google: { taskType: 'RETRIEVAL_QUERY', outputDimensionality: DIMENSIONS },
    },
  });
  return embedding;
}

/** Embed a single document chunk (asymmetric retrieval — document side) */
export async function embedDocument(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel(),
    value: text,
    providerOptions: {
      google: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: DIMENSIONS,
      },
    },
  });
  return embedding;
}

/** Embed multiple document chunks in batch (for ingestion) */
export async function embedDocuments(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const { embeddings } = await embedMany({
    model: embeddingModel(),
    values: texts,
    maxRetries: 3,
    providerOptions: {
      google: {
        taskType: 'RETRIEVAL_DOCUMENT',
        outputDimensionality: DIMENSIONS,
      },
    },
  });
  return embeddings;
}
