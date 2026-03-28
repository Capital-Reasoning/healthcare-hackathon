import { createElement } from 'react';
import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';

/**
 * Simplified read-only data table for agent use.
 *
 * The full DataTable component uses TanStack Table with ColumnDef objects
 * that include render functions — not serialisable. This OpenUI wrapper
 * accepts plain column names and row data, rendering a clean read-only table.
 */
export const DataTableDefinition = defineComponent({
  name: 'DataTable',
  description:
    'Read-only data table with column headers and rows. Good for tabular query results. For interactive features use the full DataTable component directly.',
  props: z.object({
    columns: z
      .array(
        z.object({
          key: z.string().describe('Data key to read from each row'),
          label: z.string().describe('Column header label'),
        }),
      )
      .describe('Column definitions'),
    rows: z
      .array(z.record(z.string(), z.unknown()))
      .describe('Array of row data objects'),
    caption: z
      .string()
      .optional()
      .describe('Optional table caption displayed above the table'),
    striped: z
      .boolean()
      .optional()
      .describe('Apply alternating row background. Default: false'),
  }),
  component: ({ props }) => {
    return createElement(
      'div',
      { 'data-slot': 'data-table', className: 'w-full overflow-x-auto rounded-lg border border-border' },
      props.caption
        ? createElement(
            'div',
            { className: 'px-4 py-2 text-body-sm font-medium text-foreground border-b border-border bg-muted/50' },
            props.caption,
          )
        : null,
      createElement(
        'table',
        { className: 'w-full text-body-sm' },
        createElement(
          'thead',
          { className: 'bg-muted' },
          createElement(
            'tr',
            null,
            ...props.columns.map((col) =>
              createElement(
                'th',
                {
                  key: col.key,
                  className:
                    'px-4 py-3 text-left text-caption font-medium text-muted-foreground',
                },
                col.label,
              ),
            ),
          ),
        ),
        createElement(
          'tbody',
          null,
          ...props.rows.map((row, rowIdx) =>
            createElement(
              'tr',
              {
                key: rowIdx,
                className: `border-b border-border transition-colors hover:bg-muted/50${
                  props.striped ? ' even:bg-muted/30' : ''
                }`,
              },
              ...props.columns.map((col) =>
                createElement(
                  'td',
                  { key: col.key, className: 'px-4 py-3 text-foreground' },
                  String(row[col.key] ?? '—'),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  },
});
