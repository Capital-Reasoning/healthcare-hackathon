import type { DefinedComponent, Library, ComponentGroup } from '@openuidev/react-lang';

/**
 * Re-export core OpenUI types used throughout the app.
 * These are provided by `@openuidev/react-lang` and re-exported
 * here for convenience so consumers don't need to import from
 * the library directly.
 */
export type { DefinedComponent, Library, ComponentGroup };

/**
 * Union type of all agent-renderable component names.
 * Keep in sync with the definitions in `./components/`.
 */
export type AgentComponentName =
  // Data Display
  | 'StatCard'
  | 'DataBadge'
  | 'KeyValue'
  | 'List'
  | 'DataTable'
  | 'ImageCard'
  | 'ComparisonTable'
  | 'MetricRow'
  // Charts
  | 'BarChart'
  | 'LineChart'
  | 'DonutChart'
  | 'SparkLine'
  | 'AreaChart'
  | 'HeatMap'
  | 'ScatterPlot'
  | 'RadarChart'
  | 'GaugeChart'
  // Healthcare
  | 'PatientCard'
  | 'RiskBadge'
  | 'Timeline'
  | 'VitalSign'
  | 'MedicationCard'
  // Feedback
  | 'StatusAlert'
  // Layout
  | 'Row'
  | 'Card'
  | 'Tabs';
