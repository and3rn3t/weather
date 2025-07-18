# Architecture Documentation

## 🏗️ System Architecture Overview

Our weather app follows modern React architecture principles with TypeScript, emphasizing maintainability, performance, and user experience.

## 📐 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Weather App Architecture                 │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ AppNavigator    │  │ Weather Screens │  │ UI Components│ │
│  │ (Main Router)   │  │ (Feature Views) │  │ (Reusable)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  State Management                                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ React Context   │  │ Local State     │  │ Theme System│ │
│  │ (Global State)  │  │ (Component)     │  │ (Theming)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Business Logic                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ Weather Service │  │ Data Transform  │  │ Utils       │ │
│  │ (API Calls)     │  │ (Data Mapping)  │  │ (Helpers)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │ OpenMeteo API   │  │ Nominatim API   │  │ Local Cache │ │
│  │ (Weather Data)  │  │ (Geocoding)     │  │ (Browser)   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🗂️ Project Structure

### Directory Organization

```text
src/
├── navigation/              # App navigation and routing
│   ├── AppNavigator.tsx     # Main app component with inline screens
│   └── __tests__/           # Navigation tests
├── utils/                   # Shared utilities and services
│   ├── themeContext.tsx     # Theme management system
│   ├── LoadingSkeletons.tsx # Loading state components
│   ├── testUtils.ts         # Testing utilities
│   └── __tests__/           # Utility tests
├── assets/                  # Static assets
│   └── react.svg            # React logo
├── __tests__/               # Integration tests
│   ├── config.test.ts       # Configuration tests
│   └── integration.test.tsx # End-to-end tests
├── App.tsx                  # Root component (delegated to AppNavigator)
├── App.css                  # Global styles
├── main.tsx                 # Application entry point
├── index.css                # Base CSS styles
├── vite-env.d.ts           # Vite type definitions
└── setupTests.ts           # Test configuration
```

## 🧩 Component Architecture

### Component Hierarchy

```text
App (Root)
└── AppNavigator (Main Container)
    ├── ThemeProvider (Context Provider)
    │   └── WeatherScreen (Inline Component)
    │       ├── SearchForm
    │       ├── WeatherDisplay
    │       ├── HourlyForecast
    │       ├── DailyForecast
    │       └── LoadingSkeletons
    └── DetailsScreen (Inline Component)
        ├── DetailedMetrics
        ├── WeatherCharts
        └── BackButton
```

### Inline Component Strategy

Our architecture uses **inline components** within `AppNavigator.tsx` to prevent the blank screen issue common in mobile weather apps:

```typescript
const AppNavigator: React.FC = () => {
  // All screen components defined inline
  const WeatherScreen: React.FC = () => { /* ... */ };
  const DetailsScreen: React.FC = () => { /* ... */ };
  
  return (
    <ThemeProvider>
      {currentScreen === 'weather' ? <WeatherScreen /> : <DetailsScreen />}
    </ThemeProvider>
  );
};
```

**Benefits:**

- Eliminates React Router complexity
- Prevents screen flashing/blank states
- Faster navigation transitions
- Simplified state management
- Better mobile performance

## 🎨 Theme Architecture

### Theme System Design

```typescript
interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  accent: string;
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  isMobile: boolean;
}
```

### Theme Implementation Flow

```text
1. ThemeProvider initialization
   ├── Read from localStorage ('theme' key)
   ├── Validate theme value ('light' | 'dark')
   ├── Fallback to 'light' for invalid values
   └── Apply system-wide colors

2. Theme persistence
   ├── Save to localStorage on toggle
   ├── Maintain state across sessions
   └── Handle storage errors gracefully

3. Mobile detection
   ├── Window width < 768px
   ├── Dynamic responsive behavior
   └── Optimized touch interactions
```

## 📊 State Management

### State Architecture Layers

#### 1. Global State (React Context)

```typescript
// Theme state - app-wide theming
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Usage pattern
const { isDark, colors, toggleTheme, isMobile } = useTheme();
```

#### 2. Component State (useState/useEffect)

```typescript
// Weather data state - feature-specific
const [weather, setWeather] = useState<WeatherData | null>(null);
const [error, setError] = useState<string>('');
const [isLoading, setIsLoading] = useState<boolean>(false);

// Screen navigation state
const [currentScreen, setCurrentScreen] = useState<'weather' | 'details'>('weather');
```

#### 3. Derived State (useMemo/useCallback)

```typescript
// Computed values to prevent unnecessary re-renders
const hourlyData = useMemo(() => 
  weather?.hourly?.slice(0, 24) || [], [weather]
);

const dailyData = useMemo(() => 
  weather?.daily?.slice(0, 7) || [], [weather]
);
```

### State Update Patterns

```typescript
// Async state updates with error handling
const fetchWeather = useCallback(async (city: string) => {
  setIsLoading(true);
  setError('');
  
  try {
    const data = await getWeather(city);
    setWeather(data);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error');
    setWeather(null);
  } finally {
    setIsLoading(false);
  }
}, []);
```

## 🔄 Data Flow Architecture

### Request Flow

```text
User Input → Component State → API Service → Data Transform → UI Update
     ↓              ↓              ↓              ↓              ↓
[Search City] → [setIsLoading] → [OpenMeteo] → [transformData] → [setWeather]
```

### Error Flow

```text
API Error → Service Layer → Component State → UI Display
    ↓             ↓              ↓              ↓
[Network] → [try/catch] → [setError] → [Error Message]
```

### Theme Flow

```text
User Toggle → Context Update → localStorage → Component Re-render
     ↓              ↓              ↓              ↓
[Button] → [toggleTheme] → [save theme] → [new colors]
```

## 🧪 Testing Architecture

### Testing Strategy Layers

```text
Unit Tests (70+ tests)
├── Component Tests
│   ├── Theme system (11 tests)
│   ├── Navigation logic (15 tests)
│   └── Utility functions (25+ tests)
├── Integration Tests
│   ├── API integration (8 tests)
│   ├── Error handling (12 tests)
│   └── User workflows (10+ tests)
└── Configuration Tests
    ├── TypeScript config (3 tests)
    ├── Vite setup (2 tests)
    └── ESLint rules (3 tests)
```

### Test Architecture Pattern

```typescript
// Comprehensive test coverage
describe('Weather App Feature', () => {
  // Unit level
  it('should handle individual functions');
  
  // Integration level  
  it('should work with dependencies');
  
  // User workflow level
  it('should complete user scenarios');
  
  // Error scenarios
  it('should handle edge cases');
});
```

## 🚀 Performance Architecture

### Performance Optimization Layers

#### 1. Component Level

```typescript
// React.memo for expensive components
const WeatherDisplay = React.memo<WeatherDisplayProps>(({ weather }) => {
  // Component logic
});

// useMemo for expensive computations
const processedData = useMemo(() => 
  weather ? transformWeatherData(weather) : null, [weather]
);

// useCallback for stable references
const handleSearch = useCallback((city: string) => {
  fetchWeather(city);
}, [fetchWeather]);
```

#### 2. Loading Strategy

```typescript
// Progressive loading with skeletons
const LoadingState = () => (
  <>
    <CurrentWeatherSkeleton />
    <HourlyForecastSkeleton />
    <DailyForecastSkeleton />
  </>
);

// Shimmer animations for perceived performance
const shimmerKeyframes = `
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;
```

#### 3. Mobile Optimizations

```typescript
// Touch-optimized interactions
const mobileStyles = {
  button: {
    minHeight: '44px', // iOS touch target
    fontSize: isMobile ? '16px' : '14px', // Prevent zoom
    padding: isMobile ? '12px 16px' : '8px 12px'
  },
  
  // Smooth scrolling for mobile
  hourlyContainer: {
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    WebkitOverflowScrolling: 'touch'
  }
};
```

## 🔐 Security Architecture

### Security Layers

#### 1. API Security

```typescript
// Safe API calls with validation
const validateApiResponse = (data: unknown): data is WeatherData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'current_weather' in data
  );
};

// Input sanitization
const sanitizeCity = (city: string): string => {
  return city.trim().replace(/[<>]/g, '');
};
```

#### 2. XSS Prevention

```typescript
// Safe HTML rendering (React default)
// All user input automatically escaped

// Manual sanitization when needed
const sanitizeHTML = (input: string): string => {
  return input.replace(/[<>&"']/g, (char) => ({
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#x27;'
  }[char] || char));
};
```

#### 3. Data Validation

```typescript
// Runtime type checking
const isValidWeatherCode = (code: unknown): code is number => {
  return typeof code === 'number' && code >= 0 && code <= 99;
};

// API response validation
if (!validateApiResponse(response)) {
  throw new Error('Invalid API response format');
}
```

## 🔮 Future Architecture

### Planned Architectural Improvements

#### 1. Enhanced State Management

```typescript
// Context optimization
const WeatherContext = createContext<WeatherContextType>();
const SettingsContext = createContext<SettingsContextType>();

// State machine integration
import { createMachine } from 'xstate';

const weatherMachine = createMachine({
  initial: 'idle',
  states: {
    idle: { on: { SEARCH: 'loading' } },
    loading: { on: { SUCCESS: 'loaded', ERROR: 'error' } },
    loaded: { on: { SEARCH: 'loading' } },
    error: { on: { RETRY: 'loading' } }
  }
});
```

#### 2. Advanced Caching

```typescript
// Service Worker integration
const cacheStrategy = {
  weather: 'network-first', // Fresh data preferred
  assets: 'cache-first',    // Static assets
  api: 'stale-while-revalidate' // Background updates
};

// IndexedDB for complex data
const weatherDB = new Dexie('WeatherApp');
weatherDB.version(1).stores({
  weather: 'city, data, timestamp',
  settings: 'key, value'
});
```

#### 3. Micro-Frontend Architecture

```typescript
// Feature-based modules
interface WeatherModule {
  component: React.ComponentType;
  state: StateManager;
  services: ApiService[];
}

// Dynamic loading
const LazyWeatherModule = lazy(() => import('./modules/weather'));
const LazyMapModule = lazy(() => import('./modules/map'));
```

## 📚 Architecture References

### Design Patterns Used

1. **Provider Pattern**: Theme and context management
2. **Container/Presentational**: Logic/UI separation
3. **Higher-Order Components**: Cross-cutting concerns
4. **Render Props**: Flexible component composition
5. **Custom Hooks**: Reusable stateful logic

### Best Practices Implemented

1. **Single Responsibility**: Each component has one purpose
2. **DRY Principle**: Reusable utilities and components
3. **SOLID Principles**: Extensible architecture
4. **Separation of Concerns**: Clear layer boundaries
5. **Performance First**: Optimized for mobile devices

### Architecture Decision Records (ADRs)

1. **Inline Components**: Chosen over React Router for simplicity
2. **Context over Redux**: Appropriate for app scale
3. **TypeScript**: Type safety and developer experience
4. **Vite over CRA**: Better performance and modern tooling
5. **Testing Library**: User-centric testing approach
