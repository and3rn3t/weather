/**
 * Enhanced Search Hook - Integration of Feature 4 Offline Capabilities
 *
 * Provides a drop-in replacement for existing search functionality with
 * comprehensive offline support, performance monitoring, and intelligent caching.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { SearchResultWithMeta } from '../utils/useOfflinePerformance';
import { useOfflinePerformance } from '../utils/useOfflinePerformance';

// Enhanced search result interface
interface EnhancedSearchResult {
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  country: string;
  state?: string;
  confidence?: number;
  offline?: boolean;
  cached?: boolean;
  responseTime?: number;
}

// Search state interface
interface SearchState {
  isSearching: boolean;
  query: string;
  results: EnhancedSearchResult[];
  error: string | null;
  isOffline: boolean;
  performance: {
    lastSearchTime: number;
    averageResponseTime: number;
    cacheHitRate: number;
  };
}

// Hook configuration
const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 25,
  POPULAR_CITIES: [
    'New York',
    'London',
    'Tokyo',
    'Paris',
    'Sydney',
    'Berlin',
    'Toronto',
    'Los Angeles',
    'Chicago',
    'Barcelona',
  ],
} as const;

/**
 * Enhanced Search Hook with Feature 4 Integration
 */
export const useEnhancedSearch = () => {
  // Feature 4 offline capabilities
  const {
    state: offlineState,
    search: offlineSearch,
    preloadPopularSearches,
    getPerformanceReport,
    optimizePerformance,
  } = useOfflinePerformance();

  // Local search state
  const [searchState, setSearchState] = useState<SearchState>({
    isSearching: false,
    query: '',
    results: [],
    error: null,
    isOffline: !navigator.onLine,
    performance: {
      lastSearchTime: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
    },
  });

  // Refs for debouncing and cancellation
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchAbortController = useRef<AbortController | null>(null);
  const performanceHistory = useRef<number[]>([]);

  /**
   * Initialize enhanced search capabilities
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Preload popular cities for offline use
        await preloadPopularSearches([...SEARCH_CONFIG.POPULAR_CITIES]);

        // Initial performance optimization
        await optimizePerformance();

        // eslint-disable-next-line no-console
        console.log('🚀 Enhanced search initialized with offline capabilities');
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('❌ Failed to initialize enhanced search:', error);
      }
    };

    if (offlineState.isInitialized) {
      initialize();
    }

    // Update offline status
    const handleOnline = () =>
      setSearchState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () =>
      setSearchState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }
    };
  }, [offlineState.isInitialized, preloadPopularSearches, optimizePerformance]);

  /**
   * Enhanced search function with comprehensive offline support
   */
  const performEnhancedSearch = useCallback(
    async (query: string) => {
      // Cancel previous search
      if (searchAbortController.current) {
        searchAbortController.current.abort();
      }

      // Validate query
      if (!query.trim() || query.length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
        setSearchState(prev => ({
          ...prev,
          results: [],
          error: null,
          isSearching: false,
        }));
        return;
      }

      // Setup new search
      searchAbortController.current = new AbortController();
      const startTime = performance.now();

      setSearchState(prev => ({
        ...prev,
        isSearching: true,
        query: query.trim(),
        error: null,
      }));

      try {
        // Use Feature 4 enhanced search with offline capabilities
        const searchResult: SearchResultWithMeta = await offlineSearch(query, {
          source: searchState.isOffline ? 'cache' : 'auto',
          timeout: 10000,
          priority: 'high',
          useCache: true,
          autoCorrect: true,
        });

        const responseTime = performance.now() - startTime;

        // Update performance history
        performanceHistory.current.push(responseTime);
        if (performanceHistory.current.length > 10) {
          performanceHistory.current.shift();
        }

        // Transform results to expected format
        const enhancedResults: EnhancedSearchResult[] = (
          searchResult.results as Record<string, unknown>[]
        )
          .map((item: Record<string, unknown>) => {
            const displayName =
              (item.display_name as string) ||
              (item.name as string) ||
              'Unknown Location';
            const address = item.address as Record<string, unknown> | undefined;

            return {
              name: displayName.split(',')[0] || 'Unknown',
              display_name: displayName,
              lat: (item.lat as string) || '0',
              lon: (item.lon as string) || '0',
              country:
                (address?.country as string) ||
                (item.country as string) ||
                'Unknown',
              state: (address?.state as string) || (item.state as string),
              confidence: searchResult.metadata.accuracy || 0.8,
              offline: searchResult.metadata.offline,
              cached: searchResult.metadata.cached,
              responseTime: searchResult.metadata.responseTime,
            };
          })
          .filter(
            result =>
              result.lat !== '0' &&
              result.lon !== '0' &&
              result.display_name !== 'Unknown Location'
          )
          .slice(0, SEARCH_CONFIG.MAX_RESULTS);

        // Apply fuzzy search filtering for better relevance
        const fuzzyFilteredResults = enhancedResults
          .map(result => ({
            ...result,
            relevanceScore: calculateRelevanceScore(query, result),
          }))
          .filter(result => result.relevanceScore > 0.3)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 8);

        // Update state with results
        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          results: fuzzyFilteredResults,
          performance: {
            lastSearchTime: responseTime,
            averageResponseTime:
              performanceHistory.current.reduce((a, b) => a + b, 0) /
              performanceHistory.current.length,
            cacheHitRate: offlineState.cacheStatus.hitRate,
          },
        }));
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Search failed:', error);

        setSearchState(prev => ({
          ...prev,
          isSearching: false,
          error: searchState.isOffline
            ? 'Search unavailable offline. Try a different query.'
            : 'Search failed. Please try again.',
          results: [],
        }));
      }
    },
    [offlineSearch, searchState.isOffline, offlineState.cacheStatus.hitRate]
  );

  /**
   * Debounced search function
   */
  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        performEnhancedSearch(query);
      }, SEARCH_CONFIG.DEBOUNCE_DELAY);
    },
    [performEnhancedSearch]
  );

  /**
   * Calculate relevance score for fuzzy matching
   */
  const calculateRelevanceScore = (
    query: string,
    result: EnhancedSearchResult
  ): number => {
    const queryLower = query.toLowerCase();
    const nameLower = result.name.toLowerCase();
    const displayLower = result.display_name.toLowerCase();

    let score = 0;

    // Exact match bonus
    if (nameLower === queryLower) {
      score += 100;
    } else if (nameLower.startsWith(queryLower)) {
      score += 80;
    } else if (nameLower.includes(queryLower)) {
      score += 60;
    }

    // Display name matching
    if (displayLower.includes(queryLower)) {
      score += 40;
    }

    // Character-by-character fuzzy matching
    let queryIndex = 0;
    for (
      let i = 0;
      i < nameLower.length && queryIndex < queryLower.length;
      i++
    ) {
      if (nameLower[i] === queryLower[queryIndex]) {
        score += 10;
        queryIndex++;
      }
    }

    // Bonus for completing all characters
    if (queryIndex === queryLower.length) {
      score += 30;
    }

    // Confidence and performance bonuses
    if (result.confidence) {
      score *= result.confidence;
    }

    if (result.cached) {
      score += 5; // Small bonus for cached results
    }

    return Math.min(score, 100) / 100; // Normalize to 0-1
  };

  /**
   * Get performance insights
   */
  const getSearchPerformance = useCallback(() => {
    const report = getPerformanceReport();

    return {
      ...searchState.performance,
      offlineCapable: offlineState.isInitialized,
      cacheSize: offlineState.cacheStatus.size,
      networkStatus: offlineState.isOnline ? 'online' : 'offline',
      recommendations: report.recommendations,
      score: report.performanceScore,
    };
  }, [searchState.performance, offlineState, getPerformanceReport]);

  /**
   * Clear search results
   */
  const clearSearch = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchAbortController.current) {
      searchAbortController.current.abort();
    }

    setSearchState(prev => ({
      ...prev,
      query: '',
      results: [],
      error: null,
      isSearching: false,
    }));
  }, []);

  /**
   * Retry search (useful for offline scenarios)
   */
  const retrySearch = useCallback(() => {
    if (searchState.query) {
      performEnhancedSearch(searchState.query);
    }
  }, [searchState.query, performEnhancedSearch]);

  return {
    // State
    searchState,
    offlineCapabilities: {
      isInitialized: offlineState.isInitialized,
      isOnline: offlineState.isOnline,
      cacheStatus: offlineState.cacheStatus,
      autoOptimization: offlineState.autoOptimization,
    },

    // Actions
    search: debouncedSearch,
    searchImmediate: performEnhancedSearch,
    clearSearch,
    retrySearch,

    // Performance & Analytics
    getSearchPerformance,
    optimizePerformance,
  };
};

export type { EnhancedSearchResult, SearchState };
