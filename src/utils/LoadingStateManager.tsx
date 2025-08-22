import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

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
  setLoading: (operation: LoadingOperation, isLoading: boolean, progress?: number) => void;
  setError: (operation: LoadingOperation, error: string) => void;
  clearError: (operation: LoadingOperation) => void;
  retry: (operation: LoadingOperation, retryFn: () => Promise<void>) => Promise<void>;
  isAnyLoading: boolean;
  getLoadingState: (operation: LoadingOperation) => LoadingState | undefined;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Map<LoadingOperation, LoadingState>>(
    new Map(),
  );

  const setLoading = useCallback((operation: LoadingOperation, isLoading: boolean, progress?: number) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(operation) || { operation, isLoading: false };
      
      newStates.set(operation, {
        ...currentState,
        isLoading,
        progress,
        error: isLoading ? undefined : currentState.error, // Clear error when starting new operation
      });
      
      return newStates;
    });
  }, []);

  const setError = useCallback((operation: LoadingOperation, error: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(operation) || { operation, isLoading: false };
      
      newStates.set(operation, {
        ...currentState,
        isLoading: false,
        error,
        retryCount: (currentState.retryCount || 0) + 1,
      });
      
      return newStates;
    });
  }, []);

  const clearError = useCallback((operation: LoadingOperation) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(operation);
      
      if (currentState) {
        newStates.set(operation, {
          ...currentState,
          error: undefined,
          retryCount: 0,
        });
      }
      
      return newStates;
    });
  }, []);

  const retry = useCallback(async (operation: LoadingOperation, retryFn: () => Promise<void>) => {
    const currentState = loadingStates.get(operation);
    const retryCount = currentState?.retryCount || 0;
    
    // Limit retry attempts
    if (retryCount >= 3) {
      setError(operation, 'Maximum retry attempts reached. Please try again later.');
      return;
    }

    clearError(operation);
    setLoading(operation, true);
    
    try {
      await retryFn();
      setLoading(operation, false);
    } catch (error) {
      setError(operation, error instanceof Error ? error.message : 'Operation failed');
    }
  }, [loadingStates, setLoading, setError, clearError]);

  const isAnyLoading = Array.from(loadingStates.values()).some(state => state.isLoading);

  const getLoadingState = useCallback((operation: LoadingOperation) => {
    return loadingStates.get(operation);
  }, [loadingStates]);

  const contextValue: LoadingContextType = useMemo(() => ({
    loadingStates,
    setLoading,
    setError,
    clearError,
    retry,
    isAnyLoading,
    getLoadingState,
  }), [loadingStates, setLoading, setError, clearError, retry, isAnyLoading, getLoadingState]);

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

// Hook for specific operation loading state
export const useOperationLoading = (operation: LoadingOperation) => {
  const { getLoadingState, setLoading, setError, clearError, retry } = useLoading();
  
  return {
    loadingState: getLoadingState(operation),
    setLoading: (isLoading: boolean, progress?: number) => setLoading(operation, isLoading, progress),
    setError: (error: string) => setError(operation, error),
    clearError: () => clearError(operation),
    retry: (retryFn: () => Promise<void>) => retry(operation, retryFn),
  };
};
