/**
 * LEGACY FILE - NOT CURRENTLY USED
 * 
 * This file contains the old OpenWeatherMap API integration.
 * The app now uses OpenMeteo API directly in AppNavigator.tsx for better reliability.
 * 
 * Kept for reference only - the current implementation uses:
 * - OpenMeteo API for weather data (free, no API key)
 * - OpenStreetMap Nominatim for geocoding (free)
 * - Direct fetch() calls in AppNavigator component
 */

import axios from 'axios';

const API_KEY = import.meta.env.VITE_API_KEY; // Access the API key from Vite environment
const GEOCODING_URL = 'https://api.openweathermap.org/geo/1.0/direct';
const WEATHER_URL = 'https://api.openweathermap.org/data/3.0/onecall';

export const fetchWeather = async (city: string) => {
  try {
    // Step 1: Get coordinates from city name using Geocoding API
    const geoResponse = await axios.get(GEOCODING_URL, {
      params: {
        q: city,
        limit: 1,
        appid: API_KEY,
      },
    });

    if (!geoResponse.data || geoResponse.data.length === 0) {
      throw new Error('City not found. Please check the spelling and try again.');
    }

    const { lat, lon } = geoResponse.data[0];

    // Step 2: Get weather data using One Call API v3.0 with coordinates
    const weatherResponse = await axios.get(WEATHER_URL, {
      params: {
        lat,
        lon,
        exclude: 'minutely,hourly,daily,alerts', // Only get current weather
        units: 'imperial',
        appid: API_KEY,
      },
    });

    // Transform One Call API response to match expected format
    return {
      main: {
        temp: weatherResponse.data.current.temp
      },
      weather: [{
        description: weatherResponse.data.current.weather[0].description
      }]
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    throw error;
  }
};
