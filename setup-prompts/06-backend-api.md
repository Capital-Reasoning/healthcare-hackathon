# Phase 06 — Backend & API

## Context
Phases 01-05 are complete. The app has a full UI component library, a working agent panel with chat, OpenUI integration, and Supabase client setup. API routes currently return stubs.

Read `CLAUDE.md` and `src/app/api/CLAUDE.md` for API conventions.

**Senior-dev mode:** The API is the backbone. It serves both the frontend and the AI agent. Every endpoint must be consistent, well-typed, paginated, and documented. The schema must be flexible enough to handle whatever dataset the hackathon challenge provides. When adding an endpoint, also make it available as an agent tool. Think: "Can the AI agent use this to answer user questions?"

**If you're unsure about a schema design choice (especially around FHIR compatibility vs. simplicity) — ask me. Better to get the data model right now.**

## Objective
Build the complete backend: Drizzle ORM schema, Supabase database setup, REST API routes with consistent patterns, MCP tool wrappers, seed data for demo, and comprehensive API documentation.

## Step-by-Step Instructions

### 1. Drizzle ORM Configuration

**`drizzle.config.ts`** at project root:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    // Use the Supabase connection string
    // Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  },
});
```

Read the `.env` file to construct the correct Supabase connection string from the available credentials (SUPABASE_URL, SUPABASE_DB_PASSWORD).

**`src/lib/db/client.ts`** — Database client:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

Note: We may need to add `DATABASE_URL` to `.env` if it's not there. The format for Supabase direct connection is:
`postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

If the Supabase connection string can't be derived from existing env vars, add a note and a placeholder `DATABASE_URL` to `.env`.

### 2. Database Schema (`src/lib/db/schema.ts`)

Design a FHIR-inspired but simplified schema. FHIR compatibility means familiar naming and relationships for healthcare developers, but we strip away FHIR's complexity.

```typescript
import { pgTable, uuid, text, timestamp, integer, numeric, jsonb, boolean, pgEnum, vector } from 'drizzle-orm/pg-core';

// Enums
export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'unknown']);
export const riskLevelEnum = pgEnum('risk_level', ['low', 'medium', 'high', 'critical']);
export const encounterStatusEnum = pgEnum('encounter_status', ['planned', 'in_progress', 'completed', 'cancelled']);
export const medicationStatusEnum = pgEnum('medication_status', ['active', 'discontinued', 'pending']);

// Core tables
export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  mrn: text('mrn').unique(),                              // Medical Record Number
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: timestamp('date_of_birth'),
  gender: genderEnum('gender'),
  email: text('email'),
  phone: text('phone'),
  address: jsonb('address'),                              // { street, city, state, zip, country }
  riskLevel: riskLevelEnum('risk_level').default('low'),
  primaryCondition: text('primary_condition'),
  metadata: jsonb('metadata'),                            // Extensible field for unknown data
  embedding: vector('embedding', { dimensions: 3072 }),   // For semantic search (Gemini Embedding 2)
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

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
  type: text('type'),                                      // hospital, clinic, lab, pharmacy
  address: jsonb('address'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const encounters = pgTable('encounters', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id),
  providerId: uuid('provider_id').references(() => providers.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  type: text('type'),                                      // ambulatory, emergency, inpatient, observation
  status: encounterStatusEnum('status').default('planned'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  reasonCode: text('reason_code'),                         // ICD-10 code
  reasonDisplay: text('reason_display'),                   // Human-readable reason
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const observations = pgTable('observations', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id),
  encounterId: uuid('encounter_id').references(() => encounters.id),
  code: text('code'),                                      // LOINC code
  display: text('display'),                                // "Blood Pressure", "Heart Rate"
  valueNumeric: numeric('value_numeric'),
  valueText: text('value_text'),                           // For non-numeric observations
  unit: text('unit'),                                      // "mmHg", "bpm", "mg/dL"
  status: text('status').default('final'),                 // preliminary, final, amended
  effectiveDate: timestamp('effective_date'),
  referenceRange: jsonb('reference_range'),                // { low, high, unit }
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const medications = pgTable('medications', {
  id: uuid('id').primaryKey().defaultRandom(),
  patientId: uuid('patient_id').references(() => patients.id),
  prescriberId: uuid('prescriber_id').references(() => providers.id),
  name: text('name').notNull(),
  code: text('code'),                                      // RxNorm code
  dosage: text('dosage'),
  frequency: text('frequency'),
  route: text('route'),                                    // oral, IV, topical
  status: medicationStatusEnum('status').default('active'),
  startDate: timestamp('start_date'),
  endDate: timestamp('end_date'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// RAG tables
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  filename: text('filename'),
  mimeType: text('mime_type'),
  fileSize: integer('file_size'),
  pageCount: integer('page_count'),
  tags: jsonb('tags'),                                     // Color-coded tags for organization
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').references(() => documents.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  pageNumber: integer('page_number'),
  chunkIndex: integer('chunk_index'),
  heading: text('heading'),                                // Section heading this chunk belongs to
  embedding: vector('embedding', { dimensions: 3072 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Conversations (already created in Phase 05, but include here for completeness)
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').default('New conversation'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),                            // user, assistant, system, tool
  content: text('content').notNull(),
  toolCalls: jsonb('tool_calls'),
  toolResults: jsonb('tool_results'),
  createdAt: timestamp('created_at').defaultNow(),
});
```

Add indexes for common query patterns:
- Full-text search index on `patients(first_name, last_name, primary_condition)`
- Full-text search index on `document_chunks(content)`
- Vector index (HNSW) on `patients(embedding)` and `document_chunks(embedding)`
- Index on `encounters(patient_id, start_date)`
- Index on `observations(patient_id, effective_date)`
- Index on `messages(conversation_id, created_at)`

### 3. TypeScript Types (`src/types/database.ts`)

Export inferred types from Drizzle schema:
```typescript
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import type { patients, encounters, observations, medications, providers, organizations, documents, documentChunks } from '@/lib/db/schema';

export type Patient = InferSelectModel<typeof patients>;
export type NewPatient = InferInsertModel<typeof patients>;
export type Encounter = InferSelectModel<typeof encounters>;
// ... etc for all tables
```

### 4. API Response Types (`src/types/api.ts`)

```typescript
export interface ApiResponse<T> {
  data: T;
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  error: string | null;
}

export interface ApiError {
  data: null;
  meta: null;
  error: string;
  statusCode: number;
}

// Pagination params (parsed from query string)
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Sort params
export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Filter params (dynamic, based on entity)
export type FilterParams = Record<string, string | string[] | undefined>;
```

### 5. Query Helpers (`src/lib/db/queries/`)

Create reusable query functions:

**`src/lib/db/queries/helpers.ts`** — Shared pagination, sorting, filtering:
```typescript
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams
export function parseSortParams(searchParams: URLSearchParams): SortParams | null
export function buildPaginatedResponse<T>(data: T[], total: number, params: PaginationParams): ApiResponse<T[]>
```

**`src/lib/db/queries/patients.ts`:**
- `getPatients(params)` — list with pagination, filtering, sorting
- `getPatientById(id)` — single patient with related encounters/observations
- `searchPatients(query)` — full-text search
- `getPatientStats()` — aggregate metrics (total, by risk level, etc.)

**`src/lib/db/queries/encounters.ts`:**
- `getEncounters(params)` — list with pagination, filtering by patient/provider/date
- `getEncounterById(id)` — single encounter with observations

**`src/lib/db/queries/observations.ts`:**
- `getObservations(params)` — list with filtering by patient/encounter/code
- `getVitalSigns(patientId)` — latest vital signs for a patient

**`src/lib/db/queries/medications.ts`:**
- `getMedications(params)` — list with filtering
- `getActiveMedications(patientId)` — active meds for a patient

**`src/lib/db/queries/documents.ts`:**
- `getDocuments(params)` — list
- `getDocumentById(id)` — single document with chunk count

### 6. API Routes

Implement all API routes following the consistent pattern. Each route should:
- Parse query params for pagination (page, pageSize), sort (sort=field:direction), and filters
- Call the appropriate query function
- Return `ApiResponse<T>` format
- Handle errors gracefully
- Log errors server-side

**`/api/patients/route.ts`** — GET (list) + POST (create):
```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pagination = parsePaginationParams(searchParams);
  const sort = parseSortParams(searchParams);
  const filters = {
    riskLevel: searchParams.get('riskLevel'),
    condition: searchParams.get('condition'),
    search: searchParams.get('search'),
  };

  const { data, total } = await getPatients({ ...pagination, sort, filters });
  return NextResponse.json(buildPaginatedResponse(data, total, pagination));
}

export async function POST(request: Request) {
  const body = await request.json();
  // Validate with Zod
  // Insert via Drizzle
  // Return created patient
}
```

Implement similarly for: `/api/encounters`, `/api/observations`, `/api/medications`, `/api/documents`, `/api/documents/search`.

### 7. Wire Agent Tools to Real API Calls

Update `src/lib/ai/tools.ts` — replace mock implementations with actual database queries:

```typescript
queryPatients: tool({
  // ... same definition as before
  execute: async (args) => {
    const { data, total } = await getPatients({
      page: 1,
      pageSize: args.limit,
      filters: {
        search: args.query,
        riskLevel: args.riskLevel,
        condition: args.condition,
      },
    });
    return { patients: data, total };
  },
}),
```

### 8. MCP Tool Wrappers (`src/lib/ai/mcp.ts`)

Create a registry that documents all available API endpoints as MCP-compatible tool definitions. This serves two purposes:
1. External AI agents (Claude Code, etc.) can discover and use our APIs via MCP
2. Acts as living documentation of the API surface

```typescript
export const mcpToolDefinitions = [
  {
    name: 'query_patients',
    description: 'Search and filter patient records',
    inputSchema: { /* Zod → JSON Schema */ },
    endpoint: '/api/patients',
    method: 'GET',
  },
  // ... one for each endpoint
];
```

For each endpoint, also document the expected query params and response shape in JSDoc comments.

### 9. Nested CLAUDE.md for API

**Update `src/app/api/CLAUDE.md`:**

```markdown
# API Conventions

## Response Format
All endpoints return:
\`\`\`json
{
  "data": [...],
  "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 },
  "error": null
}
\`\`\`

## Pagination
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

## Sorting
- `sort=field:asc` or `sort=field:desc`
- Example: `/api/patients?sort=lastName:asc`

## Filtering
- Filter by any indexed field as a query param
- Example: `/api/patients?riskLevel=high&condition=diabetes`
- Search: `/api/patients?search=john` (full-text search)

## Adding a New Endpoint
1. Create route file in `src/app/api/{resource}/route.ts`
2. Create query functions in `src/lib/db/queries/{resource}.ts`
3. Add Drizzle schema if new table needed in `src/lib/db/schema.ts`
4. Register as agent tool in `src/lib/ai/tools.ts`
5. Register as MCP tool in `src/lib/ai/mcp.ts`
6. Add TypeScript types in `src/types/database.ts` and `src/types/api.ts`
7. Run `npm run db:generate` and `npm run db:push` for schema changes

## Error Handling
Return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 404: Not found
- 500: Internal server error

Always return error in the standard format:
\`\`\`json
{ "data": null, "meta": null, "error": "Human-readable error message" }
\`\`\`
```

### 10. Seed Data (`src/lib/db/seed.ts`)

Create a seed script that populates the database with realistic demo data:

- **30-50 patients** with varied demographics, risk levels, conditions
- **100+ encounters** spread across patients, different types and statuses
- **200+ observations** (vital signs, lab results)
- **50+ medications** across patients
- **5-10 providers** with different specialties
- **2-3 organizations** (hospital, clinic, lab)

Use realistic but synthetic healthcare data:
- Names: generate from common name lists
- Conditions: diabetes, hypertension, COPD, heart failure, asthma, depression, anxiety
- Vital signs: realistic ranges (BP: 90-180/60-120, HR: 50-110, Temp: 97-102°F)
- ICD-10 codes: use real codes for common conditions (E11 for diabetes, I10 for hypertension, etc.)
- Dates: spread over the last 6 months

The seed script should be idempotent (can run multiple times without duplicating data — clear tables first).

Add the seed script to npm scripts: `"db:seed": "npx tsx src/lib/db/seed.ts"`

### 11. Database Migration & Push

Generate and run the initial migration:
1. `npm run db:generate` — generates SQL migration from schema
2. `npm run db:push` — pushes schema to Supabase

Also, enable the pgvector extension on Supabase if not already done:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

This may need to be done via the Supabase dashboard or their MCP server. Add instructions in CLAUDE.md for how to do this.

### 12. Verify

1. `npm run db:push` succeeds — schema is in Supabase
2. `npm run db:seed` populates data
3. `GET /api/patients` returns paginated patient data
4. `GET /api/patients?search=john` returns filtered results
5. `GET /api/patients?sort=lastName:asc` returns sorted results
6. `GET /api/patients?riskLevel=high` returns filtered results
7. `GET /api/encounters?patientId=[id]` returns encounters for a patient
8. Agent tools work — chat with the agent and ask "How many patients do we have?" → it should call queryPatients and return real data
9. All TypeScript types are correct

**If the Supabase connection fails, check the connection string format and ensure the pgvector extension is enabled. Ask me if you need help troubleshooting.**

## Success Criteria
- [ ] Drizzle schema matches the design (all tables, indexes, enums)
- [ ] Schema pushed to Supabase successfully
- [ ] Seed data populates realistic demo data
- [ ] All API routes work with pagination, sort, filter
- [ ] API responses follow the consistent format
- [ ] Agent tools call real database queries (not mocks)
- [ ] MCP tool definitions documented
- [ ] API CLAUDE.md is comprehensive
- [ ] Full-text search works on patient names
- [ ] TypeScript types are correct end-to-end
