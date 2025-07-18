/**
 * ⚠️ LEGACY FILE - DO NOT USE ⚠️
 * 
 * This file causes blank screen issues when imported.
 * Use inline components in AppNavigator.tsx instead.
 * 
 * Kept for reference only.
 */

import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Weather Details</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter city name"
        value={city}
        onChangeText={setCity}
      />
      <TouchableOpacity onPress={getWeather} style={styles.button}>
        <Text style={styles.buttonText}>Get Weather</Text>
      </TouchableOpacity>
      {weather && (
        <View style={styles.weatherInfo}>
          <Text>Temperature: {weather.main.temp}°C</Text>
          <Text>Condition: {weather.weather[0].description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  weatherInfo: {
    marginTop: 20,
  },
});

export default WeatherDetailsScreen;
