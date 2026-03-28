# Phase 03 — Core Components (Layout, Navigation, Forms, Feedback)

## Context
Phases 01-02 are complete. The project has a working Next.js app with all dependencies, a fully configured design system (Tailwind theme, typography, glass utilities, animations), and shadcn/ui base components customized to our palette.

Read these files for context:
- `CLAUDE.md` — project conventions and patterns
- `docs/stack-decisions.md` — technical decisions
- The design system test page from Phase 02 — reference for available styles

**Senior-dev mode:** Every component should be well-typed, use proper TypeScript generics where appropriate, follow accessibility best practices (aria labels, keyboard navigation), and be documented with JSDoc comments describing props. Components should be composable and follow React patterns (compound components where appropriate).

**If you're building a component and aren't sure about the right API surface — ask me. Better to get it right now than refactor during the hackathon.**

## Objective
Build the core component library: layout primitives, navigation, form components, and feedback components. These form the skeleton that everything else builds on. Each component should be ready for both static pages and eventually agent-generated UIs via OpenUI.

## Step-by-Step Instructions

### 1. Layout Components (`src/components/layout/`)

**`Page`** — The outermost content wrapper for every page.
- Props: `title`, `description`, `breadcrumbs?`, `actions?` (ReactNode for top-right action buttons), `children`
- Renders the page header (title + description + breadcrumbs + actions) and the content area
- Matches the screenshot's "Patient Population Overview" layout: overline label, large title, description text below

**`Section`** — A semantic content section within a page.
- Props: `title?`, `description?`, `children`, `className?`
- Optional title renders as an H2 with the right typography
- Subtle separator between sections

**`Card`** — Extend shadcn's Card with our variants.
- Props: extend shadcn Card + `variant?: 'default' | 'muted' | 'glass' | 'interactive'`
- `default`: white bg, subtle border (standard card)
- `muted`: recessed bg (#F5F4F0), for secondary content
- `glass`: frosted glass effect (for agent UI)
- `interactive`: adds hover shadow lift + cursor pointer
- Include `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` sub-components

**`Panel`** — A larger container for main content areas.
- Props: `children`, `padding?: 'none' | 'sm' | 'default' | 'lg'`, `className?`

**`Grid`** — A responsive grid layout.
- Props: `cols?: 1 | 2 | 3 | 4`, `gap?: 'sm' | 'default' | 'lg'`, `children`
- Responsive by default: collapses to fewer columns on smaller screens

**`Stack`** — Flexbox layout helper.
- Props: `direction?: 'row' | 'column'`, `gap?: 'xs' | 'sm' | 'default' | 'lg'`, `align?`, `justify?`, `wrap?`, `children`

**`Divider`** — Horizontal or vertical separator.
- Props: `orientation?: 'horizontal' | 'vertical'`, `className?`

### 2. Navigation Components (`src/components/navigation/`)

**`Navbar`** — Top navigation bar matching the screenshot.
- Fixed to top of viewport
- Left: App logo/icon + app name (from `config/app.ts`) — the name should be easily configurable
- Center: Navigation links (Dashboard, Patients, Research, Settings) — active state highlighted
- Right: Notification bell icon + user avatar/name (can be hardcoded for demo: "Dr. Chen")
- Uses the secondary (navy) background: #1A2E44
- White text, teal accent for active nav item
- Use Next.js `Link` components and `usePathname()` for active detection

**`SideNav`** — Optional sidebar navigation (collapsible).
- Vertical nav links with icons
- Collapsible to icon-only mode
- Active state indication
- Useful for sub-navigation within sections (e.g., patients section)
- For now, create it but don't wire it into the main layout — we may use it for specific pages

**`Tabs`** — Enhanced tab component (extend shadcn Tabs).
- Matches the screenshot's "OVERVIEW | RISK ANALYSIS | DEMOGRAPHICS | AUDIT LOG" tabs
- Underline-style active indicator in primary teal
- Uppercase, caption-weight text for tab labels
- Content area below tabs

**`Breadcrumbs`** — Navigation breadcrumb trail.
- Props: `items: { label: string; href?: string }[]`
- Last item is current page (no link, bold)
- Separator: `/` or `>` character

### 3. Form Components (`src/components/forms/`)

Build on shadcn base components but add our specific patterns:

**`SearchBar`** — Search input with icon and clear button.
- Props: `placeholder?`, `value`, `onChange`, `onClear`, `className?`
- Search icon on left, clear (X) button on right when value is non-empty
- Debounced search (300ms) option via `debounce?` prop

**`FilterBar`** — Horizontal bar of filter controls.
- Props: `filters: FilterConfig[]`, `activeFilters`, `onFilterChange`, `onClear`
- Each filter is a dropdown (Select or MultiSelect)
- "Clear all" button when filters are active
- Shows active filter count in a badge
- Matches the screenshot's "Filters | Export | + New Patient" action bar

**`DatePicker`** — Date selection component.
- Build on shadcn's popover + calendar pattern
- Props: `value`, `onChange`, `placeholder?`, `minDate?`, `maxDate?`

**`DateRangeSelector`** — Date range picker.
- Props: `startDate`, `endDate`, `onChange`, `presets?` (e.g., "Last 7 days", "Last 30 days", "This quarter")
- Two date inputs with a dash between
- Preset dropdown for quick selections

**`MultiSelect`** — Multi-value select with chips.
- Props: `options`, `value: string[]`, `onChange`, `placeholder?`, `maxSelections?`
- Selected values shown as removable chips/pills
- Searchable dropdown

**Enhanced `Input`, `Select`, `Checkbox`, `Radio`, `Toggle`, `Textarea`:**
- Wrap shadcn versions with consistent styling
- Add `label` prop (renders a proper `<label>` element)
- Add `error` prop (renders error message below in red)
- Add `hint` prop (renders helper text below in muted)
- Ensure consistent height/padding across all form elements

### 4. Feedback Components (`src/components/feedback/`)

**`Alert`** — Notification banner matching the screenshot's "Notifications" section.
- Props: `variant: 'info' | 'success' | 'warning' | 'error'`, `title`, `description`, `icon?`, `onDismiss?`
- Left border accent colored by variant
- Tinted background matching variant
- Icon + title (bold) + description layout

**`Toast`** — Notification toast (extend shadcn Toast).
- Same variant system as Alert
- Auto-dismiss after configurable duration
- Stack in bottom-right corner
- Animate in (slide-in-up) and out (fade-out)

**`Modal`** — Dialog/modal (extend shadcn Dialog).
- Props: extend shadcn Dialog + `size?: 'sm' | 'default' | 'lg' | 'xl' | 'full'`
- Backdrop blur
- Scale-in animation
- Consistent padding and header/footer patterns

**`Tooltip`** — Enhanced tooltip (extend shadcn Tooltip).
- Ensure consistent styling with our theme
- Default delay: 300ms

**`Skeleton`** — Loading skeleton component.
- Props: `variant?: 'text' | 'card' | 'avatar' | 'chart' | 'table-row'`
- Each variant produces an appropriate skeleton shape
- Subtle shimmer animation
- Compose-able: `<Skeleton variant="card" />` renders a full card skeleton

**`EmptyState`** — Empty content placeholder.
- Props: `icon?`, `title`, `description`, `action?` (ReactNode for a CTA button)
- Centered layout with muted styling
- Used when tables have no data, search returns no results, etc.

**`ProgressBar`** — Progress indicator.
- Props: `value: number` (0-100), `variant?: 'default' | 'success' | 'warning' | 'error'`, `showLabel?: boolean`, `size?: 'sm' | 'default' | 'lg'`
- Smooth animation on value change
- Color changes based on variant

**`LoadingSpinner`** — Simple spinner.
- Props: `size?: 'sm' | 'default' | 'lg'`
- Uses primary teal color
- Smooth rotation animation

### 5. Barrel Exports

Create `index.ts` barrel exports for each component directory:
- `src/components/layout/index.ts`
- `src/components/navigation/index.ts`
- `src/components/forms/index.ts`
- `src/components/feedback/index.ts`

This enables clean imports: `import { Card, Grid, Stack } from '@/components/layout'`

### 6. Build the Dashboard Shell

Now that we have layout and navigation components, build a proper dashboard shell:

**Root layout (`src/app/layout.tsx`):**
- Import fonts (Inter, JetBrains Mono)
- Apply to `<body>`
- Include toast provider

**Main layout (`src/app/(main)/layout.tsx`):**
- `<Navbar>` fixed at top
- Main content area below navbar
- Reserve space for AgentPanel (right side) — for now, just a placeholder div that we'll implement in Phase 05
- The content area should be flexible: when AgentPanel is open, content shrinks; when closed, content is full-width

**Dashboard page (`src/app/(main)/page.tsx`):**
- Recreate the screenshot's layout using our components:
  - Page header: "Patient Population Overview" with breadcrumb and description
  - "At a Glance" section with 4 StatCard-like cards in a Grid (use placeholder data — Total Patients: 2,847, Active Cases: 384, etc.)
  - "Notifications" section with 2 Alert components (bias detection warning, data pipeline healthy)
  - "Patient Records" section with tab headers (Overview, Risk Analysis, Demographics, Audit Log)
  - Below tabs: FilterBar with Filters, Export, + New Patient buttons
  - Table placeholder (we'll build DataTable in Phase 04)

This serves as proof that the component system works together and gives us a visual benchmark.

### 7. Verify

1. Run the dev server and check the dashboard — it should closely match the screenshot's layout and feel
2. Check responsive behavior — components should stack/collapse reasonably on smaller viewports
3. Verify all components render without TypeScript errors
4. Verify all components have proper aria attributes for accessibility
5. Check that the glass utilities work on at least one test element

**Screenshot the dashboard and compare against the original screenshot. Show me any significant differences and ask if adjustments are needed.**

## Success Criteria
- [ ] All layout components built and exported
- [ ] Navbar renders with correct branding and navigation
- [ ] Form components have consistent sizing, labels, and error states
- [ ] Feedback components use the correct semantic colours
- [ ] Dashboard page recreates the screenshot layout
- [ ] All components are properly typed with TypeScript
- [ ] Barrel exports work (`import { X } from '@/components/layout'`)
- [ ] No TypeScript errors
- [ ] Components are accessible (keyboard nav, aria labels)
