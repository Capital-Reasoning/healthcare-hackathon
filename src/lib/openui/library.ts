import { createLibrary } from '@openuidev/react-lang';
import {
  StatCardDefinition,
  DataBadgeDefinition,
  ListDefinition,
  DataTableDefinition,
  ImageCardDefinition,
  ComparisonTableDefinition,
  BarChartDefinition,
  LineChartDefinition,
  DonutChartDefinition,
  SparkLineDefinition,
  AreaChartDefinition,
  HeatMapDefinition,
  ScatterPlotDefinition,
  RadarChartDefinition,
  GaugeChartDefinition,
  PatientCardDefinition,
  RiskBadgeDefinition,
  TimelineDefinition,
  VitalSignDefinition,
  MedicationCardDefinition,
  StatusAlertDefinition,
  MetricRowDefinition,
  RowDefinition,
  CardDefinition,
  TabsDefinition,
} from './components';

/**
 * The BestPath OpenUI component library — registered with createLibrary so
 * the agent can generate structured UI responses that are parsed and
 * rendered with real React components.
 */
export const bestpathLibrary = createLibrary({
  components: [
    // Data Display
    StatCardDefinition,
    DataBadgeDefinition,
    ListDefinition,
    DataTableDefinition,
    ImageCardDefinition,
    ComparisonTableDefinition,
    // Charts
    BarChartDefinition,
    LineChartDefinition,
    DonutChartDefinition,
    SparkLineDefinition,
    AreaChartDefinition,
    HeatMapDefinition,
    ScatterPlotDefinition,
    RadarChartDefinition,
    GaugeChartDefinition,
    // Healthcare
    PatientCardDefinition,
    RiskBadgeDefinition,
    TimelineDefinition,
    VitalSignDefinition,
    MedicationCardDefinition,
    // Feedback
    StatusAlertDefinition,
    // Compact
    MetricRowDefinition,
    // Layout
    RowDefinition,
    CardDefinition,
    TabsDefinition,
  ],
  componentGroups: [
    {
      name: 'Data Display',
      components: [
        'StatCard',
        'DataBadge',
        'List',
        'DataTable',
        'ImageCard',
        'ComparisonTable',
        'MetricRow',
      ],
      notes: [
        'Use MetricRow for compact KPIs in the agent panel (preferred over StatCard)',
        'Use StatCard for dashboard KPIs on full-width pages',
        'Use DataTable for tabular query results',
      ],
    },
    {
      name: 'Charts',
      components: [
        'BarChart',
        'LineChart',
        'DonutChart',
        'SparkLine',
        'AreaChart',
        'HeatMap',
        'ScatterPlot',
        'RadarChart',
        'GaugeChart',
      ],
      notes: [
        'All charts accept height in pixels (default 300)',
        'Use SparkLine for inline trends in tables/cards',
      ],
    },
    {
      name: 'Healthcare',
      components: [
        'PatientCard',
        'RiskBadge',
        'Timeline',
        'VitalSign',
        'MedicationCard',
      ],
      notes: [
        'PatientCard integrates RiskBadge automatically',
        'Timeline supports encounter, medication, lab, procedure, note event types',
      ],
    },
    {
      name: 'Feedback',
      components: ['StatusAlert'],
      notes: ['Use for info/success/warning/error notifications'],
    },
    {
      name: 'Layout',
      components: ['Row', 'Card', 'Tabs'],
      notes: [
        'Use Row to place 2-4 items side-by-side (auto-stacks at narrow widths)',
        'Use Card to wrap components — "subtle" for light grouping, "elevated" for emphasis, "glass" for frosted effect',
        'Use Tabs to organise content into switchable panels — provide matching tabs and panels arrays',
      ],
    },
  ],
});
