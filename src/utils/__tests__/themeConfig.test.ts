import { describe, it, expect } from 'vitest';
import { lightTheme, darkTheme } from '../themeConfig';
import type { ThemeColors } from '../themeConfig';

describe('Theme Configuration', () => {
  describe('lightTheme', () => {
    it('should have all required properties', () => {
      const requiredProperties = [
        'appBackground',
        'cardBackground',
        'cardBorder',
        'cardShadow',
        'primaryText',
        'secondaryText',
        'inverseText',
        'primaryGradient',
        'buttonGradient',
        'buttonShadow',
        'weatherCardBackground',
        'weatherCardBorder',
        'weatherCardBadge',
        'forecastCardBackground',
        'forecastCardBorder',
        'toggleBackground',
        'toggleBorder',
        'errorBackground',
        'errorText',
        'errorBorder',
        'loadingBackground',
      ];

      requiredProperties.forEach(property => {
        expect(lightTheme).toHaveProperty(property);
        expect(lightTheme[property as keyof ThemeColors]).toBeDefined();
        expect(typeof lightTheme[property as keyof ThemeColors]).toBe('string');
      });
    });

    it('should have proper color format for basic colors', () => {
      // Test hex color format for basic colors
      expect(lightTheme.primaryText).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.secondaryText).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(lightTheme.inverseText).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should have gradient format for gradient properties', () => {
      expect(lightTheme.primaryGradient).toContain('linear-gradient');
      expect(lightTheme.buttonGradient).toContain('linear-gradient');
    });

    it('should have shadow format for shadow properties', () => {
      expect(lightTheme.cardShadow).toContain('rgba');
      expect(lightTheme.buttonShadow).toContain('rgba');
    });
  });

  describe('darkTheme', () => {
    it('should have all required properties', () => {
      const requiredProperties = [
        'appBackground',
        'cardBackground',
        'cardBorder',
        'cardShadow',
        'primaryText',
        'secondaryText',
        'inverseText',
        'primaryGradient',
        'buttonGradient',
        'buttonShadow',
        'weatherCardBackground',
        'weatherCardBorder',
        'weatherCardBadge',
        'forecastCardBackground',
        'forecastCardBorder',
        'toggleBackground',
        'toggleBorder',
        'errorBackground',
        'errorText',
        'errorBorder',
        'loadingBackground',
      ];

      requiredProperties.forEach(property => {
        expect(darkTheme).toHaveProperty(property);
        expect(darkTheme[property as keyof ThemeColors]).toBeDefined();
        expect(typeof darkTheme[property as keyof ThemeColors]).toBe('string');
      });
    });

    it('should have different colors from light theme', () => {
      // Key properties should be different between themes
      expect(darkTheme.appBackground).not.toBe(lightTheme.appBackground);
      expect(darkTheme.primaryText).not.toBe(lightTheme.primaryText);
      expect(darkTheme.cardBackground).not.toBe(lightTheme.cardBackground);
    });

    it('should maintain consistent structure with light theme', () => {
      const lightKeys = Object.keys(lightTheme).sort();
      const darkKeys = Object.keys(darkTheme).sort();

      expect(darkKeys).toEqual(lightKeys);
    });
  });

  describe('Theme Contrast and Accessibility', () => {
    it('should have sufficient contrast between text and background', () => {
      // Light theme should have dark text on light background
      expect(lightTheme.primaryText).toMatch(/^#[0-3]/); // Should start with darker hex values
      expect(lightTheme.appBackground).toContain('linear-gradient'); // Should be light gradient

      // Dark theme should have light text on dark background
      expect(darkTheme.primaryText).toMatch(/^#[c-f]/i); // Should start with lighter hex values
      expect(darkTheme.appBackground).toContain('linear-gradient'); // Should be dark gradient
    });

    it('should have consistent inverse text color', () => {
      // Inverse text should be suitable for buttons and badges
      expect(lightTheme.inverseText).toBe('#ffffff');
      expect(darkTheme.inverseText).toBe('#ffffff');
    });
  });
});
