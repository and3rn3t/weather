import React, { useCallback, useMemo, useState, type ReactNode } from 'react';
import {
  LoadingContext,
  type LoadingContextType,
  type LoadingOperation,
  type LoadingState,
} from './LoadingStateManager';

interface LoadingProviderProps {
  children: ReactNode;
}

const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<
    Map<LoadingOperation, LoadingState>
  >(new Map());

  const setLoading = useCallback(
    (operation: LoadingOperation, isLoading: boolean, progress?: number) => {
      setLoadingStates(prev => {
        const newStates = new Map(prev);
        const currentState = newStates.get(operation) || {
          operation,
          isLoading: false,
        };

        newStates.set(operation, {
          ...currentState,
          isLoading,
          progress,
          error: isLoading ? undefined : currentState.error, // Clear error when starting new operation
        });

        return newStates;
      });
    },
    [],
  );

  const setError = useCallback((operation: LoadingOperation, error: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(operation) || {
        operation,
        isLoading: false,
      };

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

  const retry = useCallback(
    async (operation: LoadingOperation, retryFn: () => Promise<void>) => {
      const currentState = loadingStates.get(operation);
      const retryCount = currentState?.retryCount || 0;

      // Limit retry attempts
      if (retryCount >= 3) {
        setError(
          operation,
          'Maximum retry attempts reached. Please try again later.',
        );
        return;
      }

      clearError(operation);
      setLoading(operation, true);

      try {
        await retryFn();
        setLoading(operation, false);
      } catch (error) {
        setError(
          operation,
          error instanceof Error ? error.message : 'Operation failed',
        );
      }
    },
    [loadingStates, setLoading, setError, clearError],
  );

  const isAnyLoading = Array.from(loadingStates.values()).some(
    state => state.isLoading,
  );

  const getLoadingState = useCallback(
    (operation: LoadingOperation) => {
      return loadingStates.get(operation);
    },
    [loadingStates],
  );

  const contextValue: LoadingContextType = useMemo(
    () => ({
      loadingStates,
      setLoading,
      setError,
      clearError,
      retry,
      isAnyLoading,
      getLoadingState,
    }),
    [
      loadingStates,
      setLoading,
      setError,
      clearError,
      retry,
      isAnyLoading,
      getLoadingState,
    ],
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingProvider;
