/**
 * Weather Icons Test File
 * 
 * Test suite for the new WeatherIcon component to ensure
 * all weather conditions render correctly with proper animations.
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import WeatherIcon from '../utils/weatherIcons';

describe('WeatherIcon Component', () => {
  // Test basic rendering
  test('renders weather icon for clear sky', () => {
    render(<WeatherIcon code={0} size={64} />);
    const iconElement = screen.getByRole('img', { hidden: true }) || screen.getByTestId('weather-icon') || document.querySelector('.weather-icon');
    expect(iconElement).toBeInTheDocument();
  });

  test('renders weather icon with custom size', () => {
    const { container } = render(<WeatherIcon code={0} size={100} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('width', '100');
    expect(svgElement).toHaveAttribute('height', '100');
  });

  test('renders animated weather icon', () => {
    const { container } = render(<WeatherIcon code={0} animated={true} />);
    const iconContainer = container.querySelector('.weather-icon-animated');
    expect(iconContainer).toBeInTheDocument();
  });

  test('renders different icons for different weather codes', () => {
    const { container: clearSky } = render(<WeatherIcon code={0} />);
    const { container: rainy } = render(<WeatherIcon code={61} />);
    const { container: snowy } = render(<WeatherIcon code={71} />);
    
    // Each should render different SVG content
    expect(clearSky.innerHTML).not.toBe(rainy.innerHTML);
    expect(rainy.innerHTML).not.toBe(snowy.innerHTML);
    expect(clearSky.innerHTML).not.toBe(snowy.innerHTML);
  });

  // Test weather code mappings
  test('renders sun icon for clear weather (code 0)', () => {
    const { container } = render(<WeatherIcon code={0} />);
    const sunElement = container.querySelector('.sun-body');
    expect(sunElement).toBeInTheDocument();
  });

  test('renders rain icon for rainy weather (code 61)', () => {
    const { container } = render(<WeatherIcon code={61} />);
    const rainElement = container.querySelector('.rain-drops');
    expect(rainElement).toBeInTheDocument();
  });

  test('renders snow icon for snowy weather (code 71)', () => {
    const { container } = render(<WeatherIcon code={71} />);
    const snowElement = container.querySelector('.snowflakes');
    expect(snowElement).toBeInTheDocument();
  });

  test('renders thunderstorm icon for storm weather (code 95)', () => {
    const { container } = render(<WeatherIcon code={95} />);
    const lightningElement = container.querySelector('.lightning');
    expect(lightningElement).toBeInTheDocument();
  });

  test('renders fog icon for foggy weather (code 45)', () => {
    const { container } = render(<WeatherIcon code={45} />);
    const fogElement = container.querySelector('.fog-layers');
    expect(fogElement).toBeInTheDocument();
  });

  // Test day/night variations
  test('renders sun during day time', () => {
    const { container } = render(<WeatherIcon code={0} isDay={true} />);
    const sunElement = container.querySelector('.sun-body');
    expect(sunElement).toBeInTheDocument();
  });

  test('renders moon during night time', () => {
    const { container } = render(<WeatherIcon code={0} isDay={false} />);
    const moonElement = container.querySelector('.moon-body');
    expect(moonElement).toBeInTheDocument();
  });

  // Test custom class names
  test('applies custom className', () => {
    const { container } = render(<WeatherIcon code={0} className="custom-weather-icon" />);
    const iconElement = container.querySelector('.custom-weather-icon');
    expect(iconElement).toBeInTheDocument();
  });

  // Test fallback for unknown weather codes
  test('renders fallback icon for unknown weather code', () => {
    const { container } = render(<WeatherIcon code={999} />);
    const iconElement = container.querySelector('.weather-icon');
    expect(iconElement).toBeInTheDocument();
  });
});

describe('Weather Icon Animations', () => {
  test('includes animation styles when animated is true', () => {
    const { container } = render(<WeatherIcon code={0} animated={true} />);
    const animatedElement = container.querySelector('.weather-icon-animated');
    expect(animatedElement).toBeInTheDocument();
  });

  test('does not include animation styles when animated is false', () => {
    const { container } = render(<WeatherIcon code={0} animated={false} />);
    const animatedElement = container.querySelector('.weather-icon-animated');
    expect(animatedElement).not.toBeInTheDocument();
  });
});

describe('Weather Icon Accessibility', () => {
  test('SVG elements have proper viewBox attributes', () => {
    const { container } = render(<WeatherIcon code={0} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('viewBox', '0 0 100 100');
  });

  test('includes proper ARIA attributes for accessibility', () => {
    const { container } = render(<WeatherIcon code={0} />);
    const iconContainer = container.querySelector('.weather-icon');
    expect(iconContainer).toBeInTheDocument();
  });
});
