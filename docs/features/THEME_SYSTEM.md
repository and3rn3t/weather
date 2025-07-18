# Theme System Documentation

## 🎨 Theme System Overview

Our weather app features a comprehensive theme system that provides dark/light modes with full mobile optimization and persistent storage.

## 🏗️ Theme Architecture

### Core Theme Structure

```typescript
interface ThemeColors {
  background: string;      // Primary background color
  surface: string;         // Card/container background
  primary: string;         // Main accent color (blue tones)
  secondary: string;       // Secondary accent color
  text: string;            // Primary text color
  textSecondary: string;   // Secondary/muted text
  border: string;          // Border colors
  accent: string;          // Highlight/emphasis color
}

interface ThemeContextType {
  isDark: boolean;         // Current theme mode
  colors: ThemeColors;     // Active color palette
  toggleTheme: () => void; // Theme switch function
  isMobile: boolean;       // Mobile detection
}
```

### Theme Definitions

#### Light Theme Colors

```typescript
const lightTheme: ThemeColors = {
  background: '#f8fafc',    // Clean white-blue background
  surface: '#ffffff',       // Pure white surfaces
  primary: '#3b82f6',       // Vibrant blue primary
  secondary: '#64748b',     // Professional gray-blue
  text: '#1e293b',          // Dark readable text
  textSecondary: '#64748b', // Muted secondary text
  border: '#e2e8f0',        // Subtle light borders
  accent: '#06b6d4'         // Cyan accent for highlights
};
```

#### Dark Theme Colors

```typescript
const darkTheme: ThemeColors = {
  background: '#0f172a',    // Deep navy background
  surface: '#1e293b',       // Elevated dark surface
  primary: '#60a5fa',       // Bright accessible blue
  secondary: '#94a3b8',     // Light gray-blue
  text: '#f1f5f9',          // High contrast white text
  textSecondary: '#94a3b8', // Readable secondary text
  border: '#334155',        // Subtle dark borders
  accent: '#22d3ee'         // Bright cyan accent
};
```

## 🎯 Theme Provider Implementation

### Context Setup

```typescript
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Theme state with validation
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('theme');
      // Validate saved theme value
      return saved === 'dark' || saved === 'light' ? saved === 'dark' : false;
    } catch {
      return false; // Fallback for localStorage errors
    }
  });

  // Mobile detection with responsive updates
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    window.innerWidth < 768
  );

  // Dynamic color selection
  const colors = isDark ? darkTheme : lightTheme;

  // Theme toggle with persistence
  const toggleTheme = useCallback(() => {
    setIsDark(prev => {
      const newTheme = !prev;
      try {
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
      } catch (error) {
        console.warn('Failed to save theme preference:', error);
      }
      return newTheme;
    });
  }, []);

  // Mobile detection listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, colors, toggleTheme, isMobile }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Custom Hook

```typescript
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## 🎨 Theme Usage Patterns

### Component Integration

```typescript
const WeatherCard: React.FC = () => {
  const { colors, isDark, isMobile } = useTheme();
  
  return (
    <div style={{
      backgroundColor: colors.surface,
      color: colors.text,
      border: `1px solid ${colors.border}`,
      borderRadius: isMobile ? '12px' : '8px',
      padding: isMobile ? '16px' : '12px',
      boxShadow: isDark 
        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
        : '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ color: colors.primary }}>Weather Info</h3>
      <p style={{ color: colors.textSecondary }}>Temperature details</p>
    </div>
  );
};
```

### CSS-in-JS Styling

```typescript
// Dynamic styles based on theme
const createStyles = (colors: ThemeColors, isMobile: boolean) => ({
  container: {
    backgroundColor: colors.background,
    color: colors.text,
    minHeight: '100vh',
    padding: isMobile ? '16px' : '24px',
    transition: 'all 0.3s ease'
  },
  
  button: {
    backgroundColor: colors.primary,
    color: colors.background,
    border: 'none',
    borderRadius: isMobile ? '8px' : '6px',
    padding: isMobile ? '12px 20px' : '8px 16px',
    fontSize: isMobile ? '16px' : '14px',
    minHeight: isMobile ? '44px' : 'auto', // iOS touch target
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: colors.accent,
      transform: 'translateY(-1px)'
    }
  },
  
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    border: `2px solid ${colors.border}`,
    borderRadius: isMobile ? '8px' : '6px',
    padding: isMobile ? '12px 16px' : '8px 12px',
    fontSize: isMobile ? '16px' : '14px', // Prevent iOS zoom
    outline: 'none',
    ':focus': {
      borderColor: colors.primary,
      boxShadow: `0 0 0 3px ${colors.primary}20`
    }
  }
});
```

## 📱 Mobile Optimizations

### Touch-Friendly Design

```typescript
const MobileOptimizedButton: React.FC<ButtonProps> = ({ onClick, children }) => {
  const { colors, isMobile } = useTheme();
  
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: colors.primary,
        color: colors.background,
        border: 'none',
        borderRadius: '8px',
        padding: isMobile ? '12px 20px' : '8px 16px',
        minHeight: isMobile ? '44px' : 'auto', // iOS accessibility
        fontSize: isMobile ? '16px' : '14px',   // Prevent zoom
        touchAction: 'manipulation',            // Disable double-tap zoom
        WebkitTapHighlightColor: 'transparent', // Remove iOS highlight
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
    >
      {children}
    </button>
  );
};
```

### Responsive Typography

```typescript
const ResponsiveText: React.FC<TextProps> = ({ variant, children }) => {
  const { colors, isMobile } = useTheme();
  
  const getTextStyles = (variant: TextVariant) => {
    const baseStyles = {
      color: colors.text,
      margin: 0,
      lineHeight: isMobile ? 1.5 : 1.4
    };
    
    switch (variant) {
      case 'heading':
        return {
          ...baseStyles,
          fontSize: isMobile ? '24px' : '32px',
          fontWeight: 600,
          color: colors.primary
        };
      case 'subheading':
        return {
          ...baseStyles,
          fontSize: isMobile ? '18px' : '20px',
          fontWeight: 500,
          color: colors.text
        };
      case 'body':
        return {
          ...baseStyles,
          fontSize: isMobile ? '16px' : '14px',
          color: colors.textSecondary
        };
      default:
        return baseStyles;
    }
  };
  
  return <span style={getTextStyles(variant)}>{children}</span>;
};
```

## 🎯 Theme Toggle Implementation

### Toggle Button Component

```typescript
const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme, colors, isMobile } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      style={{
        backgroundColor: colors.surface,
        border: `2px solid ${colors.border}`,
        borderRadius: '50%',
        width: isMobile ? '48px' : '40px',
        height: isMobile ? '48px' : '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        color: colors.primary,
        fontSize: isMobile ? '20px' : '16px'
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  );
};
```

### Animated Theme Transition

```typescript
const AnimatedThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  
  return (
    <div
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        transition: 'background-color 0.3s ease, color 0.3s ease',
        minHeight: '100vh'
      }}
    >
      {children}
    </div>
  );
};
```

## 💾 Persistence & Storage

### LocalStorage Integration

```typescript
// Theme persistence with error handling
const saveTheme = (isDark: boolean): void => {
  try {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
    // Could fall back to sessionStorage or cookies
  }
};

// Theme loading with validation
const loadTheme = (): boolean => {
  try {
    const saved = localStorage.getItem('theme');
    
    // Validate the saved value
    if (saved === 'dark' || saved === 'light') {
      return saved === 'dark';
    }
    
    // Invalid value found, clean it up
    if (saved !== null) {
      localStorage.removeItem('theme');
    }
    
    return false; // Default to light theme
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
    return false;
  }
};
```

### Migration Strategy

```typescript
// Handle legacy theme storage
const migrateThemeStorage = (): void => {
  try {
    // Check for old theme keys
    const legacyTheme = localStorage.getItem('darkMode') || 
                       localStorage.getItem('isDarkTheme');
    
    if (legacyTheme) {
      const isDark = legacyTheme === 'true' || legacyTheme === 'dark';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      
      // Clean up old keys
      localStorage.removeItem('darkMode');
      localStorage.removeItem('isDarkTheme');
    }
  } catch (error) {
    console.warn('Theme migration failed:', error);
  }
};
```

## 🧪 Testing Theme System

### Theme Context Testing

```typescript
// Test utilities for theme testing
export const renderWithTheme = (
  component: React.ReactElement,
  options: { isDark?: boolean } = {}
) => {
  const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeProvider>{children}</ThemeProvider>
  );
  
  return render(component, {
    wrapper: ThemeWrapper,
    ...options
  });
};

// Theme hook testing
const TestComponent: React.FC = () => {
  const { isDark, colors, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-mode">{isDark ? 'dark' : 'light'}</span>
      <span data-testid="background-color">{colors.background}</span>
      <button data-testid="toggle-theme" onClick={toggleTheme}>
        Toggle
      </button>
    </div>
  );
};

describe('Theme System', () => {
  it('should provide correct light theme colors', () => {
    renderWithTheme(<TestComponent />);
    
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('light');
    expect(screen.getByTestId('background-color')).toHaveTextContent('#f8fafc');
  });
  
  it('should toggle themes correctly', () => {
    renderWithTheme(<TestComponent />);
    
    const toggleButton = screen.getByTestId('toggle-theme');
    fireEvent.click(toggleButton);
    
    expect(screen.getByTestId('theme-mode')).toHaveTextContent('dark');
  });
  
  it('should persist theme to localStorage', () => {
    const localStorageMock = {
      setItem: jest.fn(),
      getItem: jest.fn(() => 'dark')
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    renderWithTheme(<TestComponent />);
    
    const toggleButton = screen.getByTestId('toggle-theme');
    fireEvent.click(toggleButton);
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark');
  });
});
```

## 🎨 Color Accessibility

### WCAG Compliance

```typescript
// Color contrast validation
const validateContrast = (foreground: string, background: string): boolean => {
  // Simplified contrast calculation
  const getLuminance = (color: string): number => {
    // Convert hex to RGB and calculate luminance
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return contrast >= 4.5; // WCAG AA standard
};

// Accessible color generation
const ensureAccessibleColors = (theme: ThemeColors): ThemeColors => {
  const validatedTheme = { ...theme };
  
  // Validate text contrast
  if (!validateContrast(theme.text, theme.background)) {
    console.warn('Text contrast may not meet accessibility standards');
  }
  
  return validatedTheme;
};
```

### High Contrast Mode

```typescript
// High contrast theme variant
const highContrastTheme: ThemeColors = {
  background: '#000000',
  surface: '#ffffff',
  primary: '#0066cc',
  secondary: '#666666',
  text: '#ffffff',
  textSecondary: '#cccccc',
  border: '#ffffff',
  accent: '#ffff00'
};

// System preference detection
const useSystemTheme = (): 'light' | 'dark' | 'high-contrast' => {
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark' | 'high-contrast'>('light');
  
  useEffect(() => {
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    
    const updateTheme = () => {
      if (highContrastQuery.matches) {
        setSystemTheme('high-contrast');
      } else if (darkModeQuery.matches) {
        setSystemTheme('dark');
      } else {
        setSystemTheme('light');
      }
    };
    
    updateTheme();
    darkModeQuery.addEventListener('change', updateTheme);
    highContrastQuery.addEventListener('change', updateTheme);
    
    return () => {
      darkModeQuery.removeEventListener('change', updateTheme);
      highContrastQuery.removeEventListener('change', updateTheme);
    };
  }, []);
  
  return systemTheme;
};
```

## 🔮 Future Enhancements

### Planned Theme Features

1. **Auto Theme**: System preference following
2. **Custom Themes**: User-defined color schemes
3. **Seasonal Themes**: Weather-based color adaptation
4. **Animation Themes**: Enhanced transitions
5. **Accessibility Options**: High contrast, reduced motion

### Advanced Theming

```typescript
// Future: Dynamic theme generation
interface DynamicThemeOptions {
  primaryColor: string;
  weatherCondition: 'sunny' | 'rainy' | 'snowy' | 'cloudy';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

const generateDynamicTheme = (options: DynamicThemeOptions): ThemeColors => {
  // Generate contextual themes based on weather and time
  const baseHue = getHueFromColor(options.primaryColor);
  const weatherModifier = getWeatherModifier(options.weatherCondition);
  const timeModifier = getTimeModifier(options.timeOfDay);
  
  return generateColorsFromHue(baseHue, weatherModifier, timeModifier);
};
```
