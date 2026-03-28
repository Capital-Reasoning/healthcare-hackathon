import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { ComparisonTable } from '@/components/data-display/comparison-table';

export const ComparisonTableDefinition = defineComponent({
  name: 'ComparisonTable',
  description:
    'Side-by-side comparison table. Rows are features/attributes, columns are items being compared. Can highlight differing values.',
  props: z.object({
    items: z
      .array(
        z.object({
          name: z.string().describe('Item name (displayed as column header)'),
          values: z
            .record(z.string(), z.string())
            .describe('Map of feature name to display value'),
        }),
      )
      .describe('Items to compare — each has a name and a map of column to value'),
    columns: z
      .array(z.string())
      .describe('Feature/attribute names to display as rows'),
    highlightDifferences: z
      .boolean()
      .optional()
      .describe('Highlight cells where values differ across items'),
  }),
  component: ({ props }) => ComparisonTable(props),
});
