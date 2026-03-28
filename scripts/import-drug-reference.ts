/**
 * Import Canadian Drug Reference CSV into BestPath database.
 * Idempotent: clears and re-inserts.
 *
 * Usage: npx tsx scripts/import-drug-reference.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as schema from '../src/lib/db/schema';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

const CSV_PATH = path.resolve(
  __dirname,
  '../hackathon-data/shared/drug-database/canadian_drug_reference.csv',
);

async function importDrugs() {
  console.log('=== Canadian Drug Reference Import ===\n');

  if (!fs.existsSync(CSV_PATH)) {
    console.error(`File not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const content = fs.readFileSync(CSV_PATH, 'utf-8');
  const rows = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  console.log(`Read ${rows.length} drug records.\n`);

  // Clear existing
  console.log('Clearing existing drug reference data...');
  await db.delete(schema.canadianDrugReference);

  // Insert
  const values = rows.map((r) => ({
    din: r.din!,
    drugName: r.drug_name!,
    genericName: r.generic_name || null,
    drugClass: r.drug_class || null,
    commonIndication: r.common_indication || null,
    typicalDosage: r.typical_dosage || null,
    route: r.route || null,
    schedule: r.schedule || null,
  }));

  await db.insert(schema.canadianDrugReference).values(values);

  console.log(`Imported ${values.length} drug reference records.`);
}

importDrugs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
