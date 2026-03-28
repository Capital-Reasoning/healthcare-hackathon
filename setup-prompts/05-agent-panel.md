# Phase 05 — Agent Panel & OpenUI Integration

## Context
Phases 01-04 are complete. The app has a full component library (layout, navigation, forms, feedback, data display, charts, healthcare components), a populated dashboard, and OpenUI `defineComponent()` definitions prepared for all agent-renderable components.

Read `CLAUDE.md` for conventions. Read `docs/stack-decisions.md` for technical decisions.

This is the **differentiator phase**. The agent panel with generative UI is what sets this product apart from every other hackathon entry. It needs to feel magical — fast, beautiful, and seamlessly integrated into the standard data interface.

**Senior-dev mode:** The streaming UX must be buttery smooth. The glass aesthetics must be refined. The responsive behavior must feel intentional, not broken. If anything feels janky, fix it before moving on. Ask me about any UX decisions you're unsure about.**

## Objective
Build the collapsible agent side panel, integrate the Vercel AI SDK with Claude for streaming chat, set up the OpenUI library and renderer for generative UI, implement conversation persistence in Supabase, and create all agent-specific UI components.

## Step-by-Step Instructions

### 1. Agent Panel Layout

**`src/components/agent/AgentPanel.tsx`** — The main panel container.

**Desktop (≥1024px):**
- Fixed to the right side of the viewport
- Width: ~380-420px (roughly 1/3 on standard screens)
- Full height minus navbar
- When open: main content area shrinks to accommodate (CSS grid or flexbox)
- When closed: collapses to a thin strip (~48px) with a floating "Ask AI" button or icon
- Smooth slide-in-right animation on open/close
- Glass aesthetic: frosted glass background, subtle gradient top border, gentle glow

**Tablet (<1024px, ≥640px):**
- Same behavior as desktop — pushes main content
- Main content area goes to phone-width layout when panel is open
- This is intentional: users get the mobile-optimized data view + full AI panel side-by-side

**Mobile (<640px):**
- Bottom sheet behavior:
  - **Collapsed:** 60px peek strip at bottom of screen. Shows "Ask AI" with a subtle gradient top border. Tapping or swiping up opens it.
  - **Expanded:** Full screen overlay with a close/minimize button at top. Slide-in-up animation.
  - **Intermediate peek (optional):** ~40% of screen height, shows recent messages. Can swipe up to full or down to collapse.
- Use CSS transforms and touch events for smooth gesture-based transitions

**Panel structure:**
```
┌─────────────────────┐
│ Panel Header        │  ← Title ("AI Assistant"), conversation selector, collapse/close button
├─────────────────────┤
│                     │
│   Message Thread    │  ← Scrollable area with chat bubbles, generated UI, citations
│                     │
│                     │
├─────────────────────┤
│ Input Area          │  ← Text input, send button, suggestion chips
└─────────────────────┘
```

**Panel Header:**
- Left: "AI Assistant" label (or active conversation title)
- Center/dropdown: conversation selector (shows recent conversations, "New conversation" button)
- Right: collapse button (on desktop), close button (on mobile)
- Subtle glass border at bottom of header

**Input Area:**
- Text input (auto-growing textarea, max 4 lines before scroll)
- Send button (primary teal, disabled when empty)
- Suggestion chips above input: contextual quick-actions like "Summarize this data", "Show risk analysis", "Compare trends"
- The suggestion chips should change based on the current page context
- Keyboard shortcut: Enter to send, Shift+Enter for newline

### 2. Chat Components (`src/components/agent/`)

**`ChatBubble`** — A single message in the thread.
- **User messages:** Right-aligned, subtle background, standard text
- **Agent messages:** Left-aligned, white/glass background, supports rich content (markdown + OpenUI components)
- **Timestamp** below each message (small, muted)
- **Copy button** on hover (copies message text)
- Smooth fade-in-up animation on appear

**`StreamingText`** — Renders streaming text from the agent.
- Typewriter effect for text tokens
- Smooth cursor animation
- When complete, cursor disappears and text settles
- Handles mixed content: regular markdown text interspersed with OpenUI component blocks

**`ThinkingIndicator`** — Shows when the agent is processing/using tools.
- Three-dot pulse animation (subtle, using our pulse-subtle animation)
- Can show tool usage: "Searching patient records...", "Analyzing data...", "Generating visualization..."
- Glass background, slightly inset
- Disappears smoothly when response starts streaming

**`CitationPill`** — Inline citation reference.
- Small, clickable pill that shows source reference: "[Doc: Clinical Guidelines, p.42]"
- On click: opens a popover with the source text excerpt
- Color: primary tint background

**`GeneratedCard`** — Wrapper for agent-generated UI components.
- Subtle glass border to distinguish AI-generated content from static UI
- Optional "Generated by AI" micro-label
- Fade-in animation when appearing in the stream
- The card itself is transparent — it just wraps whatever OpenUI component is rendered inside

**`AgentRenderer`** — The OpenUI renderer component.
- This is where OpenUI Lang gets parsed and rendered into our Svelte components
- Uses `@openuidev/react-lang`'s `<Renderer>` component (or equivalent)
- Maps our library of `defineComponent()` definitions
- Handles streaming: as new OpenUI Lang lines arrive, new components appear progressively
- Falls back to rendering raw text if parsing fails

### 3. OpenUI Library Setup

**`src/lib/openui/library.ts`** — Create the master library.

```typescript
import { createLibrary } from '@openuidev/react-lang';
// Import all component definitions from Phase 04
import { StatCardOpenUI, ... } from './components';

export const healthcareLibrary = createLibrary({
  root: 'Stack', // or whatever the default container component is
  components: [
    // Layout
    StackOpenUI,
    GridOpenUI,
    CardOpenUI,
    DividerOpenUI,
    // Data Display
    StatCardOpenUI,
    DataTableOpenUI,
    BadgeOpenUI,
    KeyValueOpenUI,
    ListOpenUI,
    // Charts
    BarChartOpenUI,
    LineChartOpenUI,
    DonutChartOpenUI,
    SparkLineOpenUI,
    AreaChartOpenUI,
    HeatMapOpenUI,
    ScatterPlotOpenUI,
    RadarChartOpenUI,
    GaugeChartOpenUI,
    // Healthcare
    PatientCardOpenUI,
    RiskBadgeOpenUI,
    TimelineOpenUI,
    VitalSignOpenUI,
    MedicationCardOpenUI,
    // Feedback
    AlertOpenUI,
    // Data Display
    ImageCardOpenUI,
    ComparisonTableOpenUI,
  ],
  componentGroups: [
    {
      name: 'Layout',
      components: ['Stack', 'Grid', 'Card', 'Divider'],
      notes: ['Use Stack for vertical layouts, Grid for multi-column layouts'],
    },
    {
      name: 'Data Visualization',
      components: ['BarChart', 'LineChart', 'DonutChart', 'AreaChart', 'SparkLine', 'HeatMap', 'ScatterPlot', 'RadarChart', 'GaugeChart'],
      notes: [
        'Always provide clear axis labels and a title',
        'Use the primary color palette for single-series charts',
        'Use the multi-series palette for comparing categories',
      ],
    },
    {
      name: 'Healthcare',
      components: ['PatientCard', 'RiskBadge', 'Timeline', 'VitalSign', 'MedicationCard'],
      notes: ['Always use appropriate risk levels', 'Show units for vital signs'],
    },
    {
      name: 'Data Display',
      components: ['StatCard', 'DataTable', 'Badge', 'KeyValue', 'List', 'ImageCard', 'ComparisonTable', 'Alert'],
    },
  ],
});
```

If OpenUI packages are not available or have different APIs, create an equivalent system:
- A registry of components with their Zod schemas
- A system prompt generator that describes available components
- A parser that extracts component blocks from Claude's output (JSON or custom format)
- A renderer that maps component names to React components

### 4. System Prompt Construction

**`src/lib/ai/system-prompt.ts`** — Build the agent's system prompt.

The system prompt should include:
1. **Role:** "You are Rithm AI, an intelligent healthcare data assistant. You help users explore, analyze, and visualize healthcare data."
2. **Capabilities:** List what the agent can do (query data, generate visualizations, analyze trends, etc.)
3. **Component library:** Auto-generated from `healthcareLibrary.prompt()` — tells Claude which UI components are available and how to use them
4. **Data context:** Injected per-request — describes what data is available, the current page context
5. **Behavior rules:**
   - Always cite sources when referencing document data
   - Use UI components to display data, not just text
   - For tabular data, use DataTable. For trends, use LineChart. For distributions, use DonutChart or BarChart.
   - Keep text responses concise — let the UI do the heavy lifting
   - When suggesting database writes, always flag them for human approval (don't present as done)
   - Be proactive: if a user asks about patients, also offer to visualize the relevant data

### 5. Vercel AI SDK Integration

**`src/app/api/chat/route.ts`** — The agent's streaming API endpoint.

Use the Vercel AI SDK to create a streaming chat endpoint:
```typescript
import { streamText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/ai/system-prompt';
import { agentTools } from '@/lib/ai/tools';

export async function POST(request: Request) {
  const { messages, pageContext } = await request.json();

  const systemPrompt = buildSystemPrompt({ pageContext });

  const result = streamText({
    model: anthropic('claude-sonnet-4-6-20250514', {
      // Extended thinking with medium budget
    }),
    system: systemPrompt,
    messages,
    tools: agentTools,
    maxSteps: 10, // Allow multiple tool calls per turn
  });

  return result.toDataStreamResponse();
}
```

**Note on extended thinking:** Check if the Vercel AI SDK supports Claude's extended thinking feature. If so, enable it with medium budget. If not, use standard mode — we can add it later.

**`src/lib/ai/tools.ts`** — Define agent tools.

Create tool definitions for the agent. Start with these foundational tools:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

export const agentTools = {
  queryPatients: tool({
    description: 'Search and filter patient records from the database',
    parameters: z.object({
      query: z.string().optional().describe('Search term for patient name or ID'),
      riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      condition: z.string().optional(),
      ageRange: z.object({ min: z.number(), max: z.number() }).optional(),
      limit: z.number().default(20),
      offset: z.number().default(0),
    }),
    execute: async (args) => {
      // Will call our REST API internally
      // For now, return mock data
      return { patients: [], total: 0 };
    },
  }),

  getPatientDetail: tool({
    description: 'Get detailed information about a specific patient',
    parameters: z.object({
      patientId: z.string(),
    }),
    execute: async (args) => {
      return { patient: null };
    },
  }),

  searchDocuments: tool({
    description: 'Search through uploaded healthcare documents using semantic search',
    parameters: z.object({
      query: z.string().describe('The search query'),
      topK: z.number().default(5),
    }),
    execute: async (args) => {
      return { results: [], total: 0 };
    },
  }),

  keywordSearch: tool({
    description: 'Search documents using exact keyword matching (for codes, IDs, specific terms)',
    parameters: z.object({
      terms: z.string().describe('Keywords to search for'),
      limit: z.number().default(10),
    }),
    execute: async (args) => {
      return { results: [], total: 0 };
    },
  }),

  getMetrics: tool({
    description: 'Retrieve dashboard metrics and aggregate statistics',
    parameters: z.object({
      metricType: z.enum(['patients', 'encounters', 'wait_times', 'risk_distribution', 'admissions']),
      period: z.enum(['day', 'week', 'month', 'quarter', 'year']).default('month'),
    }),
    execute: async (args) => {
      return { metrics: {} };
    },
  }),

  // Add more tools as needed
};
```

### 6. Chat Interface Integration

**Update the agent panel to use the Vercel AI SDK's `useChat` hook:**

```typescript
import { useChat } from '@ai-sdk/react';

const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
  api: '/api/chat',
  body: { pageContext: currentPageContext },
});
```

Wire up:
- Messages render as ChatBubble components
- Streaming text renders via StreamingText component
- Tool calls show ThinkingIndicator with tool name
- OpenUI components in responses render via AgentRenderer
- Error states show as Alert components in the thread
- "Stop generating" button when streaming
- Auto-scroll to bottom on new messages

### 7. Conversation Persistence

**Supabase tables** (create via Drizzle migration or direct SQL):

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT DEFAULT 'New conversation',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
```

**Conversation management in the panel:**
- Dropdown in panel header shows recent conversations
- "New conversation" button starts fresh
- Delete conversation (with confirmation)
- Clear all history option
- Auto-title: after the first user message, use Claude to generate a short title (or just use the first ~50 chars of the first message)
- Conversations load from Supabase on panel open
- Messages persist to Supabase after each exchange

### 8. Panel State Management

**Update `src/stores/agent-store.ts`:**
- Track panel open/closed state
- Current conversation ID
- Panel width (for potential resizing)
- Mobile sheet state (collapsed/peek/expanded)
- Persist open/closed preference in localStorage

**Update `src/stores/conversation-store.ts`:**
- Conversations list (loaded from Supabase)
- Active conversation messages
- isStreaming state
- CRUD operations that sync with Supabase

### 9. Responsive Integration in Main Layout

**Update `src/app/(main)/layout.tsx`:**

The main layout should handle the agent panel state:

```tsx
export default function MainLayout({ children }) {
  const { isOpen } = useAgentStore();

  return (
    <div className="min-h-screen bg-bg-page">
      <Navbar />
      <div className="flex pt-16"> {/* pt for navbar height */}
        <main className={cn(
          'flex-1 transition-all duration-300',
          isOpen && 'lg:mr-100' // Push content when panel is open on desktop
        )}>
          {children}
        </main>
        <AgentPanel />
      </div>
    </div>
  );
}
```

**Keyboard shortcut:** `Cmd/Ctrl + .` toggles the agent panel. Wire this up globally.

### 10. Glass Styling Polish

Apply the frosted glass aesthetic to the agent panel:
- Panel background: `glass-strong` utility (or equivalent)
- Gradient top border: subtle teal-to-transparent gradient along the top edge
- Panel header: slightly more opaque glass
- Input area: solid white/bg-card (needs to be clearly readable for typing)
- Message bubbles: slight glass effect on agent messages
- Suggestion chips: glass-subtle with teal tint

The contrast between the clean, solid data interface (left) and the frosted glass agent panel (right) should be visible but not jarring. The glass panel should feel like it's floating over the data.

### 11. Suggestion Chips

Create contextual suggestion chips that appear above the input:
- On the dashboard: "Summarize patient metrics", "Show risk distribution", "Compare to last month"
- On patients page: "Find high-risk patients", "Show readmission trends", "Analyze demographics"
- On research page: "Search recent studies", "Summarize findings", "Find related papers"

Store suggestion configs per page route. They should update when the user navigates.

### 12. Verify

1. Agent panel opens/closes smoothly with animation
2. Chat input works — can type and send messages
3. If Claude API key is configured, agent responds with streaming text
4. Agent responses can include OpenUI-rendered components (even if just as proof of concept)
5. Conversations persist across page navigations
6. Conversation history loads from Supabase (or localStorage as fallback)
7. Mobile bottom sheet behavior works on narrow viewport
8. Glass aesthetic looks good — not too transparent, not too opaque
9. Keyboard shortcuts work (⌘. to toggle, Enter to send)
10. No layout jank when panel opens/closes (smooth transition)

**Show me the agent panel at different viewport sizes. If the streaming/generative UI isn't fully working yet, that's OK — flag what's not connecting and we'll address it. The panel layout, glass aesthetic, and chat UX are the priority.**

## Success Criteria
- [ ] Agent panel opens/closes with smooth animation
- [ ] Panel pushes main content on desktop/tablet
- [ ] Mobile bottom sheet works
- [ ] Chat interface sends and receives messages
- [ ] Streaming text renders progressively
- [ ] ThinkingIndicator shows during tool calls
- [ ] OpenUI library is configured with all components
- [ ] Conversations persist in Supabase
- [ ] Conversation management UI (new, delete, history)
- [ ] Glass aesthetic is polished
- [ ] Suggestion chips show context-appropriate options
- [ ] ⌘. keyboard shortcut toggles panel
- [ ] ⌘K command palette still works alongside
