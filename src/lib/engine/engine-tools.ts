import { tool } from 'ai';
import { z } from 'zod';
import { retrieve } from '@/lib/rag/retrieve';

export const engineTools = {
  searchGuidelines: tool({
    description:
      'Search the clinical knowledge base for guidelines, screening recommendations, management protocols, and drug safety information. Use this to find evidence for your clinical assessment. Search multiple times with different queries to gather comprehensive evidence.',
    inputSchema: z.object({
      query: z
        .string()
        .describe(
          'Clinical search query — be specific (e.g., "Type 2 diabetes HbA1c monitoring interval guidelines Canada" or "hypertension blood pressure target elderly CKD")',
        ),
      topK: z
        .number()
        .optional()
        .default(8)
        .describe('Number of results (default 8)'),
    }),
    execute: async ({ query, topK }) => {
      try {
        const results = await retrieve(query, {
          mode: 'hybrid',
          topK,
        });
        return results.map((r) => ({
          content: r.content,
          documentTitle: r.documentTitle,
          documentId: r.documentId,
          chunkId: r.id,
          heading: r.heading,
          pageNumber: r.pageNumber,
        }));
      } catch {
        return [
          {
            content: 'Evidence search temporarily unavailable',
            documentTitle: 'SYSTEM ERROR',
            documentId: null,
            chunkId: null,
            heading: null,
            pageNumber: null,
          },
        ];
      }
    },
  }),
};
