// Type-only exports for iOS26 component props, inferred from component definitions.
// This avoids exporting types directly from the component file to satisfy
// react-refresh/only-export-components while keeping prop types available to consumers.

import type React from 'react';

// Infer prop types from the exported components in iOS26MainScreen
export type IOS26WeatherCardProps = React.ComponentProps<
  typeof import('./iOS26MainScreen').IOS26WeatherCard
>;

export type QuickActionsPanelProps = React.ComponentProps<
  typeof import('./iOS26MainScreen').QuickActionsPanel
>;

export type WeatherMetricsGridProps = React.ComponentProps<
  typeof import('./iOS26MainScreen').WeatherMetricsGrid
>;

export type IOS26NavigationBarProps = React.ComponentProps<
  typeof import('./iOS26MainScreen').IOS26NavigationBar
>;

// Derive WeatherMetric from WeatherMetricsGridProps
export type WeatherMetric = WeatherMetricsGridProps['metrics'][number];
