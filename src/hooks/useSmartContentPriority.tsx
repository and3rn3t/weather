/**
 * Smart Content Prioritization Hook
 *
 * Dynamically prioritizes weather content based on:
 * - Screen size and orientation
 * - Connection speed
 * - User preferences
 * - Time of day
 * - Weather conditions
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';

interface ContentPriority {
  id: string;
  component:
    | 'current'
    | 'hourly'
    | 'daily'
    | 'metrics'
    | 'visualizations'
    | 'alerts';
  priority: number; // 1-10, higher = more important
  reason: string;
  shouldShow: boolean;
  loadOrder: number;
}

interface WeatherContext {
  temperature?: number;
  weatherCode?: number;
  isExtreme?: boolean;
  hasAlerts?: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export const useSmartContentPriority = (weatherContext: WeatherContext) => {
  // Simple device detection without external dependency
  const deviceInfo = useMemo(
    () => ({
      screenSize:
        window.innerWidth < 768 ? ('small' as const) : ('large' as const),
      orientation:
        window.innerWidth > window.innerHeight
          ? ('landscape' as const)
          : ('portrait' as const),
    }),
    [],
  );

  const [userPreferences, setUserPreferences] = useState({
    prioritizeAlerts: true,
    showExtendedForecast: true,
    enableVisualizations: true,
    preferCompactView: false,
  });

  const calculatePriorities = useCallback((): ContentPriority[] => {
    const priorities: ContentPriority[] = [];
    const isSmallScreen = deviceInfo.screenSize === 'small';
    const isSlowConnection = false; // Simplified for now
    const isLandscape = deviceInfo.orientation === 'landscape';

    // 1. Current Weather (always highest priority)
    priorities.push({
      id: 'current-weather',
      component: 'current',
      priority: 10,
      reason: 'Most important information for users',
      shouldShow: true,
      loadOrder: 1,
    });

    // 2. Weather Alerts (critical if present)
    if (weatherContext.hasAlerts || weatherContext.isExtreme) {
      priorities.push({
        id: 'weather-alerts',
        component: 'alerts',
        priority: 9,
        reason: 'Safety-critical information',
        shouldShow: true,
        loadOrder: 2,
      });
    }

    // 3. Today's Hourly Forecast (high priority, context-dependent)
    const hourlyPriority = (() => {
      // Higher priority in morning (planning day) and evening (planning next day)
      if (weatherContext.timeOfDay === 'morning') return 8;
      if (weatherContext.timeOfDay === 'evening') return 7;
      return 6;
    })();

    priorities.push({
      id: 'hourly-forecast',
      component: 'hourly',
      priority: hourlyPriority,
      reason: `${weatherContext.timeOfDay} context increases relevance`,
      shouldShow: true,
      loadOrder: 3,
    });

    // 4. Key Weather Metrics (adaptive based on screen size)
    const metricsPriority = isSmallScreen ? 5 : 7;
    priorities.push({
      id: 'weather-metrics',
      component: 'metrics',
      priority: metricsPriority,
      reason: isSmallScreen
        ? 'Reduced priority on small screens'
        : 'Important contextual data',
      shouldShow: true,
      loadOrder: 4,
    });

    // 5. Weekly Forecast (lower priority, especially on small screens)
    const weeklyPriority = (() => {
      if (isSmallScreen && isLandscape) return 3; // Very low in landscape
      if (isSmallScreen) return 4;
      return 6;
    })();

    priorities.push({
      id: 'weekly-forecast',
      component: 'daily',
      priority: weeklyPriority,
      reason: isSmallScreen
        ? 'Deprioritized on mobile'
        : 'Planning information',
      shouldShow: !isSmallScreen || !isLandscape,
      loadOrder: 5,
    });

    // 6. Weather Visualizations (conditional based on capabilities)
    const showVisualizations =
      userPreferences.enableVisualizations &&
      !isSlowConnection &&
      !userPreferences.preferCompactView &&
      deviceInfo.screenSize !== 'small';

    if (showVisualizations) {
      priorities.push({
        id: 'weather-visualizations',
        component: 'visualizations',
        priority: 3,
        reason: 'Enhanced experience for capable devices',
        shouldShow: true,
        loadOrder: 6,
      });
    }

    return priorities.sort((a, b) => b.priority - a.priority);
  }, [deviceInfo, weatherContext, userPreferences]);

  const [contentPriorities, setContentPriorities] = useState<ContentPriority[]>(
    [],
  );

  useEffect(() => {
    setContentPriorities(calculatePriorities());
  }, [calculatePriorities]);

  // Get content that should be shown immediately (above the fold)
  const aboveFoldContent = useMemo(() => {
    return contentPriorities
      .filter(item => item.shouldShow && item.priority >= 7)
      .sort((a, b) => a.loadOrder - b.loadOrder);
  }, [contentPriorities]);

  // Get content that can be lazy loaded
  const belowFoldContent = useMemo(() => {
    return contentPriorities
      .filter(item => item.shouldShow && item.priority < 7)
      .sort((a, b) => a.loadOrder - b.loadOrder);
  }, [contentPriorities]);

  // Get content to hide on current screen size/connection
  const hiddenContent = useMemo(() => {
    return contentPriorities.filter(item => !item.shouldShow);
  }, [contentPriorities]);

  const updateUserPreferences = useCallback(
    (newPreferences: Partial<typeof userPreferences>) => {
      setUserPreferences(prev => ({ ...prev, ...newPreferences }));
    },
    [],
  );

  // Auto-adjust based on extreme weather
  useEffect(() => {
    if (weatherContext.isExtreme || weatherContext.hasAlerts) {
      setUserPreferences(prev => ({
        ...prev,
        prioritizeAlerts: true,
        preferCompactView: true, // Show more critical info
      }));
    }
  }, [weatherContext.isExtreme, weatherContext.hasAlerts]);

  const getLayoutConfig = useCallback(() => {
    const isCompact =
      deviceInfo.screenSize === 'small' || userPreferences.preferCompactView;

    return {
      isCompact,
      maxVisibleMetrics: isCompact ? 4 : 6,
      showInlineForecasts: !isCompact,
      useHorizontalScrolling: isCompact,
      enableDataVisualization:
        !isCompact && userPreferences.enableVisualizations,
      cardSpacing: isCompact ? ('tight' as const) : ('comfortable' as const),
      textDensity: isCompact ? ('dense' as const) : ('normal' as const),
    };
  }, [deviceInfo.screenSize, userPreferences]);

  return {
    contentPriorities,
    aboveFoldContent,
    belowFoldContent,
    hiddenContent,
    layoutConfig: getLayoutConfig(),
    userPreferences,
    updateUserPreferences,
    isSmartModeActive: true,
  };
};

// Component wrapper for priority-based rendering
interface SmartContentWrapperProps {
  priority: ContentPriority;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const SmartContentWrapper: React.FC<SmartContentWrapperProps> = ({
  priority,
  children,
  fallback = null,
}) => {
  const [isVisible, setIsVisible] = useState(priority.priority >= 7);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    // Immediate render for high priority content
    if (priority.priority >= 7) {
      setIsVisible(true);
      return;
    }

    // Intersection observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
          // Slight delay to prevent overwhelming the main thread
          setTimeout(() => setIsVisible(true), priority.loadOrder * 100);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      },
    );

    const element = document.getElementById(`content-${priority.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [priority, hasIntersected]);

  if (!priority.shouldShow) {
    return null;
  }

  return (
    <div
      id={`content-${priority.id}`}
      className={`smart-content-wrapper priority-${priority.priority}`}
      data-component={priority.component}
      data-reason={priority.reason}
    >
      {isVisible ? children : fallback}
    </div>
  );
};
