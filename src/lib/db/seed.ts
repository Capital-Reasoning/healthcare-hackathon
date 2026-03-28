/**
 * Seed script — DEPRECATED.
 *
 * The database schema was rewritten for Synthea data imports.
 * Use the dedicated import scripts instead:
 *
 *   scripts/import-synthea.ts     — Import Synthea patient/encounter/lab/vitals/medication data
 *   scripts/import-drug-reference.ts — Import Canadian drug reference data
 *   scripts/ingest-corpus.ts      — Ingest corpus documents for RAG
 *
 * This file is kept as a placeholder so `npm run db:seed` doesn't break.
 */

console.log('Seed script is deprecated. Use dedicated import scripts:');
console.log('  npx tsx scripts/import-synthea.ts');
console.log('  npx tsx scripts/import-drug-reference.ts');
console.log('  npx tsx scripts/ingest-corpus.ts');
process.exit(0);
