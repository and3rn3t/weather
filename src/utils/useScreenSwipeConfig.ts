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
export const useScreenSwipeConfig = (currentScreen: string): SwipeConfig => {
  const getSwipeConfig = (): SwipeConfig => {
    switch (currentScreen) {
      case 'Home':
        return {
          canSwipeLeft: true,  // Can swipe left to go to WeatherDetails
          canSwipeRight: false, // Cannot swipe right (no previous screen)
          leftHint: 'Weather Details',
          rightHint: null
        };
      
      case 'WeatherDetails':
        return {
          canSwipeLeft: false,  // Cannot swipe left (no next screen)
          canSwipeRight: true,  // Can swipe right to go back to Home
          leftHint: null,
          rightHint: 'Home'
        };
      
      default:
        return {
          canSwipeLeft: false,
          canSwipeRight: false,
          leftHint: null,
          rightHint: null
        };
    }
  };

  return getSwipeConfig();
};

export default useScreenSwipeConfig;
