/**
 * Advanced Autocorrect Engine for City Search
 *
 * Provides enhanced typo tolerance using multiple algorithms:
 * - Levenshtein distance for edit distance calculation
 * - Phonetic matching for sound-alike cities
 * - Common misspellings database
 * - Fuzzy matching with scoring
 */

interface AutocorrectResult {
  original: string;
  corrected: string;
  confidence: number;
  algorithm: 'exact' | 'levenshtein' | 'phonetic' | 'fuzzy' | 'misspelling';
}

export type { AutocorrectResult };

interface CityData {
  name: string;
  display_name: string;
  lat: string;
  lon: string;
  country: string;
  phonetic?: string;
}

/**
 * Calculate Levenshtein distance between two strings
 * Used for finding closest matches to user input
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  const len1 = str1.length;
  const len2 = str2.length;

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Generate phonetic code for sound-alike matching
 * Simplified Soundex algorithm
 */
export function generatePhoneticCode(str: string): string {
  if (!str) return '';

  let code = str.toUpperCase().charAt(0);
  const consonants = str.toUpperCase().replace(/[AEIOUYHW]/g, '');

  // Map similar sounding letters
  const phoneticMap: { [key: string]: string } = {
    B: '1',
    F: '1',
    P: '1',
    V: '1',
    C: '2',
    G: '2',
    J: '2',
    K: '2',
    Q: '2',
    S: '2',
    X: '2',
    Z: '2',
    D: '3',
    T: '3',
    L: '4',
    M: '5',
    N: '5',
    R: '6',
  };

  for (let i = 1; i < consonants.length && code.length < 4; i++) {
    const phoneticValue = phoneticMap[consonants[i]];
    if (phoneticValue && code[code.length - 1] !== phoneticValue) {
      code += phoneticValue;
    }
  }

  return code.padEnd(4, '0').substring(0, 4);
}

/**
 * Common city name misspellings database
 */
const COMMON_MISSPELLINGS: { [key: string]: string[] } = {
  philadelphia: ['filadelfia', 'philadelfia', 'philadephia', 'filadelfija'],
  albuquerque: ['alberquerque', 'albaquerque', 'albuqerque'],
  pittsburgh: ['pittsburg', 'pittsberg', 'pitsburg'],
  worcester: ['worchester', 'worcestor', 'worcestar'],
  cincinnati: ['cincinatti', 'cincinati', 'cincinnnati'],
  milwaukee: ['milwakee', 'milwauke', 'milwaukie'],
  minneapolis: ['mineapolis', 'minneapols', 'mineapols'],
  sacramento: ['sacremento', 'sacremanto', 'sacremnto'],
  massachusetts: ['massachusets', 'massachussetts', 'masachusets'],
  connecticut: ['conecticut', 'connecticutt', 'conneticut'],
  mississippi: ['misisipi', 'mississipi', 'misssippi'],
};

/**
 * Calculate similarity score between two strings
 */
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Advanced autocorrect engine class
 */
export class AutocorrectEngine {
  private phoneticCache = new Map<string, string>();
  private similarityCache = new Map<string, number>();

  /**
   * Find the best autocorrection for a search query
   */
  findBestCorrection(
    query: string,
    cities: CityData[],
  ): AutocorrectResult | null {
    if (!query.trim() || cities.length === 0) return null;

    const queryLower = query.toLowerCase().trim();
    const results: AutocorrectResult[] = [];

    // Use helper methods to reduce complexity
    this.addExactMatches(queryLower, cities, results);
    this.addMisspellingMatches(queryLower, cities, results);
    this.addLevenshteinMatches(queryLower, cities, results);
    this.addPhoneticMatches(queryLower, cities, results);
    this.addFuzzyMatches(queryLower, cities, results);

    return this.getBestResult(results);
  }

  private addExactMatches(
    queryLower: string,
    cities: CityData[],
    results: AutocorrectResult[],
  ): void {
    for (const city of cities) {
      const cityName = city.name.toLowerCase();
      if (cityName === queryLower) {
        results.push({
          original: queryLower,
          corrected: city.name,
          confidence: 1.0,
          algorithm: 'exact',
        });
        return; // Early return for exact match
      }

      if (cityName.startsWith(queryLower) && queryLower.length >= 3) {
        results.push({
          original: queryLower,
          corrected: city.name,
          confidence: 0.95,
          algorithm: 'exact',
        });
      }
    }
  }

  private addMisspellingMatches(
    queryLower: string,
    cities: CityData[],
    results: AutocorrectResult[],
  ): void {
    for (const [correct, misspellings] of Object.entries(COMMON_MISSPELLINGS)) {
      if (misspellings.includes(queryLower)) {
        const matchingCity = cities.find(c =>
          c.name.toLowerCase().includes(correct),
        );
        if (matchingCity) {
          results.push({
            original: queryLower,
            corrected: matchingCity.name,
            confidence: 0.9,
            algorithm: 'misspelling',
          });
        }
      }
    }
  }

  private addLevenshteinMatches(
    queryLower: string,
    cities: CityData[],
    results: AutocorrectResult[],
  ): void {
    for (const city of cities) {
      const cityName = city.name.toLowerCase();
      const distance = levenshteinDistance(queryLower, cityName);
      const maxLength = Math.max(queryLower.length, cityName.length);

      if (distance <= Math.max(2, maxLength * 0.3)) {
        const similarity = calculateSimilarity(queryLower, cityName);
        if (similarity >= 0.6) {
          results.push({
            original: queryLower,
            corrected: city.name,
            confidence: similarity * 0.8,
            algorithm: 'levenshtein',
          });
        }
      }
    }
  }

  private addPhoneticMatches(
    queryLower: string,
    cities: CityData[],
    results: AutocorrectResult[],
  ): void {
    const queryPhonetic = this.getPhoneticCode(queryLower);
    for (const city of cities) {
      const cityPhonetic = this.getPhoneticCode(city.name.toLowerCase());
      if (queryPhonetic === cityPhonetic && queryPhonetic !== '0000') {
        results.push({
          original: queryLower,
          corrected: city.name,
          confidence: 0.7,
          algorithm: 'phonetic',
        });
      }
    }
  }

  private addFuzzyMatches(
    queryLower: string,
    cities: CityData[],
    results: AutocorrectResult[],
  ): void {
    for (const city of cities) {
      const fuzzyScore = this.calculateFuzzyScore(
        queryLower,
        city.name.toLowerCase(),
      );
      if (fuzzyScore >= 0.5) {
        results.push({
          original: queryLower,
          corrected: city.name,
          confidence: fuzzyScore * 0.75,
          algorithm: 'fuzzy',
        });
      }
    }
  }

  private getBestResult(
    results: AutocorrectResult[],
  ): AutocorrectResult | null {
    if (results.length === 0) return null;

    // Sort by confidence and return the best match
    results.sort((a, b) => b.confidence - a.confidence);

    // Remove duplicates, keeping highest confidence
    const uniqueResults = results.filter(
      (result, index, arr) =>
        arr.findIndex(r => r.corrected === result.corrected) === index,
    );

    return uniqueResults.length > 0 ? uniqueResults[0] : null;
  }

  /**
   * Get multiple autocorrection suggestions
   */
  getSuggestions(
    query: string,
    cities: CityData[],
    maxSuggestions = 3,
  ): AutocorrectResult[] {
    if (!query.trim() || cities.length === 0) return [];

    const queryLower = query.toLowerCase().trim();
    const results: AutocorrectResult[] = [];

    // Use all algorithms to find suggestions
    for (const city of cities.slice(0, 100)) {
      // Limit for performance
      const cityName = city.name.toLowerCase();

      // Exact/prefix matches
      if (cityName.startsWith(queryLower)) {
        results.push({
          original: query,
          corrected: city.name,
          confidence: 0.95,
          algorithm: 'exact',
        });
        continue;
      }

      // Levenshtein distance
      const distance = levenshteinDistance(queryLower, cityName);
      if (distance <= 3) {
        const similarity = calculateSimilarity(queryLower, cityName);
        if (similarity >= 0.5) {
          results.push({
            original: query,
            corrected: city.name,
            confidence: similarity * 0.8,
            algorithm: 'levenshtein',
          });
        }
      }

      // Fuzzy score
      const fuzzyScore = this.calculateFuzzyScore(queryLower, cityName);
      if (fuzzyScore >= 0.4) {
        results.push({
          original: query,
          corrected: city.name,
          confidence: fuzzyScore * 0.7,
          algorithm: 'fuzzy',
        });
      }
    }

    // Sort by confidence and remove duplicates
    results.sort((a, b) => b.confidence - a.confidence);
    const uniqueResults = results.filter(
      (result, index, arr) =>
        arr.findIndex(r => r.corrected === result.corrected) === index,
    );

    return uniqueResults.slice(0, maxSuggestions);
  }

  private getPhoneticCode(str: string): string {
    if (this.phoneticCache.has(str)) {
      const cachedCode = this.phoneticCache.get(str);
      return cachedCode || '';
    }

    const code = generatePhoneticCode(str);
    this.phoneticCache.set(str, code);
    return code;
  }

  private calculateFuzzyScore(query: string, target: string): number {
    const cacheKey = `${query}|${target}`;
    if (this.similarityCache.has(cacheKey)) {
      const cachedScore = this.similarityCache.get(cacheKey);
      return cachedScore || 0;
    }

    let score = 0;
    let queryIndex = 0;

    // Character-by-character fuzzy matching
    for (let i = 0; i < target.length && queryIndex < query.length; i++) {
      if (target[i] === query[queryIndex]) {
        score += 10;
        queryIndex++;
      }
    }

    // Bonus for matching all characters
    if (queryIndex === query.length) {
      score += 20;
    }

    // Normalize score
    const normalizedScore = Math.min(score / (query.length * 15), 1);
    this.similarityCache.set(cacheKey, normalizedScore);

    return normalizedScore;
  }

  /**
   * Clear caches to prevent memory leaks
   */
  clearCaches(): void {
    this.phoneticCache.clear();
    this.similarityCache.clear();
  }
}

// Export singleton instance
export const autocorrectEngine = new AutocorrectEngine();
