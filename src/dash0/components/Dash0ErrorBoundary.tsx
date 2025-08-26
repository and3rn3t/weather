/**
 * Dash0 Error Boundary - No-Op Implementation
 *
 * This is a temporary no-op implementation to fix build issues.
 * The actual Dash0 integration will be implemented separately.
 */

import type { ReactNode } from 'react';
import { Component } from 'react';

interface Dash0ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface Dash0ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * No-op Error Boundary that provides the interface without actual Dash0 integration
 */
export class Dash0ErrorBoundary extends Component<
  Dash0ErrorBoundaryProps,
  Dash0ErrorBoundaryState
> {
  constructor(props: Dash0ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): Dash0ErrorBoundaryState {
    console.debug('Error Boundary (no-op):', error.message);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    console.debug('Error caught (no-op):', error.message, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
