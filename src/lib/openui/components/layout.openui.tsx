import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { cn } from '@/lib/utils';

/* ─── Row ───────────────────────────────────────────── */

export const RowDefinition = defineComponent({
  name: 'Row',
  description:
    'Responsive row layout. Items flow horizontally when space allows, stacking to a single column at narrow widths. Use to place multiple components side-by-side.',
  props: z.object({
    children: z
      .array(z.any())
      .describe('Array of child components to lay out in a row'),
  }),
  component: ({ props, renderNode }) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '0.75rem',
      }}
    >
      {Array.isArray(props.children) &&
        props.children.map((child, i) => (
          <div key={i} className="min-w-0">
            {renderNode(child)}
          </div>
        ))}
    </div>
  ),
});

/* ─── Card ──────────────────────────────────────────── */

const variantClasses: Record<string, string> = {
  subtle: 'rounded-xl border border-border/30 bg-card p-3 shadow-sm',
  elevated: 'rounded-xl border border-border/40 bg-card p-4 shadow-md',
  glass: 'rounded-xl border border-border/20 p-3 glass-subtle glow-sm',
};

export const CardDefinition = defineComponent({
  name: 'Card',
  description:
    'Wrapper card for visual grouping. Use "subtle" (default) for light grouping, "elevated" for more prominent sections, or "glass" for frosted-glass emphasis.',
  props: z.object({
    child: z.any().describe('The child component to wrap'),
    variant: z
      .enum(['subtle', 'elevated', 'glass'])
      .optional()
      .describe('Card style — subtle (default), elevated, or glass'),
  }),
  component: ({ props, renderNode }) => {
    const variant = props.variant ?? 'subtle';
    return (
      <div className={cn(variantClasses[variant])}>
        {renderNode(props.child)}
      </div>
    );
  },
});
