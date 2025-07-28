# Contributing to Premium Weather App

Thank you for your interest in contributing to our weather application! This guide will help you get started.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Git
- Modern browser with ES2020+ support

### Development Setup

1. **Fork the repository**

   ```bash
   # Fork on GitHub, then clone your fork
   git clone https://github.com/your-username/weather.git
   cd weather
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**

   ```bash
   npm run dev
   ```

4. **Run tests**

   ```bash
   npm test
   ```

## 🎯 Development Guidelines

### Code Style

- **TypeScript**: Use strict mode and follow ESLint rules
- **React**: Use functional components with hooks
- **Accessibility**: Maintain WCAG 2.1 AA compliance
- **Performance**: Consider bundle size impact for all changes

### Commit Convention

We use [Conventional Commits](https://conventionalcommits.org/):

```text
feat: add weather haptic feedback system
fix: resolve location service caching issue
docs: update API integration guide
style: improve mobile navigation animations
test: add coverage for haptic patterns
refactor: centralize weather data utilities
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

## 🔧 Project Structure

```text
src/
├── components/           # React components
│   ├── modernWeatherUI/  # Premium UI components
│   ├── MobileNavigation/ # Mobile navigation system
│   └── ...
├── utils/               # Utilities and hooks
│   ├── haptic*/         # Haptic feedback system
│   ├── location*/       # Location services
│   ├── weather*/        # Weather data management
│   └── ...
├── styles/              # CSS and design tokens
├── navigation/          # App navigation logic
└── __tests__/           # Test suites
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Guidelines

1. **Unit Tests**: Test individual components and utilities
2. **Integration Tests**: Test component interactions
3. **Accessibility Tests**: Ensure WCAG compliance
4. **Mobile Tests**: Test touch interactions and responsiveness

### Test Structure

```typescript
describe('WeatherHapticIntegration', () => {
  describe('weather pattern generation', () => {
    it('should generate appropriate haptic patterns for different weather conditions', () => {
      // Test implementation
    });
  });
});
```

## 📱 Mobile Development

### Haptic Feedback Guidelines

- **Weather-Contextual**: Patterns should relate to weather conditions
- **Battery Efficient**: Use rate limiting and intensity scaling
- **Accessible**: Provide alternative feedback for users with disabilities
- **Progressive**: Build complexity gradually through interactions

### Touch Interaction Standards

- **44px minimum touch targets** (iOS guidelines)
- **Swipe gestures** with visual feedback
- **Pull-to-refresh** with progressive loading states
- **Haptic feedback** for all interactive elements

## 🎨 Design System

### Color Usage

```css
/* Use CSS custom properties */
.weather-card {
  background: var(--card-background);
  color: var(--primary-text);
  border-radius: var(--border-radius-lg);
}
```

### Component Guidelines

- **Glassmorphism**: Use backdrop-filter for modern effects
- **Responsive**: Mobile-first approach with progressive enhancement
- **Accessible**: Semantic HTML with proper ARIA attributes
- **Performant**: Optimize animations and transitions

## 🔍 Code Review Process

### Before Submitting

1. **Self-review**: Check your own code thoroughly
2. **Tests**: Ensure all tests pass
3. **Build**: Verify production build works
4. **Accessibility**: Test with screen readers
5. **Performance**: Check bundle size impact

### Pull Request Guidelines

1. **Clear Title**: Use descriptive titles with conventional commit format
2. **Description**: Explain what changes were made and why
3. **Screenshots**: Include visuals for UI changes
4. **Testing**: Describe how changes were tested
5. **Breaking Changes**: Clearly document any breaking changes

### Review Criteria

- **Functionality**: Does it work as intended?
- **Code Quality**: Is it readable and maintainable?
- **Performance**: Does it impact bundle size or runtime performance?
- **Accessibility**: Does it maintain WCAG compliance?
- **Tests**: Are there adequate tests for the changes?

## 🚦 Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Run full test suite
4. Create production build
5. Test on multiple devices
6. Create GitHub release with notes

## 🤝 Community Guidelines

### Code of Conduct

- **Be respectful** and inclusive
- **Help others** learn and grow
- **Give constructive feedback**
- **Focus on the code**, not the person

### Getting Help

- **Issues**: Use GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions
- **Documentation**: Check existing docs first
- **Code Review**: Ask specific questions in PR comments

## 📊 Performance Standards

### Bundle Size Targets

- **Main Bundle**: < 400KB (< 120KB gzipped)
- **Vendor Bundle**: < 50KB (< 15KB gzipped)
- **CSS Bundle**: < 50KB (< 10KB gzipped)

### Performance Metrics

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.0s
- **Cumulative Layout Shift**: < 0.1

### Optimization Guidelines

1. **Code Splitting**: Use dynamic imports for large features
2. **Tree Shaking**: Ensure unused code is eliminated
3. **Image Optimization**: Use appropriate formats and sizes
4. **Caching**: Implement proper caching strategies

Thank you for contributing to make this weather app even better! 🌤️
