import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { DataBadge } from '@/components/data-display/badge';

export const DataBadgeDefinition = defineComponent({
  name: 'DataBadge',
  description:
    'Coloured badge/pill for labelling status, categories, or tags. Supports semantic colour variants.',
  props: z.object({
    text: z.string().describe('Badge label text'),
    variant: z
      .enum(['default', 'primary', 'secondary', 'success', 'warning', 'error', 'outline'])
      .optional()
      .describe('Colour variant'),
    size: z
      .enum(['sm', 'default', 'lg'])
      .optional()
      .describe('Badge size'),
    dot: z
      .boolean()
      .optional()
      .describe('Show a small coloured dot before the text'),
  }),
  component: ({ props }) => {
    return DataBadge({
      variant: props.variant,
      size: props.size,
      dot: props.dot,
      children: props.text,
    });
  },
});
