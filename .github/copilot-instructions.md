# Copilot Instructions

This project is a weather app built using React Native, TypeScript, and Vite. Below are the key features and components implemented so far:

## Current Implementation Status ✅

### Completed Features
- **HomeScreen**: Modern glassmorphism design with gradient background and weather emoji icon.
- **WeatherDetailsScreen**: Stylish interface for city input with real-time weather data display using OpenMeteo API.
- **AppNavigator**: Custom navigation system using React state (inline components) - works reliably in browser environment.
- **Weather Service**: Real API integration with OpenMeteo (completely free) and OpenStreetMap Nominatim for geocoding.
- **Modern UI**: Beautiful glassmorphism design with gradients, animations, and responsive layout.
- **No API Key Required**: Uses free OpenMeteo API service with no rate limits or subscription requirements.
- **Error Handling**: Comprehensive error handling for API failures, invalid cities, and network issues.
- **Loading States**: Animated loading indicators with spinning icons during API calls.

### Technical Architecture
- **Frontend**: React + TypeScript + Vite for fast development and hot reloading
- **Navigation**: Custom state-based navigation (inline components in AppNavigator.tsx)
- **API Integration**: OpenMeteo for weather data + OpenStreetMap Nominatim for geocoding (both free)
- **Styling**: Modern glassmorphism design with CSS-in-JS, gradients, and animations
- **Units**: Imperial units (Fahrenheit) for temperature display

## Important Technical Notes ⚠️

### Navigation Implementation
- **DO NOT** use separate component files (HomeScreen.tsx, WeatherDetailsScreen.tsx) as they cause blank screen issues
- **USE** inline components within AppNavigator.tsx - this approach is proven to work reliably
- Current navigation uses React state (`useState`) to switch between screens
- React Navigation was abandoned due to React Native Web compatibility issues in browser environment

### API Integration
- **Weather API**: OpenMeteo API - `https://api.open-meteo.com/v1/forecast` (completely free, no API key)
- **Geocoding API**: OpenStreetMap Nominatim - `https://nominatim.openstreetmap.org/search` (free)
- **Two-step process**: City name → coordinates → weather data
- **No Authentication**: Both APIs are free and require no API keys or registration
- **Units**: Uses Fahrenheit for temperature display (imperial units)
- **User-Agent**: Required header for Nominatim geocoding requests

### Development Environment
- **Node.js**: Version 22.12.0 (upgraded from 21.2.0 to resolve crypto.hash compatibility issues)
- **Package Manager**: npm
- **Dev Server**: Vite dev server (typically runs on ports 5173-5178)
- **Browser Testing**: All functionality tested and working in browser environment

### File Structure
```
src/
├── navigation/
│   └── AppNavigator.tsx          # Main navigation with inline screen components and modern UI
├── services/
│   └── weatherService.ts         # Legacy OpenWeatherMap service (kept for reference, not used)
└── screens/                     # Legacy separate components (DO NOT USE)
    ├── HomeScreen.tsx           # Causes blank screen issues
    └── WeatherDetailsScreen.tsx # Causes blank screen issues
```

## Environment Setup

### No Environment Variables Required
- **OpenMeteo**: No API key needed - completely free service
- **Nominatim**: No API key needed - free OpenStreetMap geocoding service
- Simply start the development server and the app works immediately

## Development Commands

### Start Development Server
```powershell
npm run dev
```

### Build for Production
```powershell
npm run build
```

### Preview Production Build
```powershell
npm run preview
```

## Known Working Patterns ✅

1. **Inline Components**: All screen components defined within AppNavigator.tsx
2. **Direct API Calls**: Using fetch() directly in components with OpenMeteo and Nominatim
3. **State Management**: React useState for navigation and data management
4. **Error Boundaries**: Try-catch blocks with user-friendly error messages
5. **Loading States**: Animated loading indicators with CSS animations
6. **Modern Design**: Glassmorphism effects, gradients, and smooth hover animations

## API Integration Details

### OpenMeteo Weather API
- **URL**: `https://api.open-meteo.com/v1/forecast`
- **Parameters**: 
  - `latitude` & `longitude`: From geocoding step
  - `current_weather=true`: Get current conditions
  - `temperature_unit=fahrenheit`: Imperial units
- **Response**: Weather codes mapped to human-readable descriptions
- **Rate Limits**: None - completely free service

### OpenStreetMap Nominatim Geocoding
- **URL**: `https://nominatim.openstreetmap.org/search`
- **Parameters**:
  - `q`: City name to search
  - `format=json`: JSON response format
  - `limit=1`: Single result
- **Headers**: `User-Agent` required for API compliance
- **Response**: Latitude and longitude coordinates

## Known Issues to Avoid ❌

1. **Separate Component Files**: Importing screen components from separate files causes blank screens
2. **React Navigation**: Causes compatibility issues in browser environment
3. **Missing User-Agent**: Nominatim requires User-Agent header in requests
4. **API Dependencies**: Avoid APIs requiring subscription or API keys for simplicity

## Future Enhancements (Roadmap)

- **Mobile Deployment**: Use Expo or React Native CLI for iOS/Android builds
- **Enhanced Weather Data**: Add humidity, wind speed, UV index, hourly/daily forecasts
- **Weather Icons**: Visual weather condition indicators
- **Location Services**: GPS-based weather detection
- **Offline Support**: Cache recent weather data
- **Multiple Cities**: Save favorite locations with local storage
- **Weather Alerts**: Severe weather notifications
- **Dark/Light Theme**: Theme toggle functionality
- **Weather Maps**: Integration with weather radar/satellite imagery

## Design System

### Color Palette
- **Primary Gradient**: Purple to blue (`#667eea` to `#764ba2`)
- **Weather Card**: Sky blue gradient (`#f0f9ff` to `#e0f2fe`)
- **Error States**: Red gradient with proper contrast
- **Text Colors**: Dark blue-gray for readability
- **Backgrounds**: Glassmorphism with blur effects

### Typography
- **Font Stack**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Weights**: 400 (normal), 500 (medium), 600 (semi-bold), 700 (bold), 800 (extra-bold)
- **Sizes**: Responsive scaling from 14px to 48px

## Urgent Note
- All commands or scripts generated for this project must be compatible with Windows and PowerShell environments.
- The app is currently optimized for browser testing but built on React Native foundation for future mobile deployment.
- No API keys or environment variables required - the app works immediately after setup.

For more details, visit the [OpenMeteo documentation](https://open-meteo.com/en/docs) and [React Native documentation](https://reactnative.dev/).
