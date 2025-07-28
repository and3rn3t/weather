# Copilot Instructions

This project is a premium weather app built using React + TypeScript + Vite with professional-grade features and animations.

## Current Implementation Status ✅

### 🎨 **Advanced UI Features** (COMPLETE)
- **Dark/Light Theme System**: Complete theme switching with React Context API and localStorage persistence
- **Animated Weather Icons**: 7 custom SVG weather icons with CSS animations (sun rotation, rain drops, lightning effects)
- **Enhanced Glassmorphism**: Premium card designs with backdrop blur effects and smooth transitions
- **Smooth Animations**: 0.5-0.6s theme transitions for professional feel across all UI elements
- **Theme Toggle Button**: Floating sun/moon button with elegant hover effects and position persistence

### 📱 **Mobile Optimization Features** (COMPLETE)
- **Pull-to-Refresh**: Custom hook and component system with native mobile feel
- **Touch Gesture Handling**: iOS-standard pull distances (70px trigger, 120px max) with resistance curves
- **Mobile UX**: Passive touch events, hardware-accelerated animations, visual feedback states
- **Comprehensive Testing**: 100% test coverage for mobile features with 10 test cases
- **Reusable Architecture**: Separated logic (hooks) from presentation (components) for maintainability

### 🌟 **Modern UI Component Library** (NEW - COMPLETE)
- **ModernHomeScreen**: Redesigned home interface with real-time clock, weather icon grid, and enhanced navigation
- **WeatherCard**: Glassmorphism weather display card with improved typography and visual hierarchy
- **ModernForecast**: Semantic HTML forecast components with accessibility-compliant lists and proper ARIA labeling
- **ModernWeatherMetrics**: Grid-based metrics display with section-based semantic structure
- **Full Accessibility Compliance**: WCAG-compliant with screen reader support, keyboard navigation, and semantic HTML

### 🔧 **Code Quality & Accessibility** (NEW - COMPLETE)
- **Zero TypeScript Warnings**: All compilation warnings resolved across the entire codebase
- **Accessibility Standards**: Full WCAG compliance with semantic HTML elements (button, section, ul/li)
- **Proper ARIA Labeling**: Comprehensive accessibility attributes for screen readers
- **Stable Component Keys**: Replaced array indices with semantic identifiers for React optimization
- **Clean Build Process**: Production builds complete without errors or warnings

### 🧪 **Comprehensive Testing Suite** (NEW - 2025)
- **Test Framework**: Vitest v3.2.4 with React Testing Library and jsdom environment for modern testing
- **Complete Test Coverage**: 185+ tests across 13 test files covering all major functionality
- **Mobile Testing**: 100% coverage for mobile features including pull-to-refresh, touch gestures, and responsive design
- **Component Testing**: Full coverage for weather components, theme system, haptic feedback, and location services
- **Mock Implementation**: Sophisticated mocking for geolocation API, navigator permissions, and external APIs
- **TypeScript Integration**: All tests written in TypeScript with strict type checking and no warnings

### 🌤️ **Core Weather Features**
- **HomeScreen**: Modern glassmorphism design with animated weather icon preview grid
- **WeatherDetailsScreen**: Comprehensive weather interface with current conditions and extended forecasts
- **Real-time Weather Data**: OpenMeteo API integration with current conditions, temperature, humidity, wind, pressure
- **24-Hour Forecast**: Hourly temperature and weather conditions with animated icons
- **7-Day Forecast**: Daily temperature ranges, weather conditions, and precipitation data
- **Error Handling**: User-friendly error messages with themed styling for all failure scenarios

### 🏗️ **Technical Architecture**
- **Frontend**: React 18 + TypeScript + Vite 7.0.5 for fast development and optimal performance
- **Theme System**: React Context API with TypeScript interfaces for type-safe theming
- **Mobile Features**: Custom hooks for touch gestures, pull-to-refresh, and mobile UX optimization
- **Navigation**: Custom state-based navigation (inline components) - proven reliable in browser environment
- **API Integration**: OpenMeteo (weather) + OpenStreetMap Nominatim (geocoding) - both completely free
- **Styling**: CSS-in-JS with comprehensive theme support and smooth transition animations
- **State Management**: React hooks with TypeScript for weather data, forecasts, and theme persistence
- **Testing**: Vitest v3.2.4 with React Testing Library - comprehensive test suite with 185+ tests covering mobile features, components, and APIs

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
│   └── AppNavigator.tsx          # Main app component with inline screens, theme integration, and weather logic
├── components/
│   ├── modernWeatherUI/          # Modern UI component library (Phase 2 - COMPLETE)
│   │   ├── ModernHomeScreen.tsx  # Redesigned home interface with real-time clock and weather grid
│   │   ├── WeatherCard.tsx       # Enhanced glassmorphism weather display card
│   │   ├── ModernForecast.tsx    # Accessible forecast components with semantic HTML
│   │   └── ModernWeatherMetrics.tsx # Grid-based metrics with proper ARIA labeling
│   ├── MobileNavigation.tsx      # Mobile navigation system
│   ├── ScreenTransition.tsx      # Screen transition animations
│   ├── SettingsScreen.tsx        # Settings interface
│   └── SearchScreen.tsx          # City search functionality
├── utils/
│   ├── weatherIcons.tsx          # Custom SVG weather icons with CSS animations
│   ├── themeConfig.ts            # Light/dark theme color configuration and TypeScript interfaces
│   ├── themeContext.tsx          # React Context provider for theme state management
│   ├── ThemeToggle.tsx           # Floating theme toggle button component
│   ├── usePullToRefresh.ts       # Pull-to-refresh functionality
│   ├── hapticHooks.ts            # Haptic feedback integration
│   └── mobileScreenOptimization.ts # Mobile screen optimization utilities
├── styles/
│   ├── modernWeatherUI.css       # Modern UI component styles
│   └── mobile.css               # Mobile-specific styling utilities
├── services/
│   └── weatherService.ts         # Legacy service (kept for reference, not actively used)
└── screens/                     # Legacy separate components (DO NOT USE - causes blank screens)
    ├── HomeScreen.tsx           # Deprecated - causes rendering issues
    └── WeatherDetailsScreen.tsx # Deprecated - causes rendering issues
```

## API Integration Details

### OpenMeteo Weather API (Primary)
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Features**: Current weather, hourly forecasts (24h), daily forecasts (7d)
- **Parameters**: 
  - `latitude` & `longitude`: From geocoding step
  - `current_weather=true`: Current conditions
  - `hourly`: temperature_2m, weather_code, relative_humidity_2m
  - `daily`: temperature_2m_max, temperature_2m_min, weather_code, precipitation_sum
  - `temperature_unit=fahrenheit`: Imperial units
- **Weather Codes**: Mapped to human-readable descriptions and animated icons
- **Rate Limits**: None - completely free service with no API key required

### OpenStreetMap Nominatim Geocoding
- **Endpoint**: `https://nominatim.openstreetmap.org/search`
- **Parameters**: `q` (city name), `format=json`, `limit=1`
- **Headers**: `User-Agent` header required for API compliance
- **Response**: Returns latitude/longitude coordinates for weather API calls
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

### Phase C: Modern UI Component Library ✅ COMPLETE (July 2025)
- ✅ **ModernHomeScreen**: Real-time clock, weather icon grid, enhanced navigation
- ✅ **WeatherCard**: Glassmorphism design with improved typography
- ✅ **ModernForecast**: Semantic HTML structure with accessibility compliance
- ✅ **ModernWeatherMetrics**: Grid-based layout with proper ARIA labeling
- ✅ **Full Integration**: All components integrated into AppNavigator with hot reloading
- ✅ **Code Quality**: Zero TypeScript warnings, full accessibility compliance

### Phase D: Mobile Optimization ✅ COMPLETE (July 2025)
- ✅ **Pull-to-Refresh**: Complete implementation with native feel
- ✅ **Touch Gesture Handling**: iOS-standard distances and resistance curves
- ✅ **Mobile UX**: Passive touch events and hardware acceleration
- ✅ **Comprehensive Testing**: 100% coverage for mobile features
- 🔄 **Haptic Feedback**: Vibration API integration for touch interactions  
- 🔄 **Swipe Gestures**: Navigation between weather screens
- 🔄 **Touch Animations**: Micro-interactions and visual feedback

### Phase E: Enhanced Mobile Features
- **Mobile Deployment**: Use Expo or React Native CLI for iOS/Android builds
- **Location Services**: GPS-based weather detection with permission handling
- **Offline Support**: Cache recent weather data for offline viewing
- **Multiple Cities**: Save favorite locations with local storage
- **Weather Alerts**: Severe weather notifications and push notifications

### Phase F: Advanced Features  
- **Weather Maps**: Integration with weather radar/satellite imagery
- **Enhanced Weather Data**: UV index, air quality, pollen count
- **Weather History**: Historical weather data and trends
- **Widgets**: Home screen widgets for quick weather access

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

## 🆕 Accessibility & Performance Best Practices (2025)

### Code Quality Standards ✅ COMPLETE
- **Zero TypeScript Warnings**: All compilation errors and warnings resolved across the entire codebase
- **Semantic HTML**: Use proper HTML elements (button, section, ul/li, nav) instead of generic divs for interactive content
- **ARIA Compliance**: All interactive elements have descriptive `aria-label` attributes for screen readers
- **Stable React Keys**: Use semantic identifiers instead of array indices for list items to prevent rendering issues
- **Component Memoization**: Heavy or frequently rendered components (WeatherIcon, MobileDebug) use React.memo
- **Legacy Code Management**: Unused components marked with TypeScript suppressions rather than deletion for reference

### Modern UI Implementation ✅ COMPLETE  
- **Component Library**: Complete set of 4 modern UI components with glassmorphism design
- **CSS Utility Classes**: Use utility classes from src/styles/mobile.css for layout, spacing, and effects
- **GPU-Accelerated Animations**: Prefer CSS animations using `transform` and `opacity` for performance
- **Responsive Design**: All components tested across mobile, tablet, and desktop breakpoints
- **Theme Integration**: Full dark/light theme support with smooth 0.5s transitions

### Development Guidelines
- **Hot Module Replacement**: All components support live editing with Vite HMR
- **Build Verification**: Always run `npm run build` to verify production compatibility
- **Accessibility Testing**: Test all UI with screen readers and keyboard navigation
- **Mobile Testing**: Verify touch responsiveness on real devices and browser dev tools
