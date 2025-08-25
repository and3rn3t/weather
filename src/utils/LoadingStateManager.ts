import { createContext, useContext } from 'react';

// Loading state types for different operations
export type LoadingOperation =
  | 'weatherData'
  | 'forecast'
  | 'location'
  | 'background-refresh'
  | 'search'
  | 'settings';

export interface LoadingState {
  operation: LoadingOperation;
  isLoading: boolean;
  progress?: number; // 0-100 for progress indication
  error?: string;
  retryCount?: number;
}

export interface LoadingContextType {
  loadingStates: Map<LoadingOperation, LoadingState>;
  setLoading: (
    operation: LoadingOperation,
    isLoading: boolean,
    progress?: number
  ) => void;
  setError: (operation: LoadingOperation, error: string) => void;
  clearError: (operation: LoadingOperation) => void;
  retry: (
    operation: LoadingOperation,
    retryFn: () => Promise<void>
  ) => Promise<void>;
  isAnyLoading: boolean;
  getLoadingState: (operation: LoadingOperation) => LoadingState | undefined;
}

export const LoadingContext = createContext<LoadingContextType | undefined>(
  undefined,
);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Hook for specific operation loading state
export const useOperationLoading = (operation: LoadingOperation) => {
  const { getLoadingState, setLoading, setError, clearError, retry } =
    useLoading();

  return {
    loadingState: getLoadingState(operation),
    setLoading: (isLoading: boolean, progress?: number) =>
      setLoading(operation, isLoading, progress),
    setError: (error: string) => setError(operation, error),
    clearError: () => clearError(operation),
    retry: (retryFn: () => Promise<void>) => retry(operation, retryFn),
  };
};
