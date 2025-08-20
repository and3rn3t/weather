/**
 * Location Debug Utility
 *
 * Debug tool for testing geolocation and geocoding functionality
 */

import { useLocationServices } from './useLocationServices';
import { logError, logInfo } from './logger';


/**
 * useLocationDebug - Custom React hook for locationDebug functionality
 */
/**
 * useLocationDebug - Custom React hook for locationDebug functionality
 */
export const useLocationDebug = () => {
  const locationServices = useLocationServices();

  const testGeolocation = async () => {
    logInfo('🧪 Testing Geolocation Functionality');
    logInfo('📍 Geolocation supported:', locationServices.isSupported);

    if (!locationServices.isSupported) {
      logError('❌ Geolocation not supported in this browser');
      return;
    }

    logInfo('🔄 Requesting location...');

    try {
      const location = await locationServices.getCurrentLocation({
        enableHighAccuracy: true,
        timeout: 15000,
        includeAddress: true,
      });

      if (location) {
        logInfo('✅ Location received:', {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          city: location.city,
          country: location.country,
          timestamp: new Date(location.timestamp).toISOString(),
        });
      } else {
        logError('❌ Location request returned null');
      }
    } catch (error) {
      logError('❌ Location request failed:', error);
    }
  };

  const testReverseGeocoding = async (lat: number, lon: number) => {
    logInfo(`🧪 Testing Reverse Geocoding for ${lat}, ${lon}`);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WeatherApp/1.0 (test@example.com)',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logInfo('✅ Reverse geocoding response:', data);

      const address = data.address || {};
      const city =
        address.city ||
        address.town ||
        address.village ||
        address.hamlet ||
        'Unknown Location';

      logInfo('🏙️ Extracted city:', city);
      return { city, country: address.country || '' };
    } catch (error) {
      logError('❌ Reverse geocoding failed:', error);
      return { city: 'Unknown Location', country: '' };
    }
  };

  const testWeatherAPI = async (lat: number, lon: number) => {
    logInfo(`🧪 Testing Weather API for ${lat}, ${lon}`);

    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

      const response = await fetch(weatherUrl, {
        headers: {
          'User-Agent': 'WeatherApp/1.0 (test@example.com)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logInfo('✅ Weather API response:', data);

      if (data.current_weather) {
        logInfo('🌡️ Current weather:', {
          temperature: data.current_weather.temperature,
          windspeed: data.current_weather.windspeed,
          weathercode: data.current_weather.weathercode,
          time: data.current_weather.time,
        });
      }

      return data;
    } catch (error) {
      logError('❌ Weather API failed:', error);
      return null;
    }
  };

  const runFullTest = async () => {
    logInfo('🚀 Running Full Location & Weather Test');
    logInfo('='.repeat(50));

    // Test 1: Basic geolocation
    await testGeolocation();

    // Test 2: Sample reverse geocoding (New York City)
    logInfo('\n🧪 Testing with sample coordinates (NYC):');
    await testReverseGeocoding(40.7128, -74.006);

    // Test 3: Sample weather API (NYC)
    logInfo('\n🧪 Testing weather API with sample coordinates (NYC):');
    await testWeatherAPI(40.7128, -74.006);

    logInfo('\n✅ Full test complete');
  };

  return {
    testGeolocation,
    testReverseGeocoding,
    testWeatherAPI,
    runFullTest,
    locationServices,
  };
};

// Browser console debugging utility
if (typeof window !== 'undefined') {
  (
    window as unknown as { debugLocation: Record<string, unknown> }
  ).debugLocation = {
    testReverseGeocoding: async (lat: number, lon: number) => {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
        {
          headers: { 'User-Agent': 'WeatherApp/1.0 (test@example.com)' },
        }
      );
      const data = await response.json();
      logInfo('Reverse geocoding result:', data);
      return data;
    },
    testWeatherAPI: async (lat: number, lon: number) => {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=fahrenheit`;
      const response = await fetch(weatherUrl);
      const data = await response.json();
      logInfo('Weather API result:', data);
      return data;
    },
  };
}
