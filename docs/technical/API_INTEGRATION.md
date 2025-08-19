# API Integration Documentation

## 🌐 Weather APIs Overview

Our weather app uses **two completely free APIs** with no registration or API keys required:

### 1. OpenMeteo Weather API

- **URL**: `https://api.open-meteo.com/v1/forecast`
- **Purpose**: Real-time weather data and forecasts
- **Cost**: Completely free
- **Rate Limits**: No authentication required
- **Data Quality**: Professional-grade weather data

### 2. Nominatim Geocoding API

- **URL**: `https://nominatim.openstreetmap.org/search`
- **Purpose**: Convert city names to coordinates
- **Cost**: Completely free
- **Rate Limits**: Reasonable usage expected
- **Data Quality**: OpenStreetMap database

## 🔧 API Implementation

### Weather Data Flow

```typescript
const getWeather = async (city: string) => {
  // Step 1: Convert city name to coordinates
  const geoUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
  const geoResponse = await fetch(geoUrl, {
    headers: { 'User-Agent': 'WeatherApp/1.0 (and3rn3t@icloud.com)' },
  });
  const geoData = await geoResponse.json();

  if (!geoData || geoData.length === 0) {
    throw new Error('City not found. Please check the spelling and try again.');
  }

  const { lat, lon } = geoData[0];

  // Step 2: Get weather data using coordinates
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,surface_pressure,uv_index,visibility,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=7`;

  const weatherResponse = await fetch(weatherUrl);
  const weatherData = await weatherResponse.json();

  // Step 3: Transform data for our UI
  return transformWeatherData(weatherData);
};
```

## 📊 Data Transformation

### OpenMeteo Response Structure

```typescript
interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weathercode: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    surface_pressure: number[];
    uv_index: number[];
    visibility: number[];
  };
  daily: {
    time: string[];
    weathercode: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    windspeed_10m_max: number[];
  };
}
```

### Our App's Data Structure

```typescript
interface WeatherData {
  main: {
    temp: number; // Current temperature in Fahrenheit
    feels_like: number; // Apparent temperature
    humidity: number; // Relative humidity percentage
    pressure: number; // Atmospheric pressure in hPa
  };
  weather: {
    description: string; // Human-readable condition
  }[];
  wind: {
    speed: number; // Wind speed in mph
    deg: number; // Wind direction in degrees
  };
  uv_index: number; // UV index (0-11+ scale)
  visibility: number; // Visibility in meters
}
```

### Weather Code Mapping

```typescript
const getWeatherDescription = (code: number): string => {
  const descriptions: { [key: number]: string } = {
    0: 'clear sky',
    1: 'mainly clear',
    2: 'partly cloudy',
    3: 'overcast',
    45: 'fog',
    48: 'depositing rime fog',
    51: 'light drizzle',
    53: 'moderate drizzle',
    55: 'dense drizzle',
    61: 'light rain',
    63: 'moderate rain',
    65: 'heavy rain',
    71: 'light snow',
    73: 'moderate snow',
    75: 'heavy snow',
    80: 'light rain showers',
    81: 'moderate rain showers',
    82: 'violent rain showers',
    95: 'thunderstorm',
    96: 'thunderstorm with slight hail',
    99: 'thunderstorm with heavy hail',
  };
  return descriptions[code] || 'unknown';
};
```

## 🔒 Error Handling

### Comprehensive Error Management

```typescript
const getWeather = async (city: string) => {
  try {
    // Geocoding errors
    if (!geoResponse.ok) {
      throw new Error(`Geocoding failed: ${geoResponse.status}`);
    }

    if (!geoData || geoData.length === 0) {
      throw new Error('City not found. Please check the spelling and try again.');
    }

    // Weather API errors
    if (!weatherResponse.ok) {
      throw new Error(`Weather API failed: ${weatherResponse.status}`);
    }

    // Data validation
    if (!weatherData.current_weather) {
      throw new Error('Invalid weather data received');
    }
  } catch (error) {
    // User-friendly error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    setError(`Failed to fetch weather data: ${errorMessage}`);
  }
};
```

### Error Categories

1. **Network Errors**: Connection issues, timeouts
2. **API Errors**: HTTP status codes (404, 500, etc.)
3. **Data Errors**: Invalid or missing data
4. **User Errors**: Invalid city names, typos

## 🚀 Performance Optimization

### Request Optimization

```typescript
// Debounced search to prevent excessive API calls
const debouncedSearch = useMemo(() => debounce((city: string) => getWeather(city), 300), []);

// Request deduplication
const requestCache = new Map<string, Promise<WeatherData>>();

const getCachedWeather = (city: string) => {
  if (requestCache.has(city)) {
    return requestCache.get(city)!;
  }

  const request = getWeather(city);
  requestCache.set(city, request);

  // Clear cache after 5 minutes
  setTimeout(() => requestCache.delete(city), 5 * 60 * 1000);

  return request;
};
```

### Response Caching

```typescript
// Simple in-memory cache
const weatherCache = new Map<
  string,
  {
    data: WeatherData;
    timestamp: number;
    expires: number;
  }
>();

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

const getCachedWeatherData = (city: string): WeatherData | null => {
  const cached = weatherCache.get(city);

  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }

  // Remove expired cache
  if (cached) {
    weatherCache.delete(city);
  }

  return null;
};
```

## 📱 Mobile API Considerations

### Network Conditions

```typescript
// Handle slow networks
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

try {
  const response = await fetch(url, {
    signal: controller.signal,
    headers: {
      'Cache-Control': 'no-cache',
      'User-Agent': 'WeatherApp/1.0 Mobile',
    },
  });
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timed out. Please check your connection.');
  }
  throw error;
} finally {
  clearTimeout(timeoutId);
}
```

### Offline Handling

```typescript
// Check network status
const isOnline = navigator.onLine;

if (!isOnline) {
  // Show cached data or offline message
  const cachedData = getCachedWeatherData(city);
  if (cachedData) {
    setWeather(cachedData);
    setError('Showing cached data. You are offline.');
  } else {
    setError('No internet connection. Please try again when online.');
  }
  return;
}
```

## 🔮 Future API Enhancements

### Planned Improvements

1. **Service Worker Caching**: Persistent offline data
2. **Background Sync**: Update data when online
3. **GraphQL Layer**: Optimized data fetching
4. **Real-time Updates**: WebSocket integration

### Additional APIs (Future)

1. **Air Quality**: Environmental data
2. **Weather Alerts**: Severe weather warnings
3. **Satellite Imagery**: Visual weather maps
4. **Historical Data**: Weather history and trends

## 📚 API Documentation References

### OpenMeteo Documentation

- **Main Site**: [https://open-meteo.com/](https://open-meteo.com/)
- **API Docs**: [https://open-meteo.com/en/docs](https://open-meteo.com/en/docs)
- **Weather Codes**:
  [https://open-meteo.com/en/docs#weathervariables](https://open-meteo.com/en/docs#weathervariables)
- **Examples**: [https://open-meteo.com/en/docs#examples](https://open-meteo.com/en/docs#examples)

### Nominatim Documentation

- **Main Site**: [https://nominatim.org/](https://nominatim.org/)
- **API Docs**:
  [https://nominatim.org/release-docs/develop/api/Search/](https://nominatim.org/release-docs/develop/api/Search/)
- **Usage Policy**:
  [https://operations.osmfoundation.org/policies/nominatim/](https://operations.osmfoundation.org/policies/nominatim/)
- **Examples**:
  [https://nominatim.org/release-docs/develop/api/Examples/](https://nominatim.org/release-docs/develop/api/Examples/)

## 🛠️ Development Tools

### API Testing

```bash
# Test geocoding
curl "https://nominatim.openstreetmap.org/search?q=London&format=json&limit=1"

# Test weather API
curl "https://api.open-meteo.com/v1/forecast?latitude=51.5074&longitude=-0.1278&current_weather=true"
```

### Monitoring

```typescript
// API response time tracking
const startTime = performance.now();
const response = await fetch(url);
const responseTime = performance.now() - startTime;

console.log(`API response time: ${responseTime.toFixed(2)}ms`);

// Error rate monitoring
let apiErrorCount = 0;
let apiSuccessCount = 0;

const trackAPICall = (success: boolean) => {
  if (success) {
    apiSuccessCount++;
  } else {
    apiErrorCount++;
  }

  const errorRate = apiErrorCount / (apiErrorCount + apiSuccessCount);
  if (errorRate > 0.1) {
    // 10% error rate threshold
    console.warn(`High API error rate: ${(errorRate * 100).toFixed(1)}%`);
  }
};
```
