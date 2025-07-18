/**
 * ⚠️ LEGACY FILE - DO NOT USE ⚠️
 * 
 * This file causes blank screen issues when imported.
 * Use inline components in AppNavigator.tsx instead.
 * 
 * Kept for reference only.
 */

import { useState } from 'react';
import { fetchWeather } from '../services/weatherService';

type WeatherData = {
  main: {
    temp: number;
  };
  weather: {
    description: string;
  }[];
};

type NavigationProp = {
  navigate: (screenName: string) => void;
};

/**
 * WeatherDetailsScreen component.
 * Allows the user to input a city name and fetches weather details for that city.
 *
 * State:
 * - city: The name of the city entered by the user.
 * - weather: The weather data fetched from the API.
 */
const WeatherDetailsScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const getWeather = async () => {
    try {
      const data = await fetchWeather(city);
      setWeather(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div style={styles.container}>
      <button onClick={() => navigation.navigate('Home')} style={styles.backButton}>
        ← Back
      </button>
      <h1 style={styles.title}>Weather Details</h1>
      <input
        style={styles.input}
        placeholder="Enter city name"
        value={city}
        onChange={(e) => setCity(e.target.value)}
      />
      <button onClick={getWeather} style={styles.button}>
        Get Weather
      </button>
      {weather && (
        <div style={styles.weatherInfo}>
          <p>Temperature: {weather.main.temp}°C</p>
          <p>Condition: {weather.weather[0].description}</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  backButton: {
    backgroundColor: 'transparent',
    color: '#007AFF',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px',
  },
  title: {
    fontSize: '24px',
    marginBottom: '20px',
    fontWeight: 'bold',
  },
  input: {
    height: '40px',
    border: '1px solid gray',
    borderRadius: '5px',
    marginBottom: '20px',
    paddingLeft: '10px',
    paddingRight: '10px',
    width: '200px',
    fontSize: '16px',
  },
  button: {
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    padding: '10px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '20px',
    marginLeft: '10px',
  },
  weatherInfo: {
    marginTop: '20px',
    fontSize: '16px',
  },
};

export default WeatherDetailsScreen;
