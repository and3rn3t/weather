import { QuickActionsPanel } from '../components/modernWeatherUI/iOS26MainScreen';
import { IOS26WeatherDemo } from '../components/modernWeatherUI/iOS26WeatherDemo';
import { useHaptic } from '../utils/hapticHooks';
import type { ThemeColors } from '../utils/themeConfig';

interface LazyHomeScreenProps {
  theme: ThemeColors;
  navigate: (screenName: string) => void;
  haptic: ReturnType<typeof useHaptic>;
}

/**
 * Lazy-loaded Home Screen Component
 * Extracted from AppNavigator for better code splitting
 */
function LazyHomeScreen({ theme, navigate, haptic }: LazyHomeScreenProps) {
  return (
    <div className="ios26-weather-details-container ios26-container ios26-p-0 main-content-area">
      {/* iOS 26 Navigation Bar */}
      <div className="ios26-navigation-bar">
        <h1 className="ios-title1 ios26-text-primary">Today's Weather</h1>
        <button
          className="ios26-button ios26-button-secondary"
          onClick={() => {
            haptic.buttonPress();
            navigate('Settings');
          }}
        >
          ⚙️
        </button>
      </div>

      {/* Quick Actions Panel */}
      <QuickActionsPanel
        theme={theme}
        onLocationSearch={() => {
          haptic.buttonPress();
          navigate('Search');
        }}
        onFavorites={() => {
          haptic.buttonPress();
          navigate('Favorites');
        }}
        onSettings={() => {
          haptic.buttonPress();
          navigate('Settings');
        }}
        onRadar={() => {
          haptic.buttonPress();
          // Future radar implementation
        }}
      />

      {/* iOS 26 Weather Demo - Simple Integration */}
      <IOS26WeatherDemo theme={theme} />
    </div>
  );
}

export default LazyHomeScreen;
