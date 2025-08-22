import React from 'react';
import '../styles/ProgressRing.css';

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: 24 | 32 | 48 | 64 | 72;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
  ariaLabel?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 48,
  strokeWidth = 4,
  color = '#007AFF',
  backgroundColor = '#E5E5EA',
  showPercentage = false,
  variant = 'primary',
  className = '',
  ariaLabel = 'Loading progress',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const ringClasses = [
    'progress-ring',
    `progress-ring--${variant}`,
    `progress-ring--size-${size}`,
    className,
  ].filter(Boolean).join(' ');

  const textClasses = [
    'progress-ring-text',
    size > 40 ? 'progress-ring-text--normal' : 'progress-ring-text--small',
  ].join(' ');

  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={ringClasses} aria-label={ariaLabel}>
      <progress 
        value={clampedProgress} 
        max={100} 
        aria-label={ariaLabel}
        className="progress-ring-hidden-progress"
      >
        {Math.round(clampedProgress)}%
      </progress>
      
      <svg width={size} height={size} className="progress-ring-svg" aria-hidden="true">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          className="progress-ring-background"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="progress-ring-progress"
        />
      </svg>
      
      {showPercentage && (
        <div className={textClasses} aria-hidden="true">
          {Math.round(clampedProgress)}%
        </div>
      )}
    </div>
  );
};

// Indeterminate spinner variant
export interface SpinnerProps {
  size?: 16 | 20 | 24 | 32;
  strokeWidth?: number;
  color?: string;
  variant?: 'primary' | 'secondary';
  className?: string;
  ariaLabel?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 24,
  strokeWidth = 2,
  color = '#007AFF',
  variant = 'primary',
  className = '',
  ariaLabel = 'Loading',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const spinnerClasses = [
    'spinner',
    `spinner--${variant}`,
    `spinner--size-${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={spinnerClasses} aria-label={ariaLabel}>
      <output className="spinner-hidden-output" aria-live="polite">
        {ariaLabel}
      </output>
      
      <svg width={size} height={size} className="spinner-svg" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
          strokeLinecap="round"
          className="spinner-circle"
        />
      </svg>
    </div>
  );
};

export default ProgressRing;
