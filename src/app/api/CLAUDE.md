# API Conventions

## Response Format
All endpoints return:
```json
{
  "data": [...],
  "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 },
  "error": null
}
```

Single-item responses (POST create):
```json
{
  "data": { ... },
  "meta": null,
  "error": null
}
```

## Pagination
- `page` (default: 1)
- `pageSize` (default: 20, max: 100)

## Sorting
- `sort=field:asc` or `sort=field:desc`
- Example: `/api/patients?sort=lastName:asc`

## Filtering
- Filter by any indexed field as a query param
- Example: `/api/patients?riskLevel=high&gender=female`
- Search: `/api/patients?search=john` (ILIKE on name, MRN, condition)

## Endpoints

| Method | Path | Filters | Description |
|--------|------|---------|-------------|
| GET | `/api/patients` | search, riskLevel, gender, condition, sort | List patients |
| POST | `/api/patients` | — | Create patient |
| GET | `/api/encounters` | patientId, status, type, sort | List encounters |
| GET | `/api/observations` | patientId, encounterId, code, sort | List observations |
| GET | `/api/medications` | patientId, status, sort | List medications |
| GET | `/api/documents` | page, pageSize | List documents |
| POST | `/api/documents` | — | Create document |
| GET | `/api/documents/search` | query | Semantic search (Phase 07) |

## Adding a New Endpoint
1. Create route file in `src/app/api/{resource}/route.ts`
2. Create query functions in `src/lib/db/queries/{resource}.ts`
3. Add Drizzle schema if new table needed in `src/lib/db/schema.ts`
4. Register as agent tool in `src/lib/ai/tools.ts`
5. Register as MCP tool in `src/lib/ai/mcp.ts`
6. Add TypeScript types in `src/types/database.ts`
7. Export from `src/lib/db/queries/index.ts`
8. Run `npm run db:generate` and `npm run db:push` for schema changes

## Error Handling
Return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 404: Not found
- 500: Internal server error

Always return error in the standard format:
```json
{ "data": null, "meta": null, "error": "Human-readable error message" }
```

## Query Layer
All query functions live in `src/lib/db/queries/`. Both API routes and agent tools import these directly — no HTTP round-trip for agent tools.

Helper functions in `src/lib/db/queries/helpers.ts`:
- `parsePaginationParams(searchParams)` — extracts page/pageSize with defaults
- `parseSortParams(searchParams)` — extracts sort field/direction
- `buildPaginatedResponse(data, total, params)` — wraps data in standard response
- `buildErrorResponse(error)` — creates error response object
