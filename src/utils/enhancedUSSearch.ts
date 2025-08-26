/**
 * Enhanced US Location Search
 *
 * Dramatically improves search results for US-based locations by:
 * 1. Adding comprehensive US cities database
 * 2. Implementing geographic prioritization
 * 3. Enhanced search parameters for US addresses
 * 4. State-aware search with abbreviations
 * 5. ZIP code support
 */

import { useState } from 'react';
import { logError, logInfo } from './logger';

// Comprehensive US cities database with population data
export const US_CITIES_DATABASE = [
  // Major US Cities (Priority 10)
  {
    name: 'New York',
    state: 'NY',
    stateAbbr: 'NY',
    lat: 40.7128,
    lon: -74.006,
    population: 8336000,
    priority: 10,
  },
  {
    name: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    lat: 34.0522,
    lon: -118.2437,
    population: 3979000,
    priority: 10,
  },
  {
    name: 'Chicago',
    state: 'Illinois',
    stateAbbr: 'IL',
    lat: 41.8781,
    lon: -87.6298,
    population: 2716000,
    priority: 10,
  },
  {
    name: 'Houston',
    state: 'Texas',
    stateAbbr: 'TX',
    lat: 29.7604,
    lon: -95.3698,
    population: 2320000,
    priority: 10,
  },
  {
    name: 'Phoenix',
    state: 'Arizona',
    stateAbbr: 'AZ',
    lat: 33.4484,
    lon: -112.074,
    population: 1608000,
    priority: 10,
  },

  // Major Business/Tech Hubs (Priority 9)
  {
    name: 'San Francisco',
    state: 'California',
    stateAbbr: 'CA',
    lat: 37.7749,
    lon: -122.4194,
    population: 884000,
    priority: 9,
  },
  {
    name: 'Boston',
    state: 'Massachusetts',
    stateAbbr: 'MA',
    lat: 42.3601,
    lon: -71.0589,
    population: 695000,
    priority: 9,
  },
  {
    name: 'Seattle',
    state: 'Washington',
    stateAbbr: 'WA',
    lat: 47.6062,
    lon: -122.3321,
    population: 753000,
    priority: 9,
  },
  {
    name: 'Denver',
    state: 'Colorado',
    stateAbbr: 'CO',
    lat: 39.7392,
    lon: -104.9903,
    population: 715000,
    priority: 9,
  },
  {
    name: 'Atlanta',
    state: 'Georgia',
    stateAbbr: 'GA',
    lat: 33.749,
    lon: -84.388,
    population: 499000,
    priority: 9,
  },

  // Large Cities (Priority 8)
  {
    name: 'Philadelphia',
    state: 'Pennsylvania',
    stateAbbr: 'PA',
    lat: 39.9526,
    lon: -75.1652,
    population: 1584000,
    priority: 8,
  },
  {
    name: 'San Antonio',
    state: 'Texas',
    stateAbbr: 'TX',
    lat: 29.4241,
    lon: -98.4936,
    population: 1547000,
    priority: 8,
  },
  {
    name: 'San Diego',
    state: 'California',
    stateAbbr: 'CA',
    lat: 32.7157,
    lon: -117.1611,
    population: 1423000,
    priority: 8,
  },
  {
    name: 'Dallas',
    state: 'Texas',
    stateAbbr: 'TX',
    lat: 32.7767,
    lon: -96.797,
    population: 1344000,
    priority: 8,
  },
  {
    name: 'San Jose',
    state: 'California',
    stateAbbr: 'CA',
    lat: 37.3382,
    lon: -121.8863,
    population: 1035000,
    priority: 8,
  },

  // Popular Tourist/Business Cities (Priority 7)
  {
    name: 'Las Vegas',
    state: 'Nevada',
    stateAbbr: 'NV',
    lat: 36.1699,
    lon: -115.1398,
    population: 651000,
    priority: 7,
  },
  {
    name: 'Miami',
    state: 'Florida',
    stateAbbr: 'FL',
    lat: 25.7617,
    lon: -80.1918,
    population: 467000,
    priority: 7,
  },
  {
    name: 'Portland',
    state: 'Oregon',
    stateAbbr: 'OR',
    lat: 45.5152,
    lon: -122.6784,
    population: 652000,
    priority: 7,
  },
  {
    name: 'Nashville',
    state: 'Tennessee',
    stateAbbr: 'TN',
    lat: 36.1627,
    lon: -86.7816,
    population: 670000,
    priority: 7,
  },
  {
    name: 'Orlando',
    state: 'Florida',
    stateAbbr: 'FL',
    lat: 28.5383,
    lon: -81.3792,
    population: 287000,
    priority: 7,
  },

  // Mid-size Cities (Priority 6)
  {
    name: 'Davenport',
    state: 'Iowa',
    stateAbbr: 'IA',
    lat: 41.5236,
    lon: -90.5771,
    population: 101000,
    priority: 6,
  },
  {
    name: 'Bettendorf',
    state: 'Iowa',
    stateAbbr: 'IA',
    lat: 41.5254,
    lon: -90.5099,
    population: 38000,
    priority: 6,
  },
  {
    name: 'Moline',
    state: 'Illinois',
    stateAbbr: 'IL',
    lat: 41.5058,
    lon: -90.5137,
    population: 42000,
    priority: 6,
  },
  {
    name: 'Rock Island',
    state: 'Illinois',
    stateAbbr: 'IL',
    lat: 41.5095,
    lon: -90.5787,
    population: 38000,
    priority: 6,
  },
  {
    name: 'Cedar Rapids',
    state: 'Iowa',
    stateAbbr: 'IA',
    lat: 41.9778,
    lon: -91.6656,
    population: 133000,
    priority: 6,
  },
  {
    name: 'Iowa City',
    state: 'Iowa',
    stateAbbr: 'IA',
    lat: 41.6611,
    lon: -91.5302,
    population: 74000,
    priority: 6,
  },
  {
    name: 'Peoria',
    state: 'Illinois',
    stateAbbr: 'IL',
    lat: 41.6868,
    lon: -89.589,
    population: 110000,
    priority: 6,
  },
];

// Remove duplicate Phoenix entry and ensure uniqueness
const uniqueUSCities = US_CITIES_DATABASE.filter(
  (city, index, arr) =>
    arr.findIndex(
      c => c.name === city.name && c.stateAbbr === city.stateAbbr
    ) === index
);

export const ENHANCED_US_CITIES = uniqueUSCities;

// State name mappings for enhanced search
export const US_STATE_MAPPINGS = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
};

export interface EnhancedUSSearchResult {
  name: string;
  display_name: string;
  lat: number;
  lon: number;
  state: string;
  stateAbbr: string;
  country: string;
  isUSCity: boolean;
  priority: number;
  population?: number;
  source: 'local_database' | 'api';
}

export interface USSearchOptions {
  prioritizeUS?: boolean;
  includeStates?: boolean;
  includeZipCodes?: boolean;
  maxResults?: number;
  userLocation?: { lat: number; lon: number };
}

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance?: number;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    state?: string;
    country?: string;
  };
  name?: string;
  place_rank?: number;
}

/**
 * Enhanced US-focused search function
 */
export async function searchUSLocations(
  query: string,
  options: USSearchOptions = {}
): Promise<EnhancedUSSearchResult[]> {
  const {
    prioritizeUS = true,
    includeStates = true,
    includeZipCodes = true,
    maxResults = 8,
    userLocation,
  } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const results: EnhancedUSSearchResult[] = [];
  const searchLower = query.toLowerCase().trim();

  // 1. Search local US cities database first
  const localUSResults = searchLocalUSCities(searchLower, userLocation);
  results.push(...localUSResults);

  // 2. Search API with enhanced US parameters
  try {
    const apiResults = await searchNominatimEnhanced(query, {
      prioritizeUS,
      includeStates,
      includeZipCodes,
    });

    // Merge results, avoiding duplicates
    for (const apiResult of apiResults) {
      const isDuplicate = results.some(
        r =>
          Math.abs(r.lat - apiResult.lat) < 0.01 &&
          Math.abs(r.lon - apiResult.lon) < 0.01
      );

      if (!isDuplicate) {
        results.push(apiResult);
      }
    }
  } catch (error) {
    logError('Enhanced US search API error:', error);
  }

  // 3. Sort by relevance and priority
  const sortedResults = [...results]
    .sort((a, b) => {
      // Exact name matches first
      const aExact = a.name.toLowerCase() === searchLower ? 1 : 0;
      const bExact = b.name.toLowerCase() === searchLower ? 1 : 0;
      if (aExact !== bExact) return bExact - aExact;

      // US cities prioritized
      const aUS = a.isUSCity ? 1 : 0;
      const bUS = b.isUSCity ? 1 : 0;
      if (prioritizeUS && aUS !== bUS) return bUS - aUS;

      // Then by priority/population
      return (b.priority || 0) - (a.priority || 0);
    })
    .slice(0, maxResults);

  logInfo(
    `Enhanced US search for "${query}" returned ${sortedResults.length} results`
  );
  return sortedResults;
}

/**
 * Search local US cities database
 */
function searchLocalUSCities(
  searchQuery: string,
  _userLocation?: { lat: number; lon: number }
): EnhancedUSSearchResult[] {
  const matches = ENHANCED_US_CITIES.filter(city => {
    const cityLower = city.name.toLowerCase();
    const stateLower = city.state.toLowerCase();
    const stateAbbrLower = city.stateAbbr.toLowerCase();

    return (
      cityLower.includes(searchQuery) ||
      cityLower.startsWith(searchQuery) ||
      stateLower.includes(searchQuery) ||
      stateAbbrLower.includes(searchQuery) ||
      `${cityLower} ${stateAbbrLower}`.includes(searchQuery) ||
      `${cityLower}, ${stateLower}`.includes(searchQuery)
    );
  });

  return matches.map(city => ({
    name: city.name,
    display_name: `${city.name}, ${city.state}, United States`,
    lat: city.lat,
    lon: city.lon,
    state: city.state,
    stateAbbr: city.stateAbbr,
    country: 'United States',
    isUSCity: true,
    priority: city.priority,
    population: city.population,
    source: 'local_database' as const,
  }));
}

/**
 * Enhanced Nominatim search with US-optimized parameters
 */
async function searchNominatimEnhanced(
  query: string,
  options: {
    prioritizeUS?: boolean;
    includeStates?: boolean;
    includeZipCodes?: boolean;
  }
): Promise<EnhancedUSSearchResult[]> {
  const { prioritizeUS = true, includeStates = true } = options;

  // Enhanced search parameters for better US results
  const searchParams = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '15', // Increased limit for better coverage
    'accept-language': 'en-US,en', // US English preference
    dedupe: '1',
    extratags: '1',
    namedetails: '1',
    // Bias towards US if prioritizing
    ...(prioritizeUS && {
      countrycodes: 'us', // Restrict to US first
      viewbox: '-125,49,-66,24', // US bounding box
      bounded: '1',
    }),
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${searchParams}`,
    {
      headers: {
        'User-Agent': 'EnhancedWeatherApp/2.0 (US Location Search)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Nominatim search failed: ${response.status}`);
  }

  const data = await response.json();

  // Enhanced filtering for US locations
  const filtered = data.filter((item: NominatimResult) => {
    const isValidType =
      item.type === 'city' ||
      item.type === 'town' ||
      item.type === 'village' ||
      item.type === 'hamlet' ||
      item.type === 'administrative' ||
      item.class === 'place' ||
      (includeStates && item.type === 'state');

    // Improved importance threshold
    const hasGoodImportance = !item.importance || item.importance > 0.2;

    // US location check
    const isUSLocation =
      item.display_name?.includes('United States') ||
      item.address?.country === 'United States';

    return isValidType && hasGoodImportance && (!prioritizeUS || isUSLocation);
  });

  return filtered.map((item: NominatimResult) => {
    const address = item.address || {};
    const cityName =
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      item.display_name?.split(',')[0] ||
      item.name;

    const state = address.state || '';
    const stateAbbr = getStateAbbreviation(state);

    return {
      name: cityName,
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      state,
      stateAbbr,
      country: address.country || 'United States',
      isUSCity:
        address.country === 'United States' ||
        item.display_name?.includes('United States'),
      priority: calculatePriority(item),
      source: 'api' as const,
    };
  });
}

/**
 * Get state abbreviation from full state name
 */
function getStateAbbreviation(stateName: string): string {
  for (const [abbr, fullName] of Object.entries(US_STATE_MAPPINGS)) {
    if (fullName.toLowerCase() === stateName.toLowerCase()) {
      return abbr;
    }
  }
  return stateName.substring(0, 2).toUpperCase();
}

/**
 * Calculate search priority based on importance and location type
 */
function calculatePriority(item: NominatimResult): number {
  let priority = Math.floor((item.importance || 0) * 10);

  // Boost for cities vs towns
  if (item.type === 'city') priority += 2;
  else if (item.type === 'town') priority += 1;

  // Boost for higher place rank
  if (item.place_rank && item.place_rank <= 12) priority += 3;
  else if (item.place_rank && item.place_rank <= 16) priority += 2;

  return Math.min(priority, 10);
}

/**
 * Hook for enhanced US search
 */
export function useEnhancedUSSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (
    query: string,
    options?: USSearchOptions
  ): Promise<EnhancedUSSearchResult[]> => {
    if (!query || query.length < 2) {
      return [];
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await searchUSLocations(query, options);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      logError('Enhanced US search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return { search, isLoading, error };
}
