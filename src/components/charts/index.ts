// Chart configuration
export {
  ChartContainer,
  ChartLegend,
  CHART_COLORS,
  CHART_MARGINS,
  CHART_ANIMATION,
  chartTooltipStyle,
  chartAxisStyle,
  chartGridStyle,
  getColor,
} from './chart-config';

// Must-have charts
export { BarChart, type BarChartProps } from './bar-chart';
export { LineChart, type LineChartProps } from './line-chart';
export { DonutChart, type DonutChartProps } from './donut-chart';
export { SparkLine, type SparkLineProps } from './spark-line';
export { AreaChart, type AreaChartProps } from './area-chart';

// Should-have charts
export { HeatMap, type HeatMapProps } from './heat-map';
export { ScatterPlot, type ScatterPlotProps } from './scatter-plot';
export { RadarChart, type RadarChartProps } from './radar-chart';
export { GaugeChart, type GaugeChartProps } from './gauge-chart';
export { TreeMap, type TreeMapProps, type TreeMapItem } from './tree-map';
