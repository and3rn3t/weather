/**
 * Test Utilities
 * 
 * Common utilities and helpers for testing the modern weather app
 * All components use inline implementations in AppNavigator.tsx
 */

// ========================================================================
// MOCK DATA GENERATORS
// ========================================================================

/**
 * Generates mock weather data for modern OpenMeteo API format
 */
export const createMockWeatherData = (overrides = {}) => ({
  main: {
    temp: 72,
    feels_like: 70,
    humidity: 65,
    pressure: 1013,
  },
  weather: [{
    description: 'clear sky'
  }],
  wind: {
    speed: 5,
    deg: 180
  },
  uv_index: 5,
  visibility: 10000,
  ...overrides
});

/**
 * Generates mock geocoding response
 */
export const createMockGeocodingResponse = (city = 'New York', lat = 40.7128, lon = -74.0060) => ([
  { lat: lat.toString(), lon: lon.toString(), display_name: city }
]);

/**
 * Generates mock OpenMeteo weather response
 */
export const createMockOpenMeteoResponse = (overrides = {}) => ({
  current_weather: {
    temperature: 72,
    weathercode: 0,
    windspeed: 5,
    winddirection: 180,
  },
  hourly: {
    apparent_temperature: Array(24).fill(70),
    relative_humidity_2m: Array(24).fill(70),
    surface_pressure: Array(24).fill(1013),
    uv_index: Array(24).fill(5),
    visibility: Array(24).fill(10000)
  },
  ...overrides
});

// ========================================================================
// MOCK NAVIGATION HELPER
// ========================================================================

/**
 * Creates a mock navigation object for testing
 */
export const createMockNavigation = () => {
  const navigate = jest.fn();
  return { navigate };
};

// ========================================================================
// API MOCK HELPERS
// ========================================================================

/**
 * Sets up successful fetch mocks for geocoding and weather APIs
 */
export const setupSuccessfulApiFetch = (
  cityName = 'New York',
  weatherData = createMockOpenMeteoResponse()
) => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  // Mock geocoding response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => createMockGeocodingResponse(cityName),
  } as Response);
  
  // Mock weather response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => weatherData,
  } as Response);
};

/**
 * Sets up failed fetch mocks for testing error scenarios
 */
export const setupFailedApiFetch = (
  failAtGeocoding = false,
  errorMessage = 'API Error'
) => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  if (failAtGeocoding) {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);
  } else {
    // Successful geocoding
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => createMockGeocodingResponse(),
    } as Response);
    
    // Failed weather API
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => errorMessage,
    } as Response);
  }
};

/**
 * Sets up empty geocoding response (city not found)
 */
export const setupCityNotFoundFetch = () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => [], // Empty array indicates city not found
  } as Response);
};

// ========================================================================
// WEATHER ICON MAPPING
// ========================================================================

/**
 * Weather code to icon mapping for testing
 */
export const WEATHER_ICON_MAP = {
  0: '☀️',    // Clear sky
  1: '🌤️',   // Mainly clear
  2: '☁️',    // Partly cloudy
  3: '☁️',    // Overcast
  45: '🌫️',  // Fog
  48: '🌫️',  // Depositing rime fog
  51: '🌦️',  // Light drizzle
  53: '🌦️',  // Moderate drizzle
  55: '🌦️',  // Dense drizzle
  61: '🌧️',  // Light rain
  63: '🌧️',  // Moderate rain
  65: '🌧️',  // Heavy rain
  71: '❄️',   // Light snow
  73: '❄️',   // Moderate snow
  75: '❄️',   // Heavy snow
  80: '🌦️',  // Light rain showers
  81: '🌦️',  // Moderate rain showers
  82: '🌦️',  // Violent rain showers
  95: '⛈️',   // Thunderstorm
  96: '⛈️',   // Thunderstorm with slight hail
  99: '⛈️'    // Thunderstorm with heavy hail
};

/**
 * Gets expected weather icon for a given weather code
 */
export const getExpectedWeatherIcon = (code: number): string => {
  return WEATHER_ICON_MAP[code as keyof typeof WEATHER_ICON_MAP] || '🌤️';
};

// ========================================================================
// ASYNC TESTING HELPERS
// ========================================================================

/**
 * Waits for a specific amount of time (useful for testing loading states)
 */
export const waitFor = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Creates a delayed promise for testing loading states
 */
export const createDelayedPromise = <T>(data: T, delay = 100): Promise<T> => 
  new Promise(resolve => setTimeout(() => resolve(data), delay));

// ========================================================================
// TEST CONSTANTS
// ========================================================================

export const TEST_CITIES = {
  NEW_YORK: {
    name: 'New York',
    lat: 40.7128,
    lon: -74.0060
  },
  LONDON: {
    name: 'London',
    lat: 51.5074,
    lon: -0.1278
  },
  TOKYO: {
    name: 'Tokyo',
    lat: 35.6762,
    lon: 139.6503
  },
  SYDNEY: {
    name: 'Sydney',
    lat: -33.8688,
    lon: 151.2093
  }
};

export const TEST_WEATHER_CONDITIONS = {
  CLEAR: { code: 0, description: 'clear sky', icon: '☀️' },
  CLOUDY: { code: 3, description: 'overcast', icon: '☁️' },
  RAINY: { code: 61, description: 'light rain', icon: '🌧️' },
  SNOWY: { code: 71, description: 'light snow', icon: '❄️' },
  STORMY: { code: 95, description: 'thunderstorm', icon: '⛈️' }
};

// ========================================================================
// CONSOLE MOCK HELPERS
// ========================================================================

/**
 * Suppresses console output during tests
 */
export const suppressConsole = () => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  return {
    restore: () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };
};
