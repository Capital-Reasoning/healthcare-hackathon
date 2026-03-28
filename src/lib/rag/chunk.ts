export interface Chunk {
  content: string;
  heading: string | null;
  pageNumber: number | null;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}

export interface ChunkOptions {
  /** Maximum chunk size in characters (default: 1500) */
  maxChunkSize?: number;
  /** Minimum chunk size — smaller chunks are dropped (default: 100) */
  minChunkSize?: number;
  /** Overlap in characters between consecutive chunks (default: 200) */
  overlap?: number;
  /** Keep markdown tables as single chunks (default: true) */
  preserveTables?: boolean;
}

const DEFAULTS: Required<ChunkOptions> = {
  maxChunkSize: 1500,
  minChunkSize: 100,
  overlap: 200,
  preserveTables: true,
};

// Matches markdown headers: # H1, ## H2, ### H3
const HEADER_RE = /^(#{1,3})\s+(.+)$/;
// Page break markers LlamaParse may insert
const PAGE_BREAK_RE = /^---+$/;

/**
 * Chunk markdown text using header-based splitting + recursive character fallback.
 * Preserves document structure, tables, and tracks page numbers.
 */
export function chunkMarkdown(
  markdown: string,
  options?: ChunkOptions,
): Chunk[] {
  const opts = { ...DEFAULTS, ...options };
  const sections = splitByHeaders(markdown);
  const chunks: Chunk[] = [];
  let chunkIndex = 0;

  for (const section of sections) {
    const sectionChunks = chunkSection(section, opts);
    for (const chunk of sectionChunks) {
      if (chunk.content.trim().length >= opts.minChunkSize) {
        chunks.push({ ...chunk, chunkIndex: chunkIndex++ });
      }
    }
  }

  // Apply overlap between consecutive chunks
  if (opts.overlap > 0 && chunks.length > 1) {
    applyOverlap(chunks, opts.overlap);
  }

  return chunks;
}

interface Section {
  heading: string | null;
  content: string;
  pageNumber: number | null;
}

/** Split markdown into sections by headers, tracking page numbers */
function splitByHeaders(markdown: string): Section[] {
  const lines = markdown.split('\n');
  const sections: Section[] = [];
  let currentHeading: string | null = null;
  let currentLines: string[] = [];
  let currentPage: number | null = 1;

  for (const line of lines) {
    // Track page breaks
    if (PAGE_BREAK_RE.test(line.trim())) {
      currentPage = (currentPage ?? 1) + 1;
      continue;
    }

    const headerMatch = line.match(HEADER_RE);
    if (headerMatch) {
      // Flush previous section
      if (currentLines.length > 0) {
        sections.push({
          heading: currentHeading,
          content: currentLines.join('\n').trim(),
          pageNumber: currentPage,
        });
        currentLines = [];
      }
      currentHeading = headerMatch[2]!.trim();
    } else {
      currentLines.push(line);
    }
  }

  // Flush final section
  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      content: currentLines.join('\n').trim(),
      pageNumber: currentPage,
    });
  }

  return sections;
}

/** Chunk a single section, respecting tables and max size */
function chunkSection(
  section: Section,
  opts: Required<ChunkOptions>,
): Omit<Chunk, 'chunkIndex'>[] {
  const { content, heading, pageNumber } = section;

  // If content fits, return as-is
  if (content.length <= opts.maxChunkSize) {
    return content.trim()
      ? [
          {
            content: heading ? `## ${heading}\n\n${content}` : content,
            heading,
            pageNumber,
            metadata: {},
          },
        ]
      : [];
  }

  // Split preserving tables
  const blocks = opts.preserveTables
    ? splitPreservingTables(content)
    : [content];

  const results: Omit<Chunk, 'chunkIndex'>[] = [];

  for (const block of blocks) {
    if (block.length <= opts.maxChunkSize) {
      results.push({
        content: heading ? `## ${heading}\n\n${block}` : block,
        heading,
        pageNumber,
        metadata: {},
      });
    } else {
      // Recursive split for oversized blocks
      const subChunks = recursiveSplit(block, opts.maxChunkSize);
      for (const sub of subChunks) {
        results.push({
          content: heading ? `## ${heading}\n\n${sub}` : sub,
          heading,
          pageNumber,
          metadata: {},
        });
      }
    }
  }

  return results;
}

/** Split text into blocks, keeping markdown tables intact */
function splitPreservingTables(text: string): string[] {
  const lines = text.split('\n');
  const blocks: string[] = [];
  let currentBlock: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const isTableLine =
      line.trim().startsWith('|') || /^\s*[-|:]+\s*$/.test(line.trim());

    if (isTableLine && !inTable) {
      // Flush non-table content
      if (currentBlock.length > 0) {
        const blockText = currentBlock.join('\n').trim();
        if (blockText) blocks.push(blockText);
        currentBlock = [];
      }
      inTable = true;
    } else if (!isTableLine && inTable) {
      // End of table
      const blockText = currentBlock.join('\n').trim();
      if (blockText) blocks.push(blockText);
      currentBlock = [];
      inTable = false;
    }

    currentBlock.push(line);
  }

  // Flush remaining
  const blockText = currentBlock.join('\n').trim();
  if (blockText) blocks.push(blockText);

  return blocks;
}

/**
 * Recursively split text to fit within maxSize.
 * Tries paragraph breaks → line breaks → sentence breaks → hard split.
 */
function recursiveSplit(text: string, maxSize: number): string[] {
  if (text.length <= maxSize) return [text];

  const separators = ['\n\n', '\n', '. '];

  for (const sep of separators) {
    const parts = text.split(sep);
    if (parts.length <= 1) continue;

    const chunks: string[] = [];
    let current = '';

    for (const part of parts) {
      const candidate = current ? current + sep + part : part;

      if (candidate.length <= maxSize) {
        current = candidate;
      } else {
        if (current) chunks.push(current.trim());
        // If single part exceeds maxSize, try next separator
        if (part.length > maxSize) {
          chunks.push(...recursiveSplit(part, maxSize));
          current = '';
        } else {
          current = part;
        }
      }
    }

    if (current.trim()) chunks.push(current.trim());
    if (chunks.length > 1) return chunks;
  }

  // Last resort: hard character split
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxSize) {
    chunks.push(text.slice(i, i + maxSize).trim());
  }
  return chunks.filter(Boolean);
}

/** Apply overlap: prepend tail of previous chunk to the next */
function applyOverlap(chunks: Chunk[], overlapSize: number): void {
  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = chunks[i - 1];
    const currentChunk = chunks[i];
    if (!prevChunk || !currentChunk) continue;

    const prev = prevChunk.content;
    if (prev.length <= overlapSize) continue;

    const overlap = prev.slice(-overlapSize);
    // Find a clean break point (sentence or line boundary)
    const breakIdx = Math.max(
      overlap.lastIndexOf('. '),
      overlap.lastIndexOf('\n'),
    );
    const cleanOverlap =
      breakIdx > 0 ? overlap.slice(breakIdx + 1).trim() : overlap.trim();

    if (cleanOverlap.length > 0) {
      currentChunk.content = `${cleanOverlap}\n\n${currentChunk.content}`;
    }
  }
}
