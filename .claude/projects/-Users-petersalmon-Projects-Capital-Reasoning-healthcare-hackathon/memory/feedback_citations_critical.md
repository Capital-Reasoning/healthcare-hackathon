---
name: Citations Are Non-Negotiable
description: Every recommendation must link to source documents — Peter emphasized this as absolutely critical
type: feedback
---

Source document citations are ABSOLUTELY CRITICAL in all engine output. Every recommendation must include document title, excerpt, and a clickable link to the source.

**Why:** The entire trust model of BestPath depends on "AI suggests, math decides" — and the evidence must be traceable. If a clinician can't see WHERE a recommendation comes from, the system has zero value. This is the core differentiator from generic AI chatbots.

**How to apply:** In engine output, always populate evidenceRefs with docId, chunkId, documentTitle, and excerpt. On the patient detail page, make citations clickable (link to /research or show in modal). In the navigator chat, always cite with "According to [Document Title]: '...excerpt...'". Never output a recommendation without a citation — if no evidence is found, set confidence to low and explain.
