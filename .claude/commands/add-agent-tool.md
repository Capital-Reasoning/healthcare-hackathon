# Add a New Agent Tool

Register a new tool that the Rithm AI agent can use. The user will describe what the tool should do.

## Steps

### 1. Define Zod schema
In `src/lib/ai/tools.ts`, create the input schema:

```tsx
const myToolSchema = z.object({
  paramName: z.string().describe('Description of the parameter'),
  optionalParam: z.string().optional().describe('Optional parameter'),
  limit: z.number().default(10).describe('Max results'),
});
```

Use `.describe()` on every field — this is what the LLM sees to understand the parameter.

### 2. Create the tool
Add to the `tools` object in `src/lib/ai/tools.ts`:

```tsx
myTool: tool({
  description: 'Clear, concise description of what this tool does and when to use it.',
  parameters: myToolSchema,
  execute: async ({ paramName, optionalParam, limit }) => {
    // Call query functions directly — no HTTP round-trip
    const result = await myQueryFunction({ paramName, optionalParam, limit });

    // Return a serializable object (JSON-safe)
    return {
      items: result.map(item => ({
        id: item.id,
        name: item.name,
        // ... only include fields the agent needs
      })),
      total: result.length,
    };
  },
}),
```

### 3. Update system prompt
In `src/lib/ai/system-prompt.ts`:
- Add the tool's capability to the `## Capabilities` list
- If relevant to specific pages, update the `PAGE_CONTEXT` entries

### 4. Test
Open the agent panel and ask a question that should trigger the tool. Verify:
- The tool is called with correct parameters
- The response is rendered properly
- The agent uses the data in its response

## Existing tools (for reference)
1. `queryPatients` — search/filter patients by name, risk, condition, age
2. `getPatientDetail` — get full patient record with encounters, meds, observations
3. `searchDocuments` — hybrid semantic + keyword document search
4. `keywordSearch` — exact keyword matching in documents
5. `listDocuments` — list all documents in the knowledge base
6. `getDocumentChunk` — retrieve a specific document chunk by ID
7. `getMetrics` — aggregate dashboard metrics (patient counts, risk distribution, encounters)

## Reference files
- Tools file: `src/lib/ai/tools.ts`
- System prompt: `src/lib/ai/system-prompt.ts`
- Query layer: `src/lib/db/queries/` (import query functions here)
- Chat route: `src/app/api/chat/route.ts` (where tools are registered with the AI)

## Conventions
- Tool descriptions should be clear about WHEN to use the tool
- Return only the fields the agent needs (keep payloads small)
- Use query functions from `src/lib/db/queries/` — never call API routes
- All Zod fields need `.describe()` for the LLM
