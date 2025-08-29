import React, { useCallback, useState } from 'react';
import VoiceSearchFeature from '../features/VoiceSearch';
import { useHaptic } from '../utils/hapticHooks';
import LocationButton from '../utils/LocationButton';
import { logError } from '../utils/logger';
import { optimizedFetchJson } from '../utils/optimizedFetch';
import SimpleAutocomplete from '../utils/SimpleAutocomplete';
import type { ThemeColors } from '../utils/themeConfig';
import { SimpleEnhancedButton } from './modernWeatherUI/SimpleIOSComponents';
import SmartWeatherSkeleton from './optimized/SmartWeatherSkeleton';

export interface LocationSearchPanelProps {
  theme: ThemeColors;
  loading?: boolean;
  onCitySelected: (
    city: string,
    lat: number,
    lon: number
  ) => Promise<void> | void;
  onSearch: () => void;
  onLocationDetected: (
    cityName: string,
    latitude: number,
    longitude: number
  ) => void;
  onError: (message: string) => void;
  className?: string;
}

/**
 * LocationSearchPanel
 * Groups location permission, voice search, and city autocomplete into a single engaging panel.
 */
export const LocationSearchPanel: React.FC<LocationSearchPanelProps> = ({
  theme,
  loading = false,
  onCitySelected,
  onSearch,
  onLocationDetected,
  onError,
  className = '',
}) => {
  const [isResolvingVoice, setIsResolvingVoice] = useState(false);
  const [lastVoiceCity, setLastVoiceCity] = useState('');
  const haptic = useHaptic();

  const geocodeCity = useCallback(async (city: string) => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        city
      )}&format=json&limit=1`;
      const data = await optimizedFetchJson<{ lat: string; lon: string }[]>(
        url,
        {},
        `panel:geo:${city}`
      );
      if (!data || data.length === 0) throw new Error('Not found');
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch (err) {
      logError('Voice geocode failed', err);
      throw err;
    }
  }, []);

  const handleVoiceCitySelect = useCallback(
    async (spokenCity: string) => {
      try {
        setIsResolvingVoice(true);
        setLastVoiceCity(spokenCity);
        haptic.buttonPress();
        const { lat, lon } = await geocodeCity(spokenCity);
        await onCitySelected(spokenCity, lat, lon);
        haptic.searchSuccess();
      } catch {
        onError('Unable to resolve that city from voice. Please try again.');
        haptic.searchError();
      } finally {
        setIsResolvingVoice(false);
      }
    },
    [geocodeCity, onCitySelected, onError, haptic]
  );

  return (
    <section
      className={`ios26-forecast-section ios26-card ios26-liquid-glass location-search-panel ${className}`}
      aria-label="Search or use your location"
    >
      {/* Header with voice search */}
      <div className="ios26-flex ios26-items-center ios26-justify-between ios26-mb-3">
        <div className="ios26-text-title3 ios26-text-primary">
          Find a location
        </div>
        <div className="ios26-flex ios26-gap-2">
          <VoiceSearchFeature
            onCitySelect={handleVoiceCitySelect}
            enabled={!loading}
            resolving={isResolvingVoice}
            className="ios26-button ios26-button-secondary"
          />
        </div>
      </div>

      {/* Voice resolving shimmer */}
      {isResolvingVoice && (
        <div className="ios26-mt-2" aria-live="polite" aria-busy="true">
          <SmartWeatherSkeleton variant="metrics" count={1} showPulse={true} />
          <div className="ios26-text-footnote ios26-text-secondary ios26-mt-1">
            Resolving {lastVoiceCity ? `“${lastVoiceCity}”` : 'city'}…
          </div>
        </div>
      )}

      {/* Autocomplete input */}
      <SimpleAutocomplete
        theme={theme}
        onCitySelected={onCitySelected}
        disabled={loading || isResolvingVoice}
        placeholder="Search for a city..."
      />

      {/* Quick actions */}
      <div className="ios26-quick-actions ios26-mt-3">
        <LocationButton
          theme={theme}
          isMobile={true}
          onLocationReceived={onLocationDetected}
          onError={err => onError(err)}
          disabled={loading || isResolvingVoice}
          variant="secondary"
          size="medium"
          showLabel={true}
        />

        <SimpleEnhancedButton
          title={isResolvingVoice ? 'Resolving…' : 'Search Weather'}
          onPress={onSearch}
          disabled={loading || isResolvingVoice}
          variant="primary"
          theme={theme}
          icon="🔍"
        />
      </div>

      {/* Subtle helper text */}
      <div className="ios26-text-footnote ios26-text-tertiary ios26-mt-2">
        Tip: Use your current location for instant results, or try voice search.
      </div>
    </section>
  );
};

export default LocationSearchPanel;
