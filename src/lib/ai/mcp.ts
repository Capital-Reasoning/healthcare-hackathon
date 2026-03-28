/**
 * MCP Tool Definitions — registry of all API endpoints as structured tool definitions.
 *
 * Serves two purposes:
 * 1. External AI agents can discover and use our APIs via MCP
 * 2. Living documentation of the API surface
 */

export const mcpToolDefinitions = [
  {
    name: 'query_patients',
    description: 'Search and filter patient records with pagination, sorting, and filtering',
    endpoint: '/api/patients',
    method: 'GET' as const,
    params: ['search', 'riskLevel', 'gender', 'condition', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Patient[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'create_patient',
    description: 'Create a new patient record',
    endpoint: '/api/patients',
    method: 'POST' as const,
    body: ['mrn', 'firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'address', 'riskLevel', 'primaryCondition'],
    responseShape: '{ data: Patient, meta: null, error: null }',
  },
  {
    name: 'query_encounters',
    description: 'List encounters with filtering by patient, status, or type',
    endpoint: '/api/encounters',
    method: 'GET' as const,
    params: ['patientId', 'status', 'type', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Encounter[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'query_observations',
    description: 'List observations (vitals, lab results) with filtering',
    endpoint: '/api/observations',
    method: 'GET' as const,
    params: ['patientId', 'encounterId', 'code', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Observation[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'query_medications',
    description: 'List medications with filtering by patient or status',
    endpoint: '/api/medications',
    method: 'GET' as const,
    params: ['patientId', 'status', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Medication[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'query_documents',
    description: 'List uploaded documents with pagination',
    endpoint: '/api/documents',
    method: 'GET' as const,
    params: ['page', 'pageSize'],
    responseShape: '{ data: Document[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'create_document',
    description: 'Create a new document record',
    endpoint: '/api/documents',
    method: 'POST' as const,
    body: ['title', 'filename', 'mimeType', 'fileSize', 'pageCount', 'tags'],
    responseShape: '{ data: Document, meta: null, error: null }',
  },
  {
    name: 'search_documents',
    description: 'Semantic search through document chunks using vector similarity',
    endpoint: '/api/documents/search',
    method: 'GET' as const,
    params: ['query'],
    responseShape: '{ data: DocumentChunk[], meta: PaginationMeta, error: null }',
  },
];
