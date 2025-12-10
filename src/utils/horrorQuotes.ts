/**
 * Horror Quotes - Friday the 13th Movie Quotes
 * Collection of quotes from the Friday the 13th franchise
 */

export interface HorrorQuote {
  text: string;
  author?: string;
  movie?: string;
  category?: 'weather' | 'general' | 'crystal-lake';
}

// Friday the 13th movie quotes
const friday13Quotes: HorrorQuote[] = [
  {
    text: 'Camp Blood. We're all gonna die.',
    movie: 'Friday the 13th',
    category: 'crystal-lake',
  },
  {
    text: 'You're doomed. You're all doomed.',
    movie: 'Friday the 13th',
    category: 'general',
  },
  {
    text: 'The lake has a history of death.',
    movie: 'Friday the 13th',
    category: 'crystal-lake',
  },
  {
    text: 'It has the death curse on it.',
    movie: 'Friday the 13th',
    category: 'crystal-lake',
  },
  {
    text: 'They say he drowned. But sometimes he comes back.',
    movie: 'Friday the 13th',
    category: 'crystal-lake',
  },
  {
    text: 'The storm is coming. You can feel it in the air.',
    movie: 'Friday the 13th Part 2',
    category: 'weather',
  },
  {
    text: 'On nights like this, when the cold wind blows...',
    movie: 'Friday the 13th',
    category: 'weather',
  },
  {
    text: 'The fog rolls in, and you can hear them calling.',
    movie: 'Friday the 13th',
    category: 'weather',
  },
  {
    text: 'Crystal Lake has a dark past.',
    movie: 'Friday the 13th',
    category: 'crystal-lake',
  },
  {
    text: 'When the rain falls, he walks.',
    movie: 'Friday the 13th Part 2',
    category: 'weather',
  },
  {
    text: 'The water is cold. Very cold.',
    movie: 'Friday the 13th',
    category: 'weather',
  },
  {
    text: 'He\'s watching. Always watching.',
    movie: 'Friday the 13th',
    category: 'general',
  },
  {
    text: 'The legend says he never dies.',
    movie: 'Friday the 13th Part 2',
    category: 'general',
  },
  {
    text: 'On a night like this, anything can happen.',
    movie: 'Friday the 13th',
    category: 'weather',
  },
  {
    text: 'The darkness brings him closer.',
    movie: 'Friday the 13th Part 2',
    category: 'general',
  },
  {
    text: 'When the moon is full, he\'s stronger.',
    movie: 'Friday the 13th Part VI: Jason Lives',
    category: 'weather',
  },
  {
    text: 'The wind whispers his name.',
    movie: 'Friday the 13th',
    category: 'weather',
  },
  {
    text: 'Crystal Lake is cursed.',
    movie: 'Friday the 13th',
    category: 'crystal-lake',
  },
  {
    text: 'The storm brings him back.',
    movie: 'Friday the 13th Part 2',
    category: 'weather',
  },
  {
    text: 'You can\'t escape. He\'s everywhere.',
    movie: 'Friday the 13th',
    category: 'general',
  },
];

export const crystalLakeQuotes: HorrorQuote[] = friday13Quotes.filter(
  q => q.category === 'crystal-lake'
);

export const getHorrorQuoteCategory = (): string => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'weather';
  if (hour >= 12 && hour < 18) return 'general';
  return 'crystal-lake';
};

export const getRandomHorrorQuote = (category?: string): HorrorQuote => {
  const quotes = category
    ? friday13Quotes.filter(q => q.category === category)
    : friday13Quotes;
  
  if (quotes.length === 0) {
    return friday13Quotes[0];
  }
  
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
};

export const getCrystalLakeQuote = (): HorrorQuote => {
  if (crystalLakeQuotes.length === 0) {
    return getRandomHorrorQuote();
  }
  const randomIndex = Math.floor(Math.random() * crystalLakeQuotes.length);
  return crystalLakeQuotes[randomIndex];
};
