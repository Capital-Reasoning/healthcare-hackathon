import 'dotenv/config';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function setupIndexes() {
  console.log('Creating RAG indexes...\n');

  // Full-text search: functional GIN index on document_chunks.content
  console.log('1. Creating GIN index for full-text search...');
  await sql`
    CREATE INDEX IF NOT EXISTS document_chunks_fts_idx
      ON document_chunks USING gin(to_tsvector('english', content))
  `;
  console.log('   ✓ document_chunks_fts_idx created\n');

  // HNSW vector index for fast cosine similarity search
  console.log('2. Creating HNSW index for vector search...');
  await sql`
    CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
      ON document_chunks USING hnsw(embedding vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
  `;
  console.log('   ✓ document_chunks_embedding_idx created\n');

  console.log('All RAG indexes created successfully.');
  await sql.end();
}

setupIndexes().catch((err) => {
  console.error('Failed to create indexes:', err);
  process.exit(1);
});
