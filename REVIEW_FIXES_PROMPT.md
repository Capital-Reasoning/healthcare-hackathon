# BestPath — Post-Review Fixes

You are the **orchestrating agent** for a round of targeted UI/UX and functionality fixes based on Peter's review of the live application. Use subagents liberally — spawn dedicated agents for each major area to work in parallel. Do not hold back on agent count or thoroughness.

**Read these files before doing anything else:**
1. `CLAUDE.md` — codebase patterns, conventions, and commands
2. `src/app/globals.css` — theme tokens, colour scheme, typography utilities
3. `src/lib/db/schema.ts` — database schema (ground truth for data structures)

---

## Area 1: Care Navigator — Accessibility, Feedback, and Output Quality

**Spawn a dedicated subagent for this area.** This is the most complex set of changes.

### Files to read:
- `src/app/(navigator)/navigator/page.tsx` — the full-screen chat page
- `src/app/(navigator)/layout.tsx` — navigator layout
- `src/lib/ai/navigator-prompt.ts` — the system prompt for the navigator LLM
- `src/app/api/chat/route.ts` — the chat API route (handles navigator mode)
- `src/app/globals.css` — theme tokens

### Problem 1: Poor contrast / accessibility
The navigator has contrast issues in multiple places:
- System/assistant message background is too subtle against the page background
- The disclaimer text ("This is decision support information...") has poor contrast
- User message bubbles have poor contrast against the page background
- This page is patient-facing and must be **highly accessible** — WCAG AA minimum

Fix: Ensure all text meets WCAG AA contrast ratios (4.5:1 for body text, 3:1 for large text). Use the colour scheme from `globals.css` but adjust backgrounds/foregrounds as needed for contrast. Test contrast ratios.

### Problem 2: No progress feedback during agentic search
When the navigator's LLM is searching guidelines via tools, the patient sees nothing — just a spinner. This feels like a very long wait.

Fix: Add visible progress/status feedback during the LLM's tool-use phase. Options:
- Show streaming text as it arrives (the AI SDK's `useChat` should support this — the model streams text between tool calls)
- Add a pulsing status indicator that shows what's happening: "Searching clinical guidelines...", "Reviewing screening recommendations...", "Preparing your personalized guidance..."
- Consider integrating the Vector Cube animation (`Vector_Cube/vector_cube-main/vector_cube-main/`) as a visual while searching, if feasible — or use a simpler but engaging CSS animation
- The key requirement: the patient should never see a static spinner for more than a few seconds without some kind of progress text or visual feedback

Also consider if the navigator response can be faster:
- Could we use a faster model for the navigator (e.g., Sonnet instead of Opus)?
- Could we reduce the number of tool calls needed?
- The navigator currently uses `claude-opus-4-6` via the chat route — consider switching to Sonnet for faster responses while keeping quality

### Problem 3: Output is too technical / not patient-friendly enough
The navigator's output currently includes technical elements that are inappropriate for a patient audience:
- References to specific document file names / chunk IDs
- Clinical language and diagnoses
- Quoted excerpts from guidelines
- Generic, unstructured text output

Fix: Rewrite the navigator system prompt (`src/lib/ai/navigator-prompt.ts`) to produce simpler, friendlier, more structured output:
- **Use a priority tier system with icons** — group recommendations into urgency tiers (similar to red/yellow/green but patient-friendly language). Include both colour AND icon indicators for colourblind accessibility:
  - Priority: "Act Soon" (with a relevant icon)
  - Routine: "Schedule When Convenient" (with a relevant icon)
  - Maintenance: "Keep Doing What You're Doing" (with a relevant icon)
- **Focus the output on actionable next steps:**
  - What to do
  - Who to see (pharmacist, dietitian, walk-in, LifeLabs, etc.)
  - What to say / ask for when you get there
- **Remove technical elements:** No file references, no chunk IDs, no diagnosis codes, no quoted excerpts. The evidence backing is internal — the patient just needs clear guidance.
- **Keep the disclaimer** but make it warm, not clinical
- Consider having the LLM output structured data (JSON) that gets rendered as a pretty UI component, rather than plain markdown — this would make the output consistent and visually polished. You could create a custom renderer component for this.

---

## Area 2: Dashboard / Clinical Triage Page

**Spawn a dedicated subagent for this area.**

### Files to read:
- `src/app/(main)/page.tsx` — the dashboard page (server component)
- `src/components/healthcare/triage-dashboard.tsx` — the triage dashboard client component

### Fix 1: Triage card styling
- **Remove the left colour border** from the three triage columns — it's too loud/obnoxious
- Instead, incorporate the category colour in a subtler way — perhaps a thin top border, a small coloured dot/icon in the header, or a very subtle background tint
- **Cards need a distinct foreground colour** to stand out from the page background. The page bg is `#F8F8F6` (warm white). Cards should be full white (`#FFFFFF` / `bg-card`) with a visible-but-subtle border or shadow to pop from the background.

### Fix 2: Subtitle copy
- Replace "AI-powered patient panel analysis against clinical guidelines" with something that sounds less generic and more product-specific. Examples:
  - "Evidence-based clinical action queue for your patient panel"
  - "Prioritized care actions identified from guideline analysis"
  - Something that sounds like a real clinical tool, not an AI product

### Fix 3: Badge labels on triage cards are unclear
The "high" / "low" badges on triage cards (visible in screenshots) have no label explaining what they refer to. Currently they just say "high" and "High" next to each other — one is confidence, one is risk tier, but there's no way for the user to tell.

Fix: Add explicit labels to the badges. Instead of just "high" and "High", show:
- "Confidence: High" or a labelled format
- "Risk: High" or use the existing RiskBadge which already says the level
- Or, rethink the badge row entirely: show the most important info clearly. Perhaps: overdue days badge + a combined "High confidence, High risk" text, or just the RiskBadge (which already has context) + a small confidence indicator

The key issue: two badges side by side that both say variants of "high/low/medium" with no context is confusing.

---

## Area 3: Patient Detail Page

**Spawn a dedicated subagent for this area.** This has the most individual fixes.

### Files to read:
- `src/app/(main)/patients/[id]/page.tsx` — the patient detail server component
- `src/app/(main)/patients/[id]/assessment-results.tsx` — assessment target cards
- `src/app/(main)/patients/[id]/evidence-citation.tsx` — evidence citation display
- `src/app/(main)/patients/[id]/approve-button.tsx` — the approve & send dialog
- `src/app/(main)/patients/[id]/patient-data-tabs.tsx` — clinical data tabs
- `src/app/api/chunks/[id]/route.ts` — chunk fetch endpoint for evidence modal
- `src/lib/db/queries/engine-results.ts` — engine results queries
- `src/lib/engine/scoring.ts` — scoring and categorization logic

### Fix 1: Max width for page content
All page content should have a reasonable max width so it doesn't stretch edge-to-edge on large desktops. Something like `max-w-5xl mx-auto` or `max-w-6xl mx-auto` on the main content wrapper. This improves readability significantly.

### Fix 2: "Why this action" and "Why now" cards need distinct background
The inner cards for reasoning text within each target card need a more distinct background to visually separate from the outer card. They should use a slightly different bg — perhaps `bg-muted` or `bg-background` if the card is `bg-card`.

### Fix 3: Evidence citation formatting
- Remove the `[1]`, `[2]` numbered prefixes — they add clutter
- Remove the quotes around the document title
- Make the document title slightly bigger / bolder — it's the key identifier
- Put the excerpt content **below** the title on its own line, rather than inline on the same line
- This should look like a clean reference list, not a footnoted academic paper

### Fix 4: "Up to date" items are confusing
From the screenshots: a target shows "Up to Date" with a green badge and "High Confidence" — but the recommended action text still reads like something that needs doing ("Order free T4 (fT4) to characterize elevated TSH..."). This is contradictory and confusing.

Investigate the scoring logic in `src/lib/engine/scoring.ts` and the display in `assessment-results.tsx`:
- If a target is `up_to_date`, it gets category `green` and a low score
- For `up_to_date` items, the display must reframe the messaging:
  - Show "On Track" instead of "Up to date"
  - Show the **next due date** prominently: "Next check: October 2026" or "Due again in X months"
  - De-emphasize the action text (it was already done) — perhaps show it as "Last action: ..." or grey it out
  - Visually de-emphasize green/on-track cards compared to red/yellow ones (lighter border, muted text, maybe collapsed by default)
- Consider: should `up_to_date` items appear at all on the patient detail? If the goal is to show what needs action, showing things that are already done adds noise. Consider hiding them behind an expandable "On Track Items" section, or filtering them out by default with a toggle to show.
- The `status` field from the engine could also be `unknown_due` (no record of when it was last done) — these should NOT show as "Up to date". Check the display mapping.

### Fix 5: Missing evidence full-text is a critical problem
Some engine results have empty `evidenceRefs` — targets without any linked source documents. This undermines the product's core value prop (every recommendation is evidence-backed).

Action items:
1. Query the database for any `pathway_target_run_facts` rows where `evidence_refs` is null, empty array, or has entries with null `chunkId` values
2. Delete the engine_runs and pathway_target_run_facts for those patients
3. Re-run the assessment for those patients
4. In the engine code (`src/lib/engine/assess-patient.ts`), the validation step already demotes high-confidence targets with empty evidenceRefs — verify this is working. Consider whether targets with zero evidence should be excluded entirely rather than just demoted.

### Fix 6: Confirm Notification panel improvements
The "Approve & Send" confirmation dialog needs significant improvements:
- **Make it bigger** — it's currently too small and cramped. Use a larger dialog/modal.
- **Add email AND phone notification options** — show both with checkboxes, both selected by default, but allow deselecting either
- **Improve the notification text** — currently it's a template with values filled in, which reads awkwardly. Either:
  - Use an LLM to generate a natural-sounding notification message (can be a quick API call on dialog open)
  - Or write better templates with proper line breaks, formatting, and natural language
- **Make the email/text content editable** — show the notification content in an editable textarea so the clinician can review and modify before sending. Changes don't need to persist (demo only), but the editability demonstrates the review workflow.
- **Improve layout and hierarchy** — clear sections for recipient info, notification channels, message preview, and action buttons. More whitespace. Better visual structure.
- Ensure line breaks and formatting display correctly in the notification preview

### Fix 7: Full-text view improvements
The "View full text" button and modal for evidence citations need fixes:
- **Change the button icon** — the current icon suggests opening a new tab. Use a different icon (e.g., `BookOpen`, `FileText`, `Eye` from lucide-react) and style it more as a button than a link
- **Make the full-text modal bigger** — similar treatment to the notification modal. More space, better use of screen real estate.
- **Improve text formatting** — currently displays as plain text. Add heading styling, paragraph breaks, and any available HTML formatting from the `text_as_html` field in `corpus_chunks` (check the schema — there's a `text_as_html` column that may contain formatted content)
- **Add a "View Full Document" button** inside the modal that could link to the source URL if available (check `corpus_documents.source_url` in the schema)

### Fix 8: Title display issues — URL-encoded text
Some document titles display with URL encoding artifacts — e.g., `"M.%20Beaulieu%20J.%20Pawlovich%20%20CKD%20and%20the%20state%20of"` instead of the decoded version. This happens because document titles in the database may be stored URL-encoded (from the corpus ingestion pipeline).

Fix: Apply `decodeURIComponent()` to document titles wherever they are displayed — in the evidence citation component, in the full-text modal, and anywhere else titles appear. Also check the `corpus_documents.document_title` column in the database and consider whether to fix the data at the source (a one-time SQL UPDATE to decode all titles).

Also check:
- Long titles truncate or wrap gracefully
- No weird spacing or line break issues
- Consistent capitalization

---

## Area 4: Global Typography

**This can be done inline (no subagent needed) or as part of any of the above.**

### Files to read:
- `src/app/globals.css` — typography utilities section

### Fix: Increase body text size globally
All body text throughout the app needs to be bigger for demo visibility (projector at hackathon). The current `text-body` utility is `0.9375rem` (15px) and `text-body-sm` is `0.875rem` (14px).

Increase these:
- `text-body`: bump to `1rem` (16px) minimum
- `text-body-sm`: bump to `0.9375rem` (15px) minimum
- Check that headings (`text-h1`, `text-h2`, `text-h3`) are also appropriately sized for projector viewing

This change should cascade through the whole app since components use these utilities.

---

## Execution Protocol

For each area, the subagent should:
1. **Read** all referenced files thoroughly before making changes
2. **Fix** all issues listed above
3. **Run `npm run typecheck`** after all changes — zero errors in `src/` required
4. **Run `npm run build`** to verify no build errors
5. **Report** what was changed

After all subagents complete, the orchestrator should:
1. Run `npm run typecheck` and `npm run build`
2. Run `npx vitest run` to verify tests still pass
3. Commit all changes with a descriptive message
4. Update `BUILD_LOG.md`

---

## Critical Reminders
- **Never hardcode colours** — use CSS variables from the colour scheme
- **Never draw custom SVGs** — use Lucide React icons only
- **patient_id is TEXT** (e.g., "PAT-000001"), not UUID
- **bg-card for cards** (white), **bg-background for page** (warm white)
- **Use existing components** where possible (DataBadge, RiskBadge, StatusAlert, etc.)
- Follow existing code patterns — read before writing
- The app uses Tailwind v4, shadcn/ui, and the utility classes defined in `globals.css`
