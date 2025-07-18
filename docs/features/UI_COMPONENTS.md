# UI Components Documentation

## 🎨 Core Components

### WeatherCardSkeleton

**Purpose**: Professional loading state for weather cards
**Location**: `src/utils/LoadingSkeletons.tsx`

```tsx
export const WeatherCardSkeleton: React.FC = () => {
  const { theme, isMobile, isTablet } = useTheme();
  // Responsive skeleton with shimmer animation
}
```

**Features**:

- Shimmer animation with CSS keyframes
- Responsive padding based on device type
- Theme-aware background colors
- Auto-injected animation styles

### ProgressiveImage

**Purpose**: Blur-to-clear image loading with fallbacks
**Location**: `src/utils/ProgressiveImage.tsx`

```tsx
export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src, alt, className, priority = false
}) => {
  // Progressive loading with blur effect
}
```

**Features**:

- Blur-to-clear loading transition
- Priority loading system
- Fallback image handling
- Lazy loading optimization

### ThemeToggle

**Purpose**: Floating theme switcher button
**Location**: `src/utils/ThemeToggle.tsx`

```tsx
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  // Animated sun/moon toggle
}
```

**Features**:

- Fixed positioning (top-right)
- Smooth rotation animations
- Touch-optimized 48px button
- Theme-aware icons (sun/moon)

## 🌤️ Weather Components

### WeatherIcon

**Purpose**: Animated SVG weather icons
**Location**: `src/utils/weatherIcons.tsx`

```tsx
const WeatherIcon: React.FC<WeatherIconProps> = ({
  code, size = 32, animated = false, className = ''
}) => {
  // Weather code to icon mapping
}
```

**Available Icons**:

- Clear Sky (0): Rotating sun with rays
- Partly Cloudy (1-3): Cloud formations
- Rainy (61-65): Animated raindrops
- Snowy (71-75): Falling snowflakes
- Thunderstorm (95-99): Lightning effects

### WeatherMainCard

**Purpose**: Primary weather display card
**Location**: `src/navigation/AppNavigator.tsx` (inline component)

```tsx
function WeatherMainCard({ weather, city, theme, isMobile, weatherCode }) {
  // Main weather information display
}
```

**Features**:

- Current temperature and "feels like"
- Weather description with animated icon
- Location badge with GPS indicator
- Weather details grid (humidity, wind, pressure)

### ForecastSections

**Purpose**: Hourly and daily forecast displays

#### HourlyForecastSection

- 24-hour scrollable forecast
- iOS momentum scrolling
- Scroll snap points for better UX
- Responsive card sizing

#### DailyForecastSection

- 7-day forecast display
- Today highlighting
- Temperature ranges
- Precipitation and wind data

## 🔧 Utility Components

### LoadingSkeletons

**Purpose**: Complete loading state system

#### Components

1. **WeatherCardSkeleton**: Main weather card loading
2. **ForecastListSkeleton**: Forecast list loading
3. **HourlyForecastSkeleton**: Horizontal scroll loading
4. **SearchInputSkeleton**: Search bar loading
5. **AppTitleSkeleton**: Title section loading

#### Shimmer Animation

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### ResponsiveUtils

**Purpose**: Mobile optimization utilities
**Location**: `src/utils/responsiveUtils.ts`

```tsx
export const createResponsiveTheme = (baseTheme: ThemeColors) => {
  // Enhanced theme with responsive utilities
}
```

**Features**:

- Responsive property creation
- Mobile button optimization
- Card sizing utilities
- Grid system helpers

## 🎭 Animation System

### CSS Animations

**Weather Icon Animations**:

```css
.sun-rays { animation: rotate 8s linear infinite; }
.rain-drop { animation: rain-fall 1.5s ease-in infinite; }
.lightning { animation: lightning-flash 2s ease-in-out infinite; }
```

### Transition System

**Theme Transitions**:

- Background: 0.6s ease
- Color: 0.5s ease
- Transform: 0.3s ease

**Interactive Animations**:

- Hover: translateY(-2px) with shadow increase
- Active: scale(0.98) with opacity reduction
- Focus: border glow with box-shadow

## 📱 Mobile Components

### Touch Optimization

**Minimum Touch Targets**: 44px (WCAG 2.1 compliant)
**Touch Feedback**: WebkitTapHighlightColor: transparent
**Active States**: Visual feedback for all interactions

### Responsive Behavior

**Mobile (≤768px)**:

- Single column layouts
- Larger text sizes
- Increased padding
- Touch-friendly spacing

**Tablet (769-1024px)**:

- Two-column grids
- Medium spacing
- Balanced text sizes
- Hover state support

**Desktop (>1024px)**:

- Multi-column layouts
- Smaller, denser spacing
- Full hover/focus effects
- Keyboard navigation

## 🎨 Styling System

### CSS-in-JS Approach

**Inline Styles**: Dynamic styling based on theme and state
**Style Functions**: Reusable style generators
**Theme Integration**: Direct theme property access

### Design Tokens

**Colors**: Comprehensive theme color system
**Typography**: Responsive font scaling
**Spacing**: Consistent padding/margin system
**Shadows**: Layered elevation system

### Responsive Design

**Breakpoint System**:

```tsx
const breakpoints = {
  mobile: '(max-width: 768px)',
  tablet: '(min-width: 769px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)'
};
```

## 🔄 State Management

### Component State

**Local State**: useState for component-specific data
**Theme State**: useTheme hook for global theme access
**Mobile State**: useBreakpoint for responsive behavior

### Performance Optimization

**Memoization**: useMemo for expensive calculations
**Callbacks**: useCallback for stable function references
**Effect Optimization**: useEffect with proper dependencies
