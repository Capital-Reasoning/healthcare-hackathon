/**
 * Parallel corpus ingestion for Track B (PDF/DOCX).
 * Runs multiple Unstructured API calls concurrently to speed up ingestion.
 * Resumable: skips already-ingested files.
 *
 * Usage: npx tsx scripts/ingest-corpus-parallel.ts [--concurrency=N] [--bucket=name]
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { sql } from 'drizzle-orm';
import { parseWithUnstructured, getPagesConsumed, getRemainingPages } from './lib/unstructured-parser';
import {
  storeDocument,
  getDomainsForBucket,
  getJurisdictionForBucket,
  getContentTypeForBucket,
  getUploadGroup,
  db,
} from './lib/corpus-store';
import * as schema from '../src/lib/db/schema';

// ── Config ──────────────────────────────────────────────────────────────────

const CORPUS_ROOT = path.resolve(__dirname, '../health-info-data/next-best-pathway-corpus/01_sources');
const ADDITIONAL_ROOT = path.resolve(__dirname, '../health-info-data/additional-data/Vector Content');

const args = process.argv.slice(2);
const CONCURRENCY = Number(args.find(a => a.startsWith('--concurrency='))?.split('=')[1] || '5');
const bucketArg = args.find(a => a.startsWith('--bucket='))?.split('=')[1] || null;

const CORE_BUCKETS = [
  'diabetes_national_guidance', 'hypertension_guidance', 'cardiovascular_guidance',
  'respiratory_guidance', 'renal_ckd_primary_care',
  'bc_guidelines_core', 'primary_care_national_curated', 'specialty_guidelines_curated',
  'preventive_task_force', 'bc_cancer_screening', 'immunization_prevention',
  'diagnostic_referral_guidance', 'emergency_risk_support',
  'interoperability_standards', 'substance_use_primary_care',
];

const BC_ADMIN_PATTERNS = [/contributor/i, /cme.?credit/i, /external.?review/i, /translated/i,
  /arabic|chinese|farsi|french|korean|punjabi|spanish|vietnamese/i];

interface FileEntry {
  path: string; filename: string; bucket: string;
  fileType: 'pdf' | 'docx'; sizeBytes: number;
}

function walkDir(dir: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) results.push(...walkDir(full));
      else if (entry.isFile()) results.push(full);
    }
  } catch {}
  return results;
}

function discoverPdfFiles(): FileEntry[] {
  const files: FileEntry[] = [];
  const buckets = bucketArg ? CORE_BUCKETS.filter(b => b === bucketArg) : CORE_BUCKETS;

  for (const bucket of buckets) {
    const bucketDir = path.join(CORPUS_ROOT, bucket);
    if (!fs.existsSync(bucketDir)) continue;
    for (const filePath of walkDir(bucketDir)) {
      const ext = path.extname(filePath).toLowerCase();
      const filename = path.basename(filePath);
      if (ext !== '.pdf' && ext !== '.docx') continue;
      if (bucket === 'bc_guidelines_core' && ext === '.pdf' && BC_ADMIN_PATTERNS.some(p => p.test(filename))) continue;
      files.push({ path: filePath, filename, bucket, fileType: ext.slice(1) as 'pdf' | 'docx', sizeBytes: fs.statSync(filePath).size });
    }
  }

  // Additional: 05_primary_care_national
  if (!bucketArg || bucketArg === 'primary_care_national_additional') {
    const dir = path.join(ADDITIONAL_ROOT, '05_primary_care_national');
    if (fs.existsSync(dir)) {
      for (const filePath of walkDir(dir)) {
        const ext = path.extname(filePath).toLowerCase();
        const filename = path.basename(filePath);
        if (ext !== '.pdf' && ext !== '.docx') continue;
        if (/-2\.[^.]+$/.test(filename)) continue;
        if (/award|nomination|lecture|memoriam|news|webinar/i.test(filename)) continue;
        if (filename.includes('organometallic') || filename.includes('78dbdc')) continue;
        files.push({ path: filePath, filename, bucket: 'primary_care_national_additional', fileType: ext.slice(1) as 'pdf' | 'docx', sizeBytes: fs.statSync(filePath).size });
      }
    }
  }

  return files;
}

async function getIngestedFiles(): Promise<Set<string>> {
  const rows = await db.select({ filename: schema.corpusDocuments.filename, bucket: schema.corpusDocuments.sourceBucket }).from(schema.corpusDocuments);
  return new Set(rows.map(r => `${r.bucket}::${r.filename}`));
}

// ── Parallel worker pool ────────────────────────────────────────────────────

let completed = 0;
let errors = 0;
let totalChunks = 0;
let startTime = Date.now();

async function processFile(file: FileEntry): Promise<void> {
  try {
    if (getRemainingPages() < 50) {
      console.log(`\n  ⚠ Page budget nearly exhausted! Skipping ${file.filename}`);
      return;
    }

    const estPages = Math.max(1, Math.round(file.sizeBytes / 50000));
    const chunks = await parseWithUnstructured(file.path, estPages);

    if (chunks.length === 0) {
      completed++;
      return;
    }

    const title = file.filename.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();

    await storeDocument({
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
    }, chunks);

    totalChunks += chunks.length;
    completed++;
  } catch (err: any) {
    errors++;
    console.error(`\n  ✗ ${file.filename}: ${err.message}`);
  }
}

async function runPool(files: FileEntry[]) {
  const queue = [...files];
  const active: Promise<void>[] = [];

  function logProgress() {
    const done = completed + errors;
    const total = files.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = done / Math.max(elapsed, 1);
    const remaining = total - done;
    const eta = rate > 0 ? Math.round(remaining / rate) : '?';
    process.stdout.write(`\r  [PDF] ${done}/${total} (${errors} err) | ${rate.toFixed(2)}/s | chunks: ${totalChunks} | pages: ${getPagesConsumed()} | ETA: ${eta}s    `);
  }

  const interval = setInterval(logProgress, 2000);

  async function worker() {
    while (queue.length > 0) {
      const file = queue.shift()!;
      await processFile(file);
    }
  }

  // Launch N concurrent workers
  const workers: Promise<void>[] = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  clearInterval(interval);
  logProgress();
  console.log();
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  BestPath Parallel PDF/DOCX Ingestion     ║');
  console.log(`║  Concurrency: ${CONCURRENCY}                            ║`);
  console.log('╚═══════════════════════════════════════════╝\n');

  console.log('Discovering PDF/DOCX files...');
  const allFiles = discoverPdfFiles();
  console.log(`  Found: ${allFiles.length} files\n`);

  const ingested = await getIngestedFiles();
  const toProcess = allFiles.filter(f => !ingested.has(`${f.bucket}::${f.filename}`));
  const skipped = allFiles.length - toProcess.length;
  if (skipped > 0) console.log(`  Skipping ${skipped} already-ingested files.`);
  console.log(`  Processing: ${toProcess.length} files\n`);

  if (toProcess.length === 0) {
    console.log('Nothing to do.');
    process.exit(0);
  }

  startTime = Date.now();
  await runPool(toProcess);

  // Final summary
  console.log('\n═══ Final Summary ═══\n');
  const docCount = await db.select({ c: sql<number>`count(*)` }).from(schema.corpusDocuments);
  const chunkCount = await db.select({ c: sql<number>`count(*)` }).from(schema.corpusChunks);
  const embeddedCount = await db.select({ c: sql<number>`count(*)` }).from(schema.corpusChunks).where(sql`embedding IS NOT NULL`);

  console.log(`  Total documents: ${docCount[0]?.c}`);
  console.log(`  Total chunks: ${chunkCount[0]?.c}`);
  console.log(`  Embedded: ${embeddedCount[0]?.c}`);
  console.log(`  Unstructured pages used: ${getPagesConsumed()}`);

  const bucketCounts = await db.execute(sql`
    SELECT source_bucket, count(*) as docs, sum(chunk_count) as chunks
    FROM corpus_documents GROUP BY source_bucket ORDER BY chunks DESC
  `);
  console.log('\n  Per-bucket:');
  for (const r of bucketCounts as any[]) {
    console.log(`    ${r.source_bucket}: ${r.docs} docs, ${r.chunks} chunks`);
  }

  console.log('\nDone.');
  process.exit(0);
}

main().catch(err => { console.error('\nFailed:', err); process.exit(1); });
