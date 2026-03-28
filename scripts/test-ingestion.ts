/**
 * Test ingestion pipeline on sample files before bulk run.
 * Tests Track A (HTML/cheerio) and Track B (PDF/Unstructured) separately,
 * then verifies retrieval across both.
 *
 * Usage: npx tsx scripts/test-ingestion.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { parseHtml, extractTitle } from './lib/html-parser';
import {
  parseWithUnstructured,
  getPagesConsumed,
} from './lib/unstructured-parser';
import {
  storeDocument,
  getDomainsForBucket,
  getJurisdictionForBucket,
  getContentTypeForBucket,
  getUploadGroup,
  db,
} from './lib/corpus-store';
import { embedQuery } from '../src/lib/rag/embed';
import { sql, cosineDistance, desc } from 'drizzle-orm';
import * as schema from '../src/lib/db/schema';

const CORPUS_ROOT = path.resolve(
  __dirname,
  '../health-info-data/next-best-pathway-corpus/01_sources',
);

// Sample files for testing — one from each important bucket type
const TEST_FILES = {
  trackA: [
    {
      bucket: 'hypertension_guidance',
      path: 'hypertension_guidance/hypertension_canada_guidelines/pages/diagnosis-16ccedb49a5a.html',
      description: 'Hypertension Canada — Diagnosis (clinical recommendations)',
    },
    {
      bucket: 'diabetes_national_guidance',
      // Find a clinical content page, not landing page
      glob: 'diabetes_national_guidance/**/pages/*.html',
      skipLanding: true,
      description: 'Diabetes Canada — clinical guidance chapter',
    },
    {
      bucket: 'cardiovascular_guidance',
      glob: 'cardiovascular_guidance/**/pages/*.html',
      description: 'Cardiovascular guidance HTML',
    },
  ],
  trackB: [
    {
      bucket: 'renal_ckd_primary_care',
      glob: 'renal_ckd_primary_care/**/*.pdf',
      description: 'Renal/CKD PDF (likely has threshold tables)',
    },
    {
      bucket: 'respiratory_guidance',
      glob: 'respiratory_guidance/**/*.pdf',
      description: 'Respiratory guidance PDF',
    },
  ],
};

function findFiles(pattern: string, root: string): string[] {
  // Simple glob-like search
  const parts = pattern.split('/');
  let paths = [root];

  for (const part of parts) {
    const next: string[] = [];
    for (const p of paths) {
      if (part === '**') {
        // Recursive
        const walk = (dir: string): string[] => {
          const entries: string[] = [dir];
          try {
            for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
              if (e.isDirectory()) entries.push(...walk(path.join(dir, e.name)));
            }
          } catch {}
          return entries;
        };
        next.push(...walk(p));
      } else if (part.includes('*')) {
        // Wildcard
        const re = new RegExp(
          '^' + part.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$',
        );
        try {
          for (const e of fs.readdirSync(p)) {
            if (re.test(e)) next.push(path.join(p, e));
          }
        } catch {}
      } else {
        const full = path.join(p, part);
        if (fs.existsSync(full)) next.push(full);
      }
    }
    paths = next;
  }

  return paths.filter((p) => fs.statSync(p).isFile());
}

async function testTrackA() {
  console.log('\n═══ Track A: HTML Parser (cheerio) ═══\n');

  let totalChunks = 0;
  let totalDocs = 0;

  for (const test of TEST_FILES.trackA) {
    let filePath: string;

    if (test.path) {
      filePath = path.join(CORPUS_ROOT, test.path);
    } else if (test.glob) {
      const files = findFiles(test.glob, CORPUS_ROOT);
      // Pick a file with decent size (skip tiny ones)
      const candidates = files
        .map((f) => ({ path: f, size: fs.statSync(f).size }))
        .filter((f) => f.size > 10000)
        .sort((a, b) => b.size - a.size);

      if (candidates.length === 0) {
        console.log(`  ⚠ No suitable files found for: ${test.description}`);
        continue;
      }
      filePath = candidates[0]!.path;
    } else {
      continue;
    }

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠ File not found: ${filePath}`);
      continue;
    }

    const filename = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;
    console.log(`── ${test.description} ──`);
    console.log(`  File: ${filename} (${(fileSize / 1024).toFixed(1)} KB)`);

    const html = fs.readFileSync(filePath, 'utf-8');
    const title = extractTitle(html);
    console.log(`  Title: ${title}`);

    const startTime = Date.now();
    const chunks = parseHtml(html);
    const elapsed = Date.now() - startTime;

    console.log(`  Parsed in ${elapsed}ms → ${chunks.length} chunks`);

    if (chunks.length === 0) {
      console.log(`  ⚠ No chunks produced!`);
      continue;
    }

    // Stats
    const sizes = chunks.map((c) => c.text.length);
    const tables = chunks.filter((c) => c.chunkType === 'table');
    const withEmphasis = chunks.filter(
      (c) => c.emphasizedText.length > 0,
    );

    console.log(
      `  Chunk sizes: min=${Math.min(...sizes)}, avg=${Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length)}, max=${Math.max(...sizes)}`,
    );
    console.log(`  Tables: ${tables.length}, With emphasis: ${withEmphasis.length}`);
    console.log(`  Headings: ${[...new Set(chunks.map((c) => c.heading).filter(Boolean))].slice(0, 5).join(', ')}...`);

    // Show first chunk preview
    console.log(`  First chunk preview (${chunks[0]!.text.length} chars):`);
    console.log(`    "${chunks[0]!.text.substring(0, 200)}..."`);

    // Store in DB with embeddings
    console.log(`  Embedding + storing...`);
    const docId = await storeDocument(
      {
        sourceBucket: test.bucket,
        uploadGroup: getUploadGroup(test.bucket),
        sourceUrl: null,
        documentTitle: title,
        filename,
        fileType: 'html',
        contentType: getContentTypeForBucket(test.bucket),
        clinicalDomains: getDomainsForBucket(test.bucket),
        jurisdiction: getJurisdictionForBucket(test.bucket),
        sha1: null,
        fileSizeBytes: fileSize,
      },
      chunks,
    );

    if (docId) {
      console.log(`  ✓ Stored: ${chunks.length} chunks, doc_id=${docId}`);
      totalChunks += chunks.length;
      totalDocs++;
    }

    console.log();
  }

  return { totalDocs, totalChunks };
}

async function testTrackB() {
  console.log('\n═══ Track B: PDF Parser (Unstructured) ═══\n');

  let totalChunks = 0;
  let totalDocs = 0;

  for (const test of TEST_FILES.trackB) {
    const files = findFiles(test.glob!, CORPUS_ROOT);
    if (files.length === 0) {
      console.log(`  ⚠ No files found for: ${test.description}`);
      continue;
    }

    // Pick the first reasonable PDF
    const filePath = files[0]!;
    const filename = path.basename(filePath);
    const fileSize = fs.statSync(filePath).size;

    console.log(`── ${test.description} ──`);
    console.log(`  File: ${filename} (${(fileSize / 1024).toFixed(1)} KB)`);

    const startTime = Date.now();
    const chunks = await parseWithUnstructured(filePath);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(
      `  Parsed in ${elapsed}s → ${chunks.length} chunks (pages consumed: ${getPagesConsumed()})`,
    );

    if (chunks.length === 0) {
      console.log(`  ⚠ No chunks produced!`);
      continue;
    }

    // Stats
    const sizes = chunks.map((c) => c.text.length);
    const tables = chunks.filter((c) => c.chunkType === 'table');
    const withHtml = chunks.filter((c) => c.textAsHtml);

    console.log(
      `  Chunk sizes: min=${Math.min(...sizes)}, avg=${Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length)}, max=${Math.max(...sizes)}`,
    );
    console.log(`  Tables: ${tables.length}, With text_as_html: ${withHtml.length}`);

    // Show first chunk preview
    console.log(`  First chunk preview (${chunks[0]!.text.length} chars):`);
    console.log(`    "${chunks[0]!.text.substring(0, 200)}..."`);

    if (tables.length > 0) {
      const t = tables[0]!;
      console.log(`  Sample table (${t.text.length} chars):`);
      console.log(`    "${t.text.substring(0, 200)}..."`);
    }

    // Store in DB with embeddings
    console.log(`  Embedding + storing...`);
    const docId = await storeDocument(
      {
        sourceBucket: test.bucket,
        uploadGroup: getUploadGroup(test.bucket),
        sourceUrl: null,
        documentTitle: filename.replace(/\.pdf$/, '').replace(/[-_]/g, ' '),
        filename,
        fileType: 'pdf',
        contentType: getContentTypeForBucket(test.bucket),
        clinicalDomains: getDomainsForBucket(test.bucket),
        jurisdiction: getJurisdictionForBucket(test.bucket),
        sha1: null,
        fileSizeBytes: fileSize,
      },
      chunks,
    );

    if (docId) {
      console.log(`  ✓ Stored: ${chunks.length} chunks, doc_id=${docId}`);
      totalChunks += chunks.length;
      totalDocs++;
    }

    console.log();
  }

  return { totalDocs, totalChunks };
}

async function testRetrieval() {
  console.log('\n═══ Cross-Track Retrieval Test ═══\n');

  const queries = [
    'blood pressure thresholds for hypertension diagnosis',
    'HbA1c target for type 2 diabetes management',
    'CKD screening criteria and eGFR thresholds',
    'COPD exacerbation management guidelines',
  ];

  for (const query of queries) {
    console.log(`Query: "${query}"`);

    // Vector search
    const queryEmbedding = await embedQuery(query);

    const similarity = sql<number>`1 - (${cosineDistance(schema.corpusChunks.embedding, queryEmbedding)})`;

    const results = await db
      .select({
        id: schema.corpusChunks.id,
        content: schema.corpusChunks.content,
        heading: schema.corpusChunks.heading,
        sourceBucket: schema.corpusChunks.sourceBucket,
        chunkType: schema.corpusChunks.chunkType,
        documentTitle: schema.corpusDocuments.documentTitle,
        similarity,
      })
      .from(schema.corpusChunks)
      .innerJoin(
        schema.corpusDocuments,
        sql`${schema.corpusChunks.documentId} = ${schema.corpusDocuments.id}`,
      )
      .where(sql`${schema.corpusChunks.embedding} IS NOT NULL`)
      .orderBy(cosineDistance(schema.corpusChunks.embedding, queryEmbedding))
      .limit(3);

    if (results.length === 0) {
      console.log('  No results (corpus may be empty)\n');
      continue;
    }

    for (let i = 0; i < results.length; i++) {
      const r = results[i]!;
      console.log(
        `  [${i + 1}] score=${r.similarity.toFixed(3)} bucket=${r.sourceBucket} type=${r.chunkType}`,
      );
      console.log(`      doc: ${r.documentTitle}`);
      console.log(`      heading: ${r.heading || '(none)'}`);
      console.log(`      preview: "${r.content.substring(0, 150)}..."`);
    }

    // Keyword search
    const kwResults = await db.execute(sql`
      SELECT id, content, source_bucket, heading,
        ts_rank(content_tsvector, plainto_tsquery('english', ${query})) as rank
      FROM corpus_chunks
      WHERE content_tsvector @@ plainto_tsquery('english', ${query})
      ORDER BY rank DESC
      LIMIT 3
    `);

    if ((kwResults as any[]).length > 0) {
      console.log(`  Keyword matches: ${(kwResults as any[]).length}`);
      for (const r of (kwResults as any[]).slice(0, 2)) {
        console.log(
          `    rank=${Number(r.rank).toFixed(4)} bucket=${r.source_bucket}: "${(r.content as string).substring(0, 100)}..."`,
        );
      }
    } else {
      console.log('  No keyword matches');
    }

    console.log();
  }
}

async function main() {
  console.log('╔══════════════════════════════════════╗');
  console.log('║   BestPath Ingestion Pipeline Test   ║');
  console.log('╚══════════════════════════════════════╝\n');

  // Clean test data from previous runs
  console.log('Clearing any existing corpus data...');
  await db.delete(schema.corpusChunks);
  await db.delete(schema.corpusDocuments);
  console.log('  Done.\n');

  const trackA = await testTrackA();
  console.log(
    `Track A totals: ${trackA.totalDocs} docs, ${trackA.totalChunks} chunks\n`,
  );

  const trackB = await testTrackB();
  console.log(
    `Track B totals: ${trackB.totalDocs} docs, ${trackB.totalChunks} chunks`,
  );
  console.log(`Unstructured pages consumed: ${getPagesConsumed()}\n`);

  await testRetrieval();

  console.log('═══ Test Complete ═══');
  console.log(
    `Total: ${trackA.totalDocs + trackB.totalDocs} docs, ${trackA.totalChunks + trackB.totalChunks} chunks`,
  );

  process.exit(0);
}

main().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
