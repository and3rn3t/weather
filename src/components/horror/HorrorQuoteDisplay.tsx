/**
 * HorrorQuoteDisplay - Component to show Friday the 13th quotes
 * Displays random horror quotes with movie attribution
 */

import React, { useEffect, useState } from 'react';
import {
  getRandomHorrorQuote,
  getHorrorQuoteCategory,
  type HorrorQuote,
} from '../../utils/horrorQuotes';
import '../../styles/horror-theme.css';

interface HorrorQuoteDisplayProps {
  category?: string;
  autoRotate?: boolean;
  rotateInterval?: number; // milliseconds
  className?: string;
}

export const HorrorQuoteDisplay: React.FC<HorrorQuoteDisplayProps> = ({
  category,
  autoRotate = false,
  rotateInterval = 10000, // 10 seconds default
  className = '',
}) => {
  const [quote, setQuote] = useState<HorrorQuote>(() => {
    const cat = category || getHorrorQuoteCategory();
    return getRandomHorrorQuote(cat);
  });

  useEffect(() => {
    if (!autoRotate) return;

    const interval = setInterval(() => {
      const cat = category || getHorrorQuoteCategory();
      setQuote(getRandomHorrorQuote(cat));
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, rotateInterval, category]);

  if (!quote.text) {
    return null;
  }

  return (
    <div className={`horror-quote-display ${className}`}>
      <div className="horror-quote-text">"{quote.text}"</div>
      {(quote.movie || quote.author) && (
        <div className="horror-quote-attribution">
          {quote.movie && `— ${quote.movie}`}
          {quote.author && quote.movie && ', '}
          {quote.author && quote.author}
        </div>
      )}
    </div>
  );
};

export default HorrorQuoteDisplay;
