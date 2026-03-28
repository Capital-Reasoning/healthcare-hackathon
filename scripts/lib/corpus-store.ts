/**
 * Shared corpus storage pipeline.
 * Takes parsed chunks from either Track A (cheerio) or Track B (Unstructured),
 * embeds them with Gemini, and stores in corpus_documents + corpus_chunks tables.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/lib/db/schema';
import { embedDocuments } from '../../src/lib/rag/embed';
import type { ParsedChunk } from './html-parser';

const DATABASE_URL = process.env.DATABASE_URL!;
const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

export { db };

// Embedding batch config
const EMBED_BATCH_SIZE = 20; // Gemini batch limit
const EMBED_DELAY_MS = 1000; // Rate limiting between batches

export interface DocumentMetadata {
  sourceBucket: string;
  uploadGroup: string | null;
  sourceUrl: string | null;
  documentTitle: string;
  filename: string;
  fileType: string;
  contentType: string;
  clinicalDomains: string[];
  jurisdiction: string;
  sha1: string | null;
  fileSizeBytes: number | null;
}

/**
 * Store a document and its chunks with embeddings.
 * Returns the document ID.
 */
export async function storeDocument(
  metadata: DocumentMetadata,
  chunks: ParsedChunk[],
): Promise<string | null> {
  if (chunks.length === 0) {
    console.log(`  Skipping ${metadata.filename} — no chunks`);
    return null;
  }

  // Insert document record
  const [doc] = await db
    .insert(schema.corpusDocuments)
    .values({
      sourceBucket: metadata.sourceBucket,
      uploadGroup: metadata.uploadGroup,
      sourceUrl: metadata.sourceUrl,
      documentTitle: metadata.documentTitle,
      filename: metadata.filename,
      fileType: metadata.fileType,
      contentType: metadata.contentType,
      clinicalDomains: metadata.clinicalDomains,
      jurisdiction: metadata.jurisdiction,
      sha1: metadata.sha1,
      fileSizeBytes: metadata.fileSizeBytes,
      chunkCount: chunks.length,
    })
    .returning({ id: schema.corpusDocuments.id });

  const docId = doc!.id;

  // Embed chunks in batches
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    try {
      const embeddings = await embedDocuments(texts);
      allEmbeddings.push(...embeddings);
    } catch (err: any) {
      console.error(
        `  Embedding error on batch ${i / EMBED_BATCH_SIZE + 1}: ${err.message}`,
      );
      // Fill with nulls for failed batches — we can re-embed later
      for (let j = 0; j < batch.length; j++) {
        allEmbeddings.push([]);
      }
    }

    // Rate limit
    if (i + EMBED_BATCH_SIZE < chunks.length) {
      await sleep(EMBED_DELAY_MS);
    }
  }

  // Insert chunks with embeddings
  const chunkValues = chunks.map((chunk, i) => ({
    documentId: docId,
    content: chunk.text,
    textAsHtml: chunk.textAsHtml,
    heading: chunk.heading,
    pageNumber: chunk.pageNumber,
    chunkIndex: chunk.chunkIndex,
    chunkType: chunk.chunkType,
    sourceBucket: metadata.sourceBucket,
    embedding:
      allEmbeddings[i] && allEmbeddings[i]!.length > 0
        ? allEmbeddings[i]
        : null,
    metadata: {
      emphasizedText: chunk.emphasizedText,
    },
  }));

  // Insert in batches of 50
  const CHUNK_BATCH = 50;
  for (let i = 0; i < chunkValues.length; i += CHUNK_BATCH) {
    await db
      .insert(schema.corpusChunks)
      .values(chunkValues.slice(i, i + CHUNK_BATCH) as any);
  }

  return docId;
}

// ── Metadata helpers ──────────────────────────────────────────────────────

const BUCKET_DOMAINS: Record<string, string[]> = {
  diabetes_national_guidance: ['diabetes', 'endocrine'],
  hypertension_guidance: ['hypertension', 'cardiovascular'],
  cardiovascular_guidance: ['cardiovascular', 'cardiometabolic'],
  respiratory_guidance: ['respiratory', 'copd', 'asthma'],
  renal_ckd_primary_care: ['renal', 'ckd'],
  bc_cancer_screening: ['cancer_screening', 'preventive'],
  immunization_prevention: ['immunization', 'preventive'],
  preventive_task_force: ['preventive', 'screening'],
  bc_guidelines_core: ['general', 'primary_care'],
  primary_care_national_curated: ['primary_care', 'general'],
  specialty_guidelines_curated: ['specialty'],
  diagnostic_referral_guidance: ['diagnostic', 'referral'],
  emergency_risk_support: ['emergency', 'risk'],
  interoperability_standards: ['interoperability', 'standards'],
  substance_use_primary_care: ['substance_use', 'primary_care'],
  // Additional data source
  primary_care_national_additional: [
    'cardiovascular',
    'stroke',
    'hypertension',
  ],
};

const BUCKET_JURISDICTION: Record<string, string> = {
  bc_guidelines_core: 'BC',
  bc_cancer_screening: 'BC',
  primary_care_national_curated: 'Canada',
  preventive_task_force: 'Canada',
  diabetes_national_guidance: 'Canada',
  hypertension_guidance: 'Canada',
  cardiovascular_guidance: 'Canada',
  respiratory_guidance: 'Canada',
  renal_ckd_primary_care: 'Canada',
  specialty_guidelines_curated: 'Canada',
  immunization_prevention: 'Canada',
  diagnostic_referral_guidance: 'BC',
  emergency_risk_support: 'Canada',
  interoperability_standards: 'Canada',
  substance_use_primary_care: 'Canada',
  primary_care_national_additional: 'Canada',
};

export function getDomainsForBucket(bucket: string): string[] {
  return BUCKET_DOMAINS[bucket] || ['general'];
}

export function getJurisdictionForBucket(bucket: string): string {
  return BUCKET_JURISDICTION[bucket] || 'Canada';
}

export function getContentTypeForBucket(bucket: string): string {
  if (bucket.includes('guideline') || bucket.includes('guidance'))
    return 'guideline';
  if (bucket.includes('referral') || bucket.includes('pathway'))
    return 'pathway';
  if (bucket.includes('standard') || bucket.includes('interop'))
    return 'reference';
  if (bucket.includes('education') || bucket.includes('patient'))
    return 'patient_education';
  return 'guideline';
}

export function getUploadGroup(bucket: string): string | null {
  const core = [
    'bc_guidelines_core',
    'primary_care_national_curated',
    'specialty_guidelines_curated',
    'preventive_task_force',
    'bc_cancer_screening',
    'immunization_prevention',
    'diabetes_national_guidance',
    'hypertension_guidance',
    'cardiovascular_guidance',
    'respiratory_guidance',
    'renal_ckd_primary_care',
    'diagnostic_referral_guidance',
  ];
  if (core.includes(bucket)) return 'core_clinical_and_screening';
  if (bucket === 'emergency_risk_support') return 'emergency_risk_evidence';
  if (
    bucket === 'interoperability_standards' ||
    bucket === 'drug_safety_support'
  )
    return 'route_only_medication_and_standards';
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
