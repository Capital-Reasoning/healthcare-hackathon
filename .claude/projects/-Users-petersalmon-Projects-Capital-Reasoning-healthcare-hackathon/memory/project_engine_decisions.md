---
name: Engine Implementation Decisions
description: Key architectural decisions for the BestPath assessment engine — model choice, batch strategy, priority order, and approach to evidence retrieval
type: project
---

Core engine decisions made 2026-03-27:

**Model choice:** Use Claude Sonnet (not Opus) for the assessment engine to save costs. Opus stays for the interactive chat agent. Test with small batches before scaling.

**Evidence retrieval:** No hardcoded condition-screening mappings. The LLM uses tools to search the vector DB for guidelines and determines intervals/actions from retrieved evidence. The old condition_screening_mapping.csv is not being used.

**Batch strategy:** Pre-compute 50-100 patients initially, potentially all 2,000 if results are good and time permits.

**Priority order (from Peter):**
1. Core engine (patient assessment with citations)
2. Three-column triage dashboard (replaces homepage entirely)
3. Patient detail page (reasoning, source citations, approve button)
4. Patient navigator (fully separate full-screen experience)
5. Full batch processing
6. Presentation polish

**Why:** The core value prop is assessing patients for highest-value, easy-win followups to alleviate pressure on the healthcare system. Navigator second. Agent-generated UI drill-down is lowest priority.

**How to apply:** Always prioritize citation quality and evidence traceability. The approve button on patient detail is a fake email send (demo). Navigator uses same RAG tools but different system prompt. Provider routing is part of LLM output, must be document-backed.
