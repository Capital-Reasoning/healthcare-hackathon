/**
 * Seed script — populates the database with realistic demo data.
 * Run: npm run db:seed (or npx tsx src/lib/db/seed.ts)
 * Idempotent: clears all tables before inserting.
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { count } from 'drizzle-orm';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

// ── Helpers ──────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number, decimals: number = 1): string {
  return (Math.random() * (max - min) + min).toFixed(decimals);
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function randomDate(daysAgoMax: number, daysAgoMin: number = 0): Date {
  return daysAgo(randBetween(daysAgoMin, daysAgoMax));
}

function padMrn(n: number): string {
  return `MRN-${String(n).padStart(6, '0')}`;
}

// ── Data pools ───────────────────────────────────────────────────────────────

const FIRST_NAMES_F = [
  'Maria', 'Aisha', 'Elena', 'Sarah', 'Priya', 'Lisa', 'Nancy', 'Catherine',
  'Fatima', 'Rosa', 'Yuki', 'Jennifer', 'Amara', 'Sophia', 'Hannah', 'Diana',
  'Grace', 'Olivia', 'Nadia', 'Carmen',
];

const FIRST_NAMES_M = [
  'James', 'Robert', 'David', 'Michael', 'Ahmed', 'Marcus', 'William', 'Thomas',
  'Carlos', 'Wei', 'Samuel', 'Daniel', 'Joseph', 'Benjamin', 'Alexander', 'Patrick',
  'Anthony', 'Kevin', 'Nathan', 'Luis',
];

const LAST_NAMES = [
  'Santos', 'Mitchell', 'Patel', 'Chen', 'Voronova', 'Okonkwo', 'Kim', 'Adebayo',
  'Johnson', 'Williams', 'Garcia', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Lee',
  'Wilson', 'Brown', 'Davis', 'Jackson', 'White', 'Harris', 'Clark', 'Robinson',
  'Nguyen', 'Khan', 'Singh', 'Tanaka', 'Ali', 'Mueller',
];

interface Condition {
  name: string;
  icd10: string;
  riskBias: ('low' | 'medium' | 'high' | 'critical')[];
  medications: { name: string; code: string; dosages: string[]; frequency: string; route: string }[];
}

const CONDITIONS: Condition[] = [
  {
    name: 'Type 2 Diabetes',
    icd10: 'E11.9',
    riskBias: ['medium', 'high', 'high', 'critical'],
    medications: [
      { name: 'Metformin', code: 'RxN-6809', dosages: ['500mg', '1000mg'], frequency: 'Twice daily', route: 'oral' },
      { name: 'Glipizide', code: 'RxN-4815', dosages: ['5mg', '10mg'], frequency: 'Once daily', route: 'oral' },
    ],
  },
  {
    name: 'Hypertension',
    icd10: 'I10',
    riskBias: ['low', 'medium', 'medium', 'high'],
    medications: [
      { name: 'Lisinopril', code: 'RxN-29046', dosages: ['5mg', '10mg', '20mg'], frequency: 'Once daily', route: 'oral' },
      { name: 'Amlodipine', code: 'RxN-17767', dosages: ['5mg', '10mg'], frequency: 'Once daily', route: 'oral' },
    ],
  },
  {
    name: 'COPD',
    icd10: 'J44.1',
    riskBias: ['medium', 'high', 'high', 'critical'],
    medications: [
      { name: 'Tiotropium', code: 'RxN-274431', dosages: ['18mcg'], frequency: 'Once daily', route: 'inhalation' },
      { name: 'Albuterol', code: 'RxN-435', dosages: ['90mcg'], frequency: 'As needed', route: 'inhalation' },
    ],
  },
  {
    name: 'Heart Failure',
    icd10: 'I50.9',
    riskBias: ['high', 'high', 'critical', 'critical'],
    medications: [
      { name: 'Carvedilol', code: 'RxN-20352', dosages: ['3.125mg', '6.25mg', '12.5mg'], frequency: 'Twice daily', route: 'oral' },
      { name: 'Furosemide', code: 'RxN-4603', dosages: ['20mg', '40mg'], frequency: 'Once daily', route: 'oral' },
    ],
  },
  {
    name: 'Asthma',
    icd10: 'J45.20',
    riskBias: ['low', 'low', 'medium', 'medium'],
    medications: [
      { name: 'Fluticasone', code: 'RxN-25120', dosages: ['110mcg', '220mcg'], frequency: 'Twice daily', route: 'inhalation' },
      { name: 'Albuterol', code: 'RxN-435', dosages: ['90mcg'], frequency: 'As needed', route: 'inhalation' },
    ],
  },
  {
    name: 'Chronic Kidney Disease',
    icd10: 'N18.3',
    riskBias: ['medium', 'high', 'high', 'critical'],
    medications: [
      { name: 'Epoetin Alfa', code: 'RxN-3521', dosages: ['2000 units', '4000 units'], frequency: 'Three times weekly', route: 'subcutaneous' },
    ],
  },
  {
    name: 'Depression',
    icd10: 'F32.1',
    riskBias: ['low', 'low', 'medium', 'medium'],
    medications: [
      { name: 'Sertraline', code: 'RxN-36437', dosages: ['50mg', '100mg'], frequency: 'Once daily', route: 'oral' },
    ],
  },
  {
    name: 'Anxiety Disorder',
    icd10: 'F41.1',
    riskBias: ['low', 'low', 'medium'],
    medications: [
      { name: 'Escitalopram', code: 'RxN-321988', dosages: ['10mg', '20mg'], frequency: 'Once daily', route: 'oral' },
    ],
  },
  {
    name: 'Atrial Fibrillation',
    icd10: 'I48.91',
    riskBias: ['medium', 'high', 'high', 'critical'],
    medications: [
      { name: 'Apixaban', code: 'RxN-1364430', dosages: ['2.5mg', '5mg'], frequency: 'Twice daily', route: 'oral' },
      { name: 'Metoprolol', code: 'RxN-6918', dosages: ['25mg', '50mg'], frequency: 'Twice daily', route: 'oral' },
    ],
  },
  {
    name: 'Migraine',
    icd10: 'G43.909',
    riskBias: ['low', 'low', 'medium'],
    medications: [
      { name: 'Sumatriptan', code: 'RxN-37418', dosages: ['50mg', '100mg'], frequency: 'As needed', route: 'oral' },
    ],
  },
  {
    name: 'Rheumatoid Arthritis',
    icd10: 'M06.9',
    riskBias: ['medium', 'medium', 'high'],
    medications: [
      { name: 'Methotrexate', code: 'RxN-6851', dosages: ['7.5mg', '15mg'], frequency: 'Once weekly', route: 'oral' },
    ],
  },
  {
    name: 'Osteoarthritis',
    icd10: 'M19.90',
    riskBias: ['low', 'low', 'medium'],
    medications: [
      { name: 'Naproxen', code: 'RxN-7258', dosages: ['250mg', '500mg'], frequency: 'Twice daily', route: 'oral' },
    ],
  },
];

const ENCOUNTER_TYPES = ['Follow-up', 'New Visit', 'Emergency', 'Lab Review', 'Telehealth', 'Procedure'];
const STATES = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI'];
const CITIES = ['San Francisco', 'New York', 'Houston', 'Miami', 'Chicago', 'Philadelphia', 'Columbus', 'Atlanta', 'Charlotte', 'Detroit'];
const STREETS = ['123 Main St', '456 Oak Ave', '789 Elm Blvd', '321 Pine Rd', '654 Maple Dr', '987 Cedar Ln', '147 Birch Ct', '258 Walnut Way'];

// Vital sign LOINC codes
const VITAL_CODES = {
  systolicBP: { code: '8480-6', display: 'Systolic Blood Pressure', unit: 'mmHg' },
  diastolicBP: { code: '8462-4', display: 'Diastolic Blood Pressure', unit: 'mmHg' },
  heartRate: { code: '8867-4', display: 'Heart Rate', unit: 'bpm' },
  temperature: { code: '8310-5', display: 'Body Temperature', unit: '°F' },
  o2sat: { code: '2708-6', display: 'Oxygen Saturation', unit: '%' },
  weight: { code: '29463-7', display: 'Body Weight', unit: 'lbs' },
  respiratoryRate: { code: '9279-1', display: 'Respiratory Rate', unit: 'breaths/min' },
};

// Lab LOINC codes
const LAB_CODES = {
  hba1c: { code: '4548-4', display: 'HbA1c', unit: '%' },
  egfr: { code: '33914-3', display: 'eGFR', unit: 'mL/min/1.73m2' },
  creatinine: { code: '2160-0', display: 'Creatinine', unit: 'mg/dL' },
  totalCholesterol: { code: '2093-3', display: 'Total Cholesterol', unit: 'mg/dL' },
  ldl: { code: '2089-1', display: 'LDL Cholesterol', unit: 'mg/dL' },
  glucose: { code: '2345-7', display: 'Glucose', unit: 'mg/dL' },
  wbc: { code: '6690-2', display: 'White Blood Cell Count', unit: '10^3/uL' },
  hemoglobin: { code: '718-7', display: 'Hemoglobin', unit: 'g/dL' },
};

// ── Seed logic ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('Clearing existing data...');
  await db.delete(schema.messages);
  await db.delete(schema.conversations);
  await db.delete(schema.documentChunks);
  await db.delete(schema.documents);
  await db.delete(schema.observations);
  await db.delete(schema.medications);
  await db.delete(schema.encounters);
  await db.delete(schema.patients);
  await db.delete(schema.providers);
  await db.delete(schema.organizations);

  // ── Organizations ──
  console.log('Seeding organizations...');
  const orgs = await db
    .insert(schema.organizations)
    .values([
      {
        name: 'Metro General Hospital',
        type: 'hospital',
        address: { street: '1000 Health Way', city: 'San Francisco', state: 'CA', zip: '94102', country: 'US' },
      },
      {
        name: 'Bayview Community Clinic',
        type: 'clinic',
        address: { street: '250 Community Blvd', city: 'San Francisco', state: 'CA', zip: '94124', country: 'US' },
      },
      {
        name: 'Pacific Diagnostics Lab',
        type: 'lab',
        address: { street: '500 Lab Drive', city: 'San Francisco', state: 'CA', zip: '94110', country: 'US' },
      },
    ])
    .returning();

  // ── Providers ──
  console.log('Seeding providers...');
  const providerNames = [
    { name: 'Dr. Sarah Chen', specialty: 'Cardiology', department: 'Cardiology' },
    { name: 'Dr. James Wilson', specialty: 'Pulmonology', department: 'Pulmonology' },
    { name: 'Dr. Priya Sharma', specialty: 'Endocrinology', department: 'Endocrinology' },
    { name: 'Dr. Michael Torres', specialty: 'Primary Care', department: 'Internal Medicine' },
    { name: 'Dr. Amina Osei', specialty: 'Nephrology', department: 'Internal Medicine' },
    { name: 'Dr. David Park', specialty: 'Neurology', department: 'Neurology' },
    { name: 'Dr. Emily Rodriguez', specialty: 'Psychiatry', department: 'Psychiatry' },
    { name: 'Dr. Robert Johnson', specialty: 'Rheumatology', department: 'Orthopedics' },
  ];

  const providerRows = await db
    .insert(schema.providers)
    .values(
      providerNames.map((p) => ({
        name: p.name,
        specialty: p.specialty,
        department: p.department,
        email: `${p.name.split(' ')[1]!.toLowerCase()}@metrogeneral.org`,
      })),
    )
    .returning();

  // ── Patients ──
  console.log('Seeding patients (40)...');
  const patientValues: (typeof schema.patients.$inferInsert)[] = [];

  for (let i = 0; i < 40; i++) {
    const isFemale = i % 3 !== 2; // ~67% female, ~33% male (+ 2 other)
    const gender: 'male' | 'female' | 'other' =
      i >= 38 ? 'other' : isFemale ? 'female' : 'male';
    const firstName = gender === 'female' || gender === 'other'
      ? pick(FIRST_NAMES_F)
      : pick(FIRST_NAMES_M);
    const lastName = pick(LAST_NAMES);
    const condition = CONDITIONS[i % CONDITIONS.length]!;
    const riskLevel = pick(condition.riskBias);
    const age = randBetween(25, 88);
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    dob.setMonth(randBetween(0, 11));
    dob.setDate(randBetween(1, 28));

    const stateIdx = i % STATES.length;

    patientValues.push({
      mrn: padMrn(1001 + i),
      firstName,
      lastName,
      dateOfBirth: dob,
      gender,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `(${randBetween(200, 999)}) ${randBetween(200, 999)}-${String(randBetween(1000, 9999))}`,
      address: {
        street: pick(STREETS),
        city: CITIES[stateIdx],
        state: STATES[stateIdx],
        zip: String(randBetween(10000, 99999)),
        country: 'US',
      },
      riskLevel,
      primaryCondition: condition.name,
    });
  }

  const patientRows = await db
    .insert(schema.patients)
    .values(patientValues)
    .returning();

  // ── Encounters ──
  console.log('Seeding encounters (~150)...');
  const encounterValues: (typeof schema.encounters.$inferInsert)[] = [];

  for (const patient of patientRows) {
    // Higher risk = more encounters
    const riskMultiplier =
      patient.riskLevel === 'critical' ? 7 :
      patient.riskLevel === 'high' ? 5 :
      patient.riskLevel === 'medium' ? 4 : 3;
    const numEncounters = randBetween(2, riskMultiplier);

    for (let j = 0; j < numEncounters; j++) {
      const encounterType = pick(ENCOUNTER_TYPES);
      const startDate = randomDate(180, 1);
      const endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + randBetween(1, 8));

      const condition = CONDITIONS.find((c) => c.name === patient.primaryCondition);

      encounterValues.push({
        patientId: patient.id,
        providerId: pick(providerRows).id,
        organizationId: pick(orgs).id,
        type: encounterType,
        status: j === 0 && Math.random() > 0.8 ? 'planned' : 'completed',
        startDate,
        endDate,
        reasonCode: condition?.icd10 ?? 'Z00.00',
        reasonDisplay: condition?.name ?? 'General examination',
        notes: `${encounterType} for ${patient.primaryCondition ?? 'general health'}. Patient ${patient.riskLevel === 'critical' ? 'requires close monitoring' : 'stable'}.`,
      });
    }
  }

  const encounterRows = await db
    .insert(schema.encounters)
    .values(encounterValues)
    .returning();

  // ── Observations ──
  console.log('Seeding observations (~300)...');
  const observationValues: (typeof schema.observations.$inferInsert)[] = [];

  for (const encounter of encounterRows) {
    const patient = patientRows.find((p) => p.id === encounter.patientId);
    const isHighRisk = patient?.riskLevel === 'high' || patient?.riskLevel === 'critical';
    const effectiveDate = encounter.startDate ?? new Date();

    // Vitals for every encounter
    const systolic = isHighRisk ? randBetween(135, 178) : randBetween(95, 135);
    const diastolic = isHighRisk ? randBetween(85, 115) : randBetween(60, 85);
    const hr = isHighRisk ? randBetween(65, 108) : randBetween(55, 90);
    const temp = Math.random() > 0.9 ? randFloat(99.5, 101.5) : randFloat(97.0, 99.0);
    const o2 = isHighRisk ? randBetween(89, 97) : randBetween(95, 100);
    const weight = randBetween(120, 260);
    const rr = isHighRisk ? randBetween(16, 26) : randBetween(12, 20);

    observationValues.push(
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.systolicBP.code,
        display: VITAL_CODES.systolicBP.display,
        valueNumeric: String(systolic),
        unit: VITAL_CODES.systolicBP.unit,
        effectiveDate,
        referenceRange: { low: 90, high: 130, unit: 'mmHg' },
      },
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.diastolicBP.code,
        display: VITAL_CODES.diastolicBP.display,
        valueNumeric: String(diastolic),
        unit: VITAL_CODES.diastolicBP.unit,
        effectiveDate,
        referenceRange: { low: 60, high: 80, unit: 'mmHg' },
      },
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.heartRate.code,
        display: VITAL_CODES.heartRate.display,
        valueNumeric: String(hr),
        unit: VITAL_CODES.heartRate.unit,
        effectiveDate,
        referenceRange: { low: 60, high: 100, unit: 'bpm' },
      },
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.temperature.code,
        display: VITAL_CODES.temperature.display,
        valueNumeric: temp,
        unit: VITAL_CODES.temperature.unit,
        effectiveDate,
        referenceRange: { low: 97.0, high: 99.5, unit: '°F' },
      },
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.o2sat.code,
        display: VITAL_CODES.o2sat.display,
        valueNumeric: String(o2),
        unit: VITAL_CODES.o2sat.unit,
        effectiveDate,
        referenceRange: { low: 95, high: 100, unit: '%' },
      },
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.weight.code,
        display: VITAL_CODES.weight.display,
        valueNumeric: String(weight),
        unit: VITAL_CODES.weight.unit,
        effectiveDate,
      },
      {
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: VITAL_CODES.respiratoryRate.code,
        display: VITAL_CODES.respiratoryRate.display,
        valueNumeric: String(rr),
        unit: VITAL_CODES.respiratoryRate.unit,
        effectiveDate,
        referenceRange: { low: 12, high: 20, unit: 'breaths/min' },
      },
    );

    // Lab results for ~40% of encounters
    if (Math.random() < 0.4) {
      const condition = patient?.primaryCondition;

      if (condition === 'Type 2 Diabetes' || condition === 'Chronic Kidney Disease') {
        observationValues.push({
          patientId: encounter.patientId,
          encounterId: encounter.id,
          code: LAB_CODES.hba1c.code,
          display: LAB_CODES.hba1c.display,
          valueNumeric: isHighRisk ? randFloat(7.5, 11.0) : randFloat(5.0, 7.5),
          unit: LAB_CODES.hba1c.unit,
          effectiveDate,
          referenceRange: { low: 4.0, high: 5.6, unit: '%' },
        });
        observationValues.push({
          patientId: encounter.patientId,
          encounterId: encounter.id,
          code: LAB_CODES.glucose.code,
          display: LAB_CODES.glucose.display,
          valueNumeric: isHighRisk ? String(randBetween(140, 280)) : String(randBetween(70, 140)),
          unit: LAB_CODES.glucose.unit,
          effectiveDate,
          referenceRange: { low: 70, high: 100, unit: 'mg/dL' },
        });
      }

      if (condition === 'Chronic Kidney Disease') {
        observationValues.push({
          patientId: encounter.patientId,
          encounterId: encounter.id,
          code: LAB_CODES.egfr.code,
          display: LAB_CODES.egfr.display,
          valueNumeric: isHighRisk ? String(randBetween(15, 45)) : String(randBetween(45, 90)),
          unit: LAB_CODES.egfr.unit,
          effectiveDate,
          referenceRange: { low: 60, high: 120, unit: 'mL/min/1.73m2' },
        });
        observationValues.push({
          patientId: encounter.patientId,
          encounterId: encounter.id,
          code: LAB_CODES.creatinine.code,
          display: LAB_CODES.creatinine.display,
          valueNumeric: isHighRisk ? randFloat(1.5, 4.0) : randFloat(0.6, 1.3),
          unit: LAB_CODES.creatinine.unit,
          effectiveDate,
          referenceRange: { low: 0.6, high: 1.2, unit: 'mg/dL' },
        });
      }

      // General labs for any condition
      observationValues.push({
        patientId: encounter.patientId,
        encounterId: encounter.id,
        code: LAB_CODES.totalCholesterol.code,
        display: LAB_CODES.totalCholesterol.display,
        valueNumeric: String(randBetween(150, 280)),
        unit: LAB_CODES.totalCholesterol.unit,
        effectiveDate,
        referenceRange: { low: 0, high: 200, unit: 'mg/dL' },
      });
    }
  }

  // Insert observations in batches to avoid query size limits
  const OBS_BATCH = 200;
  for (let i = 0; i < observationValues.length; i += OBS_BATCH) {
    await db
      .insert(schema.observations)
      .values(observationValues.slice(i, i + OBS_BATCH));
  }
  console.log(`  Inserted ${observationValues.length} observations`);

  // ── Medications ──
  console.log('Seeding medications (~80)...');
  const medicationValues: (typeof schema.medications.$inferInsert)[] = [];

  for (const patient of patientRows) {
    const condition = CONDITIONS.find((c) => c.name === patient.primaryCondition);
    if (!condition) continue;

    for (const med of condition.medications) {
      const isActive = Math.random() > 0.15;
      const startDate = randomDate(365, 30);
      medicationValues.push({
        patientId: patient.id,
        prescriberId: pick(providerRows).id,
        name: med.name,
        code: med.code,
        dosage: pick(med.dosages),
        frequency: med.frequency,
        route: med.route,
        status: isActive ? 'active' : 'discontinued',
        startDate,
        endDate: isActive ? undefined : randomDate(30, 1),
      });
    }

    // Some patients get an additional common medication
    if (Math.random() > 0.5) {
      medicationValues.push({
        patientId: patient.id,
        prescriberId: pick(providerRows).id,
        name: 'Acetaminophen',
        code: 'RxN-161',
        dosage: pick(['325mg', '500mg']),
        frequency: 'As needed',
        route: 'oral',
        status: 'active',
        startDate: randomDate(180, 30),
      });
    }
  }

  await db.insert(schema.medications).values(medicationValues);
  console.log(`  Inserted ${medicationValues.length} medications`);

  // ── Documents ──
  console.log('Seeding documents...');
  await db.insert(schema.documents).values([
    { title: 'AHA Heart Failure Guidelines 2025', filename: 'aha-hf-guidelines-2025.pdf', mimeType: 'application/pdf', fileSize: 2400000, pageCount: 86, tags: ['guidelines', 'cardiology'] },
    { title: 'Diabetes Management Protocol', filename: 'diabetes-mgmt-protocol.pdf', mimeType: 'application/pdf', fileSize: 1800000, pageCount: 45, tags: ['protocol', 'endocrinology'] },
    { title: 'COPD Treatment Pathway', filename: 'copd-pathway.pdf', mimeType: 'application/pdf', fileSize: 950000, pageCount: 28, tags: ['pathway', 'pulmonology'] },
    { title: 'Hypertension Screening Standards', filename: 'htn-screening.pdf', mimeType: 'application/pdf', fileSize: 720000, pageCount: 18, tags: ['standards', 'primary care'] },
    { title: 'Medication Formulary 2026', filename: 'formulary-2026.pdf', mimeType: 'application/pdf', fileSize: 3200000, pageCount: 124, tags: ['formulary', 'pharmacy'] },
    { title: 'Patient Safety Protocols', filename: 'safety-protocols.pdf', mimeType: 'application/pdf', fileSize: 1100000, pageCount: 32, tags: ['safety', 'compliance'] },
    { title: 'ICD-10 Code Reference Guide', filename: 'icd10-reference.pdf', mimeType: 'application/pdf', fileSize: 5600000, pageCount: 210, tags: ['reference', 'coding'] },
  ]);

  // ── Summary ──
  const finalCounts = await Promise.all([
    db.select({ c: count() }).from(schema.patients),
    db.select({ c: count() }).from(schema.encounters),
    db.select({ c: count() }).from(schema.observations),
    db.select({ c: count() }).from(schema.medications),
    db.select({ c: count() }).from(schema.providers),
    db.select({ c: count() }).from(schema.organizations),
    db.select({ c: count() }).from(schema.documents),
  ]);

  console.log('\nSeed complete:');
  console.log(`  Patients:      ${finalCounts[0]![0]!.c}`);
  console.log(`  Encounters:    ${finalCounts[1]![0]!.c}`);
  console.log(`  Observations:  ${finalCounts[2]![0]!.c}`);
  console.log(`  Medications:   ${finalCounts[3]![0]!.c}`);
  console.log(`  Providers:     ${finalCounts[4]![0]!.c}`);
  console.log(`  Organizations: ${finalCounts[5]![0]!.c}`);
  console.log(`  Documents:     ${finalCounts[6]![0]!.c}`);
}

seed()
  .then(() => {
    console.log('\nDone.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
