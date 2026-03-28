import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { KeyValue } from '@/components/data-display/key-value';

export const KeyValueDefinition = defineComponent({
  name: 'KeyValue',
  description:
    'Displays a list of label–value pairs in horizontal, vertical, or grid layout. Ideal for patient details, metadata, and summaries.',
  props: z.object({
    items: z
      .array(
        z.object({
          label: z.string().describe('Key / label text'),
          value: z.string().describe('Value text'),
        }),
      )
      .describe('Array of key–value pairs to display'),
    layout: z
      .enum(['horizontal', 'vertical', 'grid'])
      .optional()
      .describe('Layout mode — horizontal shows label and value side-by-side'),
    columns: z
      .enum(['1', '2', '3', '4'])
      .optional()
      .describe('Number of grid columns (only used with grid layout)'),
  }),
  component: ({ props }) => {
    return KeyValue({
      items: props.items,
      layout: props.layout,
      columns: props.columns ? (Number(props.columns) as 1 | 2 | 3 | 4) : undefined,
    });
  },
});
