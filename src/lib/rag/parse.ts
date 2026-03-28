import { getServerEnv } from '@/config/env';

const BASE_URL = 'https://api.cloud.llamaindex.ai/api/v2/parse';
const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 5 * 60 * 1000; // 5 minutes

export interface ParseResult {
  markdown: string;
  jobId: string;
  pageCount: number;
}

interface ParseOptions {
  /** Parsing tier — controls quality/cost tradeoff */
  tier?: 'fast' | 'cost_effective' | 'agentic' | 'agentic_plus';
  /** Custom parsing instruction for the agent */
  parsingInstruction?: string;
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getServerEnv().LLAMAPARSE_API_KEY}`,
  };
}

/**
 * Upload a document to LlamaParse and return parsed markdown.
 * Handles the full upload → poll → retrieve cycle.
 */
export async function parseDocument(
  file: File | Buffer,
  filename: string,
  options?: ParseOptions,
): Promise<ParseResult> {
  const jobId = await uploadFile(file, filename, options);
  await pollUntilComplete(jobId);
  return await getResult(jobId);
}

/** Upload file to LlamaParse, returns job ID */
async function uploadFile(
  file: File | Buffer,
  filename: string,
  options?: ParseOptions,
): Promise<string> {
  const formData = new FormData();

  if (Buffer.isBuffer(file)) {
    formData.append('file', new Blob([new Uint8Array(file)]), filename);
  } else {
    formData.append('file', file as Blob, filename);
  }

  const configuration = {
    tier: options?.tier ?? 'agentic',
    version: 'latest',
    ...(options?.parsingInstruction && {
      processing_options: {
        parsing_instruction: options.parsingInstruction,
      },
    }),
  };
  formData.append('configuration', JSON.stringify(configuration));

  const response = await fetch(`${BASE_URL}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `LlamaParse upload failed (${response.status}): ${text}`,
    );
  }

  const data = await response.json();
  const jobId = data.id ?? data.job?.id;
  if (!jobId) {
    throw new Error(
      `LlamaParse upload returned no job ID: ${JSON.stringify(data)}`,
    );
  }

  return jobId;
}

/** Poll job status until COMPLETED or error/timeout */
async function pollUntilComplete(jobId: string): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < MAX_WAIT_MS) {
    const response = await fetch(`${BASE_URL}/${jobId}`, {
      headers: authHeaders(),
    });

    if (!response.ok) {
      throw new Error(
        `LlamaParse status check failed (${response.status})`,
      );
    }

    const data = await response.json();
    const status = data.job?.status ?? data.status;

    if (status === 'COMPLETED' || status === 'SUCCESS') return;
    if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
      const msg = data.job?.error_message ?? data.error ?? 'Unknown error';
      throw new Error(`LlamaParse job failed: ${msg}`);
    }

    // PENDING or RUNNING — wait and retry
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(
    `LlamaParse job timed out after ${MAX_WAIT_MS / 1000}s`,
  );
}

/** Retrieve the parsed result as markdown */
async function getResult(jobId: string): Promise<ParseResult> {
  // Request both markdown and text — use markdown if available, fall back to text
  const response = await fetch(
    `${BASE_URL}/${jobId}?expand=markdown,text`,
    { headers: authHeaders() },
  );

  if (!response.ok) {
    throw new Error(
      `LlamaParse result retrieval failed (${response.status})`,
    );
  }

  const data = await response.json();

  // v2 API returns { markdown: { pages: [{ page_number, markdown }] }, text: { pages: [...] } }
  const markdownPages = data.markdown?.pages as
    | { page_number: number; markdown: string }[]
    | undefined;
  const textPages = data.text?.pages as
    | { page_number: number; text: string }[]
    | undefined;

  let fullMarkdown: string;

  if (markdownPages && markdownPages.length > 0) {
    // Join page markdowns with page break markers
    fullMarkdown = markdownPages
      .map((p) => p.markdown)
      .join('\n\n---\n\n');
  } else if (textPages && textPages.length > 0) {
    // Fallback to plain text
    fullMarkdown = textPages.map((p) => p.text).join('\n\n---\n\n');
  } else {
    fullMarkdown = '';
  }

  const pageCount =
    markdownPages?.length ?? textPages?.length ?? data.job?.page_count ?? 0;

  return {
    markdown: fullMarkdown,
    jobId,
    pageCount,
  };
}
