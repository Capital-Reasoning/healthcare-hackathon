import { z } from 'zod';
import { defineComponent } from '@openuidev/react-lang';
import { BarChart } from '@/components/charts/bar-chart';
import { LineChart } from '@/components/charts/line-chart';
import { DonutChart } from '@/components/charts/donut-chart';
import { SparkLine } from '@/components/charts/spark-line';
import { AreaChart } from '@/components/charts/area-chart';
import { HeatMap } from '@/components/charts/heat-map';
import { ScatterPlot } from '@/components/charts/scatter-plot';
import { RadarChart } from '@/components/charts/radar-chart';
import { GaugeChart } from '@/components/charts/gauge-chart';

/* ─── Shared schemas ─────────────────────────────────── */

const chartRecordSchema = z
  .array(z.record(z.string(), z.unknown()))
  .describe('Array of data objects — each key maps to a series or category');

/* ─── BarChart ───────────────────────────────────────── */

export const BarChartDefinition = defineComponent({
  name: 'BarChart',
  description:
    'Vertical or horizontal bar chart supporting multi-series and stacking. Powered by Recharts.',
  props: z.object({
    data: chartRecordSchema,
    xKey: z.string().describe('Key for the X axis (category)'),
    yKeys: z.array(z.string()).describe('Keys for Y axis values (supports multi-series)'),
    layout: z.enum(['vertical', 'horizontal']).optional().describe('Bar orientation'),
    stacked: z.boolean().optional().describe('Stack bars on top of each other'),
    colors: z.array(z.string()).optional().describe('Custom hex colours for each series'),
    height: z.number().optional().describe('Chart height in pixels. Default: 300'),
    showLegend: z.boolean().optional().describe('Show legend'),
    showGrid: z.boolean().optional().describe('Show grid lines'),
  }),
  component: ({ props }) => BarChart(props),
});

/* ─── LineChart ──────────────────────────────────────── */

export const LineChartDefinition = defineComponent({
  name: 'LineChart',
  description:
    'Line chart with optional area fill, smooth curves, and multi-series support.',
  props: z.object({
    data: chartRecordSchema,
    xKey: z.string().describe('Key for the X axis'),
    yKeys: z.array(z.string()).describe('Keys for line series'),
    curved: z.boolean().optional().describe('Use smooth monotone curves. Default: true'),
    area: z.boolean().optional().describe('Fill area under the lines'),
    colors: z.array(z.string()).optional().describe('Custom colours for each series'),
    height: z.number().optional().describe('Chart height in pixels. Default: 300'),
    showDots: z.boolean().optional().describe('Show dots on data points'),
    showLegend: z.boolean().optional().describe('Show legend'),
    showGrid: z.boolean().optional().describe('Show grid lines'),
  }),
  component: ({ props }) => LineChart(props),
});

/* ─── DonutChart ─────────────────────────────────────── */

export const DonutChartDefinition = defineComponent({
  name: 'DonutChart',
  description:
    'Pie/donut chart with configurable inner radius. Each slice needs a name and numeric value.',
  props: z.object({
    data: z
      .array(
        z.object({
          name: z.string().describe('Slice label'),
          value: z.number().describe('Numeric value'),
          color: z.string().optional().describe('Custom hex colour for this slice'),
        }),
      )
      .describe('Array of slices'),
    innerRadius: z
      .number()
      .optional()
      .describe('Inner radius as fraction of outer (0–1). Default: 0.6. Use 0 for a full pie.'),
    centerLabel: z
      .string()
      .optional()
      .describe('Text to display in the centre of the donut'),
    height: z.number().optional().describe('Chart height in pixels. Default: 300'),
    showLegend: z.boolean().optional().describe('Show legend'),
  }),
  component: ({ props }) =>
    DonutChart({
      data: props.data,
      innerRadius: props.innerRadius,
      label: props.centerLabel,
      height: props.height,
      showLegend: props.showLegend,
    }),
});

/* ─── SparkLine ──────────────────────────────────────── */

export const SparkLineDefinition = defineComponent({
  name: 'SparkLine',
  description:
    'Tiny inline line chart for showing trends inside table cells or stat cards.',
  props: z.object({
    data: z.array(z.number()).describe('Array of numeric values'),
    color: z.string().optional().describe('Line colour. Default: primary teal'),
    height: z.number().optional().describe('Height in pixels. Default: 32'),
    showDot: z.boolean().optional().describe('Show a dot on the last data point'),
  }),
  component: ({ props }) => SparkLine(props),
});

/* ─── AreaChart ──────────────────────────────────────── */

export const AreaChartDefinition = defineComponent({
  name: 'AreaChart',
  description:
    'Filled area chart supporting multi-series, stacking, and gradient fills.',
  props: z.object({
    data: chartRecordSchema,
    xKey: z.string().describe('Key for the X axis'),
    yKeys: z.array(z.string()).describe('Keys for area series'),
    stacked: z.boolean().optional().describe('Stack areas on top of each other'),
    curved: z.boolean().optional().describe('Use smooth curves. Default: true'),
    colors: z.array(z.string()).optional().describe('Custom colours for each series'),
    height: z.number().optional().describe('Chart height in pixels. Default: 300'),
    showLegend: z.boolean().optional().describe('Show legend'),
    showGrid: z.boolean().optional().describe('Show grid lines'),
  }),
  component: ({ props }) => AreaChart(props),
});

/* ─── HeatMap ────────────────────────────────────────── */

export const HeatMapDefinition = defineComponent({
  name: 'HeatMap',
  description:
    'Grid-based heat map with colour-interpolated cells. Good for correlation matrices and schedule views.',
  props: z.object({
    data: z
      .array(
        z.object({
          x: z.string().describe('Column label'),
          y: z.string().describe('Row label'),
          value: z.number().describe('Numeric value for colour intensity'),
        }),
      )
      .describe('Array of data points'),
    xLabels: z.array(z.string()).describe('Column headers'),
    yLabels: z.array(z.string()).describe('Row headers'),
    colorScaleMin: z
      .string()
      .optional()
      .describe('Hex colour for the minimum value. Default: light teal'),
    colorScaleMax: z
      .string()
      .optional()
      .describe('Hex colour for the maximum value. Default: dark teal'),
    height: z.number().optional().describe('Max height in pixels'),
  }),
  component: ({ props }) =>
    HeatMap({
      data: props.data,
      xLabels: props.xLabels,
      yLabels: props.yLabels,
      colorScale:
        props.colorScaleMin && props.colorScaleMax
          ? { min: props.colorScaleMin, max: props.colorScaleMax }
          : undefined,
      height: props.height,
    }),
});

/* ─── ScatterPlot ────────────────────────────────────── */

export const ScatterPlotDefinition = defineComponent({
  name: 'ScatterPlot',
  description:
    'Scatter/bubble plot. Supports optional bubble sizing and colour grouping.',
  props: z.object({
    data: chartRecordSchema,
    xKey: z.string().describe('Key for the X axis'),
    yKey: z.string().describe('Key for the Y axis'),
    sizeKey: z.string().optional().describe('Key for bubble sizing'),
    colorKey: z.string().optional().describe('Key for colour grouping'),
    height: z.number().optional().describe('Chart height in pixels. Default: 300'),
    showGrid: z.boolean().optional().describe('Show grid lines'),
  }),
  component: ({ props }) => ScatterPlot(props),
});

/* ─── RadarChart ─────────────────────────────────────── */

export const RadarChartDefinition = defineComponent({
  name: 'RadarChart',
  description:
    'Radar/spider chart for comparing multiple dimensions. Supports multi-series overlay.',
  props: z.object({
    data: chartRecordSchema,
    axisKey: z.string().describe('Key used for axis labels (e.g. "metric")'),
    valueKeys: z.array(z.string()).describe('Keys for value series'),
    colors: z.array(z.string()).optional().describe('Custom colours for each series'),
    height: z.number().optional().describe('Chart height in pixels. Default: 300'),
    showLegend: z.boolean().optional().describe('Show legend'),
  }),
  component: ({ props }) => RadarChart(props),
});

/* ─── GaugeChart ─────────────────────────────────────── */

export const GaugeChartDefinition = defineComponent({
  name: 'GaugeChart',
  description:
    'Semicircle gauge chart with colour thresholds and needle. Great for single KPI values.',
  props: z.object({
    value: z.number().describe('Current value'),
    min: z.number().optional().describe('Minimum value. Default: 0'),
    max: z.number().optional().describe('Maximum value. Default: 100'),
    thresholds: z
      .array(
        z.object({
          value: z.number().describe('Value at which this colour starts'),
          color: z.string().describe('Hex colour for this segment'),
        }),
      )
      .optional()
      .describe('Colour thresholds sorted ascending by value'),
    label: z.string().optional().describe('Label displayed below the value'),
    size: z.number().optional().describe('Size of the gauge in pixels. Default: 200'),
  }),
  component: ({ props }) => GaugeChart(props),
});
