/**
 * Import validation dataset (100 synthetic test cases + answer keys) into BestPath database.
 * Idempotent: clears and re-inserts.
 *
 * Usage: npx tsx scripts/import-validation.ts
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as schema from '../src/lib/db/schema';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

const BUNDLE_DIR = path.resolve(
  __dirname,
  '../docs/spec/synthetic_dataset_bundle',
);

function readJsonl<T>(filename: string): T[] {
  const filepath = path.join(BUNDLE_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return content
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line) as T);
}

async function importValidation() {
  console.log('=== Validation Dataset Import ===\n');

  // Read JSONL files
  const cases = readJsonl<Record<string, any>>('patient_cases.jsonl');
  const answers = readJsonl<Record<string, any>>('answer_key.jsonl');

  console.log(`Read ${cases.length} patient cases, ${answers.length} answer keys.\n`);

  // Clear existing
  console.log('Clearing existing validation data...');
  await db.delete(schema.validationAnswerKeys);
  await db.delete(schema.validationCases);

  // Insert cases
  console.log('Importing validation cases...');
  const caseValues = cases.map((c) => ({
    caseId: c.case_id as string,
    clinicalDomain: (c.clinical_domain as string) || null,
    packageSize: (c.package_size as string) || null,
    difficulty: (c.difficulty as string) || null,
    isEdgeCase: Boolean(c.is_edge_case),
    patientPackage: c.patient_package,
  }));

  // Batch insert
  const BATCH = 50;
  for (let i = 0; i < caseValues.length; i += BATCH) {
    await db
      .insert(schema.validationCases)
      .values(caseValues.slice(i, i + BATCH));
  }
  console.log(`  Inserted ${caseValues.length} cases.`);

  // Insert answer keys
  console.log('Importing answer keys...');
  const answerValues = answers.map((a) => ({
    caseId: a.case_id as string,
    label: a.label as string,
    targetCondition: (a.target_condition as string) || null,
    answerData: a,
  }));

  for (let i = 0; i < answerValues.length; i += BATCH) {
    await db
      .insert(schema.validationAnswerKeys)
      .values(answerValues.slice(i, i + BATCH));
  }
  console.log(`  Inserted ${answerValues.length} answer keys.`);

  console.log('\n=== Import Complete ===');
}

importValidation()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  });
