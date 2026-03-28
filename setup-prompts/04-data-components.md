# Phase 04 — Data Components (Tables, Charts, Stats, Healthcare)

## Context
Phases 01-03 are complete. The app has a working design system, layout components, navigation, forms, and feedback components. The dashboard page shows a shell that matches the screenshot layout. shadcn/ui is customized to our palette.

Read `CLAUDE.md` for project conventions. Read `docs/stack-decisions.md` for technical decisions.

**Senior-dev mode:** Data components are the heart of this application. They need to handle real data gracefully — empty states, loading states, error states, pagination, sorting, filtering. They need to be performant with large datasets. And they need to be beautiful. Don't cut corners here.

**If you're unsure about API surface, data formatting, or visual design for any component — ask me.**

## Objective
Build all data visualization components: DataTable (the big one), stat cards, charts (Recharts), healthcare-specific components, and all the "should-have" components. Each component that the agent should be able to render must also have an OpenUI `defineComponent()` wrapper prepared (just the definition — we'll integrate OpenUI fully in Phase 05).

## Step-by-Step Instructions

### 1. DataTable (`src/components/data-display/DataTable.tsx`)

This is the most important data component. Build it on `@tanstack/react-table` with our design system.

**Features:**
- Column definitions with TypeScript generics: `DataTable<T>`
- Sortable columns (click header to toggle asc/desc/none) — sort icon in header
- Filterable (per-column filters + global search)
- Paginated (page navigation at bottom, page size selector: 10/20/50/100)
- Selectable rows (checkbox column, select all, selected count display)
- Expandable rows (optional — for showing detail inline)
- Loading state (renders Skeleton rows)
- Empty state (renders EmptyState component)
- Dense variant (smaller row height for data-heavy views)
- Striped variant (alternating row backgrounds)
- Responsive: on small screens, consider horizontal scroll or card-based layout

**Column features:**
- Text alignment (left/center/right)
- Custom cell renderers
- Sortable toggle per column
- Min/max width
- Sticky first column option

**Visual style matching the screenshot:**
- Teal underline below tab headers
- Clean white background
- Subtle border between rows (#E6E4DF)
- Hover highlight on rows
- Selected row highlight (primary tint #E8F6F6)

**Props interface (approximate):**
```typescript
interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
  emptyState?: { title: string; description: string };
  pagination?: { page: number; pageSize: number; total: number; onPageChange: (page: number) => void; onPageSizeChange: (size: number) => void };
  onSort?: (field: string, direction: 'asc' | 'desc' | null) => void;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  variant?: 'default' | 'dense' | 'striped';
  className?: string;
}
```

### 2. Stat Cards (`src/components/data-display/StatCard.tsx`)

Matches the "At a Glance" cards from the screenshot.

**Props:**
```typescript
interface StatCardProps {
  label: string;           // "TOTAL PATIENTS" (rendered as overline/caption)
  value: string | number;  // "2,847" (large display number)
  icon?: React.ReactNode;  // Top-right icon
  trend?: {
    value: string;         // "12.3%"
    direction: 'up' | 'down' | 'flat';
    label: string;         // "vs prev. period"
    sentiment?: 'positive' | 'negative' | 'neutral'; // green/red/gray for the trend
  };
  variant?: 'default' | 'glass';
  onClick?: () => void;
}
```

- Large number uses the display typography
- Label is caption/overline style (uppercase, small, muted)
- Trend arrow icon (up/down) colored by sentiment
- Subtle horizontal divider between value and trend
- Icon rendered in top-right corner with muted styling

### 3. Badge/Pill (`src/components/data-display/Badge.tsx`)

Extend shadcn Badge with more variants:
- `default`, `primary`, `secondary`, `success`, `warning`, `error`, `outline`
- Size: `sm`, `default`, `lg`
- Dot indicator option (small colored dot before text)
- Dismissible option (X button)
- Matching the screenshot's style

### 4. KeyValue (`src/components/data-display/KeyValue.tsx`)

For displaying labeled data points:

**Props:**
```typescript
interface KeyValueProps {
  items: { label: string; value: React.ReactNode }[];
  layout?: 'horizontal' | 'vertical' | 'grid';
  columns?: 1 | 2 | 3 | 4;
}
```

### 5. List (`src/components/data-display/List.tsx`)

A styled list component:

**Props:**
```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  dividers?: boolean;
}
```

### 6. Charts (`src/components/charts/`)

All charts built with **Recharts**. Create wrapper components that apply our theme consistently.

First, create a shared chart config file (`src/components/charts/chart-config.ts`):
- Default colour palette (primary teal + complementary colours for multi-series)
- Consistent margins, padding
- Shared tooltip style (white card, shadow, our fonts)
- Shared axis style (muted text color, subtle grid lines)
- Responsive container wrapper
- Animation config (smooth easeOut, ~400ms)

**`BarChart`** (`src/components/charts/BarChart.tsx`):
- Props: `data`, `xKey`, `yKeys` (supports multi-series), `layout?: 'vertical' | 'horizontal'`, `stacked?: boolean`
- Rounded bar corners
- Hover highlight with tooltip
- Legend when multi-series

**`LineChart`** (`src/components/charts/LineChart.tsx`):
- Props: `data`, `xKey`, `yKeys`, `curved?: boolean`, `area?: boolean` (fill area under line)
- Smooth curves by default
- Dot markers on hover only
- Gradient area fill option

**`DonutChart`** (`src/components/charts/DonutChart.tsx`):
- Props: `data: { name: string; value: number; color?: string }[]`, `innerRadius?`, `label?`
- Center label (e.g., total value)
- Hover highlight segment with tooltip
- Legend below or beside

**`SparkLine`** (`src/components/charts/SparkLine.tsx`):
- Props: `data: number[]`, `color?`, `height?: number`, `showDot?: boolean`
- Minimal chart for inline use (inside stat cards, table cells)
- No axes, no labels — just the line
- Optional dot at the last data point

**`AreaChart`** (`src/components/charts/AreaChart.tsx`):
- Props: similar to LineChart but always filled
- Gradient fill from solid to transparent
- Supports stacked areas

**Should-have charts:**

**`HeatMap`** — Grid of colored cells.
- Props: `data`, `xLabels`, `yLabels`, `colorScale`
- Useful for showing patterns over time/categories

**`ScatterPlot`** — XY scatter with optional bubble sizing.
- Props: `data`, `xKey`, `yKey`, `sizeKey?`, `colorKey?`

**`RadarChart`** — Multi-axis radar/spider chart.
- Props: `data`, `axes: string[]`
- Good for comparing patient metrics across dimensions

**`GaugeChart`** — Semicircular gauge.
- Props: `value`, `min`, `max`, `thresholds?: { value: number; color: string }[]`, `label?`
- Good for risk scores, utilization percentages

**`TreeMap`** — Hierarchical area chart.
- Props: `data: { name: string; value: number; children?: ... }[]`
- Good for showing proportional breakdowns

### 7. Healthcare-Specific Components (`src/components/healthcare/`)

**`PatientCard`** — Summary card for a patient.
```typescript
interface PatientCardProps {
  name: string;
  id: string;  // MRN or patient ID
  age: number;
  gender: string;
  condition?: string;  // Primary diagnosis
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  lastVisit?: Date;
  avatar?: string;
  onClick?: () => void;
}
```
- Avatar (initials or image), name, ID, demographics
- Risk badge in corner
- Quick-glance info layout
- Interactive (hover effect, clickable)

**`RiskBadge`** — Risk level indicator.
```typescript
interface RiskBadgeProps {
  level: 'low' | 'medium' | 'high' | 'critical';
  label?: string;  // Custom label, defaults to the level name
  size?: 'sm' | 'default' | 'lg';
  showIcon?: boolean;
}
```
- Color-coded: low=green, medium=warning, high=error, critical=error+bold
- Optional icon (shield, warning triangle, etc.)

**`TimelineEvent`** — A single event in a timeline.
```typescript
interface TimelineEventProps {
  title: string;
  description?: string;
  timestamp: Date;
  type?: 'encounter' | 'medication' | 'lab' | 'procedure' | 'note';
  status?: 'completed' | 'pending' | 'cancelled';
  icon?: React.ReactNode;
}
```
- Vertical timeline layout with connecting line
- Icon/dot on the timeline
- Timestamp, title, description

**`Timeline`** — Container for TimelineEvents.
```typescript
interface TimelineProps {
  events: TimelineEventProps[];
  isLoading?: boolean;
}
```

**`VitalSign`** — Display a vital sign with trend.
```typescript
interface VitalSignProps {
  label: string;        // "Blood Pressure", "Heart Rate"
  value: string;        // "120/80", "72 bpm"
  unit?: string;
  status: 'normal' | 'warning' | 'critical';
  trend?: number[];     // Mini sparkline data
  timestamp?: Date;
}
```
- Inline sparkline showing recent trend
- Color-coded status indicator

**`MedicationCard`** — Medication display.
```typescript
interface MedicationCardProps {
  name: string;
  dosage: string;
  frequency: string;
  prescriber?: string;
  startDate?: Date;
  status: 'active' | 'discontinued' | 'pending';
}
```

### 8. Additional Should-Have Components

**`Carousel`** (`src/components/data-display/Carousel.tsx`):
- Props: `items: ReactNode[]`, `autoPlay?`, `interval?`, `showDots?`, `showArrows?`
- Smooth slide animation
- Touch/swipe support

**`Accordion`** — Extend shadcn Accordion with our styling.
- Expand animation using our presets
- Icon rotation on expand

**`CommandPalette`** — Quick action search (⌘K).
- Build on shadcn Command component
- Actions: navigate to page, search patients, toggle agent panel, etc.
- Keyboard shortcut: ⌘K or Ctrl+K
- Wire this up globally in the root layout

**`ImageCard`** (`src/components/data-display/ImageCard.tsx`):
- Props: `src`, `alt`, `caption?`, `aspectRatio?`
- Rounded corners, subtle border
- Optional caption below

**`ComparisonTable`** (`src/components/data-display/ComparisonTable.tsx`):
- Props: `items: { name: string; values: Record<string, any> }[]`, `columns: string[]`
- Side-by-side comparison layout
- Highlight differences between columns

**`KanbanBoard`** (`src/components/data-display/KanbanBoard.tsx`):
- Props: `columns: { id: string; title: string; items: KanbanItem[] }[]`, `onDragEnd?`
- Draggable cards between columns (use a simple drag-and-drop — could use `@hello-pangea/dnd` or just native HTML drag)
- Card renders customizable content
- Good for task management, case tracking, pipeline views

### 9. OpenUI Component Definitions

For each component that should be agent-renderable, create a `defineComponent()` definition in `src/lib/openui/components/`. Don't integrate with `createLibrary` yet (that's Phase 05), just prepare the definitions.

Create definitions for:
- StatCard, Badge, KeyValue, List
- BarChart, LineChart, DonutChart, SparkLine, AreaChart
- HeatMap, ScatterPlot, RadarChart, GaugeChart
- PatientCard, RiskBadge, Timeline, VitalSign, MedicationCard
- DataTable (simplified — the agent can render read-only tables)
- ImageCard, ComparisonTable
- Alert (the notification variant)

Each definition should have a Zod schema for props that matches the component's TypeScript props interface. Keep it compatible — the agent will pass data through OpenUI Lang, which uses positional props.

Example pattern:
```typescript
import { defineComponent } from '@openuidev/react-lang';
import { z } from 'zod';
import { StatCard } from '@/components/data-display/StatCard';

export const StatCardOpenUI = defineComponent({
  name: 'StatCard',
  description: 'Displays a key metric with label, value, icon, and trend indicator',
  props: z.object({
    label: z.string().describe('Metric label (e.g., "Total Patients")'),
    value: z.union([z.string(), z.number()]).describe('The metric value'),
    trendValue: z.string().optional().describe('Trend percentage (e.g., "12.3%")'),
    trendDirection: z.enum(['up', 'down', 'flat']).optional(),
    trendSentiment: z.enum(['positive', 'negative', 'neutral']).optional(),
    trendLabel: z.string().optional().describe('Context for trend (e.g., "vs prev. period")'),
  }),
  component: ({ props }) => (
    <StatCard
      label={props.label}
      value={props.value}
      trend={props.trendValue ? {
        value: props.trendValue,
        direction: props.trendDirection ?? 'flat',
        label: props.trendLabel ?? '',
        sentiment: props.trendSentiment,
      } : undefined}
    />
  ),
});
```

If the OpenUI packages aren't available or have different APIs than expected, create the definitions as typed objects that we can adapt later. The important thing is the Zod schemas and the component mappings exist.

### 10. Barrel Exports

Create/update barrel exports:
- `src/components/data-display/index.ts`
- `src/components/charts/index.ts`
- `src/components/healthcare/index.ts`
- `src/lib/openui/components/index.ts`

### 11. Populate the Dashboard

Update the dashboard page to use real components with demo data:
- Replace placeholder stat cards with actual `<StatCard>` components (4 cards: Total Patients, Active Cases, Avg Wait Time, Risk Alerts — matching the screenshot values)
- Replace placeholder notifications with actual `<Alert>` components
- Add a `<DataTable>` with sample patient data (10-15 rows, columns: Name, MRN, Age, Gender, Status, Risk Level, Last Visit, Primary Condition)
- Add at least one chart (e.g., a LineChart showing patient admissions over time)

### 12. Verify

1. Dashboard renders with all components populated with demo data
2. DataTable sorting works (click column headers)
3. DataTable pagination works
4. Charts render and show tooltips on hover
5. Healthcare components render with correct risk colors
6. All OpenUI definitions have valid Zod schemas
7. No TypeScript errors
8. Responsive behavior: check at 1440px, 1024px, 768px, 640px

**Take a screenshot of the completed dashboard and show me. Flag anything that doesn't look right or any components where you had to make significant design judgment calls.**

## Success Criteria
- [ ] DataTable with sort, filter, pagination, select, loading, empty states
- [ ] StatCard matches the screenshot's "At a Glance" style
- [ ] All 5 must-have chart types render correctly
- [ ] All should-have chart types render correctly
- [ ] Healthcare components render with correct visual hierarchy
- [ ] KanbanBoard component exists with drag-and-drop
- [ ] CommandPalette wired to ⌘K
- [ ] OpenUI definitions prepared for all agent-renderable components
- [ ] Dashboard page is fully populated with demo data
- [ ] No TypeScript errors, clean lint
