/**
 * BestPath Pitch Deck — PPTX Generator
 * Run: npx tsx scripts/generate-pptx.ts
 * Output: docs/presentation/BestPath-Pitch.pptx
 */
import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();

// ──────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────

pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in (16:9)
pptx.author = "Capital Reasoning";
pptx.title = "BestPath — Proactive Care Intelligence";
pptx.subject = "BuildersVault.ai Healthcare & AI Hackathon — March 2026";

const C = {
  bg: "0F1B2D",
  teal: "0B8585",
  tealLight: "0FAFAF",
  white: "FAFAF8",
  gray: "E8E6E1",
  muted: "8B95A5",
  red: "C93B3B",
  yellow: "C27A15",
  green: "0B7A5E",
} as const;

const FONT = "Inter";

// ──────────────────────────────────────────────
// Master
// ──────────────────────────────────────────────

pptx.defineSlideMaster({
  title: "BESTPATH",
  background: { color: C.bg },
});

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function sectionLabel(s: PptxGenJS.Slide, text: string, y = 0.45) {
  s.addText(text.toUpperCase(), {
    x: 0.75, y, w: 5, h: 0.35,
    fontSize: 10, color: C.tealLight, fontFace: FONT,
    bold: true, charSpacing: 3,
  });
}

function heading(s: PptxGenJS.Slide, text: string | PptxGenJS.TextProps[], opts: Partial<PptxGenJS.TextPropsOptions> = {}) {
  const defaults: PptxGenJS.TextPropsOptions = {
    x: 0.75, y: 0.85, w: 11.8, h: 0.8,
    fontSize: 32, color: C.white, fontFace: FONT, bold: true,
    lineSpacingMultiple: 1.1,
  };
  slide_addText(s, text, { ...defaults, ...opts });
}

function slide_addText(s: PptxGenJS.Slide, text: string | PptxGenJS.TextProps[], opts: PptxGenJS.TextPropsOptions) {
  if (typeof text === "string") {
    s.addText(text, opts);
  } else {
    s.addText(text, opts);
  }
}

function addStatBlock(s: PptxGenJS.Slide, x: number, y: number, num: string, label: string, numColor: string) {
  s.addShape(pptx.ShapeType.rect, { x, y, w: 0.045, h: 1.2, fill: { color: C.teal } });
  s.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.06, y, w: 5.5, h: 1.2,
    fill: { color: C.teal, transparency: 94 }, rectRadius: 0.06,
  });
  s.addText(num, {
    x: x + 0.3, y: y + 0.02, w: 5, h: 0.65,
    fontSize: 36, color: numColor, fontFace: FONT, bold: true, valign: "bottom",
  });
  s.addText(label, {
    x: x + 0.3, y: y + 0.72, w: 5, h: 0.4,
    fontSize: 12, color: C.muted, fontFace: FONT, lineSpacingMultiple: 1.3,
  });
}

function addTechItem(s: PptxGenJS.Slide, x: number, y: number, title: string, body: string) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 5.7, h: 1.2,
    fill: { color: "FFFFFF", transparency: 97 },
    line: { color: "FFFFFF", transparency: 92, width: 1 },
    rectRadius: 0.08,
  });
  s.addText(title.toUpperCase(), {
    x: x + 0.2, y: y + 0.12, w: 5.3, h: 0.3,
    fontSize: 10, color: C.tealLight, fontFace: FONT, bold: true, charSpacing: 1,
  });
  s.addText(body, {
    x: x + 0.2, y: y + 0.45, w: 5.3, h: 0.7,
    fontSize: 12, color: C.gray, fontFace: FONT, lineSpacingMultiple: 1.35,
  });
}

function addFlowStep(s: PptxGenJS.Slide, x: number, y: number, title: string, sub: string, highlight = false) {
  s.addShape(pptx.ShapeType.roundRect, {
    x, y, w: 1.9, h: 1.3,
    fill: { color: C.teal, transparency: highlight ? 0 : 88 },
    line: { color: C.tealLight, transparency: highlight ? 0 : 70, width: 1 },
    rectRadius: 0.08,
    shadow: highlight ? { type: "outer", blur: 12, color: C.teal, opacity: 0.35, offset: 0, angle: 0 } : undefined,
  });
  s.addText(title, {
    x, y: y + 0.15, w: 1.9, h: 0.55,
    fontSize: 11, color: C.white, fontFace: FONT, bold: true,
    align: "center", valign: "bottom", lineSpacingMultiple: 1.2,
  });
  s.addText(sub, {
    x, y: y + 0.7, w: 1.9, h: 0.5,
    fontSize: 9, color: highlight ? "FFFFFF" : C.muted, fontFace: FONT,
    align: "center", valign: "top", lineSpacingMultiple: 1.2,
    transparency: highlight ? 20 : 0,
  });
}

function addArrow(s: PptxGenJS.Slide, x: number, y: number) {
  s.addText("→", {
    x, y, w: 0.4, h: 1.3,
    fontSize: 20, color: C.teal, fontFace: FONT, align: "center", valign: "middle",
  });
}

function accentLine(s: PptxGenJS.Slide, x: number, y: number, w = 0.8) {
  s.addShape(pptx.ShapeType.rect, {
    x, y, w, h: 0.035, fill: { color: C.teal },
  });
}

function routeExample(s: PptxGenJS.Slide, x: number, y: number, quote: string, routing: string) {
  s.addShape(pptx.ShapeType.rect, { x, y, w: 0.03, h: 0.65, fill: { color: C.teal } });
  s.addShape(pptx.ShapeType.roundRect, {
    x: x + 0.04, y, w: 5.2, h: 0.65,
    fill: { color: C.teal, transparency: 96 }, rectRadius: 0.05,
  });
  s.addText(quote, {
    x: x + 0.2, y: y + 0.02, w: 4.9, h: 0.35,
    fontSize: 12, color: C.white, fontFace: FONT, italic: true,
  });
  s.addText(routing, {
    x: x + 0.2, y: y + 0.38, w: 4.9, h: 0.25,
    fontSize: 9, color: C.muted, fontFace: FONT,
  });
}

// ──────────────────────────────────────────────
// SLIDE 1 — The Problem
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });

  // Header row
  s.addText("BUILDERSVAULT.AI HEALTHCARE & AI HACKATHON", {
    x: 0.75, y: 0.35, w: 7, h: 0.3,
    fontSize: 9, color: C.tealLight, fontFace: FONT, charSpacing: 2, bold: true,
  });
  s.addText("Capital Reasoning  ·  March 2026", {
    x: 8, y: 0.35, w: 4.5, h: 0.3,
    fontSize: 9, color: C.muted, fontFace: FONT, align: "right",
  });

  // Lead stat
  s.addText([
    { text: "4,620", options: { fontSize: 28, color: C.red, fontFace: FONT, bold: true } },
    { text: " British Columbians died on medical waitlists last year.", options: { fontSize: 28, color: C.white, fontFace: FONT, bold: true } },
  ], { x: 0.75, y: 0.85, w: 11.8, h: 0.7, lineSpacingMultiple: 1.2 });

  // Explanation
  s.addText([
    { text: "Not waiting for experimental treatment. Waiting for a screening, a follow-up, a referral — ", options: { fontSize: 20, color: C.white, fontFace: FONT, bold: true, lineSpacingMultiple: 1.4 } },
    { text: "routine actions", options: { fontSize: 20, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: " someone should have flagged months earlier.", options: { fontSize: 20, color: C.white, fontFace: FONT, bold: true, lineSpacingMultiple: 1.4 } },
  ], { x: 0.75, y: 1.65, w: 11.8, h: 0.9, lineSpacingMultiple: 1.3 });

  // The gap
  s.addText([
    { text: "The patient data exists. The clinical guidelines exist. What's missing is anything that ", options: { fontSize: 15, color: C.muted, fontFace: FONT } },
    { text: "connects the two", options: { fontSize: 15, color: C.white, fontFace: FONT, bold: true } },
    { text: " — and tells a clinician what to do, for whom, right now.", options: { fontSize: 15, color: C.muted, fontFace: FONT } },
  ], { x: 0.75, y: 2.7, w: 11.8, h: 0.5 });

  // Stats
  addStatBlock(s, 0.7, 3.5, "352K", "Waiting for a family doctor in BC", C.red);
  addStatBlock(s, 6.8, 3.5, "250+", "BC emergency rooms closed in 2025", C.red);
  addStatBlock(s, 0.7, 5.0, "6.5M", "Canadians with no family doctor at all", C.yellow);
  addStatBlock(s, 6.8, 5.0, "32.2 wks", "Specialist referral to treatment — eight months", C.yellow);

  s.addNotes(
    "[0:00 — 0:40] Open with the death stat. Let it land. Then explain WHY.\n" +
    "\"4,620 British Columbians died on medical waitlists last year. Not waiting for cutting-edge treatment. Waiting for a screening, a follow-up, a referral — routine clinical actions that someone should have flagged months earlier. But nobody did. The patient data was there. The guidelines were there. What's missing is anything that connects the two and tells a clinician: this patient needs this action, right now. [reveal stats] 352 thousand waiting for a family doctor. 250 ER closures last year. 6.5 million Canadians with nobody watching their preventive care at all. 32 weeks from specialist referral to treatment.\""
  );
}

// ──────────────────────────────────────────────
// SLIDE 2 — BestPath: Clinician View
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });
  sectionLabel(s, "Clinician View");

  s.addText([
    { text: "Best", options: { fontSize: 34, color: C.white, fontFace: FONT, bold: true } },
    { text: "Path", options: { fontSize: 34, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: "  for clinics", options: { fontSize: 20, color: C.muted, fontFace: FONT } },
  ], { x: 0.75, y: 0.85, w: 11.5, h: 0.7 });

  s.addText([
    { text: "For every patient in a panel: find the ", options: { fontSize: 18, color: C.white, fontFace: FONT, bold: true } },
    { text: "single highest-value clinical action", options: { fontSize: 18, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: " most likely to ", options: { fontSize: 18, color: C.white, fontFace: FONT, bold: true } },
    { text: "prevent an ER visit", options: { fontSize: 18, color: C.white, fontFace: FONT, bold: true, underline: { style: "heavy" } } },
    { text: ". Surface it with cited evidence. Let clinicians act.", options: { fontSize: 18, color: C.white, fontFace: FONT, bold: true } },
  ], { x: 0.75, y: 1.7, w: 11.5, h: 0.9, lineSpacingMultiple: 1.4 });

  // Triage
  const ty = 3.1, tw = 3.5, th = 1.4;
  for (const [i, { label, color, sub }] of [
    { label: "Red", color: C.red, sub: "Overdue + High Risk\nAct now" },
    { label: "Yellow", color: C.yellow, sub: "Overdue + Lower Risk\nAct soon" },
    { label: "Green", color: C.green, sub: "Up to date\nMonitor" },
  ].entries()) {
    const tx = 0.75 + i * (tw + 0.65);
    s.addShape(pptx.ShapeType.roundRect, {
      x: tx, y: ty, w: tw, h: th,
      fill: { color, transparency: 88 },
      line: { color, transparency: 65, width: 1 },
      rectRadius: 0.1,
      shadow: { type: "outer", blur: 10, color, opacity: 0.1, offset: 0, angle: 0 },
    });
    s.addText(label, {
      x: tx, y: ty + 0.15, w: tw, h: 0.45,
      fontSize: 20, color, fontFace: FONT, bold: true, align: "center",
    });
    s.addText(sub, {
      x: tx, y: ty + 0.6, w: tw, h: 0.6,
      fontSize: 12, color: C.muted, fontFace: FONT, align: "center", lineSpacingMultiple: 1.3,
    });
  }

  s.addText("An AI agent that renders real interactive UI — tables, charts, patient cards — not walls of text.", {
    x: 0.75, y: 5.0, w: 11.5, h: 0.4,
    fontSize: 13, color: C.gray, fontFace: FONT,
  });

  s.addNotes(
    "[0:40 — 1:00] Product reveal — clinician side.\n" +
    "\"This is BestPath. For every patient in a clinic's panel, it finds the single highest-value action — the screening, medication, referral most likely to prevent an ER visit — and surfaces it with cited evidence. Red: overdue and high risk, act now. Yellow: overdue, lower risk. Green: up to date. And the AI agent doesn't just give you text — it renders real interactive UI. Tables, charts, patient cards. Ask it anything about your panel.\""
  );
}

// ──────────────────────────────────────────────
// SLIDE 3 — BestPath: Patient View
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });
  sectionLabel(s, "Patient View");

  s.addText([
    { text: "Best", options: { fontSize: 34, color: C.white, fontFace: FONT, bold: true } },
    { text: "Path", options: { fontSize: 34, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: "  for the 6.5M without a doctor", options: { fontSize: 20, color: C.muted, fontFace: FONT } },
  ], { x: 0.75, y: 0.85, w: 11.5, h: 0.7 });

  // Left column
  accentLine(s, 0.75, 1.75);
  s.addText(
    "Enter your health info conversationally — age, conditions, meds, concerns, family history. As much or as little as you have.\n\n" +
    "Same engine underneath: risk profiling, evidence retrieval, guideline matching. You get cited next-step guidance — what you need, when, and who can actually help.",
    {
      x: 0.75, y: 1.95, w: 5.5, h: 2.6,
      fontSize: 13, color: C.gray, fontFace: FONT, lineSpacingMultiple: 1.5,
    }
  );

  // Right column — routing examples
  accentLine(s, 6.8, 1.75);
  s.addText("Not \"see a doctor.\" Specific routing:", {
    x: 6.8, y: 1.95, w: 5.5, h: 0.35,
    fontSize: 13, color: C.white, fontFace: FONT, bold: true,
  });

  routeExample(s, 6.8, 2.5, "\"A pharmacist can monitor your blood pressure.\"", "→ Pharmacy · No referral needed");
  routeExample(s, 6.8, 3.3, "\"A dietitian can help with diabetes management.\"", "→ Allied health · Shorter wait");
  routeExample(s, 6.8, 4.1, "\"You need a walk-in clinic to get this referral started.\"", "→ Walk-in · Available today");

  s.addText([
    { text: "Routes to the ", options: { fontSize: 12, color: C.muted, fontFace: FONT } },
    { text: "right level of care", options: { fontSize: 12, color: C.white, fontFace: FONT, bold: true } },
    { text: ", not the default specialist queue. Patients get faster help. The system gets less load. ", options: { fontSize: 12, color: C.muted, fontFace: FONT } },
    { text: "Everyone wins.", options: { fontSize: 12, color: C.tealLight, fontFace: FONT, bold: true } },
  ], { x: 0.75, y: 5.2, w: 11.5, h: 0.4 });

  s.addNotes(
    "[1:00 — 1:25] The other half of the product.\n" +
    "\"Now, the other side. 6.5 million Canadians don't have a family doctor. Nobody is watching their preventive care. BestPath gives them a self-service care navigator. Enter your health info conversationally — whatever you have. Same engine underneath. But it doesn't just say 'see a doctor.' It routes you to the right level of care. A pharmacist can monitor your blood pressure. A dietitian can help with diabetes management. You need a walk-in for this referral. Smarter routing, faster help, less system load. Everyone wins.\""
  );
}

// ──────────────────────────────────────────────
// SLIDE 4 — How It Works (Engine)
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });
  sectionLabel(s, "The Engine");
  heading(s, "AI suggests. Math decides.");

  const flowY = 2.0;
  addFlowStep(s, 0.55, flowY, "Patient\nData", "Demographics, labs,\nmeds, encounters");
  addArrow(s, 2.5, flowY);
  addFlowStep(s, 2.95, flowY, "Risk Confluence\nVector (RCV)", "What could\ngo wrong?");
  addArrow(s, 4.9, flowY);
  addFlowStep(s, 5.35, flowY, "Evidence\nRetrieval", "BC clinical\nguidelines via RAG");
  addArrow(s, 7.3, flowY);
  addFlowStep(s, 7.75, flowY, "AI\nStructuring", "Claude connects\npatient → guidelines");
  addArrow(s, 9.7, flowY);
  addFlowStep(s, 10.15, flowY, "Deterministic\nComparator", "Pure math.\nNo hallucination.", true);

  // Quote block
  s.addShape(pptx.ShapeType.rect, { x: 0.75, y: 4.0, w: 0.04, h: 1.5, fill: { color: C.teal } });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.82, y: 4.0, w: 5.5, h: 1.5,
    fill: { color: C.teal, transparency: 94 }, rectRadius: 0.06,
  });
  s.addText([
    { text: "Guidelines say what's needed.\n", options: { fontSize: 14, color: C.white, fontFace: FONT, italic: true, lineSpacingMultiple: 1.5 } },
    { text: "Patient data shows what's been done.\n", options: { fontSize: 14, color: C.white, fontFace: FONT, italic: true, lineSpacingMultiple: 1.5 } },
    { text: "Arithmetic determines urgency.", options: { fontSize: 14, color: C.white, fontFace: FONT, bold: true, italic: true, lineSpacingMultiple: 1.5 } },
  ], { x: 1.05, y: 4.1, w: 5.1, h: 1.1 });
  s.addText("No AI on the critical decision path.", {
    x: 1.05, y: 5.15, w: 5.1, h: 0.3,
    fontSize: 10, color: C.muted, fontFace: FONT,
  });

  s.addText([
    { text: "Every recommendation ", options: { fontSize: 13, color: C.gray, fontFace: FONT } },
    { text: "cited", options: { fontSize: 13, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: ". Every overdue status ", options: { fontSize: 13, color: C.gray, fontFace: FONT } },
    { text: "calculated", options: { fontSize: 13, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: ", not predicted.", options: { fontSize: 13, color: C.gray, fontFace: FONT } },
  ], { x: 6.8, y: 4.1, w: 5.5, h: 0.5, lineSpacingMultiple: 1.4 });

  s.addText([
    { text: "Our AI doesn't replace doctors. It replaces the sticky note that says ", options: { fontSize: 13, color: C.gray, fontFace: FONT } },
    { text: "\"CHECK MRS. CHEN'S LABS???\"", options: { fontSize: 13, color: C.tealLight, fontFace: FONT, bold: true } },
  ], { x: 6.8, y: 4.7, w: 5.5, h: 0.5, lineSpacingMultiple: 1.3 });

  s.addNotes(
    "[1:25 — 1:55] Walk through the pipeline. Emphasize the deterministic comparator.\n" +
    "\"Here's the engine. Patient data goes in. We build a Risk Confluence Vector: everything that says this patient might be heading for an emergency. That queries our knowledge base — BC clinical guidelines, screening protocols — via RAG. Claude reads the patient data alongside the guidelines and structures the output. But here's the key: the actual decision — is this patient overdue? how urgent? — that's pure arithmetic. No AI on the critical path. [beat] Our AI doesn't replace doctors. It replaces the sticky note that says 'check Mrs. Chen's labs, question mark question mark question mark.'\""
  );
}

// ──────────────────────────────────────────────
// SLIDE 5 — Live Demo
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });
  sectionLabel(s, "Live Demo", 2.5);
  s.addText("Let's see it work.", {
    x: 0.5, y: 3.0, w: 12.3, h: 1.0,
    fontSize: 42, color: C.white, fontFace: FONT, bold: true, align: "center",
  });
  s.addText("Dashboard  →  Patient drill-down  →  Agent query  →  Patient navigator", {
    x: 0.5, y: 4.2, w: 12.3, h: 0.5,
    fontSize: 16, color: C.muted, fontFace: FONT, align: "center",
  });
  s.addNotes(
    "[1:55 — 2:50] THIS IS THE DEMO. 4 beats:\n" +
    "1. Dashboard — red/yellow/green triage across the panel. \"2,000 patients, triaged automatically.\"\n" +
    "2. Drill into a red patient — RCV breakdown, overdue actions, cited evidence.\n" +
    "3. Agent query — \"Who needs an HbA1c recheck?\" — live table with citations.\n" +
    "4. Patient view — enter basic health info, show routing recommendation.\n" +
    "If live demo fails, screenshots. Never debug on stage."
  );
}

// ──────────────────────────────────────────────
// SLIDE 6 — Business Viability
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });
  sectionLabel(s, "Why This Works");
  heading(s, "This isn't a prototype.");

  addTechItem(s, 0.7, 1.9, "Real Data, Real Logic",
    "Tested against 2,000 Synthea patients. Same engine works against any EHR feed via FHIR.");
  addTechItem(s, 6.8, 1.9, "Clinician Trust by Design",
    "Every recommendation cited against source guidelines. Every overdue status calculated, not predicted. Missing data flagged, never hidden.");
  addTechItem(s, 0.7, 3.4, "Both Sides of the Problem",
    "Clinicians get a proactive action queue. Unattached patients get cited next-step guidance and provider routing.");
  addTechItem(s, 6.8, 3.4, "Zero Adoption Friction",
    "Red/yellow/green mirrors how clinicians already think. AI generates interactive charts and tables — not walls of text. No behaviour change.");

  s.addText([
    { text: "Existing tools are dashboards ", options: { fontSize: 14, color: C.muted, fontFace: FONT } },
    { text: "or", options: { fontSize: 14, color: C.white, fontFace: FONT, bold: true } },
    { text: " chatbots. Never both. BestPath combines ", options: { fontSize: 14, color: C.muted, fontFace: FONT } },
    { text: "proactive risk triage", options: { fontSize: 14, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: " with ", options: { fontSize: 14, color: C.muted, fontFace: FONT } },
    { text: "generative clinical UI", options: { fontSize: 14, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: ". BC is investing ", options: { fontSize: 14, color: C.muted, fontFace: FONT } },
    { text: "$2.8B", options: { fontSize: 14, color: C.white, fontFace: FONT, bold: true } },
    { text: " in healthcare over three years — this is where it should go.", options: { fontSize: 14, color: C.muted, fontFace: FONT } },
  ], { x: 0.75, y: 5.1, w: 11.5, h: 0.7, lineSpacingMultiple: 1.3 });

  s.addNotes(
    "[2:50 — 3:10] Quick hits. Let the grid do the work.\n" +
    "\"This isn't a prototype. Real data, same engine works against any EHR via FHIR. Every recommendation cited, every status calculated. The UX mirrors how clinicians already think. Existing tools are dashboards or chatbots — never both. BestPath combines proactive risk triage with generative clinical UI. BC is investing 2.8 billion in healthcare. This is where it should go.\""
  );
}

// ──────────────────────────────────────────────
// SLIDE 7 — Close
// ──────────────────────────────────────────────
{
  const s = pptx.addSlide({ masterName: "BESTPATH" });

  s.addText([
    { text: "Best", options: { fontSize: 60, color: C.white, fontFace: FONT, bold: true } },
    { text: "Path", options: { fontSize: 60, color: C.tealLight, fontFace: FONT, bold: true } },
  ], { x: 0.5, y: 1.5, w: 12.3, h: 1.1, align: "center" });

  s.addShape(pptx.ShapeType.rect, { x: 5.7, y: 2.75, w: 1.9, h: 0.04, fill: { color: C.teal } });

  s.addText("4,620 people died on BC waitlists last year.", {
    x: 0.5, y: 3.2, w: 12.3, h: 0.5,
    fontSize: 18, color: C.muted, fontFace: FONT, align: "center",
  });

  s.addText([
    { text: "BestPath makes sure the next one gets flagged\n", options: { fontSize: 24, color: C.white, fontFace: FONT, bold: true, lineSpacingMultiple: 1.4 } },
    { text: "before", options: { fontSize: 24, color: C.tealLight, fontFace: FONT, bold: true } },
    { text: " it's too late.", options: { fontSize: 24, color: C.white, fontFace: FONT, bold: true } },
  ], { x: 0.5, y: 3.8, w: 12.3, h: 1.2, align: "center" });

  s.addShape(pptx.ShapeType.rect, { x: 4.0, y: 5.5, w: 5.3, h: 0.02, fill: { color: C.teal, transparency: 70 } });

  s.addText([
    { text: "Capital Reasoning", options: { fontSize: 13, color: C.white, fontFace: FONT, bold: true } },
    { text: "\nClinical AI Track  ·  BuildersVault.ai  ·  March 2026", options: { fontSize: 11, color: C.muted, fontFace: FONT } },
  ], { x: 0.5, y: 5.7, w: 12.3, h: 0.7, align: "center" });

  s.addNotes(
    "[3:10 — 3:25] Land the close. Eye contact.\n" +
    "\"Four thousand six hundred and twenty people died on BC waitlists last year. BestPath makes sure the next one gets flagged before it's too late. We're Capital Reasoning. Thank you.\"\n" +
    "[Stop talking. Let the silence land.]"
  );
}

// ──────────────────────────────────────────────
// Write
// ──────────────────────────────────────────────
const outPath = "docs/presentation/BestPath-Pitch.pptx";
pptx.writeFile({ fileName: outPath }).then(() => {
  console.log(`✓ Written to ${outPath}`);
}).catch((err: Error) => {
  console.error("Failed:", err);
  process.exit(1);
});
