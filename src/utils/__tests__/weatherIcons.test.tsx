import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import WeatherIcon from '../weatherIcons';

describe('WeatherIcon Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<WeatherIcon code={0} />);

      const container = document.querySelector('.weather-icon');
      expect(container).toBeInTheDocument();

      const svgElement = container?.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
      expect(svgElement).toHaveAttribute('width', '64');
      expect(svgElement).toHaveAttribute('height', '64');
    });

    it('should apply custom size', () => {
      render(<WeatherIcon code={0} size={100} />);

      const container = document.querySelector('.weather-icon');
      const svgElement = container?.querySelector('svg');
      expect(svgElement).toHaveAttribute('width', '100');
      expect(svgElement).toHaveAttribute('height', '100');
    });

    it('should apply custom className', () => {
      render(<WeatherIcon code={0} className="custom-class" />);

      const container = document.querySelector('.weather-icon');
      expect(container).toHaveClass('custom-class');
    });

    it('should include animation class when animated=true', () => {
      render(<WeatherIcon code={0} animated={true} />);

      const container = document.querySelector('.weather-icon');
      const svgElement = container?.querySelector('svg');
      expect(svgElement).toHaveClass('weather-icon-animated');
    });

    it('should not include animation class when animated=false', () => {
      render(<WeatherIcon code={0} animated={false} />);

      const container = document.querySelector('.weather-icon');
      const svgElement = container?.querySelector('svg');
      expect(svgElement).not.toHaveClass('weather-icon-animated');
    });
  });

  describe('Weather Code Mapping', () => {
    const testCases = [
      { code: 0, description: 'clear sky', expectedClass: 'sun-rays' },
      { code: 1, description: 'mainly clear', expectedClass: 'sun-rays' },
      { code: 2, description: 'partly cloudy', expectedClass: 'cloud-body' },
      { code: 3, description: 'overcast', expectedClass: 'cloud-body' },
      { code: 45, description: 'fog', expectedClass: 'fog-layers' },
      { code: 61, description: 'light rain', expectedClass: 'rain-cloud' },
      { code: 71, description: 'light snow', expectedClass: 'snow-cloud' },
      { code: 95, description: 'thunderstorm', expectedClass: 'storm-cloud' },
    ];

    testCases.forEach(({ code, description, expectedClass }) => {
      it(`should render correct icon for weather code ${code} (${description})`, () => {
        render(<WeatherIcon code={code} />);

        const container = document.querySelector('.weather-icon');
        const svgElement = container?.querySelector('svg');
        expect(svgElement).toBeInTheDocument();

        const weatherElement = svgElement?.querySelector(`.${expectedClass}`);
        expect(weatherElement).toBeInTheDocument();
      });
    });

    it('should render fallback icon for unknown weather codes', () => {
      render(<WeatherIcon code={999} />);

      const container = document.querySelector('.weather-icon');
      const svgElement = container?.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });
  });

  describe('SVG Structure', () => {
    it('should have proper SVG structure', () => {
      render(<WeatherIcon code={0} />);

      const container = document.querySelector('.weather-icon');
      const svgElement = container?.querySelector('svg');
      expect(svgElement?.tagName).toBe('svg');
      expect(svgElement).toHaveAttribute('viewBox', '0 0 100 100');
    });

    it('should maintain aspect ratio with viewBox', () => {
      render(<WeatherIcon code={0} size={100} />);

      const container = document.querySelector('.weather-icon');
      const svgElement = container?.querySelector('svg');
      expect(svgElement).toHaveAttribute('viewBox', '0 0 100 100');
      expect(svgElement).toHaveAttribute('width', '100');
      expect(svgElement).toHaveAttribute('height', '100');
    });
  });

  describe('Animation Features', () => {
    it('should have sun rays for clear weather', () => {
      render(<WeatherIcon code={0} animated={true} />);

      const container = document.querySelector('.weather-icon');
      const sunRays = container?.querySelector('.sun-rays');
      expect(sunRays).toBeInTheDocument();
    });

    it('should have rain drops for rainy weather', () => {
      render(<WeatherIcon code={61} animated={true} />);

      const container = document.querySelector('.weather-icon');
      const rainDrops = container?.querySelector('.rain-drops');
      expect(rainDrops).toBeInTheDocument();
    });

    it('should have lightning for stormy weather', () => {
      render(<WeatherIcon code={95} animated={true} />);

      const container = document.querySelector('.weather-icon');
      const lightning = container?.querySelector('.lightning');
      expect(lightning).toBeInTheDocument();
    });
  });
});
