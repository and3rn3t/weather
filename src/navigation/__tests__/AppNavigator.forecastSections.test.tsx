/* @vitest-environment jsdom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// We import the components indirectly through a simple wrappers that exposes the sections.
// To avoid importing the whole navigator, we re-export sections from a tiny test helper below.
import {
  TestDailySection,
  TestHourlySection,
} from '../forecastSections.testHelper';

const sampleHourly = Array.from({ length: 3 }).map((_, i) => ({
  time: `2025-08-28T0${i}:00:00Z`,
  weatherCode: 1,
  temperature: 70 + i,
  humidity: 50 + i,
  feelsLike: 69 + i,
}));

const sampleDaily = [
  {
    date: '2025-08-28',
    weatherCode: 1,
    tempMin: 60,
    tempMax: 80,
    precipitation: 0,
    windSpeed: 5,
  },
  {
    date: '2025-08-29',
    weatherCode: 2,
    tempMin: 62,
    tempMax: 78,
    precipitation: 1,
    windSpeed: 7,
  },
  {
    date: '2025-08-30',
    weatherCode: 3,
    tempMin: 58,
    tempMax: 85,
    precipitation: 0,
    windSpeed: 6,
  },
];

describe('Forecast sections (legacy AppNavigator)', () => {
  it('Hourly shows "Now" for the first item', () => {
    render(<TestHourlySection loading={false} hourlyForecast={sampleHourly} />);
    const el = screen.getByText('Now');
    expect(!!el).toBe(true);
  });

  it('Daily renders quantized range fill classes', () => {
    render(<TestDailySection loading={false} dailyForecast={sampleDaily} />);
    const fills = screen.getAllByTestId('ios26-range-fill');
    expect(fills.length).toBe(sampleDaily.length);
    // Ensure classes contain start-sX and width-wX tokens
    const classNames = fills.map(el => el.getAttribute('class') || '');
    expect(classNames.some(c => /start-s\d+/.test(c))).toBe(true);
    expect(classNames.some(c => /width-w\d+/.test(c))).toBe(true);
  });
});
