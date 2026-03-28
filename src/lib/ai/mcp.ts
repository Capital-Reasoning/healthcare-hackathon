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
    params: ['search', 'sex', 'ageMin', 'ageMax', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Patient[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'create_patient',
    description: 'Create a new patient record',
    endpoint: '/api/patients',
    method: 'POST' as const,
    body: ['patientId', 'firstName', 'lastName', 'dateOfBirth', 'age', 'sex', 'postalCode', 'bloodType', 'insuranceNumber', 'primaryLanguage', 'emergencyContactPhone'],
    responseShape: '{ data: Patient, meta: null, error: null }',
  },
  {
    name: 'query_encounters',
    description: 'List encounters with filtering by patient, disposition, or encounter type',
    endpoint: '/api/encounters',
    method: 'GET' as const,
    params: ['patientId', 'disposition', 'encounterType', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Encounter[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'query_lab_results',
    description: 'List lab results with filtering by patient, encounter, or test code',
    endpoint: '/api/observations',
    method: 'GET' as const,
    params: ['patientId', 'encounterId', 'testCode', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: LabResult[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'query_medications',
    description: 'List medications with filtering by patient or active status',
    endpoint: '/api/medications',
    method: 'GET' as const,
    params: ['patientId', 'active', 'page', 'pageSize', 'sort'],
    responseShape: '{ data: Medication[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'query_documents',
    description: 'List uploaded corpus documents with pagination',
    endpoint: '/api/documents',
    method: 'GET' as const,
    params: ['page', 'pageSize'],
    responseShape: '{ data: CorpusDocument[], meta: PaginationMeta, error: null }',
  },
  {
    name: 'create_document',
    description: 'Create a new corpus document record',
    endpoint: '/api/documents',
    method: 'POST' as const,
    body: ['documentTitle', 'filename', 'fileType', 'contentType', 'sourceBucket', 'pageCount', 'fileSizeBytes', 'clinicalDomains', 'jurisdiction'],
    responseShape: '{ data: CorpusDocument, meta: null, error: null }',
  },
  {
    name: 'search_documents',
    description: 'Semantic search through document chunks using vector similarity',
    endpoint: '/api/documents/search',
    method: 'GET' as const,
    params: ['query', 'mode', 'topK', 'documentId'],
    responseShape: '{ data: RetrievalResult[], meta: PaginationMeta, error: null }',
  },
];
