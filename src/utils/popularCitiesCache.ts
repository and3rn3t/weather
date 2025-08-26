/**
 * Popular Cities Prefetching System
 *
 * Provides instant results for commonly searched cities by pre-loading
 * popular city data and implementing intelligent caching strategies.
 */

export interface PopularCity {
  name: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  population: number;
  continent: string;
  timezone: string;
  category: 'major_city' | 'capital' | 'tourist_destination' | 'business_hub';
  searchPriority: number; // 1-10, higher = more commonly searched
}

/**
 * Top 50 most commonly searched cities worldwide
 * Sorted by search frequency and global importance
 */
export const POPULAR_CITIES: PopularCity[] = [
  // Tier 1: Global Megacities (Priority 10)
  {
    name: 'New York',
    country: 'United States',
    countryCode: 'US',
    lat: 40.7128,
    lon: -74.006,
    population: 8_419_000,
    continent: 'North America',
    timezone: 'America/New_York',
    category: 'major_city',
    searchPriority: 10,
  },
  {
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GB',
    lat: 51.5074,
    lon: -0.1278,
    population: 9_648_000,
    continent: 'Europe',
    timezone: 'Europe/London',
    category: 'major_city',
    searchPriority: 10,
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JP',
    lat: 35.6762,
    lon: 139.6503,
    population: 14_094_000,
    continent: 'Asia',
    timezone: 'Asia/Tokyo',
    category: 'major_city',
    searchPriority: 10,
  },
  {
    name: 'Paris',
    country: 'France',
    countryCode: 'FR',
    lat: 48.8566,
    lon: 2.3522,
    population: 11_175_000,
    continent: 'Europe',
    timezone: 'Europe/Paris',
    category: 'major_city',
    searchPriority: 10,
  },

  // Tier 2: Major International Cities (Priority 9)
  {
    name: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    lat: 34.0522,
    lon: -118.2437,
    population: 3_967_000,
    continent: 'North America',
    timezone: 'America/Los_Angeles',
    category: 'major_city',
    searchPriority: 9,
  },
  {
    name: 'Chicago',
    country: 'United States',
    countryCode: 'US',
    lat: 41.8781,
    lon: -87.6298,
    population: 2_746_000,
    continent: 'North America',
    timezone: 'America/Chicago',
    category: 'major_city',
    searchPriority: 9,
  },
  {
    name: 'Sydney',
    country: 'Australia',
    countryCode: 'AU',
    lat: -33.8688,
    lon: 151.2093,
    population: 5_312_000,
    continent: 'Oceania',
    timezone: 'Australia/Sydney',
    category: 'major_city',
    searchPriority: 9,
  },
  {
    name: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    lat: 25.2048,
    lon: 55.2708,
    population: 3_411_000,
    continent: 'Asia',
    timezone: 'Asia/Dubai',
    category: 'business_hub',
    searchPriority: 9,
  },

  // Tier 3: Regional Capitals & Business Hubs (Priority 8)
  {
    name: 'Berlin',
    country: 'Germany',
    countryCode: 'DE',
    lat: 52.52,
    lon: 13.405,
    population: 3_677_000,
    continent: 'Europe',
    timezone: 'Europe/Berlin',
    category: 'capital',
    searchPriority: 8,
  },
  {
    name: 'Toronto',
    country: 'Canada',
    countryCode: 'CA',
    lat: 43.6532,
    lon: -79.3832,
    population: 2_930_000,
    continent: 'North America',
    timezone: 'America/Toronto',
    category: 'major_city',
    searchPriority: 8,
  },
  {
    name: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    lat: 1.3521,
    lon: 103.8198,
    population: 5_454_000,
    continent: 'Asia',
    timezone: 'Asia/Singapore',
    category: 'business_hub',
    searchPriority: 8,
  },
  {
    name: 'Hong Kong',
    country: 'Hong Kong SAR',
    countryCode: 'HK',
    lat: 22.3193,
    lon: 114.1694,
    population: 7_482_000,
    continent: 'Asia',
    timezone: 'Asia/Hong_Kong',
    category: 'business_hub',
    searchPriority: 8,
  },

  // Tier 4: Tourist Destinations & Major Cities (Priority 7)
  {
    name: 'Miami',
    country: 'United States',
    countryCode: 'US',
    lat: 25.7617,
    lon: -80.1918,
    population: 467_000,
    continent: 'North America',
    timezone: 'America/New_York',
    category: 'tourist_destination',
    searchPriority: 7,
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    countryCode: 'ES',
    lat: 41.3851,
    lon: 2.1734,
    population: 1_636_000,
    continent: 'Europe',
    timezone: 'Europe/Madrid',
    category: 'tourist_destination',
    searchPriority: 7,
  },
  {
    name: 'Amsterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    lat: 52.3676,
    lon: 4.9041,
    population: 873_000,
    continent: 'Europe',
    timezone: 'Europe/Amsterdam',
    category: 'tourist_destination',
    searchPriority: 7,
  },
  {
    name: 'Rome',
    country: 'Italy',
    countryCode: 'IT',
    lat: 41.9028,
    lon: 12.4964,
    population: 2_873_000,
    continent: 'Europe',
    timezone: 'Europe/Rome',
    category: 'tourist_destination',
    searchPriority: 7,
  },

  // Additional major cities (Priority 6-7)
  {
    name: 'Madrid',
    country: 'Spain',
    countryCode: 'ES',
    lat: 40.4168,
    lon: -3.7038,
    population: 3_223_000,
    continent: 'Europe',
    timezone: 'Europe/Madrid',
    category: 'capital',
    searchPriority: 7,
  },
  {
    name: 'Seoul',
    country: 'South Korea',
    countryCode: 'KR',
    lat: 37.5665,
    lon: 126.978,
    population: 9_776_000,
    continent: 'Asia',
    timezone: 'Asia/Seoul',
    category: 'major_city',
    searchPriority: 7,
  },
  {
    name: 'Mumbai',
    country: 'India',
    countryCode: 'IN',
    lat: 19.076,
    lon: 72.8777,
    population: 20_411_000,
    continent: 'Asia',
    timezone: 'Asia/Kolkata',
    category: 'major_city',
    searchPriority: 7,
  },
  {
    name: 'São Paulo',
    country: 'Brazil',
    countryCode: 'BR',
    lat: -23.5558,
    lon: -46.6396,
    population: 12_396_000,
    continent: 'South America',
    timezone: 'America/Sao_Paulo',
    category: 'major_city',
    searchPriority: 7,
  },

  // US Cities (Priority 6-8)
  {
    name: 'San Francisco',
    country: 'United States',
    countryCode: 'US',
    lat: 37.7749,
    lon: -122.4194,
    population: 884_000,
    continent: 'North America',
    timezone: 'America/Los_Angeles',
    category: 'business_hub',
    searchPriority: 8,
  },
  {
    name: 'Las Vegas',
    country: 'United States',
    countryCode: 'US',
    lat: 36.1699,
    lon: -115.1398,
    population: 651_000,
    continent: 'North America',
    timezone: 'America/Los_Angeles',
    category: 'tourist_destination',
    searchPriority: 7,
  },
  {
    name: 'Boston',
    country: 'United States',
    countryCode: 'US',
    lat: 42.3601,
    lon: -71.0589,
    population: 695_000,
    continent: 'North America',
    timezone: 'America/New_York',
    category: 'business_hub',
    searchPriority: 6,
  },
  {
    name: 'Seattle',
    country: 'United States',
    countryCode: 'US',
    lat: 47.6062,
    lon: -122.3321,
    population: 753_000,
    continent: 'North America',
    timezone: 'America/Los_Angeles',
    category: 'business_hub',
    searchPriority: 6,
  },
  {
    name: 'Denver',
    country: 'United States',
    countryCode: 'US',
    lat: 39.7392,
    lon: -104.9903,
    population: 715_000,
    continent: 'North America',
    timezone: 'America/Denver',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Atlanta',
    country: 'United States',
    countryCode: 'US',
    lat: 33.749,
    lon: -84.388,
    population: 499_000,
    continent: 'North America',
    timezone: 'America/New_York',
    category: 'business_hub',
    searchPriority: 6,
  },
  {
    name: 'Phoenix',
    country: 'United States',
    countryCode: 'US',
    lat: 33.4484,
    lon: -112.074,
    population: 1_608_000,
    continent: 'North America',
    timezone: 'America/Phoenix',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Philadelphia',
    country: 'United States',
    countryCode: 'US',
    lat: 39.9526,
    lon: -75.1652,
    population: 1_584_000,
    continent: 'North America',
    timezone: 'America/New_York',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'San Diego',
    country: 'United States',
    countryCode: 'US',
    lat: 32.7157,
    lon: -117.1611,
    population: 1_423_000,
    continent: 'North America',
    timezone: 'America/Los_Angeles',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Dallas',
    country: 'United States',
    countryCode: 'US',
    lat: 32.7767,
    lon: -96.797,
    population: 1_344_000,
    continent: 'North America',
    timezone: 'America/Chicago',
    category: 'business_hub',
    searchPriority: 6,
  },
  {
    name: 'San Antonio',
    country: 'United States',
    countryCode: 'US',
    lat: 29.4241,
    lon: -98.4936,
    population: 1_547_000,
    continent: 'North America',
    timezone: 'America/Chicago',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Houston',
    country: 'United States',
    countryCode: 'US',
    lat: 29.7604,
    lon: -95.3698,
    population: 2_320_000,
    continent: 'North America',
    timezone: 'America/Chicago',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Austin',
    country: 'United States',
    countryCode: 'US',
    lat: 30.2672,
    lon: -97.7431,
    population: 965_000,
    continent: 'North America',
    timezone: 'America/Chicago',
    category: 'business_hub',
    searchPriority: 6,
  },

  // European Cities (Priority 6-7)
  {
    name: 'Vienna',
    country: 'Austria',
    countryCode: 'AT',
    lat: 48.2082,
    lon: 16.3738,
    population: 1_897_000,
    continent: 'Europe',
    timezone: 'Europe/Vienna',
    category: 'capital',
    searchPriority: 6,
  },
  {
    name: 'Prague',
    country: 'Czech Republic',
    countryCode: 'CZ',
    lat: 50.0755,
    lon: 14.4378,
    population: 1_309_000,
    continent: 'Europe',
    timezone: 'Europe/Prague',
    category: 'tourist_destination',
    searchPriority: 6,
  },
  {
    name: 'Stockholm',
    country: 'Sweden',
    countryCode: 'SE',
    lat: 59.3293,
    lon: 18.0686,
    population: 975_000,
    continent: 'Europe',
    timezone: 'Europe/Stockholm',
    category: 'capital',
    searchPriority: 6,
  },

  // Asian Cities (Priority 6-7)
  {
    name: 'Bangkok',
    country: 'Thailand',
    countryCode: 'TH',
    lat: 13.7563,
    lon: 100.5018,
    population: 10_539_000,
    continent: 'Asia',
    timezone: 'Asia/Bangkok',
    category: 'tourist_destination',
    searchPriority: 7,
  },
  {
    name: 'Beijing',
    country: 'China',
    countryCode: 'CN',
    lat: 39.9042,
    lon: 116.4074,
    population: 21_893_000,
    continent: 'Asia',
    timezone: 'Asia/Shanghai',
    category: 'capital',
    searchPriority: 7,
  },
  {
    name: 'Shanghai',
    country: 'China',
    countryCode: 'CN',
    lat: 31.2304,
    lon: 121.4737,
    population: 28_516_000,
    continent: 'Asia',
    timezone: 'Asia/Shanghai',
    category: 'business_hub',
    searchPriority: 7,
  },

  // Additional Cities (Priority 5-6)
  {
    name: 'Cairo',
    country: 'Egypt',
    countryCode: 'EG',
    lat: 30.0444,
    lon: 31.2357,
    population: 20_484_000,
    continent: 'Africa',
    timezone: 'Africa/Cairo',
    category: 'capital',
    searchPriority: 6,
  },
  {
    name: 'Cape Town',
    country: 'South Africa',
    countryCode: 'ZA',
    lat: -33.9249,
    lon: 18.4241,
    population: 4_618_000,
    continent: 'Africa',
    timezone: 'Africa/Johannesburg',
    category: 'tourist_destination',
    searchPriority: 6,
  },
  {
    name: 'Tel Aviv',
    country: 'Israel',
    countryCode: 'IL',
    lat: 32.0853,
    lon: 34.7818,
    population: 460_000,
    continent: 'Asia',
    timezone: 'Asia/Jerusalem',
    category: 'business_hub',
    searchPriority: 6,
  },
  {
    name: 'Mexico City',
    country: 'Mexico',
    countryCode: 'MX',
    lat: 19.4326,
    lon: -99.1332,
    population: 21_805_000,
    continent: 'North America',
    timezone: 'America/Mexico_City',
    category: 'capital',
    searchPriority: 6,
  },
  {
    name: 'Buenos Aires',
    country: 'Argentina',
    countryCode: 'AR',
    lat: -34.6118,
    lon: -58.396,
    population: 15_154_000,
    continent: 'South America',
    timezone: 'America/Argentina/Buenos_Aires',
    category: 'capital',
    searchPriority: 6,
  },

  // Complete top 50 with remaining high-priority cities
  {
    name: 'Vancouver',
    country: 'Canada',
    countryCode: 'CA',
    lat: 49.2827,
    lon: -123.1207,
    population: 2_632_000,
    continent: 'North America',
    timezone: 'America/Vancouver',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Montreal',
    country: 'Canada',
    countryCode: 'CA',
    lat: 45.5017,
    lon: -73.5673,
    population: 4_291_000,
    continent: 'North America',
    timezone: 'America/Toronto',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Zurich',
    country: 'Switzerland',
    countryCode: 'CH',
    lat: 47.3769,
    lon: 8.5417,
    population: 415_000,
    continent: 'Europe',
    timezone: 'Europe/Zurich',
    category: 'business_hub',
    searchPriority: 6,
  },
  {
    name: 'Oslo',
    country: 'Norway',
    countryCode: 'NO',
    lat: 59.9139,
    lon: 10.7522,
    population: 697_000,
    continent: 'Europe',
    timezone: 'Europe/Oslo',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Helsinki',
    country: 'Finland',
    countryCode: 'FI',
    lat: 60.1699,
    lon: 24.9384,
    population: 658_000,
    continent: 'Europe',
    timezone: 'Europe/Helsinki',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Copenhagen',
    country: 'Denmark',
    countryCode: 'DK',
    lat: 55.6761,
    lon: 12.5683,
    population: 644_000,
    continent: 'Europe',
    timezone: 'Europe/Copenhagen',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Brussels',
    country: 'Belgium',
    countryCode: 'BE',
    lat: 50.8503,
    lon: 4.3517,
    population: 1_208_000,
    continent: 'Europe',
    timezone: 'Europe/Brussels',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Lisbon',
    country: 'Portugal',
    countryCode: 'PT',
    lat: 38.7223,
    lon: -9.1393,
    population: 547_000,
    continent: 'Europe',
    timezone: 'Europe/Lisbon',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Warsaw',
    country: 'Poland',
    countryCode: 'PL',
    lat: 52.2297,
    lon: 21.0122,
    population: 1_793_000,
    continent: 'Europe',
    timezone: 'Europe/Warsaw',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Budapest',
    country: 'Hungary',
    countryCode: 'HU',
    lat: 47.4979,
    lon: 19.0402,
    population: 1_752_000,
    continent: 'Europe',
    timezone: 'Europe/Budapest',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Athens',
    country: 'Greece',
    countryCode: 'GR',
    lat: 37.9755,
    lon: 23.7348,
    population: 3_154_000,
    continent: 'Europe',
    timezone: 'Europe/Athens',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Istanbul',
    country: 'Turkey',
    countryCode: 'TR',
    lat: 41.0082,
    lon: 28.9784,
    population: 15_519_000,
    continent: 'Asia',
    timezone: 'Europe/Istanbul',
    category: 'major_city',
    searchPriority: 6,
  },
  {
    name: 'Riyadh',
    country: 'Saudi Arabia',
    countryCode: 'SA',
    lat: 24.7136,
    lon: 46.6753,
    population: 7_676_000,
    continent: 'Asia',
    timezone: 'Asia/Riyadh',
    category: 'capital',
    searchPriority: 5,
  },
  {
    name: 'Delhi',
    country: 'India',
    countryCode: 'IN',
    lat: 28.7041,
    lon: 77.1025,
    population: 32_941_000,
    continent: 'Asia',
    timezone: 'Asia/Kolkata',
    category: 'capital',
    searchPriority: 6,
  },
  {
    name: 'Jakarta',
    country: 'Indonesia',
    countryCode: 'ID',
    lat: -6.2088,
    lon: 106.8456,
    population: 10_770_000,
    continent: 'Asia',
    timezone: 'Asia/Jakarta',
    category: 'capital',
    searchPriority: 6,
  },
  {
    name: 'Manila',
    country: 'Philippines',
    countryCode: 'PH',
    lat: 14.5995,
    lon: 120.9842,
    population: 13_923_000,
    continent: 'Asia',
    timezone: 'Asia/Manila',
    category: 'capital',
    searchPriority: 5,
  },
];

/**
 * Popular Cities Cache Management
 */
export class PopularCitiesCache {
  private readonly cache = new Map<string, PopularCity[]>();
  private lastUpdated = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get popular cities with intelligent filtering
   */
  getPopularCities(
    query: string = '',
    userLocation?: { lat: number; lon: number }
  ): PopularCity[] {
    const cacheKey = `${query.toLowerCase()}_${userLocation?.lat || 0}_${
      userLocation?.lon || 0
    }`;

    // Check cache first
    if (
      this.cache.has(cacheKey) &&
      Date.now() - this.lastUpdated < this.CACHE_DURATION
    ) {
      return this.cache.get(cacheKey) || [];
    }

    let results = [...POPULAR_CITIES];

    // Filter by query if provided
    if (query.length >= 1) {
      const queryLower = query.toLowerCase();
      results = results.filter(
        city =>
          city.name.toLowerCase().includes(queryLower) ||
          city.country.toLowerCase().includes(queryLower)
      );
    }

    // Sort by proximity if user location provided
    if (userLocation) {
      results = results
        .map(city => ({
          ...city,
          distance: this.calculateDistance(
            userLocation.lat,
            userLocation.lon,
            city.lat,
            city.lon
          ),
        }))
        .sort((a, b) => {
          // Prioritize by search priority first, then distance
          const priorityDiff = b.searchPriority - a.searchPriority;
          if (Math.abs(priorityDiff) >= 2) return priorityDiff;
          return a.distance - b.distance;
        });
    } else {
      // Sort by search priority only
      results.sort((a, b) => b.searchPriority - a.searchPriority);
    }

    // Cache results
    this.cache.set(cacheKey, results);
    this.lastUpdated = Date.now();

    return results;
  }

  /**
   * Get instant suggestions for empty/short queries
   */
  getInstantSuggestions(maxResults = 8): PopularCity[] {
    return POPULAR_CITIES.filter(city => city.searchPriority >= 8) // Only top-tier cities
      .slice(0, maxResults);
  }

  /**
   * Search by category
   */
  getCitiesByCategory(
    category: PopularCity['category'],
    maxResults = 10
  ): PopularCity[] {
    return POPULAR_CITIES.filter(city => city.category === category)
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, maxResults);
  }

  /**
   * Get cities by continent with priority
   */
  getCitiesByContinent(continent: string, maxResults = 10): PopularCity[] {
    return POPULAR_CITIES.filter(city => city.continent === continent)
      .sort((a, b) => b.searchPriority - a.searchPriority)
      .slice(0, maxResults);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Clear cache manually
   */
  clearCache(): void {
    this.cache.clear();
    this.lastUpdated = 0;
  }

  /**
   * Preload popular cities into localStorage for offline access
   */
  preloadToStorage(): void {
    try {
      localStorage.setItem(
        'weather-popular-cities',
        JSON.stringify(POPULAR_CITIES)
      );
      localStorage.setItem(
        'weather-popular-cities-timestamp',
        Date.now().toString()
      );
    } catch {
      // Storage not available or quota exceeded - continue silently
      return;
    }
  }

  /**
   * Load popular cities from localStorage if available
   */
  loadFromStorage(): PopularCity[] {
    try {
      const stored = localStorage.getItem('weather-popular-cities');
      const timestamp = localStorage.getItem(
        'weather-popular-cities-timestamp'
      );

      if (stored && timestamp) {
        const age = Date.now() - parseInt(timestamp, 10);
        if (age < this.CACHE_DURATION) {
          return JSON.parse(stored);
        }
      }
    } catch {
      // Storage not available or invalid data - return default
      return POPULAR_CITIES;
    }
    return POPULAR_CITIES;
  }
}

// Export singleton instance
export const popularCitiesCache = new PopularCitiesCache();
