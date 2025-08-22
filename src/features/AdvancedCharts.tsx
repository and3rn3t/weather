/**
 * Advanced Charts Feature Module
 * Lazy-loaded feature for advanced weather visualization
 */

import React from 'react';
import { PrecipitationChart, TemperatureTrend } from '../utils/lazyComponents';

export interface AdvancedChartsFeatureProps {
  hourlyData?: Array<{ time: string; temperature: number }>;
  precipitationHourlyData?: Array<{ time: string; precipitation: number }>;
  enabled?: boolean;
  showTemperatureTrend?: boolean;
  showPrecipitationChart?: boolean;
}

/**
 * Advanced Charts Feature Component
 * Encapsulates heavy chart components in a lazy-loaded module
 */
export const AdvancedChartsFeature: React.FC<AdvancedChartsFeatureProps> = ({
  hourlyData,
  precipitationHourlyData,
  enabled = true,
  showTemperatureTrend = true,
  showPrecipitationChart = true,
}) => {
  if (!enabled) {
    return null;
  }

  return (
    <div className="advanced-charts-container">
      {showTemperatureTrend && hourlyData && (
        <React.Suspense
          fallback={
            <div className="chart-loading">Loading temperature chart...</div>
          }
        >
          <TemperatureTrend hourlyData={hourlyData} />
        </React.Suspense>
      )}

      {showPrecipitationChart && precipitationHourlyData && (
        <React.Suspense
          fallback={
            <div className="chart-loading">Loading precipitation chart...</div>
          }
        >
          <PrecipitationChart hourlyData={precipitationHourlyData} />
        </React.Suspense>
      )}
    </div>
  );
};

export default AdvancedChartsFeature;
