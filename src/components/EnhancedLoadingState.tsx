/**
 * Enhanced Loading States Component
 * 
 * Provides sophisticated loading states with context-aware messaging,
 * progress indication, and accessibility features for better UX.
 */

import React from 'react';
import { safeTelemetry } from '../utils/buildOptimizations';

interface LoadingStateProps {
  type?: 'weather' | 'location' | 'component' | 'generic';
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  theme?: 'light' | 'dark';
}

const LoadingSpinner: React.FC<{ size: string; theme: string }> = ({ size, theme }) => {
  const sizeClasses = {
    small: 'w-6 h-6',
    medium: 'w-8 h-8', 
    large: 'w-12 h-12'
  };

  return (
    <div 
      className={`${sizeClasses[size as keyof typeof sizeClasses]} animate-spin`}
      style={{
        border: `2px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
        borderTop: `2px solid ${theme === 'dark' ? '#8b5cf6' : '#667eea'}`,
        borderRadius: '50%'
      }}
      aria-hidden="true"
    />
  );
};

const ProgressBar: React.FC<{ progress: number; theme: string }> = ({ progress, theme }) => (
  <div 
    className="w-full bg-opacity-20 rounded-full h-1.5 mt-3"
    style={{ backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
  >
    <div 
      className="h-1.5 rounded-full transition-all duration-300 ease-out"
      style={{ 
        width: `${Math.max(0, Math.min(100, progress))}%`,
        backgroundColor: theme === 'dark' ? '#8b5cf6' : '#667eea'
      }}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    />
  </div>
);

export const EnhancedLoadingState: React.FC<LoadingStateProps> = ({
  type = 'generic',
  message,
  progress,
  showProgress = false,
  isError = false,
  errorMessage,
  onRetry,
  className = '',
  size = 'medium',
  theme = 'dark'
}) => {
  // Context-aware default messages
  const getDefaultMessage = () => {
    switch (type) {
      case 'weather':
        return 'Fetching weather data...';
      case 'location':
        return 'Getting your location...';
      case 'component':
        return 'Loading component...';
      default:
        return 'Loading...';
    }
  };

  const displayMessage = message || getDefaultMessage();

  // Track loading times for analytics
  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      safeTelemetry.trackTiming(`loading-${type}`, loadTime);
    };
  }, [type]);

  // Error state
  if (isError) {
    return (
      <div 
        className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
        role="alert"
        aria-live="polite"
      >
        <div 
          className="text-4xl mb-3"
          style={{ color: theme === 'dark' ? '#ef4444' : '#dc2626' }}
        >
          ⚠️
        </div>
        <h3 
          className="font-semibold mb-2"
          style={{ color: theme === 'dark' ? '#f9fafb' : '#1f2937' }}
        >
          Something went wrong
        </h3>
        <p 
          className="text-sm mb-4 opacity-75"
          style={{ color: theme === 'dark' ? '#d1d5db' : '#6b7280' }}
        >
          {errorMessage || 'Unable to load content. Please try again.'}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
            style={{
              backgroundColor: theme === 'dark' ? '#8b5cf6' : '#667eea',
              color: '#ffffff'
            }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Success loading state
  return (
    <div 
      className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label={displayMessage}
    >
      <LoadingSpinner size={size} theme={theme} />
      
      <p 
        className="mt-4 font-medium"
        style={{ color: theme === 'dark' ? '#f9fafb' : '#1f2937' }}
      >
        {displayMessage}
      </p>
      
      {showProgress && progress !== undefined && (
        <>
          <ProgressBar progress={progress} theme={theme} />
          <span 
            className="text-xs mt-2 opacity-75"
            style={{ color: theme === 'dark' ? '#d1d5db' : '#6b7280' }}
            aria-label={`Loading progress: ${progress}%`}
          >
            {progress}%
          </span>
        </>
      )}
    </div>
  );
};

// Skeleton loading component for lazy-loaded content
export const SkeletonLoader: React.FC<{
  lines?: number;
  height?: string;
  theme?: 'light' | 'dark';
}> = ({ 
  lines = 3, 
  height = '1rem',
  theme = 'dark' 
}) => {
  const baseColor = theme === 'dark' ? '#374151' : '#e5e7eb';
  const shimmerColor = theme === 'dark' ? '#4b5563' : '#f3f4f6';

  return (
    <div className="animate-pulse">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="mb-2 last:mb-0 rounded"
          style={{
            height,
            backgroundColor: baseColor,
            backgroundImage: `linear-gradient(90deg, ${baseColor} 25%, ${shimmerColor} 50%, ${baseColor} 75%)`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite'
          }}
        />
      ))}
    </div>
  );
};

// CSS-in-JS for shimmer animation
const shimmerStyle = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// Inject shimmer styles
if (typeof document !== 'undefined') {
  const styleId = 'enhanced-loading-shimmer-style';
  if (!document.getElementById(styleId)) {
    const styleSheet = document.createElement('style');
    styleSheet.id = styleId;
    styleSheet.textContent = shimmerStyle;
    document.head.appendChild(styleSheet);
  }
}