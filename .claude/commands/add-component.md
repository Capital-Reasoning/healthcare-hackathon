# Add a New Component

Create a new UI component for the BestPath app. The user will describe the component they need.

## Steps

### 1. Create the component file
Place it in the appropriate directory under `src/components/`:
- `data-display/` — tables, badges, stat cards, lists
- `charts/` — any chart or visualization
- `healthcare/` — patient cards, risk badges, vitals, medications, timelines
- `forms/` — inputs, filters, search bars
- `feedback/` — alerts, toasts, status messages
- `layout/` — structural components (cards, grids, stacks, panels)
- `agent/` — agent panel specific components

Follow this pattern:
```tsx
import { cn } from '@/lib/utils';

interface ComponentNameProps {
  // Define all props with JSDoc comments
  /** Primary label */
  label: string;
  className?: string;
}

export function ComponentName({ label, className }: ComponentNameProps) {
  return (
    <div data-slot="component-name" className={cn('...', className)}>
      {/* Implementation */}
    </div>
  );
}
```

### 2. Add to barrel export
Add the component to the `index.ts` barrel export in its directory (e.g., `src/components/data-display/index.ts`).

### 3. Create OpenUI definition (if agent-renderable)
Create `src/lib/openui/components/component-name.tsx`:

```tsx
import { defineComponent } from '@openuidev/react-lang';
import { ComponentName } from '@/components/{category}/component-name';

export const ComponentNameDefinition = defineComponent(ComponentName, {
  name: 'ComponentName',
  description: 'Brief description of what it renders.',
  argNames: ['arg1', 'arg2', 'arg3'],
  // argNames must match the positional order of props
});
```

### 4. Register in OpenUI library
In `src/lib/openui/components/index.ts`:
- Import the definition: `export { ComponentNameDefinition } from './component-name';`

In `src/lib/openui/library.ts`:
- Import the definition
- Add it to the `components` array
- Add it to the appropriate `componentGroups` entry

### 5. Update system prompt
In `src/lib/ai/system-prompt.ts`, add the component to the `OPENUI_LANG_PROMPT` under the appropriate section with its signature and description.

## Reference files
- Existing component: `src/components/data-display/stat-card.tsx`
- Existing OpenUI def: `src/lib/openui/components/stat-card.tsx`
- Library registration: `src/lib/openui/library.ts`
- Component index: `src/lib/openui/components/index.ts`
- System prompt: `src/lib/ai/system-prompt.ts`

## Conventions
- Always use Lucide React icons (`lucide-react`), never custom SVG paths
- Use `cn()` from `@/lib/utils` for className merging
- Use colour variables (`text-foreground`, `bg-card`, `border-border`), never hardcoded colours
- Add `data-slot="component-name"` for debugging
- TypeScript strict — all props must be typed
