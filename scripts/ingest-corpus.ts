/**
 * Bulk corpus ingestion script.
 * Processes all clinical guideline files across 15+ buckets.
 * Track A (HTML → cheerio, free) runs first, then Track B (PDF/DOCX → Unstructured).
 *
 * Features:
 * - Resumable: skips files already ingested (by filename + bucket)
 * - Page budget tracking for Unstructured API
 * - Progress logging with ETA
 * - Error isolation: one file failure doesn't stop the batch
 *
 * Usage: npx tsx scripts/ingest-corpus.ts [--track=a|b|both] [--bucket=name]
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { eq, and, sql } from 'drizzle-orm';
import { parseHtml, extractTitle } from './lib/html-parser';
import {
  parseWithUnstructured,
  getPagesConsumed,
  getRemainingPages,
} from './lib/unstructured-parser';
import {
  storeDocument,
  getDomainsForBucket,
  getJurisdictionForBucket,
  getContentTypeForBucket,
  getUploadGroup,
  db,
} from './lib/corpus-store';
import * as schema from '../src/lib/db/schema';

// ── Configuration ───────────────────────────────────────────────────────────

const CORPUS_ROOT = path.resolve(
  __dirname,
  '../health-info-data/next-best-pathway-corpus/01_sources',
);

const ADDITIONAL_ROOT = path.resolve(
  __dirname,
  '../health-info-data/additional-data/Vector Content',
);

// Parse CLI args
const args = process.argv.slice(2);
const trackArg =
  args.find((a) => a.startsWith('--track='))?.split('=')[1] || 'both';
const bucketArg =
  args.find((a) => a.startsWith('--bucket='))?.split('=')[1] || null;

// Buckets in priority order
const CORE_BUCKETS = [
  // Highest priority: condition-mapped to Synthea data
  'diabetes_national_guidance',
  'hypertension_guidance',
  'cardiovascular_guidance',
  'respiratory_guidance',
  'renal_ckd_primary_care',
  // Core clinical
  'bc_guidelines_core',
  'primary_care_national_curated',
  'specialty_guidelines_curated',
  // Preventive/screening
  'preventive_task_force',
  'bc_cancer_screening',
  'immunization_prevention',
  // Referral + emergency
  'diagnostic_referral_guidance',
  'emergency_risk_support',
  // Added per review
  'interoperability_standards',
  'substance_use_primary_care',
];

// bc_guidelines_core PDF filename filters — exclude administrative docs
const BC_ADMIN_PATTERNS = [
  /contributor/i,
  /cme.?credit/i,
  /external.?review/i,
  /translated/i,
  /arabic|chinese|farsi|french|korean|punjabi|spanish|vietnamese/i,
];

// ── File discovery ──────────────────────────────────────────────────────────

interface FileEntry {
  path: string;
  filename: string;
  bucket: string;
  fileType: 'html' | 'pdf' | 'docx';
  sizeBytes: number;
  source: 'corpus' | 'additional';
}

function discoverFiles(): { html: FileEntry[]; pdf: FileEntry[] } {
  const html: FileEntry[] = [];
  const pdf: FileEntry[] = [];

  const bucketsToProcess = bucketArg
    ? CORE_BUCKETS.filter((b) => b === bucketArg)
    : CORE_BUCKETS;

  for (const bucket of bucketsToProcess) {
    const bucketDir = path.join(CORPUS_ROOT, bucket);
    if (!fs.existsSync(bucketDir)) {
      console.log(`  ⚠ Bucket dir not found: ${bucket}`);
      continue;
    }

    const files = walkDir(bucketDir);
    for (const filePath of files) {
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      const sizeBytes = fs.statSync(filePath).size;

      // Filter bc_guidelines_core administrative PDFs
      if (bucket === 'bc_guidelines_core' && ext === '.pdf') {
        if (BC_ADMIN_PATTERNS.some((p) => p.test(filename))) {
          continue; // Skip administrative docs
        }
      }

      if (ext === '.html' || ext === '.htm') {
        html.push({
          path: filePath,
          filename,
          bucket,
          fileType: 'html',
          sizeBytes,
          source: 'corpus',
        });
      } else if (ext === '.pdf') {
        pdf.push({
          path: filePath,
          filename,
          bucket,
          fileType: 'pdf',
          sizeBytes,
          source: 'corpus',
        });
      } else if (ext === '.docx') {
        pdf.push({
          path: filePath,
          filename,
          bucket,
          fileType: 'docx',
          sizeBytes,
          source: 'corpus',
        });
      }
    }
  }

  // Additional data: 05_primary_care_national
  if (!bucketArg || bucketArg === 'primary_care_national_additional') {
    const additionalDir = path.join(ADDITIONAL_ROOT, '05_primary_care_national');
    if (fs.existsSync(additionalDir)) {
      const files = walkDir(additionalDir);
      for (const filePath of files) {
        const ext = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath);
        const sizeBytes = fs.statSync(filePath).size;

        // Skip duplicates (files ending in -2 hash suffix before extension)
        if (/-2\.[^.]+$/.test(filename)) continue;
        // Skip non-clinical files
        if (
          /award|nomination|lecture|memoriam|news|webinar/i.test(filename)
        )
          continue;
        // Skip the poisoned AI-generated file
        if (filename.includes('organometallic') || filename.includes('78dbdc')) continue;

        if (ext === '.html' || ext === '.htm') {
          html.push({
            path: filePath,
            filename,
            bucket: 'primary_care_national_additional',
            fileType: 'html',
            sizeBytes,
            source: 'additional',
          });
        } else if (ext === '.pdf') {
          pdf.push({
            path: filePath,
            filename,
            bucket: 'primary_care_national_additional',
            fileType: 'pdf',
            sizeBytes,
            source: 'additional',
          });
        }
      }
    }
  }

  return { html, pdf };
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...walkDir(full));
      } else if (entry.isFile()) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

// ── Resumability: check what's already ingested ─────────────────────────────

async function getIngestedFiles(): Promise<Set<string>> {
  const rows = await db
    .select({
      filename: schema.corpusDocuments.filename,
      bucket: schema.corpusDocuments.sourceBucket,
    })
    .from(schema.corpusDocuments);

  return new Set(rows.map((r) => `${r.bucket}::${r.filename}`));
}

// ── Progress tracking ───────────────────────────────────────────────────────

class ProgressTracker {
  private total: number;
  private completed = 0;
  private errors = 0;
  private skipped = 0;
  private startTime = Date.now();
  private label: string;

  constructor(label: string, total: number) {
    this.label = label;
    this.total = total;
  }

  skip() {
    this.skipped++;
  }

  complete() {
    this.completed++;
    this.log();
  }

  error() {
    this.errors++;
    this.log();
  }

  private log() {
    const done = this.completed + this.errors;
    const elapsed = (Date.now() - this.startTime) / 1000;
    const rate = done / elapsed;
    const remaining = this.total - done - this.skipped;
    const eta = rate > 0 ? Math.round(remaining / rate) : '?';
    process.stdout.write(
      `\r  [${this.label}] ${done}/${this.total - this.skipped} (${this.errors} errors) | ${rate.toFixed(1)}/s | ETA: ${eta}s     `,
    );
  }

  summary(): string {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(0);
    return `${this.label}: ${this.completed} ingested, ${this.errors} errors, ${this.skipped} skipped (${elapsed}s)`;
  }
}

// ── Main ingestion ──────────────────────────────────────────────────────────

async function ingestTrackA(files: FileEntry[], ingested: Set<string>) {
  console.log(`\n═══ Track A: HTML Ingestion (${files.length} files) ═══\n`);

  const toProcess = files.filter(
    (f) => !ingested.has(`${f.bucket}::${f.filename}`),
  );
  const skipped = files.length - toProcess.length;
  if (skipped > 0) {
    console.log(`  Skipping ${skipped} already-ingested files.`);
  }

  const progress = new ProgressTracker('HTML', files.length);
  for (let i = 0; i < skipped; i++) progress.skip();

  let totalChunks = 0;

  for (const file of toProcess) {
    try {
      const html = fs.readFileSync(file.path, 'utf-8');
      const title = extractTitle(html);
      const chunks = parseHtml(html);

      if (chunks.length === 0) {
        progress.complete();
        continue;
      }

      await storeDocument(
        {
          sourceBucket: file.bucket,
          uploadGroup: getUploadGroup(file.bucket),
          sourceUrl: null,
          documentTitle: title,
          filename: file.filename,
          fileType: 'html',
          contentType: getContentTypeForBucket(file.bucket),
          clinicalDomains: getDomainsForBucket(file.bucket),
          jurisdiction: getJurisdictionForBucket(file.bucket),
          sha1: null,
          fileSizeBytes: file.sizeBytes,
        },
        chunks,
      );

      totalChunks += chunks.length;
      progress.complete();
    } catch (err: any) {
      console.error(`\n  ✗ ${file.filename}: ${err.message}`);
      progress.error();
    }
  }

  console.log(`\n  ${progress.summary()}`);
  console.log(`  Total chunks: ${totalChunks}`);
  return totalChunks;
}

async function ingestTrackB(files: FileEntry[], ingested: Set<string>) {
  console.log(
    `\n═══ Track B: PDF/DOCX Ingestion (${files.length} files) ═══\n`,
  );
  console.log(
    `  Unstructured page budget: ${getRemainingPages()} remaining\n`,
  );

  const toProcess = files.filter(
    (f) => !ingested.has(`${f.bucket}::${f.filename}`),
  );
  const skipped = files.length - toProcess.length;
  if (skipped > 0) {
    console.log(`  Skipping ${skipped} already-ingested files.`);
  }

  const progress = new ProgressTracker('PDF/DOCX', files.length);
  for (let i = 0; i < skipped; i++) progress.skip();

  let totalChunks = 0;

  for (const file of toProcess) {
    // Check page budget
    if (getRemainingPages() < 50) {
      console.log(`\n  ⚠ Page budget nearly exhausted! Stopping Track B.`);
      break;
    }

    try {
      const estPages = Math.max(1, Math.round(file.sizeBytes / 50000)); // rough estimate
      const chunks = await parseWithUnstructured(file.path, estPages);

      if (chunks.length === 0) {
        progress.complete();
        continue;
      }

      const title = file.filename
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      await storeDocument(
        {
          sourceBucket: file.bucket,
          uploadGroup: getUploadGroup(file.bucket),
          sourceUrl: null,
          documentTitle: title,
          filename: file.filename,
          fileType: file.fileType,
          contentType: getContentTypeForBucket(file.bucket),
          clinicalDomains: getDomainsForBucket(file.bucket),
          jurisdiction: getJurisdictionForBucket(file.bucket),
          sha1: null,
          fileSizeBytes: file.sizeBytes,
        },
        chunks,
      );

      totalChunks += chunks.length;
      progress.complete();
    } catch (err: any) {
      console.error(`\n  ✗ ${file.filename}: ${err.message}`);
      progress.error();
    }
  }

  console.log(`\n  ${progress.summary()}`);
  console.log(`  Total chunks: ${totalChunks}`);
  console.log(`  Unstructured pages consumed: ${getPagesConsumed()}`);
  return totalChunks;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════╗');
  console.log('║   BestPath Bulk Corpus Ingestion      ║');
  console.log('╚═══════════════════════════════════════╝\n');

  // Clear test data from previous test runs (but preserve any real ingestion)
  // Only clear if starting fresh (no --bucket flag)
  if (!bucketArg) {
    const existing = await db
      .select({ c: sql<number>`count(*)` })
      .from(schema.corpusDocuments);
    const count = existing[0]?.c || 0;
    if (count > 0 && count < 20) {
      // Looks like test data — clear it
      console.log(`Clearing ${count} test documents from previous runs...`);
      await db.delete(schema.corpusChunks);
      await db.delete(schema.corpusDocuments);
    }
  }

  console.log('Discovering files...');
  const { html, pdf } = discoverFiles();
  console.log(`  Found: ${html.length} HTML, ${pdf.length} PDF/DOCX`);
  console.log(
    `  Buckets: ${[...new Set([...html, ...pdf].map((f) => f.bucket))].join(', ')}\n`,
  );

  const ingested = await getIngestedFiles();
  if (ingested.size > 0) {
    console.log(`  Already ingested: ${ingested.size} files (will skip)\n`);
  }

  let totalChunks = 0;

  if (trackArg === 'a' || trackArg === 'both') {
    totalChunks += await ingestTrackA(html, ingested);
  }

  if (trackArg === 'b' || trackArg === 'both') {
    // Refresh ingested set after Track A
    const freshIngested = await getIngestedFiles();
    totalChunks += await ingestTrackB(pdf, freshIngested);
  }

  // Final counts
  console.log('\n═══ Final Summary ═══\n');
  const docCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.corpusDocuments);
  const chunkCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.corpusChunks);
  const embeddedCount = await db
    .select({ c: sql<number>`count(*)` })
    .from(schema.corpusChunks)
    .where(sql`embedding IS NOT NULL`);

  console.log(`  Documents: ${docCount[0]?.c}`);
  console.log(`  Chunks: ${chunkCount[0]?.c}`);
  console.log(`  Embedded: ${embeddedCount[0]?.c}`);
  if (trackArg === 'b' || trackArg === 'both') {
    console.log(`  Unstructured pages used: ${getPagesConsumed()}`);
  }

  // Per-bucket breakdown
  const bucketCounts = await db.execute(sql`
    SELECT source_bucket, count(*) as docs, sum(chunk_count) as chunks
    FROM corpus_documents
    GROUP BY source_bucket
    ORDER BY chunks DESC
  `);
  console.log('\n  Per-bucket:');
  for (const r of bucketCounts as any[]) {
    console.log(`    ${r.source_bucket}: ${r.docs} docs, ${r.chunks} chunks`);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nIngestion failed:', err);
  process.exit(1);
});
