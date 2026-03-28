# Scaffold a New Page

Create a new page in the BestPath app. The user will provide the page name (e.g., "analytics", "reports").

## Steps

### 1. Create the route file
Create `src/app/(main)/$ARGUMENTS/page.tsx` with this pattern:

```tsx
import { Page } from '@/components/layout/page';
import { Section } from '@/components/layout/section';

export default function PageNamePage() {
  return (
    <Page
      title="Page Title"
      description="Brief description of this page."
      breadcrumbs={[{ label: 'Page Title' }]}
    >
      <Section>
        {/* Page content here */}
      </Section>
    </Page>
  );
}
```

If the page needs client-side state (filters, search, etc.), add `'use client';` at the top.

### 2. Add navigation link
In `src/components/navigation/navbar.tsx`:
- Import the appropriate Lucide icon
- Add an entry to the `NAV_ITEMS` array: `{ label: 'Page Title', href: '/page-name', icon: IconName }`

### 3. Add command palette entry
In `src/components/navigation/command-palette.tsx`:
- Add a `CommandItem` in the Navigation group with the page name and route
- Add a keyboard shortcut if appropriate (follow existing pattern: ⌘D, ⌘P, ⌘R, etc.)

### 4. Add page context for the agent
In `src/lib/ai/system-prompt.ts`:
- Add an entry to the `PAGE_CONTEXT` record describing what the user sees on this page and which tools are most relevant

## Reference files
- Existing page: `src/app/(main)/page.tsx` (dashboard — full example with tabs, filters, charts)
- Existing page: `src/app/(main)/research/page.tsx` (research — example with search and API calls)
- Layout components: `src/components/layout/page.tsx`, `section.tsx`, `grid.tsx`
- Navbar: `src/components/navigation/navbar.tsx`
- Command palette: `src/components/navigation/command-palette.tsx`
- System prompt: `src/lib/ai/system-prompt.ts`
