# Copilot Instructions

<!-- IMPORTANT: When giving commands, use PowerShell and Windows paths; avoid POSIX-only operators. Prefer PowerShell-compatible syntax (pwsh) and npm scripts or separate lines instead of shell chaining. -->

> IMPORTANT: All shell commands provided for this project must be Windows/PowerShell compatible. Use
> Windows paths, avoid POSIX-only operators and bash-only syntax (e.g., `export`, `source`, `grep`,
> and `&&` in Windows PowerShell 5.1). Prefer npm scripts or newline-separated commands.

This project is a premium weather app built using React + TypeScript + Vite with professional-grade
features and animations.

## Current Implementation Status ✅

### 🎨 **Advanced UI Features** (COMPLETE)

- **Dark/Light Theme System**: Complete theme switching with React Context API and localStorage
  persistence
- **Animated Weather Icons**: 7 custom SVG weather icons with CSS animations (sun rotation, rain
  drops, lightning effects)
- **Enhanced Glassmorphism**: Premium card designs with backdrop blur effects and smooth transitions
- **Smooth Animations**: 0.5-0.6s theme transitions for professional feel across all UI elements
- **Theme Toggle Button**: Floating sun/moon button with elegant hover effects and position
  persistence

### 📱 **Mobile Optimization Features** (COMPLETE)

- **Pull-to-Refresh**: Custom hook and component system with native mobile feel
- **Touch Gesture Handling**: iOS-standard pull distances (70px trigger, 120px max) with resistance
  curves
- **Mobile UX**: Passive touch events, hardware-accelerated animations, visual feedback states
- **Comprehensive Testing**: 100% test coverage for mobile features with 10 test cases
- **Reusable Architecture**: Separated logic (hooks) from presentation (components) for
  maintainability

### 🌟 **iOS26 Advanced Components Integration** (COMPLETE - August 2025)

- **iOS26WeatherInterface**: Complete weather display with advanced glassmorphism and spring physics
  animations
- **iOS26WeatherCard**: Native iOS-style weather cards with haptic feedback and adaptive colors
- **iOS26NavigationBar**: Authentic iOS navigation patterns with proper accessibility
- **WeatherMetricsGrid**: Enhanced metrics display with iOS design hierarchy
- **QuickActionsPanel**: iOS-style action system with native interaction patterns
- **IOS26WeatherDemo**: Modern home interface showcasing complete iOS26 design system
- **Advanced Components Integrated**: ContextMenu, LiveActivity, InteractiveWidget, ModalSheet
- **Premium iOS Features**: Right-click context menus, Dynamic Island notifications, interactive
  widgets, enhanced modal sheets
- **Professional Polish**: 60fps animations, haptic feedback, iOS typography system (11 classes),
  4-level material design
- **Full iOS Design Compliance**: Follows iOS Human Interface Guidelines with cutting-edge iOS26
  patterns

### 🔧 **Code Quality & Accessibility** (NEW - COMPLETE)

- **Zero TypeScript Warnings**: All compilation warnings resolved across the entire codebase
- **Accessibility Standards**: Full WCAG compliance with semantic HTML elements (button, section,
  ul/li)
- **Proper ARIA Labeling**: Comprehensive accessibility attributes for screen readers
- **Stable Component Keys**: Replaced array indices with semantic identifiers for React optimization
- **Clean Build Process**: Production builds complete without errors or warnings

### 🔍 **Advanced Search Enhancement Features** (NEW - August 2025)

- **Feature 1: Advanced Autocorrect Engine**: Intelligent typo correction using Levenshtein
  distance, phonetic matching, and misspellings database with 5-tier confidence scoring
- **Feature 2: Popular Cities Prefetching**: Instant search results for 50 curated world cities with
  geographic prioritization and localStorage caching
- **Feature 3: Voice Search Integration**: Web Speech API integration with 80+ city pronunciation
  variations, real-time visual feedback, and full accessibility support
- **Complete Search Enhancement**: Multi-layered search system combining autocorrect, popular cities
  cache, and voice recognition for optimal user experience
- **Performance Optimized**: Memory management, bundle size monitoring, and efficient caching
  strategies across all search features

### 🧪 **Comprehensive Testing Suite** (NEW - 2025)

- **Test Framework**: Vitest v3.2.4 with React Testing Library and jsdom environment for modern
  testing
- **Complete Test Coverage**: 185+ tests across 13 test files covering all major functionality
- **Mobile Testing**: 100% coverage for mobile features including pull-to-refresh, touch gestures,
  and responsive design
- **Component Testing**: Full coverage for weather components, theme system, haptic feedback, and
  location services
- **Mock Implementation**: Sophisticated mocking for geolocation API, navigator permissions, and
  external APIs
- **TypeScript Integration**: All tests written in TypeScript with strict type checking and no
  warnings

### 🚀 **Production Deployment Infrastructure** (COMPLETE - August 2025)

- **Hosting Platform**: Cloudflare Pages with automated GitHub Actions deployment
- **Custom Domains**: Production (weather.andernet.dev) and Development (weather-dev.andernet.dev)
- **CI/CD Pipeline**: Automated build, test, and deployment on every push to main branch
- **Build Optimization**: Ultra-fast builds (<2 seconds) with optimized bundle size (286.70 kB)
- **Performance Budget**: Monitored bundle size and loading performance
- **Zero Configuration**: No API keys or environment variables required for deployment
- **SSL/Security**: Automatic HTTPS, security headers, and Cloudflare protection

### 🌤️ **Core Weather Features**

- **HomeScreen**: Modern glassmorphism design with animated weather icon preview grid
- **WeatherDetailsScreen**: Comprehensive weather interface with current conditions and extended
  forecasts
- **Real-time Weather Data**: OpenMeteo API integration with current conditions, temperature,
  humidity, wind, pressure
- **24-Hour Forecast**: Hourly temperature and weather conditions with animated icons
- **7-Day Forecast**: Daily temperature ranges, weather conditions, and precipitation data
- **Error Handling**: User-friendly error messages with themed styling for all failure scenarios

### 🏗️ **Technical Architecture**

- **Frontend**: React 18 + TypeScript + Vite 7.0.5 for fast development and optimal performance
- **Theme System**: React Context API with TypeScript interfaces for type-safe theming
- **Mobile Features**: Custom hooks for touch gestures, pull-to-refresh, and mobile UX optimization
- **Navigation**: Custom state-based navigation (inline components) - proven reliable in browser
  environment
- **API Integration**: OpenMeteo (weather) + OpenStreetMap Nominatim (geocoding) - both completely
  free
- **Styling**: CSS-in-JS with comprehensive theme support and smooth transition animations
- **State Management**: React hooks with TypeScript for weather data, forecasts, and theme
  persistence
- **Testing**: Vitest v3.2.4 with React Testing Library - comprehensive test suite with 185+ tests
  covering mobile features, components, and APIs

## Important Technical Notes ⚠️

### Networking Best Practices (Contributor Note)

- Use the centralized networking utilities for all external requests: `optimizedFetch` /
  `optimizedFetchJson`.
- Prefer the hooks only when React lifecycle coupling is required: `useWeatherAPIOptimization`,
  `useMobileOptimizedAPI`.
- Do not set `User-Agent` manually; the shared layer ensures Nominatim compliance and sanitizes
  headers to avoid preflight.
- Pass stable cache keys and AbortController signals for coalescing and cancellation.
- Reference: docs/guides/NETWORKING_README.md and docs/technical/PRODUCTION_NETWORKING_STRATEGY.md

### Navigation Implementation

- **DO NOT** use separate component files (HomeScreen.tsx, WeatherDetailsScreen.tsx) as they cause
  blank screen issues
- **USE** inline components within AppNavigator.tsx - this approach is proven to work reliably
- Current navigation uses React state (`useState`) to switch between screens
- React Navigation was abandoned due to React Native Web compatibility issues in browser environment
- **Single-source nav styling**: Navigation bar visuals live in `src/styles/mobile.css`. Avoid
  creating or importing additional nav override CSS files.

### API Integration

- **Weather API**: OpenMeteo API - `https://api.open-meteo.com/v1/forecast` (completely free, no API
  key)
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
│   └── AppNavigator.tsx          # Main app component with inline screens and iOS26 UI integration
├── components/
│   ├── modernWeatherUI/          # iOS26 UI Kit Component Library (COMPLETE - August 2025)
│   │   ├── iOS26MainScreen.tsx   # iOS26NavigationBar, iOS26WeatherCard, WeatherMetricsGrid, QuickActionsPanel
│   │   ├── iOS26WeatherInterface.tsx # Complete weather display with glassmorphism and animations
│   │   ├── iOS26WeatherDemo.tsx  # Modern home interface showcasing iOS26 design system
│   │   ├── iOS26Components.tsx   # Advanced components: ContextMenu, LiveActivity, InteractiveWidget, ModalSheet, SwipeActions
│   │   └── [Legacy Components]   # ModernHomeScreen.tsx, WeatherCard.tsx (deprecated, kept for reference)
│   ├── VoiceSearchButton.tsx     # Voice search component with Web Speech API integration (NEW - August 2025)
│   ├── VoiceSearchButton.css     # Voice search styling with animations and accessibility (NEW - August 2025)
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
│   ├── mobileScreenOptimization.ts # Mobile screen optimization utilities
│   ├── autocorrectEngine.ts      # Advanced typo correction with Levenshtein distance (NEW - August 2025)
│   ├── popularCitiesCache.ts     # Popular cities database with geographic prioritization (NEW - August 2025)
│   ├── useEnhancedSearch.ts      # Enhanced search hook combining all search features (NEW - August 2025)
│   └── useVoiceSearch.ts         # Voice search hook with Web Speech API integration (NEW - August 2025)
├── styles/
│   ├── iOS26.css                 # iOS26 design system styles (primary)
│   ├── modernWeatherUI.css       # Legacy modern UI styles (deprecated)
│   └── mobile.css               # Mobile-specific styling utilities
├── docs/                        # Organized documentation (August 2025)
│   ├── guides/                  # Development and deployment guides
│   ├── reports/                 # Project status and migration reports
│   ├── technical/               # Technical specifications
│   └── archive/                 # Historical documents and deprecated components
├── services/
│   └── weatherService.ts         # Legacy service (archived, not actively used)
└── screens/                     # Legacy separate components (ARCHIVED - causes blank screens)
    ├── HomeScreen.tsx           # Deprecated - use inline components in AppNavigator.tsx
    └── WeatherDetailsScreen.tsx # Deprecated - use inline components in AppNavigator.tsx
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
- **Response**: Returns latitude/longitude coordinates for weather API calls ├── services/ │ └──
  weatherService.ts # Legacy OpenWeatherMap service (kept for reference, not used) └── screens/ #
  Legacy separate components (DO NOT USE) ├── HomeScreen.tsx # Causes blank screen issues └──
  WeatherDetailsScreen.tsx # Causes blank screen issues

````

## Environment Setup

### No Environment Variables Required
- **OpenMeteo**: No API key needed - completely free service
- **Nominatim**: No API key needed - free OpenStreetMap geocoding service
- Simply start the development server and the app works immediately

## Development Commands

### Start Development Server
```powershell
npm run dev
````

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

## 🚀 **iOS26 Advanced Components Library** (COMPLETE - August 2025)

### **Available Advanced Components**

#### **1. ContextMenu** - Premium Right-Click Interactions

```typescript
<ContextMenu actions={contextMenuActions} theme={theme}>
  <WeatherMainCard {...props} />
</ContextMenu>
```

- **Features**: Right-click/long-press activation, haptic feedback, glassmorphism styling
- **Actions**: Refresh, Share, Add to Favorites, View Details
- **Usage**: Integrated on main weather cards for quick access to common actions

#### **2. InteractiveWidget** - Live Weather Widgets

```typescript
<InteractiveWidget title="Current Temperature" size="medium" theme={theme}>
  <TemperatureDisplay />
</InteractiveWidget>
```

- **Features**: Real-time data display, touch interactions, loading states, smooth animations
- **Widgets**: Temperature, Humidity, Wind, Pressure, UV Index, Visibility
- **Usage**: Interactive weather data display with haptic feedback

#### **3. ModalSheet** - Enhanced Settings Interface

```typescript
<ModalSheet
  isVisible={showModal}
  title="Weather Settings"
  detents={['medium', 'large']}
  theme={theme}
>
  <SettingsContent />
</ModalSheet>
```

- **Features**: iOS-style bottom sheet, detent system, backdrop blur, smooth animations
- **Usage**: Enhanced settings interface with live notification testing

#### **4. LiveActivity** - Dynamic Island Notifications

```typescript
<LiveActivity isVisible={showAlert} title="Weather Update" subtitle="Updated now" theme={theme} />
```

- **Features**: Dynamic Island-style presentation, weather alerts, auto-dismiss, progress indicators
- **Usage**: Real-time weather notifications and system updates

#### **5. SwipeActions** - Touch Gesture Controls

```typescript
<SwipeActions leftActions={actions} rightActions={actions}>
  <WeatherCard />
</SwipeActions>
```

- **Features**: Left/right swipe detection, configurable actions, smooth animations
- **Status**: Available for future implementation on weather cards and location lists

### **Design System Integration**

#### **iOS Typography System** (11 Classes)

- `ios-large-title` (34pt) - Main temperature displays
- `ios-title1` (28pt) - Section headers
- `ios-title2` (22pt) - Widget values
- `ios-headline` (17pt) - Important text
- `ios-body` (17pt) - Standard content
- `ios-footnote` (13pt) - Labels and metadata

#### **Material Effects System** (4 Levels)

- `ios-material-thin` - Light blur effect
- `ios-material-regular` - Standard glassmorphism
- `ios-material-thick` - Heavy blur backdrop
- `ios-material-chrome` - Metallic finish effect

## Known Issues to Avoid ❌

1. **Separate Component Files**: Importing screen components from separate files causes blank
   screens
2. **React Navigation**: Causes compatibility issues in browser environment
3. **Missing User-Agent**: Nominatim requires User-Agent header in requests
4. **API Dependencies**: Avoid APIs requiring subscription or API keys for simplicity

## 🛠️ **Critical Fix: Mobile Navigation Blue Rectangle Issue** (RESOLVED - July 2025)

### **Problem Description**

A persistent dark blue oval/rectangle would appear across the entire mobile navigation container
when clicking navigation icons, blocking interaction and creating poor UX.

### **Root Cause Discovery**

Through comprehensive debugging with visual CSS borders, we discovered the blue rectangle was
**NOT** coming from the navigation buttons themselves, but from:

1. **Content area elements** receiving `:active` styling when navigation was clicked
2. **Scrollbar pseudo-elements** getting browser default `:active` states
3. **Main container divs** that were styled when navigation interaction occurred

### **Failed Approaches** (DO NOT REPEAT)

- ❌ **CSS Button Overrides**: Attempted to override button `:active` states with `!important`
- ❌ **Navigation Element Replacement**: Changed `<nav>` to `<div>` and `<button>` to
  `<div role="button">`
- ❌ **Nuclear CSS Resets**: Used `all: unset !important` and `all: revert !important`
- ❌ **Event Prevention**: Added `preventDefault()` and `stopPropagation()` to all touch/mouse
  events
- ❌ **Pointer Events Manipulation**: Disabled `pointer-events` on container, re-enabled on buttons

### **Successful Solution** ✅

Focus fixes where they actually originate: content area and scrollbar `:active` states. The final
implementation is consolidated inside `src/index.css` (not separate fix files) and complemented by
the single-source nav styles in `src/styles/mobile.css`.

#### **Consolidated Fix Location**

- Global active-state neutralization: `src/index.css` (single source; do not reintroduce separate
  fix files)
- Navigation visuals and layout: `src/styles/mobile.css`

#### **Critical CSS Rules (now in index.css):**

```css
/* Disable :active on all content elements */
#root:active,
#root *:active,
body:active,
html:active,
main:active,
div:not(.mobile-navigation):active,
.app-container:active,
.main-content:active {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

/* Fix scrollbar active states */
::-webkit-scrollbar:active,
::-webkit-scrollbar-thumb:active,
::-webkit-scrollbar-track:active {
  background: transparent !important;
  border: none !important;
}

/* Single scrollbar control */
html,
body {
  overflow-x: hidden !important;
  overflow-y: auto !important;
}
```

#### **CSS Import Order (Updated, Minimal):**

```css
/* In src/index.css - keep it lean and predictable */
@import './styles/mobile.css';
@import './styles/iosComponents.css';
/* Avoid additional nav override files; the global fix lives here in index.css */
```

### **Debugging Technique Used**

```css
/* Add temporary debug borders to identify styling sources */
*:active {
  border: 2px solid red !important;
  background: yellow !important;
}
div:active {
  border: 3px solid green !important;
  background: orange !important;
}
```

### **Prevention Guidelines**

1. **Always test navigation on localhost after CSS changes** - dev server restart required for CSS
   imports
2. **Use debug borders** when investigating mysterious styling issues
3. **Target content elements, not just navigation** - browser styling can affect parent containers
4. **Check scrollbar pseudo-elements** - they can receive unexpected `:active` states
5. **Do not add new global nav overrides** - Keep nav styles in `styles/mobile.css` and the global
   active-state fix in `index.css`

### **Component Architecture Changes**

- **MobileNavigation.tsx**: Replaced `<nav>` with `<div role="navigation">` and `<button>` with
  `<div role="button">`
- **Accessibility preserved**: All ARIA attributes maintained (`role`, `aria-pressed`, `tabIndex`)
- **Inline style overrides**: Added nuclear inline styles as final fallback
- **Event handling**: Enhanced with `preventDefault()` on touch/mouse events

### **Verification Steps**

1. Start dev server: `npx vite` (bypasses linting if needed)
2. Test navigation clicks - should show ONLY purple highlights
3. Verify single scrollbar only
4. Check no blue rectangle appears on any navigation interaction
5. Confirm haptic feedback and navigation switching still work

## 📘 Lessons Learned: Blank Screen + CSS Cleanup (Aug 2025)

- Blank screens often come from environment/caching or duplicate React installs. Ensure service
  workers are unregistered on localhost and caches purged; dedupe `react`/`react-dom`.
- Keep navigation styling in one place (`styles/mobile.css`). Competing override files caused
  inconsistent states and UI artifacts.
- The “blue rectangle” was caused by content and scrollbar `:active` states, not the nav itself; fix
  globally in `index.css` rather than piling on component-level overrides.
- When debugging CSS, progressively disable imports in `index.css`, add temporary debug borders, and
  verify overflow/scrollbar pseudo-elements.
- Prefer minimal, predictable CSS import order. Avoid alternate entry CSS files (e.g.,
  `index-core.css`, `index-optimized.css`, `index-test.css`).
- Retain development-only safeguards (dev boot banner suppression, overlay neutralization) to
  prevent dev-only obstruction.

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

- All commands or scripts generated for this project must be compatible with Windows and PowerShell
  environments.
- The app is currently optimized for browser testing but built on React Native foundation for future
  mobile deployment.
- No API keys or environment variables required - the app works immediately after setup.

For more details, visit the [OpenMeteo documentation](https://open-meteo.com/en/docs) and
[React Native documentation](https://reactnative.dev/).

## 🆕 Accessibility & Performance Best Practices (2025)

### Code Quality Standards ✅ COMPLETE

- **Zero TypeScript Warnings**: All compilation errors and warnings resolved across the entire
  codebase
- **Semantic HTML**: Use proper HTML elements (button, section, ul/li, nav) instead of generic divs
  for interactive content
- **ARIA Compliance**: All interactive elements have descriptive `aria-label` attributes for screen
  readers
- **Stable React Keys**: Use semantic identifiers instead of array indices for list items to prevent
  rendering issues
- **Component Memoization**: Heavy or frequently rendered components (WeatherIcon, MobileDebug) use
  React.memo
- **Legacy Code Management**: Unused components marked with TypeScript suppressions rather than
  deletion for reference

### Modern UI Implementation ✅ COMPLETE

- **Component Library**: Complete set of 4 modern UI components with glassmorphism design
- **CSS Utility Classes**: Use utility classes from src/styles/mobile.css for layout, spacing, and
  effects
- **GPU-Accelerated Animations**: Prefer CSS animations using `transform` and `opacity` for
  performance
- **Responsive Design**: All components tested across mobile, tablet, and desktop breakpoints
- **Theme Integration**: Full dark/light theme support with smooth 0.5s transitions

### Development Guidelines

- **Hot Module Replacement**: All components support live editing with Vite HMR
- **Build Verification**: Always run `npm run build` to verify production compatibility
- **Accessibility Testing**: Test all UI with screen readers and keyboard navigation
- **Mobile Testing**: Verify touch responsiveness on real devices and browser dev tools

## 🔧 CSS Troubleshooting Guidelines (July 2025)

### **Dev Server Management**

- **CSS Changes**: Always restart dev server after importing new CSS files: `npx vite`
- **Import Order**: CSS import order in `src/index.css` is critical - fix files must load last
- **Cache Issues**: If styles don't update, clear browser cache and restart dev server
- **Linting Bypass**: Use `npx vite` instead of `npm run dev` to bypass pre-check failures

### **Debugging Mysterious Styling Issues**

1. **Visual Debug Borders**: Add temporary debug CSS to identify problematic elements:
   ```css
   *:active {
     border: 2px solid red !important;
     background: yellow !important;
   }
   div:active {
     border: 3px solid green !important;
     background: orange !important;
   }
   ```
2. **CSS Specificity**: Use browser dev tools to inspect computed styles and override conflicts
3. **Disable CSS Files**: Temporarily comment out CSS imports in `src/index.css` to isolate issues
4. **Test with Minimal CSS**: Create isolated test environment with only essential styles

### **Mobile Navigation Specific Issues**

- **Blue Rectangle Problem**: Usually caused by content area or scrollbar `:active` states, NOT
  navigation buttons
- **Multiple Scrollbars**: Check `overflow` settings on `html`, `body`, and `#root` elements
- **Touch Highlighting**: Use `-webkit-tap-highlight-color: transparent` and
  `touch-action: manipulation`
- **Accessibility**: Always maintain ARIA attributes when replacing semantic HTML elements
