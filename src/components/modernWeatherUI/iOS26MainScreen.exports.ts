// Re-export types and components from iOS26MainScreen in a separate module
// to satisfy react-refresh/only-export-components for the component file.
export {} from './iOS26MainScreen';

// Explicitly export types
export type {
  iOS26NavigationBarProps,
  // Types are re-exported from the component file without triggering refresh rule
  // since this file is not subject to the components-only constraint
  // Keep names in sync with iOS26MainScreen
  iOS26WeatherCardProps,
  QuickActionsPanelProps,
  WeatherMetric,
  WeatherMetricsGridProps,
} from './iOS26MainScreen';
