# Add a New API Route

Create a new REST API endpoint for the Rithm app. The user will describe the resource/endpoint they need.

## Steps

### 1. Add Drizzle schema (if new table)
In `src/lib/db/schema.ts`:
- Define the table using `pgTable()` with appropriate columns
- Add indexes for fields that will be filtered/sorted
- Define relations if there are foreign keys
- Run `npm run db:generate` then `npm run db:push`

### 2. Create query functions
Create `src/lib/db/queries/{resource}.ts`:

```tsx
import { db } from '@/lib/db';
import { tableName } from '@/lib/db/schema';
import { eq, ilike, and, desc, asc, count } from 'drizzle-orm';

interface GetResourceParams {
  search?: string;
  filterField?: string;
  page: number;
  pageSize: number;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export async function getResources(params: GetResourceParams) {
  const { search, page, pageSize, sortField, sortDirection } = params;

  const conditions = [];
  if (search) {
    conditions.push(ilike(tableName.nameField, `%${search}%`));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy = sortField ? (sortDirection === 'desc' ? desc(tableName[sortField]) : asc(tableName[sortField])) : desc(tableName.createdAt);

  const [data, [{ total }]] = await Promise.all([
    db.select().from(tableName).where(where).orderBy(orderBy).limit(pageSize).offset((page - 1) * pageSize),
    db.select({ total: count() }).from(tableName).where(where),
  ]);

  return { data, total };
}
```

### 3. Export from query index
In `src/lib/db/queries/index.ts`, add: `export * from './{resource}';`

### 4. Create the API route
Create `src/app/api/{resource}/route.ts`:

```tsx
import { NextRequest, NextResponse } from 'next/server';
import { getResources } from '@/lib/db/queries/{resource}';
import { parsePaginationParams, parseSortParams, buildPaginatedResponse, buildErrorResponse } from '@/lib/db/queries/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const pagination = parsePaginationParams(searchParams);
    const sort = parseSortParams(searchParams);

    const { data, total } = await getResources({
      ...pagination,
      ...sort,
    });

    return NextResponse.json(buildPaginatedResponse(data, total, pagination));
  } catch (error) {
    console.error('GET /api/{resource} error:', error);
    return NextResponse.json(buildErrorResponse('Failed to fetch resources'), { status: 500 });
  }
}
```

### 5. Register as agent tool
In `src/lib/ai/tools.ts`:
- Import the query function
- Define a Zod schema for the tool input
- Add the tool to the `tools` object using `tool()` from `ai`
- The tool should call the query function directly (no HTTP round-trip)

### 6. Update system prompt
In `src/lib/ai/system-prompt.ts`, add the new capability to the Capabilities list.

## Response format
All endpoints must return:
```json
{ "data": [...], "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 }, "error": null }
```

## Reference files
- API conventions: `src/app/api/CLAUDE.md`
- Existing route: `src/app/api/patients/route.ts`
- Query layer: `src/lib/db/queries/patients.ts`
- Helpers: `src/lib/db/queries/helpers.ts`
- Schema: `src/lib/db/schema.ts`
- Tools: `src/lib/ai/tools.ts`
