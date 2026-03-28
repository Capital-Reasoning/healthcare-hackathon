import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type {
  patients,
  encounters,
  labResults,
  vitals,
  medications,
  canadianDrugReference,
  corpusDocuments,
  corpusChunks,
  engineRuns,
  pathwayTargetRunFacts,
  validationCases,
  validationAnswerKeys,
  conversations,
  messages,
} from '@/lib/db/schema';

// Select types (read from DB)
export type Patient = InferSelectModel<typeof patients>;
export type Encounter = InferSelectModel<typeof encounters>;
export type LabResult = InferSelectModel<typeof labResults>;
export type Vital = InferSelectModel<typeof vitals>;
export type Medication = InferSelectModel<typeof medications>;
export type DrugReference = InferSelectModel<typeof canadianDrugReference>;
export type CorpusDocument = InferSelectModel<typeof corpusDocuments>;
export type CorpusChunk = InferSelectModel<typeof corpusChunks>;
export type EngineRun = InferSelectModel<typeof engineRuns>;
export type PathwayTargetRunFact = InferSelectModel<typeof pathwayTargetRunFacts>;
export type ValidationCase = InferSelectModel<typeof validationCases>;
export type ValidationAnswerKey = InferSelectModel<typeof validationAnswerKeys>;
export type Conversation = InferSelectModel<typeof conversations>;
export type Message = InferSelectModel<typeof messages>;

// Insert types (write to DB)
export type NewPatient = InferInsertModel<typeof patients>;
export type NewEncounter = InferInsertModel<typeof encounters>;
export type NewLabResult = InferInsertModel<typeof labResults>;
export type NewVital = InferInsertModel<typeof vitals>;
export type NewMedication = InferInsertModel<typeof medications>;
export type NewDrugReference = InferInsertModel<typeof canadianDrugReference>;
export type NewCorpusDocument = InferInsertModel<typeof corpusDocuments>;
export type NewCorpusChunk = InferInsertModel<typeof corpusChunks>;
export type NewEngineRun = InferInsertModel<typeof engineRuns>;
export type NewPathwayTargetRunFact = InferInsertModel<typeof pathwayTargetRunFacts>;
export type NewValidationCase = InferInsertModel<typeof validationCases>;
export type NewValidationAnswerKey = InferInsertModel<typeof validationAnswerKeys>;
export type NewConversation = InferInsertModel<typeof conversations>;
export type NewMessage = InferInsertModel<typeof messages>;
