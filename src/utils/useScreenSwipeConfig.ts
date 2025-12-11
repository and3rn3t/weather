/**
 * Screen Swipe Configuration Hook
 *
 * Provides screen-specific swipe navigation configuration
 */

export interface SwipeConfig {
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  leftHint: string | null;
  rightHint: string | null;
}

/**
 * Hook for screen-specific swipe configuration
 */
/**
 * useScreenSwipeConfig - Custom React hook for useScreenSwipeConfig functionality
 */
/**
 * useScreenSwipeConfig - Custom React hook for useScreenSwipeConfig functionality
 */
export const useScreenSwipeConfig = (currentScreen: string): SwipeConfig => {
  const getSwipeConfig = (): SwipeConfig => {
    // Define screen order for circular navigation
    const screenOrder: Array<
      'Home' | 'Weather' | 'Search' | 'Favorites' | 'Settings'
    > = ['Home', 'Weather', 'Search', 'Favorites', 'Settings'];

    const currentIndex = screenOrder.indexOf(
      currentScreen as 'Home' | 'Weather' | 'Search' | 'Favorites' | 'Settings'
    );

    if (currentIndex === -1) {
      return {
        canSwipeLeft: false,
        canSwipeRight: false,
        leftHint: null,
        rightHint: null,
      };
    }

    const nextScreen = screenOrder[(currentIndex + 1) % screenOrder.length];
    const prevScreen =
      screenOrder[(currentIndex - 1 + screenOrder.length) % screenOrder.length];

    return {
      canSwipeLeft: true, // Can always swipe to next screen
      canSwipeRight: true, // Can always swipe to previous screen
      leftHint: nextScreen,
      rightHint: prevScreen,
    };
  };

  return getSwipeConfig();
};

export default useScreenSwipeConfig;
