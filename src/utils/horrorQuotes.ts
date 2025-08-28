// Retired: horror quotes have been removed. Keep minimal no-op exports for compatibility.
export interface HorrorQuote {
  text: string;
  author?: string;
  movie?: string;
}

export const getHorrorQuoteCategory = () => 'general';
export const getRandomHorrorQuote = (): HorrorQuote => ({ text: '' });
export const crystalLakeQuotes: HorrorQuote[] = [];
export const getCrystalLakeQuote = (): HorrorQuote => ({ text: '' });
