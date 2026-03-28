# Phase 07 — RAG Pipeline

## Context
Phases 01-06 are complete. The app has a full UI, agent panel with chat, database schema, seeded data, and working API routes. The agent can query the database via tools.

Read `CLAUDE.md` and `docs/stack-decisions.md` for context.

This phase adds the RAG (Retrieval Augmented Generation) pipeline — the ability for users to upload documents, and for the AI agent to search through them with cited answers. This is a core feature for a healthcare data platform, where clinical guidelines, research papers, policy documents, and reports need to be instantly searchable and citable.

**Senior-dev mode:** The RAG pipeline needs to be robust. Document parsing must handle real-world PDFs (tables, multi-column, scanned images). Chunking must preserve context. Retrieval must be fast and accurate. Citations must be traceable. If you hit quality issues with parsing or chunking — flag them so we can discuss alternatives.**

**If you're unsure about chunking strategy, embedding model configuration, or retrieval parameters — ask me.**

## Objective
Build the complete RAG pipeline: document upload + parsing (LlamaParse), semantic chunking, embedding generation (Gemini Embedding 2), storage in Supabase pgvector, hybrid retrieval (vector + keyword search), agent tool integration, and citation display in the UI.

## Step-by-Step Instructions

### 1. LlamaParse Integration (`src/lib/rag/parse.ts`)

LlamaParse is a cloud API — call it via HTTP. The flow:
1. Upload document to LlamaParse API
2. Poll for completion (it processes asynchronously)
3. Retrieve parsed result as structured markdown

```typescript
const LLAMAPARSE_API_URL = 'https://api.cloud.llamaindex.ai/api/parsing';

export async function parseDocument(file: File | Buffer, filename: string): Promise<ParsedDocument> {
  // 1. Upload
  const formData = new FormData();
  formData.append('file', file, filename);

  const uploadResponse = await fetch(`${LLAMAPARSE_API_URL}/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}` },
    body: formData,
  });

  const { id: jobId } = await uploadResponse.json();

  // 2. Poll for completion
  let result;
  while (true) {
    const statusResponse = await fetch(`${LLAMAPARSE_API_URL}/job/${jobId}`, {
      headers: { Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}` },
    });
    result = await statusResponse.json();
    if (result.status === 'SUCCESS') break;
    if (result.status === 'ERROR') throw new Error(`LlamaParse failed: ${result.error}`);
    await new Promise(r => setTimeout(r, 2000)); // Poll every 2 seconds
  }

  // 3. Get result as markdown
  const markdownResponse = await fetch(`${LLAMAPARSE_API_URL}/job/${jobId}/result/markdown`, {
    headers: { Authorization: `Bearer ${process.env.LLAMAPARSE_API_KEY}` },
  });

  return {
    markdown: await markdownResponse.text(),
    pageCount: result.page_count,
    metadata: result.metadata,
  };
}
```

**Important:** Check the actual LlamaParse API documentation (search the web if needed) for the correct endpoints and request format. The above is approximate — the actual API may differ. Adapt as needed.

### 2. Semantic Chunking (`src/lib/rag/chunk.ts`)

Implement semantic chunking that preserves document structure. Two strategies, used in sequence:

**Strategy 1: Markdown header-based chunking (primary)**
- Split on `## ` and `### ` headers produced by LlamaParse
- Each chunk keeps its heading as context
- Tables are kept as single chunks (don't split mid-table)
- Target chunk size: 512-1024 tokens
- If a section exceeds max size, fall back to Strategy 2 within that section

**Strategy 2: Recursive character splitting (fallback)**
- Split on paragraph boundaries (`\n\n`)
- If still too large, split on sentence boundaries (`. `)
- Overlap: 20% (ensures context continuity across chunks)
- Each chunk retains the parent section heading as prefix

```typescript
interface DocumentChunk {
  content: string;
  heading: string | null;        // Section heading this chunk belongs to
  pageNumber: number | null;     // Estimated page number
  chunkIndex: number;            // Sequential index within document
  metadata: Record<string, unknown>;
}

export function chunkDocument(
  markdown: string,
  options?: {
    maxChunkSize?: number;       // Default: 1000 tokens (~4000 chars)
    overlapSize?: number;        // Default: 200 tokens
    preserveTables?: boolean;    // Default: true
  }
): DocumentChunk[]
```

**Page number estimation:** LlamaParse sometimes includes page markers in the markdown. If present, use them. Otherwise, estimate based on character position.

### 3. Embedding Generation (`src/lib/rag/embed.ts`)

Use Gemini Embedding 2 for generating embeddings. Two options for the SDK:

**Option A: `@google/generative-ai` SDK (direct)**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' }); // or gemini-embedding-2
  // Batch embed
  const result = await model.batchEmbedContents({
    requests: texts.map(text => ({
      content: { parts: [{ text }] },
      taskType: 'RETRIEVAL_DOCUMENT',
    })),
  });
  return result.embeddings.map(e => e.values);
}

export async function generateQueryEmbedding(query: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
  const result = await model.embedContent({
    content: { parts: [{ text: query }] },
    taskType: 'RETRIEVAL_QUERY',
  });
  return result.embedding.values;
}
```

**Option B: Vercel AI SDK `@ai-sdk/google`**
```typescript
import { google } from '@ai-sdk/google';
import { embed, embedMany } from 'ai';

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: google.textEmbeddingModel('text-embedding-004'),
    values: texts,
  });
  return embeddings;
}
```

**Use whichever SDK has better support for the Gemini embedding model.** Check the latest docs. If `gemini-embedding-2` is available as a model ID, prefer it over `text-embedding-004`. The Vercel AI SDK approach is cleaner if it supports the model.

**Important:** Batch embeddings — don't send one at a time. Batch sizes of 50-100 chunks are efficient. Handle rate limiting gracefully (retry with exponential backoff).

### 4. Document Ingestion Pipeline (`src/lib/rag/ingest.ts`)

Orchestrate the full pipeline:

```typescript
export async function ingestDocument(file: File | Buffer, filename: string): Promise<{
  documentId: string;
  chunksCreated: number;
}> {
  // 1. Create document record in DB
  const [document] = await db.insert(documents).values({
    title: filename.replace(/\.\w+$/, ''),
    filename,
    mimeType: getMimeType(filename),
    fileSize: file.size,
  }).returning();

  // 2. Parse with LlamaParse
  const parsed = await parseDocument(file, filename);

  // 3. Update document with page count
  await db.update(documents).set({ pageCount: parsed.pageCount }).where(eq(documents.id, document.id));

  // 4. Chunk the parsed markdown
  const chunks = chunkDocument(parsed.markdown);

  // 5. Generate embeddings (batched)
  const chunkTexts = chunks.map(c => c.content);
  const embeddings = await generateEmbeddings(chunkTexts);

  // 6. Store chunks with embeddings in Supabase
  const chunkRecords = chunks.map((chunk, i) => ({
    documentId: document.id,
    content: chunk.content,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex,
    heading: chunk.heading,
    embedding: embeddings[i],
  }));

  await db.insert(documentChunks).values(chunkRecords);

  return { documentId: document.id, chunksCreated: chunks.length };
}
```

### 5. Hybrid Retrieval (`src/lib/rag/retrieve.ts`)

Implement three retrieval methods:

**Vector search (semantic):**
```typescript
export async function vectorSearch(query: string, options?: {
  topK?: number;
  documentId?: string;  // Scope to specific document
  threshold?: number;   // Minimum similarity score
}): Promise<RetrievalResult[]> {
  const queryEmbedding = await generateQueryEmbedding(query);
  const topK = options?.topK ?? 5;

  // Use Supabase RPC or raw SQL for vector similarity search
  // pgvector cosine similarity: 1 - (embedding <=> query_embedding)
  const results = await db.execute(sql`
    SELECT
      dc.id,
      dc.content,
      dc.page_number,
      dc.heading,
      dc.document_id,
      d.title as document_title,
      1 - (dc.embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}) as similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    ${options?.documentId ? sql`WHERE dc.document_id = ${options.documentId}` : sql``}
    ORDER BY dc.embedding <=> ${sql.raw(`'[${queryEmbedding.join(',')}]'::vector`)}
    LIMIT ${topK}
  `);

  return results.map(r => ({
    chunkId: r.id,
    content: r.content,
    pageNumber: r.page_number,
    heading: r.heading,
    documentId: r.document_id,
    documentTitle: r.document_title,
    score: r.similarity,
    method: 'vector' as const,
  }));
}
```

**Keyword search (full-text):**
```typescript
export async function keywordSearch(terms: string, options?: {
  limit?: number;
  documentId?: string;
}): Promise<RetrievalResult[]> {
  // Use PostgreSQL full-text search
  const results = await db.execute(sql`
    SELECT
      dc.id,
      dc.content,
      dc.page_number,
      dc.heading,
      dc.document_id,
      d.title as document_title,
      ts_rank(to_tsvector('english', dc.content), plainto_tsquery('english', ${terms})) as rank
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE to_tsvector('english', dc.content) @@ plainto_tsquery('english', ${terms})
    ${options?.documentId ? sql`AND dc.document_id = ${options.documentId}` : sql``}
    ORDER BY rank DESC
    LIMIT ${options?.limit ?? 10}
  `);

  return results.map(r => ({
    chunkId: r.id,
    content: r.content,
    pageNumber: r.page_number,
    heading: r.heading,
    documentId: r.document_id,
    documentTitle: r.document_title,
    score: r.rank,
    method: 'keyword' as const,
  }));
}
```

**Direct chunk retrieval (by ID):**
```typescript
export async function getChunkById(chunkId: string): Promise<RetrievalResult | null> {
  // Direct lookup — for when the agent wants to see a specific chunk it found earlier
}
```

**Hybrid search (combine vector + keyword):**
```typescript
export async function hybridSearch(query: string, options?: {
  topK?: number;
  documentId?: string;
  vectorWeight?: number;   // Default: 0.7
  keywordWeight?: number;  // Default: 0.3
}): Promise<RetrievalResult[]> {
  const [vectorResults, keywordResults] = await Promise.all([
    vectorSearch(query, { topK: (options?.topK ?? 10) * 2, documentId: options?.documentId }),
    keywordSearch(query, { limit: (options?.topK ?? 10) * 2, documentId: options?.documentId }),
  ]);

  // Reciprocal Rank Fusion (RRF) to combine results
  return reciprocalRankFusion(vectorResults, keywordResults, {
    topK: options?.topK ?? 10,
    vectorWeight: options?.vectorWeight ?? 0.7,
    keywordWeight: options?.keywordWeight ?? 0.3,
  });
}
```

Implement RRF (Reciprocal Rank Fusion) for combining ranked results from different methods.

### 6. API Routes for RAG

**`/api/documents/route.ts`** — GET (list documents) + POST (upload document):
```typescript
export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ data: null, meta: null, error: 'No file provided' }, { status: 400 });
  }

  const result = await ingestDocument(file, file.name);
  return NextResponse.json({
    data: result,
    meta: null,
    error: null,
  });
}
```

**`/api/rag/vector-search/route.ts`:**
```typescript
export async function POST(request: Request) {
  const { query, topK, documentId } = await request.json();
  const results = await vectorSearch(query, { topK, documentId });
  return NextResponse.json({ data: results, meta: { total: results.length }, error: null });
}
```

**`/api/rag/keyword-search/route.ts`:**
```typescript
export async function POST(request: Request) {
  const { terms, limit, documentId } = await request.json();
  const results = await keywordSearch(terms, { limit, documentId });
  return NextResponse.json({ data: results, meta: { total: results.length }, error: null });
}
```

### 7. Agent RAG Tools

Update `src/lib/ai/tools.ts` with real RAG tool implementations:

```typescript
searchDocuments: tool({
  description: 'Search through uploaded healthcare documents using hybrid semantic + keyword search. Returns relevant passages with citations. You can call this multiple times with different queries to search more thoroughly.',
  parameters: z.object({
    query: z.string().describe('The search query — be specific and descriptive'),
    topK: z.number().default(5).describe('Number of results to return'),
    documentId: z.string().optional().describe('Scope search to a specific document ID'),
    method: z.enum(['hybrid', 'vector', 'keyword']).default('hybrid').describe('Search method'),
  }),
  execute: async (args) => {
    let results;
    switch (args.method) {
      case 'vector':
        results = await vectorSearch(args.query, { topK: args.topK, documentId: args.documentId });
        break;
      case 'keyword':
        results = await keywordSearch(args.query, { limit: args.topK, documentId: args.documentId });
        break;
      default:
        results = await hybridSearch(args.query, { topK: args.topK, documentId: args.documentId });
    }
    return {
      results: results.map(r => ({
        content: r.content,
        source: `${r.documentTitle}${r.pageNumber ? `, p.${r.pageNumber}` : ''}`,
        heading: r.heading,
        score: r.score,
        chunkId: r.chunkId,
      })),
      total: results.length,
    };
  },
}),

getDocumentChunk: tool({
  description: 'Retrieve a specific document chunk by ID for more detail',
  parameters: z.object({
    chunkId: z.string(),
  }),
  execute: async (args) => {
    const chunk = await getChunkById(args.chunkId);
    return chunk;
  },
}),

listDocuments: tool({
  description: 'List all uploaded documents',
  parameters: z.object({}),
  execute: async () => {
    const docs = await db.select().from(documents).orderBy(desc(documents.createdAt));
    return { documents: docs };
  },
}),
```

**Important:** The system prompt should instruct Claude to:
- Make multiple search calls with different queries when the first results aren't sufficient
- Use vector search for conceptual/semantic queries, keyword search for exact terms/codes/IDs
- Always cite sources: "According to [Document Title, p.X]..."
- Prefer hybrid search as default

### 8. Citation Display Component

**`src/components/agent/CitationPill.tsx`** — Already created in Phase 05, but ensure it works with real citation data:
- Clickable pill showing: "[Doc Title, p.42]"
- On click: popover with the source text excerpt, link to full document
- Multiple citations in a message should be numbered: [1], [2], etc.

**`src/components/agent/SourcesPanel.tsx`** — Optional expandable section at the bottom of an agent message:
- "Sources (3)" toggle
- Expands to show all cited chunks with document title, page, heading, and excerpt
- Each source clickable to show the full chunk content

### 9. Document Upload UI

**`src/components/forms/FileUpload.tsx`** — File upload component:
- Drag-and-drop zone
- File type filtering (PDF, DOCX, TXT, MD)
- Upload progress indicator
- Success/error feedback
- Multi-file upload support

Add a document upload section to the Settings page (or a dedicated Documents page):
- Upload area
- List of uploaded documents with: title, filename, page count, upload date, delete button
- Upload status/progress for in-flight uploads

### 10. Full-Text Search Index Setup

Ensure the PostgreSQL full-text search index is created on document chunks:

```sql
CREATE INDEX idx_document_chunks_fts ON document_chunks
  USING GIN (to_tsvector('english', content));
```

Also create the HNSW vector index for fast similarity search:

```sql
CREATE INDEX idx_document_chunks_embedding ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

These may need to be added via Drizzle migration or direct SQL on Supabase. Check if Drizzle supports these index types; if not, create them via raw SQL in the seed/migration script.

### 11. Test with a Real Document

If possible, test the pipeline end-to-end with a sample healthcare document:
1. Upload a PDF (even a simple one — a publicly available clinical guideline or research paper)
2. Verify LlamaParse processes it correctly
3. Verify chunks are created with embeddings
4. Test vector search with a relevant query
5. Test keyword search with a specific term from the document
6. Ask the agent a question about the document and verify it retrieves and cites correctly

If you can't test with a real document (API keys not configured, etc.), create a test script that simulates the pipeline with mock data. Flag what needs real-world testing.

### 12. Verify

1. Document upload endpoint accepts files and triggers the ingestion pipeline
2. LlamaParse integration works (or is properly mocked with clear TODO)
3. Chunking produces reasonable chunk sizes with preserved context
4. Embeddings are generated and stored in pgvector
5. Vector search returns semantically relevant results
6. Keyword search returns exact-match results
7. Hybrid search combines both methods
8. Agent can call RAG tools and cite sources in responses
9. Citation pills render and are clickable
10. Document list page shows uploaded documents

**If LlamaParse or Gemini APIs fail due to rate limits or auth issues, document the error and create a fallback path (e.g., simple text extraction with `pdf-parse` + character splitting). The pipeline architecture should be correct even if specific APIs need swapping.**

## Success Criteria
- [ ] Document ingestion pipeline works end-to-end (or is well-mocked)
- [ ] LlamaParse integration for PDF parsing
- [ ] Semantic chunking preserves document structure
- [ ] Gemini Embedding 2 generates embeddings
- [ ] pgvector stores and indexes embeddings
- [ ] Vector search returns relevant results
- [ ] Keyword search returns exact matches
- [ ] Hybrid search (RRF) combines both methods
- [ ] Agent RAG tools are wired to real retrieval
- [ ] Agent can make multiple search calls per turn
- [ ] Citations display correctly in the agent panel
- [ ] Document upload UI exists
- [ ] Full-text and vector indexes are created
