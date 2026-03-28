/**
 * Import Synthea hackathon dataset into BestPath database.
 * Reads 5 CSVs: patients, encounters, medications, lab_results, vitals.
 * Idempotent: clears and re-inserts all data.
 *
 * Usage: npx tsx scripts/import-synthea.ts
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

const DATA_DIR = path.resolve(
  __dirname,
  '../hackathon-data/track-1-clinical-ai/synthea-patients',
);

function readCsv<T>(filename: string): T[] {
  const filepath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filepath, 'utf-8');
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as T[];
}

function parseDate(val: string | undefined | null): string | null {
  if (!val || val.trim() === '') return null;
  return val.trim();
}

function parseNum(val: string | undefined | null): string | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : String(n);
}

function parseInt_(val: string | undefined | null): number | null {
  if (!val || val.trim() === '') return null;
  const n = Number(val);
  return isNaN(n) ? null : Math.round(n);
}

function parseBool(val: string | undefined | null): boolean {
  if (!val) return false;
  return val.trim().toLowerCase() === 'true';
}

const BATCH_SIZE = 500;

async function batchInsert<T extends Record<string, unknown>>(
  table: any,
  rows: T[],
  label: string,
) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await db.insert(table).values(batch);
    process.stdout.write(
      `\r  ${label}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`,
    );
  }
  console.log();
}

async function importAll() {
  console.log('=== BestPath Synthea Import ===\n');
  console.log(`Data directory: ${DATA_DIR}\n`);

  // Verify files exist
  const files = [
    'patients.csv',
    'encounters.csv',
    'medications.csv',
    'lab_results.csv',
    'vitals.csv',
  ];
  for (const f of files) {
    if (!fs.existsSync(path.join(DATA_DIR, f))) {
      console.error(`Missing file: ${f}`);
      process.exit(1);
    }
  }

  // Clear existing data (reverse FK order)
  console.log('Clearing existing Synthea data...');
  await db.delete(schema.vitals);
  await db.delete(schema.labResults);
  await db.delete(schema.medications);
  await db.delete(schema.encounters);
  await db.delete(schema.patients);
  console.log('  Done.\n');

  // ── Patients ──
  console.log('Importing patients...');
  const rawPatients = readCsv<Record<string, string>>('patients.csv');
  const patientRows = rawPatients.map((r) => ({
    patientId: r.patient_id!,
    firstName: r.first_name!,
    lastName: r.last_name!,
    dateOfBirth: parseDate(r.date_of_birth),
    age: parseInt_(r.age),
    sex: r.sex || null,
    postalCode: r.postal_code || null,
    bloodType: r.blood_type || null,
    insuranceNumber: r.insurance_number || null,
    primaryLanguage: r.primary_language || null,
    emergencyContactPhone: r.emergency_contact_phone || null,
  }));
  await batchInsert(schema.patients, patientRows, 'Patients');

  // ── Encounters ──
  console.log('Importing encounters...');
  const rawEncounters = readCsv<Record<string, string>>('encounters.csv');
  const encounterRows = rawEncounters.map((r) => ({
    encounterId: r.encounter_id!,
    patientId: r.patient_id!,
    encounterDate: parseDate(r.encounter_date),
    encounterType: r.encounter_type || null,
    facility: r.facility || null,
    chiefComplaint: r.chief_complaint || null,
    diagnosisCode: r.diagnosis_code || null,
    diagnosisDescription: r.diagnosis_description || null,
    triageLevel: parseInt_(r.triage_level),
    disposition: r.disposition || null,
    lengthOfStayHours: parseNum(r.length_of_stay_hours),
    attendingPhysician: r.attending_physician || null,
  }));
  await batchInsert(schema.encounters, encounterRows, 'Encounters');

  // ── Medications ──
  console.log('Importing medications...');
  const rawMeds = readCsv<Record<string, string>>('medications.csv');
  const medRows = rawMeds.map((r) => ({
    medicationId: r.medication_id!,
    patientId: r.patient_id!,
    drugName: r.drug_name!,
    drugCode: r.drug_code || null,
    dosage: r.dosage || null,
    frequency: r.frequency || null,
    route: r.route || null,
    prescriber: r.prescriber || null,
    startDate: parseDate(r.start_date),
    endDate: parseDate(r.end_date),
    active: parseBool(r.active),
  }));
  await batchInsert(schema.medications, medRows, 'Medications');

  // ── Lab Results ──
  console.log('Importing lab results...');
  const rawLabs = readCsv<Record<string, string>>('lab_results.csv');
  const labRows = rawLabs.map((r) => ({
    labId: r.lab_id!,
    patientId: r.patient_id!,
    encounterId: r.encounter_id || null,
    testName: r.test_name || null,
    testCode: r.test_code || null,
    value: parseNum(r.value),
    unit: r.unit || null,
    referenceRangeLow: parseNum(r.reference_range_low),
    referenceRangeHigh: parseNum(r.reference_range_high),
    abnormalFlag: r.abnormal_flag || null,
    collectedDate: parseDate(r.collected_date),
  }));
  await batchInsert(schema.labResults, labRows, 'Lab Results');

  // ── Vitals ──
  console.log('Importing vitals...');
  const rawVitals = readCsv<Record<string, string>>('vitals.csv');
  const vitalRows = rawVitals.map((r) => ({
    vitalsId: r.vitals_id!,
    patientId: r.patient_id!,
    encounterId: r.encounter_id || null,
    heartRate: parseInt_(r.heart_rate),
    systolicBp: parseInt_(r.systolic_bp),
    diastolicBp: parseInt_(r.diastolic_bp),
    temperatureCelsius: parseNum(r.temperature_celsius),
    respiratoryRate: parseInt_(r.respiratory_rate),
    o2Saturation: parseNum(r.o2_saturation),
    painScale: parseInt_(r.pain_scale),
    recordedAt: r.recorded_at ? new Date(r.recorded_at) : null,
  }));
  await batchInsert(schema.vitals, vitalRows, 'Vitals');

  // ── Summary ──
  console.log('\n=== Import Complete ===');
  console.log(`  Patients:    ${patientRows.length}`);
  console.log(`  Encounters:  ${encounterRows.length}`);
  console.log(`  Medications: ${medRows.length}`);
  console.log(`  Lab Results: ${labRows.length}`);
  console.log(`  Vitals:      ${vitalRows.length}`);
}

importAll()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('\nImport failed:', err);
    process.exit(1);
  });
