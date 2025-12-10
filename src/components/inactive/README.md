# Inactive Components

This folder contains components that are currently not being used in the active codebase but may be useful for future reference or re-implementation.

## Folder Structure

### `deprecated/`
Components that have been explicitly deprecated and replaced with newer implementations:
- **HorrorQuoteDisplay.tsx** - Deprecated horror theme quote display (returns null)
- **HorrorThemeActivator.tsx** - Deprecated horror theme activator (returns null)
- **HorrorThemeActivator.css** - Associated styles

### `test/`
Test and development components used for debugging and verification:
- **MobileTest.tsx** - Mobile optimization testing component
- **NavigationTest.tsx** - iOS-style navigation positioning test component

### `legacy-ui/`
Legacy UI components that have been replaced by newer implementations:
- **BottomSheet.tsx** - Legacy bottom sheet component
- **FloatingActionButton.tsx** - Legacy floating action button
- **IOSHIGNavigation.tsx** - Legacy iOS HIG navigation component
- **IOSHIGWeatherDisplay.tsx** - Legacy iOS HIG weather display
- **IOSSearchBar.tsx** - Legacy iOS search bar (replaced by EnhancedSearchBar)
- **EnhancedSearchBar.tsx** - Enhanced search bar component
- **EnhancedSearchBar.css** - Associated styles
- **EnhancedSearchScreen.tsx** - Enhanced search screen component
- **EnhancedSearchScreen.css** - Associated styles
- **WeatherInteractionEnhancer.tsx** - Weather interaction enhancement component

### `modernWeatherUI/`
Modern weather UI components that are not currently in use:
- **SimpleIOSDemo.tsx** - Simple iOS demo component
- **IOSWeatherDemo.tsx** - iOS weather demo (replaced by iOS26WeatherDemo)
- **ModernHomeScreen.tsx** - Modern home screen component
- **ModernForecast.tsx** - Modern forecast component
- **ModernWeatherMetrics.tsx** - Modern weather metrics component
- **InteractiveWeatherWidget.tsx** - Interactive weather widget (used only in NavigationTest)
- **EnhancedMobileWeatherCard.tsx** - Enhanced mobile weather card
- **EnhancedWeatherDisplay.tsx** - Enhanced weather display component
- **WeatherCard.tsx** - Weather card component (used by WeatherHapticIntegration)
- **integration-guide.ts** - Integration guide documentation
- **iOS26IntegrationGuide.js** - iOS 26 integration guide

## Notes

- These components are preserved for potential future use
- Some components may have dependencies on other inactive components
- If you need to use any of these components, check their imports and update paths accordingly
- Components in `test/` folder may be useful for debugging and development
- Components in `legacy-ui/` have been superseded by newer implementations in the active codebase

## Reactivation

To reactivate a component:
1. Move it back to the appropriate active folder (`src/components/` or `src/components/modernWeatherUI/`)
2. Update any import paths in the component file
3. Update imports in files that use the component
4. Test thoroughly to ensure it works with the current codebase

