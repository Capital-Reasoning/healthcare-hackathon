# Phase 02 — Design System & Theme

## Context
Phase 01 is complete. The Next.js project is initialized with all dependencies, shadcn/ui is set up, and the folder structure exists. The app runs on `localhost:3000`.

Read these files for context:
- `docs/colour-scheme.md` — the approved colour palette
- `docs/stack-decisions.md` — all technical decisions
- `CLAUDE.md` — project conventions

This is a hackathon project but we want **high design quality**. The design should feel warm, professional, and trustworthy for healthcare — not cold/sterile and not flashy/playful. Think: Stripe's clarity meets Linear's polish, in a healthcare context. The AI features get a distinct frosted glass treatment.

**If you're unsure about any aesthetic choice, ask me. Show me alternatives if needed.**

## Objective
Build the complete design system: Tailwind v4 theme configuration, CSS custom properties, glass/gradient utilities, typography scale, animation presets, and a visual test page to verify everything looks right.

## Step-by-Step Instructions

### 1. Tailwind v4 Theme Configuration

Tailwind v4 uses CSS-first configuration (not `tailwind.config.js`). Configure the theme in `src/styles/globals.css` (or wherever the Tailwind directives live).

Map the colour scheme from `docs/colour-scheme.md` to Tailwind theme tokens:

```css
@import "tailwindcss";

@theme {
  /* Primary (Teal) */
  --color-primary-DEFAULT: #0C8C8C;
  --color-primary-hover: #0A7373;
  --color-primary-pressed: #085C5C;
  --color-primary-tint: #E8F6F6;
  --color-primary-tint-medium: #D0EEEE;

  /* Secondary (Navy) */
  --color-secondary-DEFAULT: #1A2E44;
  --color-secondary-light: #2A4365;

  /* Background */
  --color-bg-page: #FAFAF8;
  --color-bg-card: #FFFFFF;
  --color-bg-muted: #F5F4F0;
  --color-bg-inset: #EFEEE9;

  /* Borders */
  --color-border-DEFAULT: #E6E4DF;
  --color-border-strong: #D4D1CA;
  --color-border-primary: #C1E8E8;

  /* Text */
  --color-text-primary: #1A2E44;
  --color-text-secondary: #5A6578;
  --color-text-muted: #8C919C;

  /* Semantic */
  --color-success: #0B7A5E;
  --color-warning: #C27A15;
  --color-error: #C93B3B;

  /* Add appropriate tints for semantic colors */
  --color-success-tint: #E6F5F0;
  --color-warning-tint: #FDF3E3;
  --color-error-tint: #FDE8E8;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(26, 46, 68, 0.04);
  --shadow-DEFAULT: 0 1px 3px rgba(26, 46, 68, 0.06), 0 1px 2px rgba(26, 46, 68, 0.04);
  --shadow-md: 0 4px 6px rgba(26, 46, 68, 0.06), 0 2px 4px rgba(26, 46, 68, 0.04);
  --shadow-lg: 0 10px 15px rgba(26, 46, 68, 0.06), 0 4px 6px rgba(26, 46, 68, 0.04);
  --shadow-xl: 0 20px 25px rgba(26, 46, 68, 0.08), 0 10px 10px rgba(26, 46, 68, 0.04);

  /* Border radius */
  --radius-sm: 6px;
  --radius-DEFAULT: 8px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
  --radius-full: 9999px;

  /* Typography */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

Also update shadcn/ui's CSS variables to use our colour scheme instead of the defaults. shadcn uses CSS custom properties like `--primary`, `--secondary`, `--background`, etc. — remap them to our palette.

### 2. Typography Scale

Set up a clear, readable typography scale. Healthcare UIs need excellent readability:

- **Display:** 36px/40px, semibold — page titles like "Patient Population Overview"
- **Heading 1:** 28px/36px, semibold — section headers
- **Heading 2:** 22px/28px, semibold — card titles
- **Heading 3:** 18px/24px, medium — subsection headers
- **Body:** 15px/24px, regular — standard text (slightly larger than typical 14px for readability)
- **Body Small:** 13px/20px, regular — secondary text, table cells
- **Caption:** 11px/16px, medium — labels, badges, overlines (like "TOTAL PATIENTS" in the screenshot)
- **Mono:** Same scale but in monospace — for data values, IDs, codes

Create utility classes or Tailwind extensions for these. Consider creating a `<Text>` component that takes a `variant` prop.

### 3. Google Fonts

Add Inter (sans-serif) and JetBrains Mono (monospace) via `next/font/google` in the root layout. These are clean, highly readable fonts that work well for data-dense healthcare UIs.

### 4. Glass & Gradient Utilities

Create utility classes for the AI/agent aesthetic. These should be reusable across components:

**Glass effects:**
- `.glass` — frosted glass background: `backdrop-blur-xl bg-white/70 border border-white/20`
- `.glass-strong` — more opaque: `backdrop-blur-2xl bg-white/85 border border-white/30`
- `.glass-subtle` — barely there: `backdrop-blur-md bg-white/40 border border-white/10`
- `.glass-dark` — for dark surfaces: `backdrop-blur-xl bg-secondary/80 border border-white/10`

**Gradient borders:**
- A utility that creates a gradient border effect (using a pseudo-element or background-clip technique)
- Primary gradient: teal to a lighter teal with transparency
- AI gradient: a subtle, shifting gradient (teal → blue → teal) that feels "intelligent"

**Glow effects:**
- `.glow-sm` — subtle box-shadow with primary color: `0 0 15px rgba(12, 140, 140, 0.1)`
- `.glow-md` — medium: `0 0 30px rgba(12, 140, 140, 0.15)`
- `.glow-lg` — pronounced: `0 0 50px rgba(12, 140, 140, 0.2)`

**Shimmer animation:**
- A shimmer/pulse animation for AI-generated content that's loading or just appeared
- Should be subtle — not a loading spinner, more of a gentle luminance shift

Implement these as Tailwind utilities (via `@layer utilities` in CSS) or as reusable CSS classes in globals.css.

### 5. Animation Presets

Define reusable animations:

- `fade-in` — opacity 0→1, 200ms ease-out
- `fade-in-up` — opacity 0→1 + translateY(8px→0), 300ms ease-out
- `slide-in-right` — translateX(100%→0), 300ms ease-out (for agent panel)
- `slide-in-up` — translateY(100%→0), 300ms ease-out (for mobile bottom sheet)
- `scale-in` — scale(0.95→1) + opacity 0→1, 200ms ease-out (for modals/cards)
- `shimmer` — a gentle left-to-right shimmer for AI content
- `pulse-subtle` — a very subtle opacity pulse (for thinking indicators)
- `expand` — height 0→auto with opacity, for accordions/collapsibles

Register these as Tailwind animation utilities so they can be used as `animate-fade-in`, `animate-slide-in-right`, etc.

### 6. Component Variant Patterns

Create a shared pattern for component variants using `class-variance-authority` (CVA). Define a standard set of variant patterns that components will reuse:

**Size variants:** `sm`, `default`, `lg`
**Color variants:** `default`, `primary`, `secondary`, `success`, `warning`, `error`, `ghost`
**Surface variants:** `default` (white card), `muted` (recessed), `glass` (frosted), `inset` (well)

Create a shared variants file at `src/lib/variants.ts` that exports these patterns for reuse.

### 7. Notification/Alert Styles

Looking at the screenshot, notifications have a distinct style:
- Left border accent (colored by severity)
- Soft background tint
- Icon + title + description layout

Define CSS patterns for:
- **Info notification:** teal left border, teal-tinted background
- **Warning notification:** warning (amber) left border, amber-tinted background
- **Error notification:** error (red) left border, red-tinted background
- **Success notification:** success (green) left border, green-tinted background

### 8. Card Patterns

The screenshot shows several card styles:
- **Stat cards** (At a Glance): white background, subtle border, icon in top-right, large number, trend indicator
- **Notification cards:** left-border accent, tinted background
- **Content cards:** white background, standard border, header + body

Define base card styles that these specific patterns can extend.

### 9. Design System Test Page

Create a page at `/settings` (or a dedicated `/design-system` route) that displays:
- All colour swatches (primary, secondary, backgrounds, borders, text, semantic)
- Typography scale (all variants with sample text)
- Glass effects (all variants on a coloured background so the effect is visible)
- Shadow scale
- Animation demos (buttons that trigger each animation)
- Card variants
- Notification styles

This is your visual reference during the hackathon. It helps verify the theme is correct and gives you a quick reference for available styles.

### 10. Verify Theme Integration

Make sure the Tailwind theme, shadcn/ui components, and CSS custom properties all work together:
- A shadcn `<Button>` should use the primary teal, not the default shadcn blue
- A shadcn `<Card>` should use the warm white background and subtle borders
- shadcn `<Badge>` should use the desaturated semantic colours
- The placeholder pages should use `bg-bg-page` for page backgrounds

**Run the dev server, check the design system page, and fix any visual issues. Ask me if you want my opinion on any aesthetic choices.**

## Success Criteria
- [ ] Tailwind theme tokens match `docs/colour-scheme.md` exactly
- [ ] shadcn/ui components use our palette, not defaults
- [ ] Typography scale renders correctly with Inter + JetBrains Mono
- [ ] Glass effects are visible and look good
- [ ] Animations work and feel smooth
- [ ] Design system test page exists and shows all styles
- [ ] `bg-bg-page` renders the warm white (#FAFAF8)
- [ ] No Tailwind default blue/gray colours leaking through
