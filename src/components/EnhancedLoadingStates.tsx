import React from 'react';
import '../styles/EnhancedLoadingStates.css';
import {
  useOperationLoading,
  type LoadingOperation,
} from '../utils/LoadingStateManager';
import { ProgressRing, Spinner } from './ProgressRing';

// Enhanced loading skeleton for weather data
export interface WeatherSkeletonProps {
  showForecast?: boolean;
  showMetrics?: boolean;
  className?: string;
}

export const WeatherDataSkeleton: React.FC<WeatherSkeletonProps> = ({
  showForecast = false,
  showMetrics = false,
  className = '',
}) => {
  return (
    <div className={`weather-skeleton ${className}`}>
      {/* Current weather skeleton */}
      <div className="weather-skeleton-current">
        <div className="weather-skeleton-icon" />
        <div className="weather-skeleton-temp" />
        <div className="weather-skeleton-desc" />
      </div>

      {/* Weather metrics skeleton */}
      {showMetrics && (
        <div className="weather-skeleton-metrics">
          {['humidity', 'pressure', 'wind', 'visibility'].map(metric => (
            <div key={metric} className="weather-skeleton-metric">
              <div className="weather-skeleton-metric-icon" />
              <div className="weather-skeleton-metric-value" />
              <div className="weather-skeleton-metric-label" />
            </div>
          ))}
        </div>
      )}

      {/* Forecast skeleton */}
      {showForecast && (
        <div className="weather-skeleton-forecast">
          {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
            <div key={day} className="weather-skeleton-forecast-item">
              <div className="weather-skeleton-forecast-day" />
              <div className="weather-skeleton-forecast-icon" />
              <div className="weather-skeleton-forecast-temp" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Progress indicator with operation context
export interface OperationProgressProps {
  operation: LoadingOperation;
  showProgress?: boolean;
  showSpinner?: boolean;
  size?: 24 | 32 | 48 | 64 | 72;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const OperationProgress: React.FC<OperationProgressProps> = ({
  operation,
  showProgress = false,
  showSpinner = true,
  size = 32,
  variant = 'primary',
  className = '',
}) => {
  const { loadingState } = useOperationLoading(operation);

  if (!loadingState?.isLoading) {
    return null;
  }

  const hasProgress = typeof loadingState.progress === 'number';

  if (showProgress && hasProgress) {
    return (
      <ProgressRing
        progress={loadingState.progress || 0}
        size={size}
        variant={variant}
        showPercentage={size >= 48}
        className={className}
        ariaLabel={`${operation} progress: ${Math.round(
          loadingState.progress || 0
        )}%`}
      />
    );
  }

  if (showSpinner) {
    const spinnerVariant =
      variant === 'primary' || variant === 'secondary' ? variant : 'primary';

    return (
      <Spinner
        size={size <= 32 ? (size as 16 | 20 | 24 | 32) : 32}
        variant={spinnerVariant}
        className={className}
        ariaLabel={`Loading ${operation}`}
      />
    );
  }

  return null;
};

// Background refresh indicator (subtle)
export interface BackgroundUpdateIndicatorProps {
  operation: LoadingOperation;
  className?: string;
}

export const BackgroundUpdateIndicator: React.FC<
  BackgroundUpdateIndicatorProps
> = ({ operation, className = '' }) => {
  const { loadingState } = useOperationLoading(operation);

  if (!loadingState?.isLoading || operation !== 'background-refresh') {
    return null;
  }

  return (
    <div className={`background-update-indicator ${className}`}>
      <Spinner
        size={16}
        variant="secondary"
        ariaLabel="Updating weather data in background"
      />
      <span className="background-update-text">Updating...</span>
    </div>
  );
};

// Error recovery component with retry
export interface ErrorRecoveryStateProps {
  operation: LoadingOperation;
  onRetry?: () => Promise<void>;
  className?: string;
}

export const ErrorRecoveryState: React.FC<ErrorRecoveryStateProps> = ({
  operation,
  onRetry,
  className = '',
}) => {
  const { loadingState, retry } = useOperationLoading(operation);

  if (!loadingState?.error) {
    return null;
  }

  const handleRetry = async () => {
    if (onRetry) {
      await retry(onRetry);
    }
  };

  const retryCount = loadingState.retryCount || 0;
  const maxRetries = 3;

  return (
    <div className={`error-recovery-state ${className}`}>
      <div className="error-recovery-icon">⚠️</div>
      <div className="error-recovery-content">
        <p className="error-recovery-message">{loadingState.error}</p>
        {retryCount < maxRetries && onRetry && (
          <button
            className="error-recovery-retry-button"
            onClick={handleRetry}
            disabled={loadingState.isLoading}
            type="button"
          >
            {loadingState.isLoading ? (
              <>
                <Spinner size={16} variant="secondary" />
                Retrying...
              </>
            ) : (
              `Retry (${retryCount}/${maxRetries})`
            )}
          </button>
        )}
        {retryCount >= maxRetries && (
          <p className="error-recovery-max-retries">
            Maximum retries reached. Please try again later.
          </p>
        )}
      </div>
    </div>
  );
};

// Loading overlay for full-screen operations
export interface LoadingOverlayProps {
  operation: LoadingOperation;
  title?: string;
  description?: string;
  showProgress?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  operation,
  title = 'Loading',
  description,
  showProgress = false,
  className = '',
}) => {
  const { loadingState } = useOperationLoading(operation);

  if (!loadingState?.isLoading) {
    return null;
  }

  const hasProgress = typeof loadingState.progress === 'number';

  return (
    <div className={`loading-overlay ${className}`}>
      <div className="loading-overlay-content">
        {showProgress && hasProgress ? (
          <ProgressRing
            progress={loadingState.progress || 0}
            size={64}
            variant="primary"
            showPercentage
            ariaLabel={`${title} progress: ${Math.round(
              loadingState.progress || 0
            )}%`}
          />
        ) : (
          <Spinner size={32} variant="primary" ariaLabel={`Loading ${title}`} />
        )}

        <h2 className="loading-overlay-title">{title}</h2>

        {description && (
          <p className="loading-overlay-description">{description}</p>
        )}

        {hasProgress && (
          <p className="loading-overlay-progress">
            {Math.round(loadingState.progress || 0)}% complete
          </p>
        )}
      </div>
    </div>
  );
};

export default WeatherDataSkeleton;
