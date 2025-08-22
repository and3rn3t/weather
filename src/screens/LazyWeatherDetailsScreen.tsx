import type { ThemeColors } from '../utils/themeConfig';

interface LazyWeatherDetailsScreenProps {
  theme: ThemeColors;
  navigate: (screenName: string) => void;
  // Add other props as needed - this is a placeholder for future extraction
  [key: string]: any;
}

/**
 * Lazy-loaded Weather Details Screen Component
 * Placeholder for future extraction from AppNavigator
 * Currently forwards to the main weather display
 */
function LazyWeatherDetailsScreen({
  navigate,
  ...props
}: LazyWeatherDetailsScreenProps) {
  return (
    <div className="ios26-weather-details-container ios26-container ios26-p-4">
      <div className="ios26-navigation-bar">
        <button
          className="ios26-button ios26-button-secondary"
          onClick={() => navigate('Home')}
        >
          ← Home
        </button>
        <h1 className="ios-title1 ios26-text-primary">Weather Details</h1>
      </div>

      <div className="ios26-content-section">
        <p className="ios-body ios26-text-secondary">
          Weather details functionality - currently integrated in main app...
        </p>
        <button
          className="ios26-button ios26-button-primary"
          onClick={() => navigate('Home')}
        >
          Return to Weather
        </button>
      </div>
    </div>
  );
}

export default LazyWeatherDetailsScreen;
