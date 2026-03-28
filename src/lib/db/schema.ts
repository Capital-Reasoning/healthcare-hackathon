import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  jsonb,
  pgEnum,
  vector,
  index,
} from 'drizzle-orm/pg-core';

// ── Enums ────────────────────────────────────────────────────────────────────

export const genderEnum = pgEnum('gender', [
  'male',
  'female',
  'other',
  'unknown',
]);

export const riskLevelEnum = pgEnum('risk_level', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const encounterStatusEnum = pgEnum('encounter_status', [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
]);

export const medicationStatusEnum = pgEnum('medication_status', [
  'active',
  'discontinued',
  'pending',
]);

// ── Core Tables ──────────────────────────────────────────────────────────────

export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    mrn: text('mrn').unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    dateOfBirth: timestamp('date_of_birth'),
    gender: genderEnum('gender'),
    email: text('email'),
    phone: text('phone'),
    address: jsonb('address').$type<{
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      country?: string;
    }>(),
    riskLevel: riskLevelEnum('risk_level').default('low'),
    primaryCondition: text('primary_condition'),
    metadata: jsonb('metadata'),
    embedding: vector('embedding', { dimensions: 3072 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
  },
  (table) => [
    index('patients_mrn_idx').on(table.mrn),
    index('patients_name_idx').on(table.lastName, table.firstName),
    index('patients_risk_level_idx').on(table.riskLevel),
  ],
);

export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  specialty: text('specialty'),
  department: text('department'),
  email: text('email'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  type: text('type'),
  address: jsonb('address').$type<{
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  }>(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const encounters = pgTable(
  'encounters',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id').references(() => patients.id),
    providerId: uuid('provider_id').references(() => providers.id),
    organizationId: uuid('organization_id').references(() => organizations.id),
    type: text('type'),
    status: encounterStatusEnum('status').default('planned'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    reasonCode: text('reason_code'),
    reasonDisplay: text('reason_display'),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('encounters_patient_date_idx').on(table.patientId, table.startDate),
  ],
);

export const observations = pgTable(
  'observations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id').references(() => patients.id),
    encounterId: uuid('encounter_id').references(() => encounters.id),
    code: text('code'),
    display: text('display'),
    valueNumeric: numeric('value_numeric'),
    valueText: text('value_text'),
    unit: text('unit'),
    status: text('status').default('final'),
    effectiveDate: timestamp('effective_date'),
    referenceRange: jsonb('reference_range').$type<{
      low?: number;
      high?: number;
      unit?: string;
    }>(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('observations_patient_date_idx').on(
      table.patientId,
      table.effectiveDate,
    ),
  ],
);

export const medications = pgTable(
  'medications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    patientId: uuid('patient_id').references(() => patients.id),
    prescriberId: uuid('prescriber_id').references(() => providers.id),
    name: text('name').notNull(),
    code: text('code'),
    dosage: text('dosage'),
    frequency: text('frequency'),
    route: text('route'),
    status: medicationStatusEnum('status').default('active'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('medications_patient_status_idx').on(table.patientId, table.status),
  ],
);

// ── RAG Tables ───────────────────────────────────────────────────────────────

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  filename: text('filename'),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  pageCount: integer('page_count'),
  tags: jsonb('tags').$type<string[]>(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').references(() => documents.id, {
      onDelete: 'cascade',
    }),
    content: text('content').notNull(),
    pageNumber: integer('page_number'),
    chunkIndex: integer('chunk_index'),
    heading: text('heading'),
    embedding: vector('embedding', { dimensions: 3072 }),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [index('document_chunks_doc_idx').on(table.documentId)],
);

// ── Chat Tables ──────────────────────────────────────────────────────────────

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').default('New conversation'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
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
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => [
    index('messages_conversation_idx').on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

// ── Relations ────────────────────────────────────────────────────────────────

export const patientsRelations = relations(patients, ({ many }) => ({
  encounters: many(encounters),
  observations: many(observations),
  medications: many(medications),
}));

export const providersRelations = relations(providers, ({ many }) => ({
  encounters: many(encounters),
  prescriptions: many(medications),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  encounters: many(encounters),
}));

export const encountersRelations = relations(encounters, ({ one, many }) => ({
  patient: one(patients, {
    fields: [encounters.patientId],
    references: [patients.id],
  }),
  provider: one(providers, {
    fields: [encounters.providerId],
    references: [providers.id],
  }),
  organization: one(organizations, {
    fields: [encounters.organizationId],
    references: [organizations.id],
  }),
  observations: many(observations),
}));

export const observationsRelations = relations(observations, ({ one }) => ({
  patient: one(patients, {
    fields: [observations.patientId],
    references: [patients.id],
  }),
  encounter: one(encounters, {
    fields: [observations.encounterId],
    references: [encounters.id],
  }),
}));

export const medicationsRelations = relations(medications, ({ one }) => ({
  patient: one(patients, {
    fields: [medications.patientId],
    references: [patients.id],
  }),
  prescriber: one(providers, {
    fields: [medications.prescriberId],
    references: [providers.id],
  }),
}));

export const documentsRelations = relations(documents, ({ many }) => ({
  chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, {
    fields: [documentChunks.documentId],
    references: [documents.id],
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
