import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { MetricRow } from '@/components/data-display/metric-row';

export const MetricRowDefinition = defineComponent({
  name: 'MetricRow',
  description:
    'Compact stacked metric display — full-width rows connected with thin dividers. Much more space-efficient than multiple StatCards. Use for 2-6 KPIs in a narrow panel.',
  props: z.object({
    metrics: z
      .array(
        z.object({
          label: z.string().describe('Metric label (e.g. "Total Patients")'),
          value: z
            .union([z.string(), z.number()])
            .describe('The metric value'),
          trendValue: z
            .string()
            .optional()
            .describe('Trend text (e.g. "+4.5%")'),
          trendDirection: z
            .enum(['up', 'down', 'flat'])
            .optional()
            .describe('Arrow direction'),
          trendLabel: z
            .string()
            .optional()
            .describe('Context (e.g. "vs last month")'),
          trendSentiment: z
            .enum(['positive', 'negative', 'neutral'])
            .optional()
            .describe('Colour — positive green, negative red'),
        }),
      )
      .describe('Array of metrics to display as connected rows'),
  }),
  component: ({ props }) =>
    MetricRow({
      metrics: props.metrics.map((m) => ({
        ...m,
        value: String(m.value),
      })),
    }),
});
