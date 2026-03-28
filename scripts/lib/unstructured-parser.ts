/**
 * Track B: PDF/DOCX parser using Unstructured API.
 * Sends files to Unstructured with hi_res strategy + by_title chunking.
 * Outputs standardized ParsedChunk shape compatible with Track A (cheerio).
 */

import { UnstructuredClient } from 'unstructured-client';
import { Strategy } from 'unstructured-client/sdk/models/shared';
import * as fs from 'fs';
import * as path from 'path';
import type { ParsedChunk } from './html-parser';

let _client: UnstructuredClient | null = null;

function getClient(): UnstructuredClient {
  if (!_client) {
    const apiKey =
      process.env.UNSTRUCTURED_API_KEY;
    const serverUrl =
      process.env.UNSTRUCTURED_API_URL ||
      'https://api.unstructuredapp.io/general/v0/general';

    if (!apiKey) {
      throw new Error('UNSTRUCTURED_API_KEY is not set');
    }

    _client = new UnstructuredClient({
      serverURL: serverUrl,
      security: { apiKeyAuth: apiKey },
    });
  }
  return _client;
}

// Page budget tracking
let _totalPagesConsumed = 0;
const PAGE_BUDGET = 14000; // Leave 1000 buffer from 15000 limit

export function getPagesConsumed(): number {
  return _totalPagesConsumed;
}

export function getRemainingPages(): number {
  return PAGE_BUDGET - _totalPagesConsumed;
}

/**
 * Parse a PDF or DOCX file through Unstructured API.
 * Returns standardized ParsedChunk array.
 * Tracks page consumption against budget.
 */
export async function parseWithUnstructured(
  filePath: string,
  estimatedPages?: number,
): Promise<ParsedChunk[]> {
  // Budget check
  const estPages = estimatedPages || 5;
  if (_totalPagesConsumed + estPages > PAGE_BUDGET) {
    console.warn(
      `  ⚠ Page budget warning: ${_totalPagesConsumed}/${PAGE_BUDGET} consumed, ` +
        `skipping ${path.basename(filePath)} (est ${estPages} pages)`,
    );
    return [];
  }

  const client = getClient();
  const fileData = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const res = await client.general.partition({
    partitionParameters: {
      files: {
        content: fileData,
        fileName,
      },
      strategy: Strategy.HiRes,
      chunkingStrategy: 'by_title' as any,
      maxCharacters: 1500,
      newAfterNChars: 1000,
      combineTextUnderNChars: 400,
    },
  });

  // Extract elements from response
  const elements: any[] =
    (res as any).elements ||
    (res as any).data ||
    (res as any).partitionResponse?.elements ||
    (Array.isArray(res) ? res : []);

  // Track page consumption (estimate from elements)
  const maxPage = elements.reduce((max: number, el: any) => {
    const p = el.metadata?.page_number;
    return p && p > max ? p : max;
  }, 1);
  _totalPagesConsumed += maxPage;

  // Convert to ParsedChunk
  const chunks: ParsedChunk[] = [];
  let chunkIndex = 0;

  for (const el of elements) {
    const text = (el.text || '').trim();
    if (text.length < 80) continue; // Skip tiny chunks

    // Strip orig_elements (large, unneeded)
    if (el.metadata?.orig_elements) {
      delete el.metadata.orig_elements;
    }

    const isTable = el.type === 'Table';
    const textAsHtml = el.metadata?.text_as_html || null;
    const pageNumber = el.metadata?.page_number || null;

    // Extract emphasized text
    const emphasized: string[] = [];
    if (el.metadata?.emphasized_text_contents) {
      const contents = el.metadata.emphasized_text_contents;
      if (Array.isArray(contents)) {
        emphasized.push(
          ...contents.filter((t: string) => t && t.length > 2),
        );
      }
    }

    // Split oversized chunks (tables or text)
    if (text.length > 1500) {
      const subTexts = splitOversized(text, 1500);
      for (let s = 0; s < subTexts.length; s++) {
        const sub = subTexts[s]!.trim();
        if (sub.length < 80) continue;
        const partLabel =
          subTexts.length > 1 ? `[Part ${s + 1} of ${subTexts.length}] ` : '';
        chunks.push({
          text: partLabel + sub,
          textAsHtml: s === 0 && isTable ? textAsHtml : null,
          heading: null,
          pageNumber,
          chunkIndex: chunkIndex++,
          chunkType: isTable ? 'table' : 'text',
          emphasizedText: s === 0 ? emphasized : [],
        });
      }
    } else {
      chunks.push({
        text,
        textAsHtml: isTable ? textAsHtml : null,
        heading: null,
        pageNumber,
        chunkIndex: chunkIndex++,
        chunkType: isTable ? 'table' : 'text',
        emphasizedText: emphasized,
      });
    }
  }

  return chunks;
}

function splitOversized(text: string, maxSize: number): string[] {
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
        if (current) chunks.push(current);
        current = part.length > maxSize ? part.slice(0, maxSize) : part;
      }
    }
    if (current) chunks.push(current);
    if (chunks.length > 1) return chunks;
  }
  // Hard split
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += maxSize) {
    chunks.push(text.slice(i, i + maxSize));
  }
  return chunks;
}
