import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  patients,
  encounters,
  observations,
  medications,
  providers,
  organizations,
  documents,
  documentChunks,
  conversations,
  messages,
} from '@/lib/db/schema';

// Select types (read from DB)
export type Patient = InferSelectModel<typeof patients>;
export type Encounter = InferSelectModel<typeof encounters>;
export type Observation = InferSelectModel<typeof observations>;
export type Medication = InferSelectModel<typeof medications>;
export type Provider = InferSelectModel<typeof providers>;
export type Organization = InferSelectModel<typeof organizations>;
export type Document = InferSelectModel<typeof documents>;
export type DocumentChunk = InferSelectModel<typeof documentChunks>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;

// Insert types (write to DB)
export type NewPatient = InferInsertModel<typeof patients>;
export type NewEncounter = InferInsertModel<typeof encounters>;
export type NewObservation = InferInsertModel<typeof observations>;
export type NewMedication = InferInsertModel<typeof medications>;
export type NewProvider = InferInsertModel<typeof providers>;
export type NewOrganization = InferInsertModel<typeof organizations>;
export type NewDocument = InferInsertModel<typeof documents>;
export type NewDocumentChunk = InferInsertModel<typeof documentChunks>;
export type NewConversation = InferInsertModel<typeof conversations>;
export type NewMessage = InferInsertModel<typeof messages>;
