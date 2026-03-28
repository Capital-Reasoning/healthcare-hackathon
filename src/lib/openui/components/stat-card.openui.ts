import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { StatCard } from '@/components/data-display/stat-card';

export const StatCardDefinition = defineComponent({
  name: 'StatCard',
  description:
    'Displays a key metric with label, value, and optional trend indicator. Use for KPIs, summaries, and dashboard counters.',
  props: z.object({
    label: z.string().describe('Metric label displayed as overline text (e.g. "Total Patients")'),
    value: z.union([z.string(), z.number()]).describe('The metric value displayed prominently'),
    trendValue: z
      .string()
      .optional()
      .describe('Trend change text (e.g. "+12%")'),
    trendDirection: z
      .enum(['up', 'down', 'flat'])
      .optional()
      .describe('Direction of the trend arrow'),
    trendLabel: z
      .string()
      .optional()
      .describe('Contextual label for the trend (e.g. "vs last month")'),
    trendSentiment: z
      .enum(['positive', 'negative', 'neutral'])
      .optional()
      .describe('Colour sentiment — positive is green, negative is red'),
    variant: z
      .enum(['default', 'glass'])
      .optional()
      .describe('Visual variant — use glass only in the agent panel'),
  }),
  component: ({ props }) => {
    const trend =
      props.trendValue && props.trendDirection
        ? {
            value: props.trendValue,
            direction: props.trendDirection,
            label: props.trendLabel ?? '',
            sentiment: props.trendSentiment,
          }
        : undefined;

    return StatCard({
      label: props.label,
      value: props.value,
      trend,
      variant: props.variant,
    });
  },
});
