import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { PatientCard } from '@/components/healthcare/patient-card';
import { RiskBadge } from '@/components/healthcare/risk-badge';
import { Timeline } from '@/components/healthcare/timeline';
import { VitalSign } from '@/components/healthcare/vital-sign';
import { MedicationCard } from '@/components/healthcare/medication-card';

/* ─── PatientCard ────────────────────────────────────── */

export const PatientCardDefinition = defineComponent({
  name: 'PatientCard',
  description:
    'Compact patient summary card with avatar, demographics, condition, risk level, and last visit date.',
  props: z.object({
    name: z.string().describe('Patient full name'),
    id: z.string().describe('Medical Record Number (MRN) or patient ID'),
    age: z.number().describe('Patient age in years'),
    gender: z.string().describe('Patient gender'),
    condition: z.string().optional().describe('Primary diagnosis or condition'),
    riskLevel: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Risk level shown as a coloured badge'),
    lastVisit: z
      .string()
      .optional()
      .describe('Last visit date as ISO string (e.g. "2026-01-15")'),
    avatar: z.string().optional().describe('Avatar image URL'),
  }),
  component: ({ props }) => PatientCard(props),
});

/* ─── RiskBadge ──────────────────────────────────────── */

export const RiskBadgeDefinition = defineComponent({
  name: 'RiskBadge',
  description:
    'Semantic badge showing patient risk level with colour-coded icon. Used standalone or inside cards.',
  props: z.object({
    level: z
      .enum(['low', 'medium', 'high', 'critical'])
      .describe('Risk level'),
    label: z
      .string()
      .optional()
      .describe('Custom label — defaults to the level name capitalised'),
    size: z.enum(['sm', 'default', 'lg']).optional().describe('Badge size'),
    showIcon: z
      .boolean()
      .optional()
      .describe('Show an icon before the label. Default: true'),
  }),
  component: ({ props }) => RiskBadge(props),
});

/* ─── Timeline ───────────────────────────────────────── */

export const TimelineDefinition = defineComponent({
  name: 'Timeline',
  description:
    'Vertical timeline of clinical events — encounters, medications, labs, procedures, and notes.',
  props: z.object({
    events: z
      .array(
        z.object({
          title: z.string().describe('Event title'),
          description: z.string().optional().describe('Event description'),
          timestamp: z.string().describe('ISO date string'),
          type: z
            .enum(['encounter', 'medication', 'lab', 'procedure', 'note'])
            .optional()
            .describe('Event type — determines the icon'),
          status: z
            .enum(['completed', 'pending', 'cancelled'])
            .optional()
            .describe('Event status — determines colour'),
        }),
      )
      .describe('Array of timeline events'),
  }),
  component: ({ props }) => Timeline({ events: props.events }),
});

/* ─── VitalSign ──────────────────────────────────────── */

export const VitalSignDefinition = defineComponent({
  name: 'VitalSign',
  description:
    'Single vital sign row with status indicator, value, unit, and sparkline trend.',
  props: z.object({
    label: z.string().describe('Vital sign name (e.g. "Blood Pressure")'),
    value: z.string().describe('Current value (e.g. "120/80")'),
    unit: z.string().optional().describe('Unit of measurement (e.g. "mmHg")'),
    status: z
      .enum(['normal', 'warning', 'critical'])
      .describe('Status indicator colour'),
    trend: z
      .array(z.number())
      .optional()
      .describe('Array of recent numeric values for sparkline'),
  }),
  component: ({ props }) => VitalSign(props),
});

/* ─── MedicationCard ─────────────────────────────────── */

export const MedicationCardDefinition = defineComponent({
  name: 'MedicationCard',
  description:
    'Card showing medication name, dosage, frequency, prescriber, start date, and status.',
  props: z.object({
    name: z.string().describe('Medication name'),
    dosage: z.string().describe('Dosage (e.g. "500mg")'),
    frequency: z.string().describe('Frequency (e.g. "Twice daily")'),
    prescriber: z.string().optional().describe('Prescribing doctor name'),
    startDate: z
      .string()
      .optional()
      .describe('Start date as ISO string'),
    status: z
      .enum(['active', 'discontinued', 'pending'])
      .describe('Medication status'),
  }),
  component: ({ props }) => MedicationCard(props),
});
