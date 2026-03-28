import { tool } from 'ai';
import { z } from 'zod';
import { getPatients, getPatientById, getPatientStats } from '@/lib/db/queries/patients';
import { getEncounters } from '@/lib/db/queries/encounters';
import { getDocuments, getChunkById } from '@/lib/db/queries/documents';
import { retrieve } from '@/lib/rag/retrieve';

const queryPatientsSchema = z.object({
  query: z
    .string()
    .optional()
    .describe('Free-text search term for patient name or patient ID'),
  sex: z
    .string()
    .optional()
    .describe('Filter by sex (M or F)'),
  ageRange: z
    .object({
      min: z.number().describe('Minimum age'),
      max: z.number().describe('Maximum age'),
    })
    .optional()
    .describe('Filter by age range'),
  limit: z.number().default(20).describe('Max results to return'),
  offset: z.number().default(0).describe('Pagination offset'),
});

const getPatientDetailSchema = z.object({
  patientId: z.string().describe('The text patient ID (e.g. "PAT-000123")'),
});

const searchDocumentsSchema = z.object({
  query: z.string().describe('The natural-language search query — be specific and descriptive'),
  topK: z.number().default(5).describe('Number of top results to return'),
  documentId: z
    .string()
    .optional()
    .describe('Scope search to a specific document ID'),
  method: z
    .enum(['hybrid', 'vector', 'keyword'])
    .default('hybrid')
    .describe('Search method: hybrid (default), vector (semantic), or keyword (exact)'),
});

const keywordSearchSchema = z.object({
  terms: z.string().describe('Keywords or phrases to search for'),
  limit: z.number().default(10).describe('Max results to return'),
  documentId: z
    .string()
    .optional()
    .describe('Scope search to a specific document ID'),
});

const listDocumentsSchema = z.object({
  page: z.number().default(1).describe('Page number'),
  pageSize: z.number().default(20).describe('Results per page'),
});

const getDocumentChunkSchema = z.object({
  chunkId: z.string().describe('The chunk UUID to retrieve'),
});

const getMetricsSchema = z.object({
  metricType: z
    .enum([
      'patients',
      'encounters',
      'wait_times',
      'sex_distribution',
      'admissions',
    ])
    .describe('The type of metric to retrieve'),
  period: z
    .enum(['day', 'week', 'month', 'quarter', 'year'])
    .default('month')
    .describe('Time period for the metric'),
});

export const agentTools = {
  queryPatients: tool({
    description:
      'Search and filter patient records from the database. Returns a list of patients matching the criteria.',
    inputSchema: queryPatientsSchema,
    execute: async (args) => {
      const { data, total } = await getPatients({
        page: Math.floor(args.offset / args.limit) + 1,
        pageSize: args.limit,
        filters: {
          search: args.query,
          sex: args.sex,
          ageMin: args.ageRange?.min,
          ageMax: args.ageRange?.max,
        },
      });

      const patients = data.map((p) => ({
        id: p.id,
        patientId: p.patientId,
        firstName: p.firstName,
        lastName: p.lastName,
        sex: p.sex,
        dateOfBirth: p.dateOfBirth,
        age: p.age,
        postalCode: p.postalCode,
      }));

      return { patients, total };
    },
  }),

  getPatientDetail: tool({
    description:
      'Get detailed information about a specific patient including their encounters, medications, and vitals.',
    inputSchema: getPatientDetailSchema,
    execute: async (args) => {
      const patient = await getPatientById(args.patientId);
      if (!patient) return { patient: null };
      return { patient };
    },
  }),

  searchDocuments: tool({
    description:
      'Search through uploaded healthcare documents using hybrid semantic + keyword search. Returns relevant passages with citations. Call multiple times with different queries to search more thoroughly.',
    inputSchema: searchDocumentsSchema,
    execute: async (args) => {
      const results = await retrieve(args.query, {
        mode: args.method,
        topK: args.topK,
        documentId: args.documentId,
      });

      return {
        results: results.map((r) => ({
          content: r.content,
          documentTitle: r.documentTitle,
          documentId: r.documentId,
          pageNumber: r.pageNumber,
          heading: r.heading,
          score: r.score,
          chunkId: r.id,
        })),
        total: results.length,
        query: args.query,
      };
    },
  }),

  keywordSearch: tool({
    description:
      'Search documents using exact keyword matching. Use for specific codes, IDs, drug names, or clinical terms.',
    inputSchema: keywordSearchSchema,
    execute: async (args) => {
      const results = await retrieve(args.terms, {
        mode: 'keyword',
        topK: args.limit,
        documentId: args.documentId,
      });

      return {
        results: results.map((r) => ({
          content: r.content,
          documentTitle: r.documentTitle,
          documentId: r.documentId,
          pageNumber: r.pageNumber,
          heading: r.heading,
          score: r.score,
          chunkId: r.id,
        })),
        total: results.length,
        terms: args.terms,
      };
    },
  }),

  listDocuments: tool({
    description:
      'List all uploaded documents in the knowledge base. Returns titles, file types, and content types.',
    inputSchema: listDocumentsSchema,
    execute: async (args) => {
      const { data, total } = await getDocuments(args);
      return {
        documents: data.map((d) => ({
          id: d.id,
          documentTitle: d.documentTitle,
          filename: d.filename,
          fileType: d.fileType,
          contentType: d.contentType,
          pageCount: d.pageCount,
          chunkCount: d.chunkCount,
          ingestedAt: d.ingestedAt,
        })),
        total,
      };
    },
  }),

  getDocumentChunk: tool({
    description:
      'Retrieve a specific document chunk by ID for more detailed inspection.',
    inputSchema: getDocumentChunkSchema,
    execute: async (args) => {
      const chunk = await getChunkById(args.chunkId);
      if (!chunk) return { chunk: null };
      return { chunk };
    },
  }),

  getMetrics: tool({
    description:
      'Retrieve dashboard metrics and aggregate statistics for population health analysis.',
    inputSchema: getMetricsSchema,
    execute: async (args) => {
      const stats = await getPatientStats();
      const encounterResult = await getEncounters({ page: 1, pageSize: 1 });

      const metricsMap: Record<string, object> = {
        patients: {
          total: stats.total,
          bySex: stats.bySex,
        },
        sex_distribution: {
          ...stats.bySex,
          total: stats.total,
        },
        encounters: {
          total: encounterResult.total,
        },
        wait_times: {
          average: 23,
          median: 18,
          unit: 'minutes',
          note: 'Wait times require real-time tracking — placeholder values',
        },
        admissions: {
          note: 'Admissions metrics require dedicated tracking — placeholder values',
        },
      };

      return {
        metrics: metricsMap[args.metricType] ?? {},
        type: args.metricType,
        period: args.period,
      };
    },
  }),
};

/** Subset of tools for the patient navigator (document search only) */
export const navigatorTools = {
  searchDocuments: agentTools.searchDocuments,
  keywordSearch: agentTools.keywordSearch,
};
