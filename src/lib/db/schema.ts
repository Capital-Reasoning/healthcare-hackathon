import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  date,
  index,
  uniqueIndex,
  vector,
} from 'drizzle-orm/pg-core';

// ── Patients ────────────────────────────────────────────────────────────────

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: text('patient_id').notNull().unique(), // "PAT-000001"
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    dateOfBirth: date('date_of_birth'),
    age: integer('age'),
    sex: text('sex'), // M/F from Synthea
    postalCode: text('postal_code'),
    bloodType: text('blood_type'),
    insuranceNumber: text('insurance_number'),
    primaryLanguage: text('primary_language'),
    emergencyContactPhone: text('emergency_contact_phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('patients_patient_id_idx').on(table.patientId),
    index('patients_name_idx').on(table.lastName, table.firstName),
    index('patients_postal_code_idx').on(table.postalCode),
  ],
);

// ── Encounters ──────────────────────────────────────────────────────────────

export const encounters = pgTable(
  'encounters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    encounterId: text('encounter_id').notNull().unique(), // "ENC-0000001"
    patientId: text('patient_id').notNull(), // FK to patients.patient_id
    encounterDate: date('encounter_date'),
    encounterType: text('encounter_type'), // outpatient/emergency/inpatient
    facility: text('facility'),
    chiefComplaint: text('chief_complaint'),
    diagnosisCode: text('diagnosis_code'), // ICD-10-CA
    diagnosisDescription: text('diagnosis_description'),
    triageLevel: integer('triage_level'), // CTAS 1-5
    disposition: text('disposition'),
    lengthOfStayHours: numeric('length_of_stay_hours'),
    attendingPhysician: text('attending_physician'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('encounters_encounter_id_idx').on(table.encounterId),
    index('encounters_patient_id_idx').on(table.patientId),
    index('encounters_patient_date_idx').on(
      table.patientId,
      table.encounterDate,
    ),
    index('encounters_diagnosis_code_idx').on(table.diagnosisCode),
    index('encounters_encounter_type_idx').on(table.encounterType),
  ],
);

// ── Lab Results ─────────────────────────────────────────────────────────────

export const labResults = pgTable(
  'lab_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    labId: text('lab_id').notNull().unique(), // "LAB-000001"
    patientId: text('patient_id').notNull(),
    encounterId: text('encounter_id'),
    testName: text('test_name'),
    testCode: text('test_code'), // LOINC
    value: numeric('value'),
    unit: text('unit'),
    referenceRangeLow: numeric('reference_range_low'),
    referenceRangeHigh: numeric('reference_range_high'),
    abnormalFlag: text('abnormal_flag'), // N/H/L
    collectedDate: date('collected_date'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('lab_results_lab_id_idx').on(table.labId),
    index('lab_results_patient_date_idx').on(
      table.patientId,
      table.collectedDate,
    ),
    index('lab_results_patient_test_idx').on(
      table.patientId,
      table.testCode,
    ),
    index('lab_results_encounter_idx').on(table.encounterId),
    index('lab_results_abnormal_idx').on(table.abnormalFlag),
  ],
);

// ── Vitals ──────────────────────────────────────────────────────────────────

export const vitals = pgTable(
  'vitals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    vitalsId: text('vitals_id').notNull().unique(), // "VIT-000001"
    patientId: text('patient_id').notNull(),
    encounterId: text('encounter_id'),
    heartRate: integer('heart_rate'),
    systolicBp: integer('systolic_bp'),
    diastolicBp: integer('diastolic_bp'),
    temperatureCelsius: numeric('temperature_celsius'),
    respiratoryRate: integer('respiratory_rate'),
    o2Saturation: numeric('o2_saturation'),
    painScale: integer('pain_scale'),
    recordedAt: timestamp('recorded_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('vitals_vitals_id_idx').on(table.vitalsId),
    index('vitals_patient_recorded_idx').on(
      table.patientId,
      table.recordedAt,
    ),
    index('vitals_encounter_idx').on(table.encounterId),
  ],
);

// ── Medications ─────────────────────────────────────────────────────────────

export const medications = pgTable(
  'medications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    medicationId: text('medication_id').notNull().unique(), // "MED-000001"
    patientId: text('patient_id').notNull(),
    drugName: text('drug_name').notNull(),
    drugCode: text('drug_code'), // DIN
    dosage: text('dosage'),
    frequency: text('frequency'),
    route: text('route'),
    prescriber: text('prescriber'),
    startDate: date('start_date'),
    endDate: date('end_date'),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('medications_medication_id_idx').on(table.medicationId),
    index('medications_patient_active_idx').on(table.patientId, table.active),
    index('medications_drug_code_idx').on(table.drugCode),
  ],
);

// ── Canadian Drug Reference ─────────────────────────────────────────────────

export const canadianDrugReference = pgTable(
  'canadian_drug_reference',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    din: text('din').notNull().unique(),
    drugName: text('drug_name').notNull(),
    genericName: text('generic_name'),
    drugClass: text('drug_class'),
    commonIndication: text('common_indication'),
    typicalDosage: text('typical_dosage'),
    route: text('route'),
    schedule: text('schedule'),
  },
  (table) => [
    uniqueIndex('drug_ref_din_idx').on(table.din),
    index('drug_ref_class_idx').on(table.drugClass),
    index('drug_ref_generic_idx').on(table.genericName),
  ],
);

// ── Corpus Documents (RAG) ──────────────────────────────────────────────────

export const corpusDocuments = pgTable(
  'corpus_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sourceBucket: text('source_bucket').notNull(), // e.g. "diabetes_national_guidance"
    uploadGroup: text('upload_group'), // core_clinical_and_screening / emergency_risk_evidence / route_only
    sourceUrl: text('source_url'),
    documentTitle: text('document_title').notNull(),
    filename: text('filename'),
    fileType: text('file_type'), // html / pdf / docx
    contentType: text('content_type'), // guideline / pathway / policy / reference / patient_education
    clinicalDomains: text('clinical_domains')
      .array()
      .default(sql`'{}'::text[]`),
    jurisdiction: text('jurisdiction'), // BC / Canada / International
    pageCount: integer('page_count'),
    fileSizeBytes: integer('file_size_bytes'),
    sha1: text('sha1'),
    chunkCount: integer('chunk_count').default(0),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('corpus_docs_bucket_idx').on(table.sourceBucket),
    index('corpus_docs_upload_group_idx').on(table.uploadGroup),
  ],
);

// ── Corpus Chunks (RAG + Embeddings) ────────────────────────────────────────

export const corpusChunks = pgTable(
  'corpus_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => corpusDocuments.id, { onDelete: 'cascade' }),
    content: text('content').notNull(), // plain text for embedding + search
    textAsHtml: text('text_as_html'), // HTML for display (tables, formatted content)
    heading: text('heading'),
    pageNumber: integer('page_number'),
    chunkIndex: integer('chunk_index').notNull(),
    chunkType: text('chunk_type').default('text'), // text / table / list
    sourceBucket: text('source_bucket'), // denormalized for fast filtering
    embedding: vector('embedding', { dimensions: 3072 }),
    metadata: jsonb('metadata'), // overflow: emphasized_text, parent_id, etc.
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('corpus_chunks_doc_idx').on(table.documentId),
    index('corpus_chunks_bucket_idx').on(table.sourceBucket),
  ],
);

// ── Engine Runs ─────────────────────────────────────────────────────────────

export const engineRuns = pgTable(
  'engine_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: text('run_id').notNull().unique(),
    patientId: text('patient_id').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    corpusVersion: text('corpus_version'),
    targetCount: integer('target_count').default(0),
    status: text('status').default('running'), // running / completed / failed
    error: text('error'),
  },
  (table) => [
    uniqueIndex('engine_runs_run_id_idx').on(table.runId),
    index('engine_runs_patient_idx').on(table.patientId),
  ],
);

// ── Pathway Target Run Facts (append-only) ──────────────────────────────────

export const pathwayTargetRunFacts = pgTable(
  'pathway_target_run_facts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: text('run_id').notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).notNull(),
    patientId: text('patient_id').notNull(),
    targetId: text('target_id').notNull(),
    condition: text('condition'),
    screeningType: text('screening_type'),
    action: text('action'), // what to do
    riskTier: text('risk_tier'), // high / medium / low
    status: text('status'), // overdue_now / due_soon / up_to_date / unknown_due
    overdueDays: integer('overdue_days'),
    dueDate: date('due_date'),
    intervalDays: integer('interval_days'),
    lastCompletedDate: date('last_completed_date'),
    priorityRank: integer('priority_rank'),
    confidence: text('confidence'), // high / medium / low
    confidenceReason: text('confidence_reason'),
    actionValueScore: integer('action_value_score'), // pre-computed for queue sorting
    whyThisAction: text('why_this_action'),
    whyNow: text('why_now'),
    evidenceRefs: jsonb('evidence_refs'), // [{doc_id, excerpt, chunk_id}]
    missingDataTasks: jsonb('missing_data_tasks'), // ["string"]
    providerRoute: text('provider_route'), // pharmacist / dietitian / PT / walk-in / ER / specialist
    category: text('category'), // red / yellow / green (dashboard)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('ptrf_patient_condition_idx').on(
      table.patientId,
      table.condition,
      table.screeningType,
    ),
    index('ptrf_run_idx').on(table.runId),
    index('ptrf_category_score_idx').on(
      table.category,
      table.actionValueScore,
    ),
    index('ptrf_status_idx').on(table.status),
    index('ptrf_generated_at_idx').on(table.generatedAt),
  ],
);

// ── Validation Dataset ──────────────────────────────────────────────────────

export const validationCases = pgTable(
  'validation_cases',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id').notNull().unique(), // "PC-0001"
    clinicalDomain: text('clinical_domain'),
    packageSize: text('package_size'), // sparse / medium / dense
    difficulty: text('difficulty'), // moderate / difficult / expert
    isEdgeCase: boolean('is_edge_case').default(false),
    patientPackage: jsonb('patient_package').notNull(), // full patient package
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('validation_cases_case_id_idx').on(table.caseId),
  ],
);

export const validationAnswerKeys = pgTable(
  'validation_answer_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    caseId: text('case_id').notNull().unique(), // FK to validation_cases.case_id
    label: text('label').notNull(), // DUE / NOT_DUE
    targetCondition: text('target_condition'),
    answerData: jsonb('answer_data').notNull(), // full answer key
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('validation_keys_case_id_idx').on(table.caseId),
    index('validation_keys_label_idx').on(table.label),
  ],
);

// ── Chat Tables (PRESERVED) ─────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').default('New conversation'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'cascade',
    }),
    role: text('role').notNull(),
    content: text('content').notNull(),
    toolCalls: jsonb('tool_calls'),
    toolResults: jsonb('tool_results'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('messages_conversation_idx').on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

// ── Relations ───────────────────────────────────────────────────────────────

export const patientsRelations = relations(patients, ({ many }) => ({
  encounters: many(encounters),
  labResults: many(labResults),
  vitals: many(vitals),
  medications: many(medications),
}));

export const encountersRelations = relations(encounters, ({ one, many }) => ({
  patient: one(patients, {
    fields: [encounters.patientId],
    references: [patients.patientId],
  }),
  labResults: many(labResults),
  vitals: many(vitals),
}));

export const labResultsRelations = relations(labResults, ({ one }) => ({
  patient: one(patients, {
    fields: [labResults.patientId],
    references: [patients.patientId],
  }),
  encounter: one(encounters, {
    fields: [labResults.encounterId],
    references: [encounters.encounterId],
  }),
}));

export const vitalsRelations = relations(vitals, ({ one }) => ({
  patient: one(patients, {
    fields: [vitals.patientId],
    references: [patients.patientId],
  }),
  encounter: one(encounters, {
    fields: [vitals.encounterId],
    references: [encounters.encounterId],
  }),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  patient: one(patients, {
    fields: [medications.patientId],
    references: [patients.patientId],
  }),
}));

export const corpusDocumentsRelations = relations(
  corpusDocuments,
  ({ many }) => ({
    chunks: many(corpusChunks),
  }),
);

export const corpusChunksRelations = relations(corpusChunks, ({ one }) => ({
  document: one(corpusDocuments, {
    fields: [corpusChunks.documentId],
    references: [corpusDocuments.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));
