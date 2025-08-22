import type { ThemeColors } from '../utils/themeConfig';

interface LazySettingsScreenProps {
  theme: ThemeColors;
  navigate: (screenName: string) => void;
}

/**
 * Lazy-loaded Settings Screen Component
 * Future implementation for app settings
 */
function LazySettingsScreen({ theme, navigate }: LazySettingsScreenProps) {
  return (
    <div className="ios26-weather-details-container ios26-container ios26-p-4">
      <div className="ios26-navigation-bar">
        <button
          className="ios26-button ios26-button-secondary"
          onClick={() => navigate('Home')}
        >
          ← Back
        </button>
        <h1 className="ios-title1 ios26-text-primary">Settings</h1>
      </div>

      <div className="ios26-content-section">
        <p className="ios-body ios26-text-secondary">
          App settings and preferences coming soon...
        </p>
      </div>
    </div>
  );
}

export default LazySettingsScreen;
