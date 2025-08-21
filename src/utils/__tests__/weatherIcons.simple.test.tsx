import { describe, test, expect } from 'vitest';
import { render } from '@testing-library/react';
import WeatherIcon from '../weatherIcons';

describe('WeatherIcon Component - Simple Tests', () => {
  test('renders weather icon for clear sky', () => {
    const { container } = render(<WeatherIcon code={0} size={64} />);
    const iconElement = container.querySelector('.weather-icon');
    expect(iconElement).toBeInTheDocument();
  });

  test('renders weather icon with custom size', () => {
    const { container } = render(<WeatherIcon code={0} size={100} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('width', '100');
    expect(svgElement).toHaveAttribute('height', '100');
  });

  test('renders animated weather icon', () => {
    const { container } = render(
      <WeatherIcon code={0} size={64} animated={true} />,
    );
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveClass('weather-icon-animated');
  });

  test('renders different icons for different weather codes', () => {
    const { container: container1 } = render(
      <WeatherIcon code={0} size={64} />,
    );
    const { container: container2 } = render(
      <WeatherIcon code={61} size={64} />,
    );

    const svg1 = container1.querySelector('svg');
    const svg2 = container2.querySelector('svg');

    expect(svg1).toBeInTheDocument();
    expect(svg2).toBeInTheDocument();
    // SVG content should be different for different weather codes
    expect(svg1?.innerHTML).not.toBe(svg2?.innerHTML);
  });

  test('includes proper viewBox attributes', () => {
    const { container } = render(<WeatherIcon code={0} size={64} />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toHaveAttribute('viewBox', '0 0 100 100');
  });
});
