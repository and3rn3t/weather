# Testing Strategy & Implementation

## 🧪 Testing Philosophy

Our testing approach focuses on **reliability**, **maintainability**, and **real-world usage scenarios**. We prioritize testing user interactions and critical application flows over implementation details.

### Testing Principles

1. **User-Centric**: Test behavior users actually experience
2. **Integration Focus**: Favor integration tests over unit tests
3. **Maintainable**: Write tests that survive refactoring
4. **Fast Feedback**: Quick test execution for development workflow
5. **Real Scenarios**: Test actual usage patterns

## 📊 Test Coverage Overview

### Current Status: **70+ Tests Across 9 Test Suites**

| Category | Test Count | Coverage | Status |
|----------|------------|----------|---------|
| Theme System | 11 tests | 100% | ✅ Passing |
| Weather Icons | 19 tests | 100% | ✅ Passing |
| Mobile Optimization | 12 tests | 95% | ✅ Passing |
| Configuration | 9 tests | 100% | ✅ Passing |
| Weather Utils | 11 tests | 90% | ✅ Passing |
| Navigation | 5 tests | 85% | ✅ Passing |
| Integration | 7 tests | 80% | ⚠️ Some failures |

## 🛠️ Testing Stack

### Core Testing Tools

- **Vitest**: Fast test runner with TypeScript support
- **React Testing Library**: Component testing with user-focused queries
- **Jest DOM**: Additional matchers for DOM testing
- **MSW**: API mocking for integration tests

### Testing Utilities

```tsx
// Custom test utilities
export const renderWithTheme = (component: ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

export const mockWeatherAPI = () => {
  // Mock weather API responses
};
```

## 📋 Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and utilities
**Location**: `src/utils/__tests__/`

#### Weather Utilities (`weatherUtils.test.ts`)

```tsx
describe('Weather Utilities', () => {
  it('should map weather codes correctly', () => {
    expect(getWeatherDescription(0)).toBe('clear sky');
    expect(getWeatherDescription(61)).toBe('light rain');
  });

  it('should format temperature correctly', () => {
    expect(formatTemperature(23.7)).toBe('24°F');
  });
});
```

#### Theme Configuration (`themeConfig.test.ts`)

```tsx
describe('Theme Configuration', () => {
  it('should provide complete theme objects', () => {
    expect(lightTheme).toHaveProperty('primaryText');
    expect(darkTheme).toHaveProperty('appBackground');
  });

  it('should have consistent color properties', () => {
    const lightKeys = Object.keys(lightTheme);
    const darkKeys = Object.keys(darkTheme);
    expect(lightKeys).toEqual(darkKeys);
  });
});
```

### 2. Component Tests

**Purpose**: Test React component behavior
**Location**: Component-specific test files

#### Theme Context (`themeContext.test.tsx`)

```tsx
describe('Theme Context and Hook', () => {
  it('should toggle theme correctly', () => {
    const { getByTestId } = renderWithTheme(<TestComponent />);
    const toggleButton = getByTestId('toggle-theme');
    
    fireEvent.click(toggleButton);
    
    expect(getByTestId('theme-mode')).toHaveTextContent('dark');
  });

  it('should persist theme to localStorage', () => {
    // Test localStorage integration
  });
});
```

#### Weather Icons (`weatherIcons.test.tsx`)

```tsx
describe('Weather Icons', () => {
  it('should render correct icon for weather code', () => {
    const { container } = render(
      <WeatherIcon code={0} size={32} animated={true} />
    );
    
    expect(container.querySelector('.sun-rays')).toBeInTheDocument();
  });

  it('should apply animations when requested', () => {
    // Test animation class application
  });
});
```

### 3. Integration Tests

**Purpose**: Test component interactions and user flows
**Location**: `src/__tests__/`

#### App Navigation (`AppNavigator.test.tsx`)

```tsx
describe('App Navigation', () => {
  it('should navigate between screens', () => {
    const { getByText } = render(<AppNavigator />);
    
    fireEvent.click(getByText('Check Weather →'));
    
    expect(getByText('Weather Forecast')).toBeInTheDocument();
  });
});
```

#### Weather Forecast (`weatherForecast.test.tsx`)

```tsx
describe('Weather Forecast Features', () => {
  it('should display weather data after search', async () => {
    const { getByPlaceholderText, getByText } = render(<AppNavigator />);
    
    fireEvent.change(getByPlaceholderText('Enter city name...'), {
      target: { value: 'London' }
    });
    fireEvent.click(getByText('🔍 Search'));
    
    await waitFor(() => {
      expect(getByText(/°F/)).toBeInTheDocument();
    });
  });
});
```

### 4. Mobile Optimization Tests

**Purpose**: Test responsive behavior and mobile features
**Location**: `src/utils/__tests__/useMobileOptimization.test.ts`

```tsx
describe('Mobile Optimization', () => {
  it('should detect mobile breakpoint', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { result } = renderHook(() => useBreakpoint());
    
    expect(result.current.isMobile).toBe(true);
  });

  it('should create mobile-optimized buttons', () => {
    // Test mobile button creation
  });
});
```

## 🔧 Test Configuration

### Vitest Configuration (`vite.config.ts`)

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    css: true,
    reporters: ['verbose'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/setupTests.ts'],
    },
  },
});
```

### Test Setup (`src/setupTests.ts`)

```typescript
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
```

## 🎯 Testing Best Practices

### 1. Query Priority

**Recommended Query Order**:

1. `getByRole` - Most accessible
2. `getByLabelText` - Form elements
3. `getByText` - User-visible text
4. `getByTestId` - Last resort

### 2. Async Testing

```tsx
// Wait for API responses
await waitFor(() => {
  expect(getByText('Weather data')).toBeInTheDocument();
});

// Test loading states
expect(getByText('Loading...')).toBeInTheDocument();
```

### 3. Error Testing

```tsx
it('should handle API errors gracefully', async () => {
  // Mock API failure
  server.use(
    rest.get('*/forecast', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  // Test error display
  await waitFor(() => {
    expect(getByText(/Failed to fetch/)).toBeInTheDocument();
  });
});
```

### 4. Accessibility Testing

```tsx
it('should be accessible', () => {
  const { container } = render(<WeatherCard />);
  
  // Check for proper ARIA attributes
  expect(getByRole('button')).toHaveAttribute('aria-label');
  
  // Verify keyboard navigation
  fireEvent.keyDown(getByRole('button'), { key: 'Enter' });
});
```

## 📈 Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

### Test Reporting

- **Coverage Reports**: Generated on each CI run
- **Test Results**: Detailed failure reporting
- **Performance Metrics**: Test execution time tracking

## 🔮 Future Testing Enhancements

### Planned Improvements

1. **Visual Regression Testing**: Automated screenshot comparison
2. **Performance Testing**: Lighthouse CI integration
3. **E2E Testing**: Playwright for full user journeys
4. **Accessibility Testing**: Automated a11y checks

### Advanced Testing Scenarios

1. **Network Conditions**: Slow network simulation
2. **Device Testing**: Cross-device compatibility
3. **Offline Testing**: Service worker validation
4. **Security Testing**: XSS and injection protection
