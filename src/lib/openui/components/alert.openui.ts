import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { StatusAlert } from '@/components/feedback/status-alert';

export const StatusAlertDefinition = defineComponent({
  name: 'StatusAlert',
  description:
    'Notification banner with coloured left border, icon, title, and optional description. Use for informational messages, success confirmations, warnings, and errors.',
  props: z.object({
    variant: z
      .enum(['info', 'success', 'warning', 'error'])
      .describe('Visual variant — determines colour and default icon'),
    title: z.string().describe('Alert title (bold)'),
    description: z
      .string()
      .optional()
      .describe('Alert body text'),
  }),
  component: ({ props }) => StatusAlert(props),
});
