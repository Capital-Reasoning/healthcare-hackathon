# Setup Prompts — Overview

These prompts are designed to be run **sequentially** in Claude Code sessions. Each phase builds on the previous one's output. Run them in order.

## Execution Order

| # | File | What it does | Est. time |
|---|------|-------------|-----------|
| 01 | `01-project-setup.md` | Next.js + TypeScript + Tailwind v4 + all deps + config + CLAUDE.md | 20-30 min |
| 02 | `02-design-system.md` | Theme tokens, CSS custom properties, glass utilities, typography | 15-20 min |
| 03 | `03-core-components.md` | Layout, navigation, forms, feedback — shadcn/ui base | 30-45 min |
| 04 | `04-data-components.md` | DataTable, StatCards, charts (Recharts), healthcare components | 30-45 min |
| 05 | `05-agent-panel.md` | Collapsible panel, chat UI, OpenUI library, AI SDK integration | 30-45 min |
| 06 | `06-backend-api.md` | Drizzle schema, REST API routes, MCP wrappers, seed data | 30-40 min |
| 07 | `07-rag-pipeline.md` | LlamaParse, chunking, Gemini embeddings, pgvector, hybrid retrieval | 30-40 min |
| 08 | `08-polish-and-demo.md` | Responsive polish, demo prep, challenge intake system, skills | 20-30 min |

## How to Use

1. Open a Claude Code session in this project directory
2. Copy-paste the contents of the prompt file (or reference it: "Read and execute setup-prompts/01-project-setup.md")
3. Let Claude work through the instructions
4. Verify the success criteria at the end of each prompt
5. Commit the changes before moving to the next phase

## Important Notes

- Each prompt asks Claude to verify its work and ask you questions if anything is unclear
- The prompts reference `docs/stack-decisions.md` and `docs/colour-scheme.md` for context
- Environment variables are already configured in `.env`
- MCP servers should be configured as part of Phase 01
- App name ("Rithm") is configured in `src/config/app.ts` and can be changed later
