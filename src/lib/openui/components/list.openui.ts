import { createElement } from 'react';
import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';

/**
 * Simplified List for agent use — renders string items as a styled list.
 * The full List component accepts a renderItem function which cannot be
 * expressed as serialisable props, so this OpenUI wrapper accepts plain
 * string items and renders them as simple text rows.
 */
export const ListDefinition = defineComponent({
  name: 'List',
  description:
    'Renders a simple list of text items with optional dividers. For richer content, compose other components.',
  props: z.object({
    items: z
      .array(z.string())
      .describe('Array of text items to render'),
    ordered: z
      .boolean()
      .optional()
      .describe('Use numbered (ordered) list instead of bullet list'),
    dividers: z
      .boolean()
      .optional()
      .describe('Show dividers between items. Default: true'),
  }),
  component: ({ props }) => {
    const Tag = props.ordered ? 'ol' : 'ul';
    const listStyle = props.ordered ? 'list-decimal' : 'list-disc';
    const showDividers = props.dividers ?? true;

    return createElement(
      'div',
      { 'data-slot': 'list' },
      createElement(
        Tag,
        { className: `${listStyle} pl-5 flex flex-col ${showDividers ? 'divide-y divide-border' : 'gap-1'}` },
        ...props.items.map((item, i) =>
          createElement(
            'li',
            { key: i, className: 'py-2 text-body-sm text-foreground' },
            item,
          ),
        ),
      ),
    );
  },
});
