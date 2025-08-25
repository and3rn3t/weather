/**
 * Horror Weather Quote Display Component
 * Shows spooky weather-related quotes for the horror theme
 */

import {
  getCrystalLakeQuote,
  getRandomHorrorQuote,
} from '../utils/horrorQuotes';
import { useTheme } from '../utils/useTheme';

interface HorrorQuoteDisplayProps {
  weatherCode?: number;
  isDay?: boolean;
  cityName?: string;
  className?: string;
}

/**
 * HorrorQuoteDisplay - Core HorrorQuoteDisplay functionality
 * Only renders when horror theme is active
 */
export const HorrorQuoteDisplay = ({
  weatherCode = 0,
  isDay = true,
  cityName = '',
  className = '',
}: HorrorQuoteDisplayProps): JSX.Element | null => {
  const { isHorror } = useTheme();

  // Only render when horror theme is active
  if (!isHorror) {
    return null;
  }

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
