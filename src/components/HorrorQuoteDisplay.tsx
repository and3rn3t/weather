/**
 * Horror Weather Quote Display Component
 * Shows spooky weather-related quotes for the horror theme
 */

import React from 'react';
import {
  getCrystalLakeQuote,
  getRandomHorrorQuote,
} from '../utils/horrorQuotes';

interface HorrorQuoteDisplayProps {
  weatherCode: number;
  isDay?: boolean;
  cityName?: string;
  className?: string;
}

export const HorrorQuoteDisplay: React.FC<HorrorQuoteDisplayProps> = ({
  weatherCode,
  isDay = true,
  cityName = '',
  className = '',
}) => {
  // Use Crystal Lake specific quotes if the city name contains "Crystal Lake"
  const isCrystalLake = cityName.toLowerCase().includes('crystal lake');

  const quote = isCrystalLake
    ? getCrystalLakeQuote()
    : getRandomHorrorQuote(weatherCode, isDay);

  return (
    <div className={`horror-weather-quote ${className}`}>
      <div className="quote-text">{quote.text}</div>
      {(quote.author || quote.movie) && (
        <div className="quote-attribution">
          {quote.author && (
            <span className="quote-author">— {quote.author}</span>
          )}
          {quote.movie && (
            <span className="quote-movie">
              {quote.author ? ', ' : '— '}
              {quote.movie}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default HorrorQuoteDisplay;
