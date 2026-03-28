/**
 * Seed 5 healthy "green / on-track" patients into BestPath.
 *
 * Each patient has:
 *  - Recent wellness encounters (last 3 months)
 *  - Normal lab results (last 6 months): HbA1c, lipids, CBC
 *  - Normal vitals
 *  - Active preventive medications where age-appropriate
 *  - Some resolved minor diagnoses (common cold, sprained ankle, etc.)
 *
 * Patient IDs: PAT-009001 through PAT-009005 (high numbers to avoid conflicts)
 *
 * Usage: npx tsx scripts/seed-healthy-patients.ts
 */

import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL!;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { prepare: false });

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysAgoTimestamp(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function dob(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  d.setMonth(d.getMonth() - Math.floor(Math.random() * 6));
  return d.toISOString().split('T')[0];
}

// ── Patient definitions ─────────────────────────────────────────────────────

interface PatientDef {
  patientId: string;
  firstName: string;
  lastName: string;
  age: number;
  sex: string;
  postalCode: string;
  bloodType: string;
  insuranceNumber: string;
  primaryLanguage: string;
}

const patients: PatientDef[] = [
  {
    patientId: 'PAT-009001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    age: 34,
    sex: 'F',
    postalCode: 'V6B 1A1',
    bloodType: 'A+',
    insuranceNumber: '9876543210',
    primaryLanguage: 'English',
  },
  {
    patientId: 'PAT-009002',
    firstName: 'David',
    lastName: 'Okafor',
    age: 42,
    sex: 'M',
    postalCode: 'V5K 2T3',
    bloodType: 'O+',
    insuranceNumber: '9876543211',
    primaryLanguage: 'English',
  },
  {
    patientId: 'PAT-009003',
    firstName: 'Emily',
    lastName: 'Chen',
    age: 29,
    sex: 'F',
    postalCode: 'V6Z 1Y6',
    bloodType: 'B+',
    insuranceNumber: '9876543212',
    primaryLanguage: 'English',
  },
  {
    patientId: 'PAT-009004',
    firstName: 'James',
    lastName: 'Whitfield',
    age: 51,
    sex: 'M',
    postalCode: 'V7P 3R4',
    bloodType: 'AB+',
    insuranceNumber: '9876543213',
    primaryLanguage: 'English',
  },
  {
    patientId: 'PAT-009005',
    firstName: 'Priya',
    lastName: 'Sharma',
    age: 38,
    sex: 'F',
    postalCode: 'V6E 4A2',
    bloodType: 'O-',
    insuranceNumber: '9876543214',
    primaryLanguage: 'English',
  },
];

// ── Encounter / lab / vitals / medication data ──────────────────────────────

// Counter helpers for unique IDs
let encIdx = 90001;
let labIdx = 90001;
let vitIdx = 90001;
let medIdx = 90001;

function encId() {
  return `ENC-${String(encIdx++).padStart(7, '0')}`;
}
function labId() {
  return `LAB-${String(labIdx++).padStart(6, '0')}`;
}
function vitId() {
  return `VIT-${String(vitIdx++).padStart(6, '0')}`;
}
function medId() {
  return `MED-${String(medIdx++).padStart(6, '0')}`;
}

// ── Main insertion ──────────────────────────────────────────────────────────

async function seed() {
  console.log('=== Seeding 5 Healthy Patients ===\n');

  // Clean up any previous run (idempotent)
  const patientIds = patients.map((p) => p.patientId);
  console.log('Cleaning up previous data for these patient IDs...');
  await sql`DELETE FROM vitals WHERE patient_id = ANY(${patientIds})`;
  await sql`DELETE FROM lab_results WHERE patient_id = ANY(${patientIds})`;
  await sql`DELETE FROM medications WHERE patient_id = ANY(${patientIds})`;
  await sql`DELETE FROM encounters WHERE patient_id = ANY(${patientIds})`;
  await sql`DELETE FROM patients WHERE patient_id = ANY(${patientIds})`;
  console.log('  Done.\n');

  // ── Insert patients ──
  console.log('Inserting patients...');
  for (const p of patients) {
    await sql`
      INSERT INTO patients (patient_id, first_name, last_name, date_of_birth, age, sex, postal_code, blood_type, insurance_number, primary_language)
      VALUES (${p.patientId}, ${p.firstName}, ${p.lastName}, ${dob(p.age)}, ${p.age}, ${p.sex}, ${p.postalCode}, ${p.bloodType}, ${p.insuranceNumber}, ${p.primaryLanguage})
    `;
  }
  console.log(`  Inserted ${patients.length} patients.\n`);

  // ── Insert encounters ──
  console.log('Inserting encounters...');
  let encounterCount = 0;

  // Each patient gets: 1 recent wellness visit + 1 older resolved minor condition

  // PAT-009001 Sarah Mitchell (34F) — wellness visit 2 weeks ago, common cold 4 months ago (resolved)
  const enc1a = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc1a}, 'PAT-009001', ${daysAgo(14)}, 'outpatient', 'Vancouver General Clinic', 'Annual wellness exam', 'Z00.00', 'Encounter for general adult medical examination without abnormal findings', 5, 'discharged', '0.75', 'Dr. Rebecca Torres')`;
  const enc1b = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc1b}, 'PAT-009001', ${daysAgo(120)}, 'outpatient', 'Vancouver General Clinic', 'Sore throat, runny nose for 3 days', 'J06.9', 'Acute upper respiratory infection, unspecified (resolved)', 5, 'discharged', '0.5', 'Dr. Rebecca Torres')`;
  encounterCount += 2;

  // PAT-009002 David Okafor (42M) — wellness visit 6 weeks ago, sprained ankle 5 months ago (resolved)
  const enc2a = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc2a}, 'PAT-009002', ${daysAgo(42)}, 'outpatient', 'North Shore Health Centre', 'Routine checkup and bloodwork', 'Z00.00', 'Encounter for general adult medical examination without abnormal findings', 5, 'discharged', '1.0', 'Dr. Michael Tran')`;
  const enc2b = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc2b}, 'PAT-009002', ${daysAgo(150)}, 'outpatient', 'North Shore Health Centre', 'Left ankle pain after basketball', 'S93.401A', 'Sprain of unspecified ligament of left ankle, initial encounter (resolved)', 4, 'discharged', '1.5', 'Dr. Michael Tran')`;
  encounterCount += 2;

  // PAT-009003 Emily Chen (29F) — wellness visit 3 weeks ago, tension headache 3 months ago (resolved)
  const enc3a = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc3a}, 'PAT-009003', ${daysAgo(21)}, 'outpatient', 'Downtown Vancouver Medical', 'Wellness visit, preventive care', 'Z00.00', 'Encounter for general adult medical examination without abnormal findings', 5, 'discharged', '0.75', 'Dr. Aisha Patel')`;
  const enc3b = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc3b}, 'PAT-009003', ${daysAgo(90)}, 'outpatient', 'Downtown Vancouver Medical', 'Recurring tension headaches', 'G44.209', 'Tension-type headache, unspecified (resolved)', 5, 'discharged', '0.5', 'Dr. Aisha Patel')`;
  encounterCount += 2;

  // PAT-009004 James Whitfield (51M) — wellness visit 4 weeks ago, seasonal allergies 2 months ago (resolved)
  const enc4a = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc4a}, 'PAT-009004', ${daysAgo(28)}, 'outpatient', 'Lions Gate Medical Centre', 'Annual physical, lipid panel review', 'Z00.00', 'Encounter for general adult medical examination without abnormal findings', 5, 'discharged', '1.0', 'Dr. Steven Park')`;
  const enc4b = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc4b}, 'PAT-009004', ${daysAgo(60)}, 'outpatient', 'Lions Gate Medical Centre', 'Seasonal allergy symptoms — sneezing, itchy eyes', 'J30.1', 'Allergic rhinitis due to pollen (resolved)', 5, 'discharged', '0.5', 'Dr. Steven Park')`;
  encounterCount += 2;

  // PAT-009005 Priya Sharma (38F) — wellness visit 10 days ago, mild gastroenteritis 6 months ago (resolved)
  const enc5a = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc5a}, 'PAT-009005', ${daysAgo(10)}, 'outpatient', 'Burnaby Community Health', 'Wellness visit and screening review', 'Z00.00', 'Encounter for general adult medical examination without abnormal findings', 5, 'discharged', '0.75', 'Dr. Karen Liu')`;
  const enc5b = encId();
  await sql`INSERT INTO encounters (encounter_id, patient_id, encounter_date, encounter_type, facility, chief_complaint, diagnosis_code, diagnosis_description, triage_level, disposition, length_of_stay_hours, attending_physician)
    VALUES (${enc5b}, 'PAT-009005', ${daysAgo(180)}, 'outpatient', 'Burnaby Community Health', 'Nausea and diarrhea for 2 days', 'K52.9', 'Noninfective gastroenteritis and colitis, unspecified (resolved)', 4, 'discharged', '1.0', 'Dr. Karen Liu')`;
  encounterCount += 2;

  console.log(`  Inserted ${encounterCount} encounters.\n`);

  // ── Insert lab results ──
  // Every patient gets a normal panel: HbA1c, Total Cholesterol, LDL, HDL, Triglycerides, Hemoglobin, WBC, Platelets, Fasting Glucose
  console.log('Inserting lab results...');
  let labCount = 0;

  interface LabDef {
    testName: string;
    testCode: string;
    value: number;
    unit: string;
    rangeLow: number;
    rangeHigh: number;
  }

  function normalLabs(sex: string): LabDef[] {
    return [
      { testName: 'Hemoglobin A1c', testCode: '4548-4', value: 5.2, unit: '%', rangeLow: 4.0, rangeHigh: 5.6 },
      { testName: 'Total Cholesterol', testCode: '2093-3', value: 185, unit: 'mg/dL', rangeLow: 125, rangeHigh: 200 },
      { testName: 'LDL Cholesterol', testCode: '2089-1', value: 105, unit: 'mg/dL', rangeLow: 0, rangeHigh: 130 },
      { testName: 'HDL Cholesterol', testCode: '2085-9', value: sex === 'F' ? 62 : 52, unit: 'mg/dL', rangeLow: 40, rangeHigh: 100 },
      { testName: 'Triglycerides', testCode: '2571-8', value: 110, unit: 'mg/dL', rangeLow: 0, rangeHigh: 150 },
      { testName: 'Hemoglobin', testCode: '718-7', value: sex === 'F' ? 13.5 : 15.0, unit: 'g/dL', rangeLow: sex === 'F' ? 12.0 : 13.5, rangeHigh: sex === 'F' ? 16.0 : 17.5 },
      { testName: 'White Blood Cell Count', testCode: '6690-2', value: 6.5, unit: '10^3/uL', rangeLow: 4.5, rangeHigh: 11.0 },
      { testName: 'Platelet Count', testCode: '777-3', value: 245, unit: '10^3/uL', rangeLow: 150, rangeHigh: 400 },
      { testName: 'Fasting Glucose', testCode: '1558-6', value: 88, unit: 'mg/dL', rangeLow: 70, rangeHigh: 100 },
    ];
  }

  // Pair each patient with their wellness encounter & collection date
  const labPatients: { patientId: string; encounterId: string; sex: string; collectedDaysAgo: number }[] = [
    { patientId: 'PAT-009001', encounterId: enc1a, sex: 'F', collectedDaysAgo: 14 },
    { patientId: 'PAT-009002', encounterId: enc2a, sex: 'M', collectedDaysAgo: 42 },
    { patientId: 'PAT-009003', encounterId: enc3a, sex: 'F', collectedDaysAgo: 21 },
    { patientId: 'PAT-009004', encounterId: enc4a, sex: 'M', collectedDaysAgo: 28 },
    { patientId: 'PAT-009005', encounterId: enc5a, sex: 'F', collectedDaysAgo: 10 },
  ];

  for (const lp of labPatients) {
    const labs = normalLabs(lp.sex);
    // Add slight per-patient variance so values aren't identical
    const variance = [0, 0.1, -0.05, 0.08, -0.03];
    const pIdx = labPatients.indexOf(lp);

    for (const lab of labs) {
      const adjustedValue = +(lab.value * (1 + variance[pIdx])).toFixed(1);
      await sql`
        INSERT INTO lab_results (lab_id, patient_id, encounter_id, test_name, test_code, value, unit, reference_range_low, reference_range_high, abnormal_flag, collected_date)
        VALUES (${labId()}, ${lp.patientId}, ${lp.encounterId}, ${lab.testName}, ${lab.testCode}, ${adjustedValue}, ${lab.unit}, ${lab.rangeLow}, ${lab.rangeHigh}, 'N', ${daysAgo(lp.collectedDaysAgo)})
      `;
      labCount++;
    }
  }

  console.log(`  Inserted ${labCount} lab results.\n`);

  // ── Insert vitals ──
  console.log('Inserting vitals...');
  let vitalCount = 0;

  interface VitalDef {
    patientId: string;
    encounterId: string;
    hr: number;
    sysBp: number;
    diaBp: number;
    temp: number;
    rr: number;
    o2: number;
    pain: number;
    daysAgo: number;
  }

  const vitalData: VitalDef[] = [
    { patientId: 'PAT-009001', encounterId: enc1a, hr: 72, sysBp: 118, diaBp: 76, temp: 36.7, rr: 16, o2: 99, pain: 0, daysAgo: 14 },
    { patientId: 'PAT-009002', encounterId: enc2a, hr: 68, sysBp: 122, diaBp: 80, temp: 36.6, rr: 14, o2: 98, pain: 0, daysAgo: 42 },
    { patientId: 'PAT-009003', encounterId: enc3a, hr: 74, sysBp: 112, diaBp: 72, temp: 36.8, rr: 16, o2: 99, pain: 0, daysAgo: 21 },
    { patientId: 'PAT-009004', encounterId: enc4a, hr: 70, sysBp: 126, diaBp: 82, temp: 36.7, rr: 15, o2: 98, pain: 0, daysAgo: 28 },
    { patientId: 'PAT-009005', encounterId: enc5a, hr: 76, sysBp: 116, diaBp: 74, temp: 36.8, rr: 16, o2: 99, pain: 0, daysAgo: 10 },
  ];

  for (const v of vitalData) {
    await sql`
      INSERT INTO vitals (vitals_id, patient_id, encounter_id, heart_rate, systolic_bp, diastolic_bp, temperature_celsius, respiratory_rate, o2_saturation, pain_scale, recorded_at)
      VALUES (${vitId()}, ${v.patientId}, ${v.encounterId}, ${v.hr}, ${v.sysBp}, ${v.diaBp}, ${v.temp}, ${v.rr}, ${v.o2}, ${v.pain}, ${daysAgoTimestamp(v.daysAgo)})
    `;
    vitalCount++;
  }

  // Also add vitals for the resolved-condition encounters (they had normal vitals there too)
  const resolvedVitals: VitalDef[] = [
    { patientId: 'PAT-009001', encounterId: enc1b, hr: 78, sysBp: 120, diaBp: 78, temp: 37.2, rr: 17, o2: 98, pain: 2, daysAgo: 120 },
    { patientId: 'PAT-009002', encounterId: enc2b, hr: 82, sysBp: 124, diaBp: 80, temp: 36.8, rr: 16, o2: 98, pain: 4, daysAgo: 150 },
    { patientId: 'PAT-009003', encounterId: enc3b, hr: 70, sysBp: 114, diaBp: 74, temp: 36.7, rr: 15, o2: 99, pain: 3, daysAgo: 90 },
    { patientId: 'PAT-009004', encounterId: enc4b, hr: 72, sysBp: 128, diaBp: 84, temp: 36.6, rr: 15, o2: 98, pain: 0, daysAgo: 60 },
    { patientId: 'PAT-009005', encounterId: enc5b, hr: 80, sysBp: 118, diaBp: 76, temp: 37.0, rr: 18, o2: 98, pain: 2, daysAgo: 180 },
  ];

  for (const v of resolvedVitals) {
    await sql`
      INSERT INTO vitals (vitals_id, patient_id, encounter_id, heart_rate, systolic_bp, diastolic_bp, temperature_celsius, respiratory_rate, o2_saturation, pain_scale, recorded_at)
      VALUES (${vitId()}, ${v.patientId}, ${v.encounterId}, ${v.hr}, ${v.sysBp}, ${v.diaBp}, ${v.temp}, ${v.rr}, ${v.o2}, ${v.pain}, ${daysAgoTimestamp(v.daysAgo)})
    `;
    vitalCount++;
  }

  console.log(`  Inserted ${vitalCount} vitals records.\n`);

  // ── Insert medications ──
  console.log('Inserting medications...');
  let medCount = 0;

  interface MedDef {
    patientId: string;
    drugName: string;
    dosage: string;
    frequency: string;
    route: string;
    prescriber: string;
    startDaysAgo: number;
    active: boolean;
    endDaysAgo?: number;
  }

  const medData: MedDef[] = [
    // PAT-009001 Sarah (34F) — Vitamin D, oral contraceptive
    { patientId: 'PAT-009001', drugName: 'Vitamin D3 (Cholecalciferol)', dosage: '1000 IU', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Rebecca Torres', startDaysAgo: 365, active: true },
    { patientId: 'PAT-009001', drugName: 'Levonorgestrel/Ethinyl Estradiol', dosage: '0.15mg/0.03mg', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Rebecca Torres', startDaysAgo: 730, active: true },

    // PAT-009002 David (42M) — Vitamin D, fish oil
    { patientId: 'PAT-009002', drugName: 'Vitamin D3 (Cholecalciferol)', dosage: '1000 IU', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Michael Tran', startDaysAgo: 200, active: true },
    { patientId: 'PAT-009002', drugName: 'Omega-3 Fatty Acids (Fish Oil)', dosage: '1000 mg', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Michael Tran', startDaysAgo: 200, active: true },
    // Resolved: ibuprofen for ankle sprain (inactive)
    { patientId: 'PAT-009002', drugName: 'Ibuprofen', dosage: '400 mg', frequency: 'every 6 hours as needed', route: 'oral', prescriber: 'Dr. Michael Tran', startDaysAgo: 150, active: false, endDaysAgo: 136 },

    // PAT-009003 Emily (29F) — Vitamin D
    { patientId: 'PAT-009003', drugName: 'Vitamin D3 (Cholecalciferol)', dosage: '1000 IU', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Aisha Patel', startDaysAgo: 180, active: true },
    // Resolved: acetaminophen for headache (inactive)
    { patientId: 'PAT-009003', drugName: 'Acetaminophen', dosage: '500 mg', frequency: 'every 6 hours as needed', route: 'oral', prescriber: 'Dr. Aisha Patel', startDaysAgo: 90, active: false, endDaysAgo: 75 },

    // PAT-009004 James (51M) — low-dose statin (age-appropriate preventive), Vitamin D, ASA
    { patientId: 'PAT-009004', drugName: 'Atorvastatin', dosage: '10 mg', frequency: 'once daily at bedtime', route: 'oral', prescriber: 'Dr. Steven Park', startDaysAgo: 365, active: true },
    { patientId: 'PAT-009004', drugName: 'Vitamin D3 (Cholecalciferol)', dosage: '1000 IU', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Steven Park', startDaysAgo: 365, active: true },
    // Resolved: cetirizine for seasonal allergies (inactive, short course)
    { patientId: 'PAT-009004', drugName: 'Cetirizine', dosage: '10 mg', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Steven Park', startDaysAgo: 60, active: false, endDaysAgo: 30 },

    // PAT-009005 Priya (38F) — Vitamin D, iron supplement
    { patientId: 'PAT-009005', drugName: 'Vitamin D3 (Cholecalciferol)', dosage: '1000 IU', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Karen Liu', startDaysAgo: 300, active: true },
    { patientId: 'PAT-009005', drugName: 'Ferrous Fumarate (Iron)', dosage: '300 mg', frequency: 'once daily', route: 'oral', prescriber: 'Dr. Karen Liu', startDaysAgo: 180, active: true },
  ];

  for (const m of medData) {
    await sql`
      INSERT INTO medications (medication_id, patient_id, drug_name, dosage, frequency, route, prescriber, start_date, end_date, active)
      VALUES (${medId()}, ${m.patientId}, ${m.drugName}, ${m.dosage}, ${m.frequency}, ${m.route}, ${m.prescriber}, ${daysAgo(m.startDaysAgo)}, ${m.endDaysAgo ? daysAgo(m.endDaysAgo) : null}, ${m.active})
    `;
    medCount++;
  }

  console.log(`  Inserted ${medCount} medication records.\n`);

  // ── Summary ──
  console.log('=== Seed Complete ===\n');
  console.log('Healthy patient IDs:');
  for (const p of patients) {
    console.log(`  ${p.patientId}  ${p.firstName} ${p.lastName} (${p.age}${p.sex})`);
  }
  console.log('\nThese patients should classify as green/on-track:');
  console.log('  - Recent wellness encounters (within 3 months)');
  console.log('  - All normal lab results (HbA1c, lipids, CBC, glucose)');
  console.log('  - Normal vitals');
  console.log('  - Active preventive medications');
  console.log('  - Only resolved minor conditions in history');

  await sql.end();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\nSeed failed:', err);
    process.exit(1);
  });
