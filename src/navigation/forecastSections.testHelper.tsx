import React from 'react';
import SmartWeatherSkeleton from '../components/optimized/SmartWeatherSkeleton';
import WeatherIcon from '../utils/weatherIcons';

// Types copied from AppNavigator context (minimal)
export type HourlyForecast = {
  time: string;
  weatherCode: number;
  temperature: number;
  humidity: number;
  feelsLike: number;
};
export type DailyForecast = {
  date: string;
  weatherCode: number;
  tempMin: number;
  tempMax: number;
  precipitation: number;
  windSpeed: number;
};

// Utilities copied for test rendering
const formatTimeForHourly = (time: string) => {
  const d = new Date(time);
  const h = d.getHours();
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${hour12} ${ampm}`;
};

const formatDayInfo = (dateStr: string, index: number) => {
  const d = new Date(dateStr);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
  const isToday = index === 0;
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  return { dayName, dateStr: formatted, isToday };
};

export const TestHourlySection: React.FC<{
  loading: boolean;
  hourlyForecast: HourlyForecast[];
}> = ({ loading, hourlyForecast }) => {
  if (loading && hourlyForecast.length === 0) {
    return (
      <div className="ios26-forecast-section">
        <div className="ios-headline ios26-text-primary ios26-text-semibold ios26-forecast-title">
          Hourly
        </div>
        <SmartWeatherSkeleton variant="hourly" count={4} showPulse={true} />
      </div>
    );
  }
  if (hourlyForecast.length > 0) {
    return (
      <div className="ios26-forecast-section enhanced-readability">
        <div className="ios-headline ios26-text-primary ios26-text-semibold ios26-forecast-title enhanced-readability">
          Hourly
        </div>
        <div className="ios26-forecast-scroll enhanced-readability ios26-timeline">
          {hourlyForecast.slice(0, 24).map((hour, index) => {
            const timeStr = formatTimeForHourly(hour.time);
            return (
              <div
                key={`hour-${hour.time}`}
                className={`ios26-forecast-item enhanced-readability ${index === 0 ? 'now' : ''}`}
              >
                <div className="ios26-text-footnote ios26-text-secondary ios26-forecast-time enhanced-readability">
                  {index === 0 ? 'Now' : timeStr}
                </div>
                <div className="ios26-forecast-icon">
                  <WeatherIcon
                    code={hour.weatherCode}
                    size={32}
                    animated={true}
                  />
                </div>
                <div className="ios26-forecast-temperature enhanced-readability">
                  <div className="ios26-text-subheadline ios26-text-semibold ios26-text-primary">
                    {hour.temperature}°F
                  </div>
                </div>
                <div className="ios26-text-caption2 ios26-text-tertiary ios26-forecast-sub">
                  💧 {hour.humidity}%
                </div>
                <div className="ios26-text-caption2 ios26-text-tertiary ios26-forecast-sub">
                  Feels {hour.feelsLike}°
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

export const TestDailySection: React.FC<{
  loading: boolean;
  dailyForecast: DailyForecast[];
}> = ({ loading, dailyForecast }) => {
  if (loading && dailyForecast.length === 0) {
    return (
      <div className="ios26-forecast-section enhanced-readability">
        <div className="ios-headline ios26-text-primary ios26-text-semibold ios26-forecast-title enhanced-readability">
          Daily
        </div>
        <SmartWeatherSkeleton variant="daily" count={7} showPulse={true} />
      </div>
    );
  }
  if (dailyForecast.length > 0) {
    const days = dailyForecast;
    const globalMin = Math.min(...days.map(d => d.tempMin));
    const globalMax = Math.max(...days.map(d => d.tempMax));
    const toStep = (val: number) =>
      Math.max(0, Math.min(10, Math.round(val * 10)));
    const getRangeSteps = (min: number, max: number) => {
      const total = Math.max(1, globalMax - globalMin);
      const startPct = (min - globalMin) / total;
      const widthPct = (max - min) / total;
      return { startStep: toStep(startPct), widthStep: toStep(widthPct) };
    };
    return (
      <div className="ios26-forecast-section enhanced-readability">
        <div className="ios-headline ios26-text-primary ios26-text-semibold ios26-forecast-title enhanced-readability">
          Daily
        </div>
        <div className="ios26-forecast-scroll enhanced-readability">
          {dailyForecast.map((day, index) => {
            const { dayName, dateStr, isToday } = formatDayInfo(
              day.date,
              index
            );
            const { startStep, widthStep } = getRangeSteps(
              day.tempMin,
              day.tempMax
            );
            return (
              <div
                key={`day-${day.date}`}
                className={`ios26-forecast-item enhanced-readability ${isToday ? 'today' : ''}`}
              >
                <div className="ios26-forecast-time enhanced-readability">
                  <div
                    className={`ios-subheadline ${isToday ? 'ios26-text-bold ios26-text-primary' : 'ios26-text-semibold ios26-text-primary'}`}
                  >
                    {dayName}
                  </div>
                  <div className="ios-caption ios26-text-secondary">
                    {dateStr}
                  </div>
                </div>
                <div className="ios26-forecast-icon">
                  <WeatherIcon
                    code={day.weatherCode}
                    size={36}
                    animated={true}
                  />
                </div>
                <div className="ios26-daily-range">
                  <div className="ios26-range-rail" />
                  <div
                    data-testid="ios26-range-fill"
                    className={`ios26-range-fill start-s${startStep} width-w${widthStep}`}
                  />
                </div>
                <div className="ios26-forecast-temp-range">
                  <div className="ios-subheadline ios26-text-semibold ios26-text-primary ios26-forecast-temperature enhanced-readability">
                    {day.tempMax}°
                  </div>
                  <div className="ios-subheadline ios26-text-secondary ios26-forecast-temperature enhanced-readability">
                    {day.tempMin}°
                  </div>
                </div>
                {day.precipitation > 0 && (
                  <div className="ios-caption2 ios26-text-tertiary ios26-forecast-precipitation enhanced-readability">
                    🌧️ {day.precipitation}mm
                  </div>
                )}
                <div className="ios-caption2 ios26-text-tertiary">
                  💨 {day.windSpeed}mph
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};
