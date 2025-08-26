// Horror weather quotes for dramatic effect

/**
 * Horror Weather Quotes
 * Spooky weather-related quotes inspired by horror movies
 */

export interface HorrorQuote {
  text: string;
  author?: string;
  movie?: string;
}

export const horrorWeatherQuotes: Record<string, HorrorQuote[]> = {
  // Clear/Sunny weather quotes
  clear: [
    {
      text: 'The sun never sets on evil...',
      movie: 'The Wicker Man',
    },
    {
      text: 'Even in the brightest light, darkness finds a way.',
    },
    {
      text: 'The light... it burns... but cannot cleanse.',
    },
    {
      text: "Sunshine in Crystal Lake... something's not right.",
    },
  ],

  // Cloudy weather quotes
  cloudy: [
    {
      text: 'The clouds gather like vultures overhead...',
    },
    {
      text: "Gray skies, red eyes... they're watching.",
    },
    {
      text: 'Behind every cloud lurks something sinister.',
    },
    {
      text: "The heavens weep for what's to come.",
    },
  ],

  // Rainy weather quotes
  rain: [
    {
      text: "It's not rain... it's the tears of the damned.",
    },
    {
      text: 'When it rains, it pours... blood.',
      movie: 'The Shining',
    },
    {
      text: 'Every drop carries a whisper of doom.',
    },
    {
      text: 'The storm brings more than water tonight.',
    },
    {
      text: 'Ch ch ch... ah ah ah... *thunder crashes*',
      movie: 'Friday the 13th',
    },
  ],

  // Thunderstorm quotes
  thunderstorm: [
    {
      text: 'Lightning reveals what darkness conceals.',
    },
    {
      text: "The thunder... it's calling your name.",
    },
    {
      text: 'In every flash, I see their faces...',
    },
    {
      text: "Storm's coming... and it's bringing friends.",
    },
    {
      text: 'Even Mother Nature has gone mad...',
    },
  ],

  // Snow weather quotes
  snow: [
    {
      text: 'The cold never bothered the dead anyway...',
    },
    {
      text: 'Winter in Crystal Lake... they never left.',
    },
    {
      text: 'Each snowflake is a soul crying out.',
    },
    {
      text: 'The white hides the red underneath.',
    },
    {
      text: 'In the blizzard, no one can hear you scream.',
    },
  ],

  // Fog weather quotes
  fog: [
    {
      text: 'The fog rolls in... and something else rolls out.',
    },
    {
      text: 'They move in the mist, unseen but felt.',
    },
    {
      text: "What lurks in the fog shouldn't be named.",
    },
    {
      text: 'The veil between worlds grows thin...',
    },
    {
      text: 'In the fog, all paths lead to darkness.',
      movie: 'The Fog',
    },
  ],

  // Night time quotes
  night: [
    {
      text: 'The night... it has eyes.',
    },
    {
      text: 'When darkness falls, evil rises.',
    },
    {
      text: 'They come alive after midnight...',
    },
    {
      text: 'Sleep? Not in Crystal Lake...',
    },
    {
      text: 'The witching hour approaches...',
    },
  ],

  // General spooky quotes
  general: [
    {
      text: 'Weather forecast: 100% chance of terror.',
    },
    {
      text: 'The atmosphere is... charged with malevolence.',
    },
    {
      text: 'Something wicked this way comes...',
      author: 'Shakespeare',
      movie: 'Macbeth',
    },
    {
      text: 'The elements conspire against the living.',
    },
    {
      text: 'Nature itself recoils from this place...',
    },
    {
      text: "Heeere's... Johnny!",
      movie: 'The Shining',
    },
    {
      text: "They're coming to get you, Barbara...",
      movie: 'Night of the Living Dead',
    },
  ],
};

// Map weather codes to quote categories
export const getHorrorQuoteCategory = (
  code: number,
  isDay: boolean = true
): string => {
  if (!isDay) return 'night';

  if (code === 0) return 'clear';
  if (code >= 1 && code <= 3) return 'cloudy';
  if (code >= 45 && code <= 48) return 'fog';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 95 && code <= 99) return 'thunderstorm';

  return 'general';
};

// Security: Use cryptographically secure random number generation
const getSecureRandomIndex = (maxValue: number): number => {
  if (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.getRandomValues
  ) {
    // Browser environment with crypto API
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % maxValue;
  } else if (typeof require !== 'undefined') {
    // Node.js environment - fallback to Math.random for browser compatibility
    return Math.floor(Math.random() * maxValue);
  } else {
    // Fallback for environments without crypto
    return Math.floor(Math.random() * maxValue);
  }
};

// Get a random horror quote for the weather condition
export const getRandomHorrorQuote = (
  code: number,
  isDay: boolean = true
): HorrorQuote => {
  const category = getHorrorQuoteCategory(code, isDay);
  const quotes = horrorWeatherQuotes[category] || horrorWeatherQuotes.general;

  return quotes[getSecureRandomIndex(quotes.length)];
};

// Crystal Lake specific quotes
export const crystalLakeQuotes: HorrorQuote[] = [
  {
    text: "Welcome to Crystal Lake... you'll never leave.",
    movie: 'Friday the 13th',
  },
  {
    text: 'The camp may be closed, but Jason never sleeps...',
    movie: 'Friday the 13th',
  },
  {
    text: 'Mrs. Voorhees warned them... but they never listen.',
    movie: 'Friday the 13th',
  },
  {
    text: 'Ki ki ki... ma ma ma...',
    movie: 'Friday the 13th',
  },
  {
    text: "Don't go in the water... don't go in the woods...",
    movie: 'Friday the 13th',
  },
  {
    text: 'Friday the 13th weather: Partly cloudy with a chance of mayhem.',
  },
  {
    text: 'Camp Crystal Lake Weather Station: Broadcasting your final forecast.',
  },
];

// Get Crystal Lake specific quote
export const getCrystalLakeQuote = (): HorrorQuote => {
  return crystalLakeQuotes[getSecureRandomIndex(crystalLakeQuotes.length)];
};
