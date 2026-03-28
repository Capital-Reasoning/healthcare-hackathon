import { getPatientById } from '@/lib/db/queries/patients';
import { getLatestLabResults } from '@/lib/db/queries/lab-results';
import { getLatestVitals } from '@/lib/db/queries/vitals';
import { createEngineLogger } from './logger';

const log = createEngineLogger('build-patient-context');

export interface PatientContextData {
  patientId: string;
  demographics: {
    firstName: string;
    lastName: string;
    age: number | null;
    sex: string | null;
    dateOfBirth: string | null;
    postalCode: string | null;
    bloodType: string | null;
    primaryLanguage: string | null;
  };
  conditions: string[];
  encounters: Array<{
    date: string | null;
    type: string | null;
    diagnosisCode: string | null;
    diagnosisDescription: string | null;
    chiefComplaint: string | null;
    facility: string | null;
  }>;
  activeMedications: Array<{
    drugName: string;
    dosage: string | null;
    frequency: string | null;
    startDate: string | null;
  }>;
  latestLabs: Array<{
    testName: string | null;
    testCode: string | null;
    value: string | null;
    unit: string | null;
    abnormalFlag: string | null;
    collectedDate: string | null;
    referenceRangeLow: string | null;
    referenceRangeHigh: string | null;
  }>;
  latestVitals: {
    heartRate: number | null;
    systolicBp: number | null;
    diastolicBp: number | null;
    temperatureCelsius: string | null;
    respiratoryRate: number | null;
    o2Saturation: string | null;
    recordedAt: Date | null;
  } | null;
  engagementSignals: {
    edVisitCount: number;
    lastEncounterDate: string | null;
    totalEncounters: number;
  };
}

export interface PatientContext {
  markdown: string;
  structured: PatientContextData;
}

/**
 * Assemble patient data from DB into a context package
 * for the engine LLM (markdown) and comparator (structured).
 */
export async function buildPatientContext(
  patientId: string,
): Promise<PatientContext> {
  const timer = log.time('buildPatientContext');

  const [patient, latestLabs, latestVitals] = await Promise.all([
    getPatientById(patientId),
    getLatestLabResults(patientId),
    getLatestVitals(patientId),
  ]);

  if (!patient) {
    throw new Error(`Patient not found: ${patientId}`);
  }

  // Deduplicate conditions from encounters by diagnosisCode
  const conditionMap = new Map<string, string>();
  for (const enc of patient.encounters ?? []) {
    if (enc.diagnosisCode && enc.diagnosisDescription) {
      conditionMap.set(enc.diagnosisCode, enc.diagnosisDescription);
    }
  }
  const conditions = Array.from(conditionMap.values());

  // Engagement signals
  const edVisitCount = (patient.encounters ?? []).filter(
    (e) => e.encounterType === 'emergency',
  ).length;
  const lastEncounterDate =
    patient.encounters?.[0]?.encounterDate ?? null;

  // Build structured data
  const structured: PatientContextData = {
    patientId: patient.patientId,
    demographics: {
      firstName: patient.firstName,
      lastName: patient.lastName,
      age: patient.age,
      sex: patient.sex,
      dateOfBirth: patient.dateOfBirth,
      postalCode: patient.postalCode,
      bloodType: patient.bloodType,
      primaryLanguage: patient.primaryLanguage,
    },
    conditions,
    encounters: (patient.encounters ?? []).slice(0, 10).map((e) => ({
      date: e.encounterDate,
      type: e.encounterType,
      diagnosisCode: e.diagnosisCode,
      diagnosisDescription: e.diagnosisDescription,
      chiefComplaint: e.chiefComplaint,
      facility: e.facility,
    })),
    activeMedications: (patient.medications ?? []).map((m) => ({
      drugName: m.drugName,
      dosage: m.dosage,
      frequency: m.frequency,
      startDate: m.startDate,
    })),
    latestLabs: latestLabs.map((l) => ({
      testName: l.test_name,
      testCode: l.test_code,
      value: l.value,
      unit: l.unit,
      abnormalFlag: l.abnormal_flag,
      collectedDate: l.collected_date,
      referenceRangeLow: l.reference_range_low,
      referenceRangeHigh: l.reference_range_high,
    })),
    latestVitals: latestVitals
      ? {
          heartRate: latestVitals.heartRate,
          systolicBp: latestVitals.systolicBp,
          diastolicBp: latestVitals.diastolicBp,
          temperatureCelsius: latestVitals.temperatureCelsius,
          respiratoryRate: latestVitals.respiratoryRate,
          o2Saturation: latestVitals.o2Saturation,
          recordedAt: latestVitals.recordedAt,
        }
      : null,
    engagementSignals: {
      edVisitCount,
      lastEncounterDate,
      totalEncounters: (patient.encounters ?? []).length,
    },
  };

  // Build markdown for LLM
  const markdown = formatMarkdown(structured);

  timer.end({ patientId, conditionCount: conditions.length });

  return { markdown, structured };
}

function formatMarkdown(data: PatientContextData): string {
  const lines: string[] = [];
  const d = data.demographics;

  lines.push(`# Patient: ${d.firstName} ${d.lastName} (${data.patientId})`);
  lines.push('');
  lines.push('## Demographics');
  lines.push(`- Age: ${d.age ?? 'Unknown'}`);
  lines.push(`- Sex: ${d.sex ?? 'Unknown'}`);
  lines.push(`- DOB: ${d.dateOfBirth ?? 'Unknown'}`);
  lines.push(`- Postal Code: ${d.postalCode ?? 'Unknown'}`);
  lines.push(`- Blood Type: ${d.bloodType ?? 'Unknown'}`);
  lines.push(`- Primary Language: ${d.primaryLanguage ?? 'Unknown'}`);
  lines.push('');

  // Conditions
  lines.push('## Active Conditions');
  if (data.conditions.length === 0) {
    lines.push('No documented conditions.');
  } else {
    for (const c of data.conditions) {
      lines.push(`- ${c}`);
    }
  }
  lines.push('');

  // Engagement
  lines.push('## Engagement Signals');
  lines.push(`- Total encounters: ${data.engagementSignals.totalEncounters}`);
  lines.push(`- ED visits: ${data.engagementSignals.edVisitCount}`);
  lines.push(
    `- Last encounter: ${data.engagementSignals.lastEncounterDate ?? 'None recorded'}`,
  );
  lines.push('');

  // Active medications
  lines.push('## Active Medications');
  if (data.activeMedications.length === 0) {
    lines.push('No active medications.');
  } else {
    for (const m of data.activeMedications) {
      lines.push(
        `- ${m.drugName} ${m.dosage ?? ''} ${m.frequency ?? ''} (started ${m.startDate ?? 'unknown'})`,
      );
    }
  }
  lines.push('');

  // Latest labs
  lines.push('## Latest Lab Results (one per test code)');
  if (data.latestLabs.length === 0) {
    lines.push('No lab results on file.');
  } else {
    for (const l of data.latestLabs) {
      const flag =
        l.abnormalFlag && l.abnormalFlag !== 'N'
          ? ` **[${l.abnormalFlag}]**`
          : '';
      const range =
        l.referenceRangeLow || l.referenceRangeHigh
          ? ` (ref: ${l.referenceRangeLow ?? '?'}-${l.referenceRangeHigh ?? '?'})`
          : '';
      lines.push(
        `- ${l.testName ?? l.testCode ?? 'Unknown'}: ${l.value ?? '?'} ${l.unit ?? ''}${flag}${range} — collected ${l.collectedDate ?? 'unknown'}`,
      );
    }
  }
  lines.push('');

  // Latest vitals
  lines.push('## Latest Vitals');
  if (!data.latestVitals) {
    lines.push('No vitals on file.');
  } else {
    const v = data.latestVitals;
    if (v.heartRate != null) lines.push(`- Heart Rate: ${v.heartRate} bpm`);
    if (v.systolicBp != null && v.diastolicBp != null)
      lines.push(`- Blood Pressure: ${v.systolicBp}/${v.diastolicBp} mmHg`);
    if (v.temperatureCelsius != null)
      lines.push(`- Temperature: ${v.temperatureCelsius} C`);
    if (v.respiratoryRate != null)
      lines.push(`- Respiratory Rate: ${v.respiratoryRate}/min`);
    if (v.o2Saturation != null)
      lines.push(`- O2 Saturation: ${v.o2Saturation}%`);
    if (v.recordedAt)
      lines.push(`- Recorded: ${new Date(v.recordedAt).toISOString().split('T')[0]}`);
  }
  lines.push('');

  // Recent encounters (last 10)
  lines.push('## Recent Encounters (last 10)');
  if (data.encounters.length === 0) {
    lines.push('No encounters on file.');
  } else {
    for (const e of data.encounters) {
      lines.push(
        `- ${e.date ?? 'Unknown date'} | ${e.type ?? 'unknown'} | ${e.diagnosisDescription ?? e.chiefComplaint ?? 'No diagnosis'} ${e.diagnosisCode ? `(${e.diagnosisCode})` : ''} | ${e.facility ?? ''}`,
      );
    }
  }

  return lines.join('\n');
}
