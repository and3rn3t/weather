#!/usr/bin/env node

/**
 * Weather API Test Suite
 * Comprehensive testing for OpenMeteo and Nominatim APIs
 */

class WeatherAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async test(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      const startTime = performance.now();
      await testFn();
      const duration = Math.round(performance.now() - startTime);
      
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASS', duration });
      console.log(`   ✅ PASS (${duration}ms)\n`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`   ❌ FAIL: ${error.message}\n`);
    }
  }

  async testOpenMeteoBasic() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.current_weather) {
      throw new Error('Missing current_weather data');
    }
    
    if (typeof data.current_weather.temperature !== 'number') {
      throw new Error('Invalid temperature data');
    }
    
    if (!data.current_weather.weathercode && data.current_weather.weathercode !== 0) {
      throw new Error('Missing weather code');
    }
  }

  async testOpenMeteoHourly() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&hourly=temperature_2m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.hourly || !data.hourly.time || !Array.isArray(data.hourly.time)) {
      throw new Error('Missing or invalid hourly data structure');
    }
    
    if (data.hourly.time.length < 24) {
      throw new Error('Insufficient hourly forecast data');
    }
    
    if (!data.hourly.temperature_2m || data.hourly.temperature_2m.length !== data.hourly.time.length) {
      throw new Error('Temperature data mismatch');
    }
  }

  async testOpenMeteoDaily() {
    const url = 'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&temperature_unit=fahrenheit';
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.daily || !data.daily.time || !Array.isArray(data.daily.time)) {
      throw new Error('Missing or invalid daily data structure');
    }
    
    if (data.daily.time.length < 7) {
      throw new Error('Insufficient daily forecast data');
    }
    
    if (!data.daily.temperature_2m_max || !data.daily.temperature_2m_min) {
      throw new Error('Missing temperature min/max data');
    }
  }

  async testNominatimBasic() {
    const url = 'https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WeatherApp-Test/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No geocoding results returned');
    }
    
    const result = data[0];
    if (!result.lat || !result.lon) {
      throw new Error('Missing latitude/longitude coordinates');
    }
    
    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);
    
    if (isNaN(lat) || isNaN(lon)) {
      throw new Error('Invalid coordinate format');
    }
    
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error('Coordinates out of valid range');
    }
  }

  async testNominatimSpecialCharacters() {
    const cities = ['São Paulo', 'München', 'København'];
    
    for (const city of cities) {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'WeatherApp-Test/1.0' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${city}`);
      }
      
      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error(`No results for ${city}`);
      }
    }
  }

  async testAPIRateLimits() {
    const requests = [];
    const startTime = Date.now();
    
    // Test 5 rapid requests to OpenMeteo
    for (let i = 0; i < 5; i++) {
      requests.push(
        fetch('https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current_weather=true')
      );
    }
    
    const responses = await Promise.all(requests);
    const endTime = Date.now();
    
    const allSuccessful = responses.every(r => r.ok);
    if (!allSuccessful) {
      throw new Error('Rate limiting detected or API errors');
    }
    
    const duration = endTime - startTime;
    if (duration > 10000) {
      throw new Error(`Requests took too long: ${duration}ms`);
    }
  }

  async testWeatherCodeMapping() {
    // Test various weather codes
    const testCodes = [0, 1, 2, 3, 45, 48, 51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99];
    
    for (const code of testCodes) {
      const description = this.getWeatherDescription(code);
      if (!description || description === 'Unknown') {
        throw new Error(`No description for weather code ${code}`);
      }
    }
  }

  getWeatherDescription(code) {
    const descriptions = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Fog',
      48: 'Depositing rime fog',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Dense drizzle',
      61: 'Slight rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      80: 'Slight rain showers',
      81: 'Moderate rain showers',
      82: 'Violent rain showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with slight hail',
      99: 'Thunderstorm with heavy hail'
    };
    
    return descriptions[code] || 'Unknown';
  }

  async testErrorHandling() {
    // Test invalid coordinates
    try {
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=999&longitude=999&current_weather=true');
      if (response.ok) {
        throw new Error('Expected error for invalid coordinates');
      }
    } catch (error) {
      if (error.message.includes('Expected error')) {
        throw error;
      }
      // Network errors are expected and fine
    }
    
    // Test invalid city name
    const response = await fetch('https://nominatim.openstreetmap.org/search?q=ThisCityDoesNotExist12345&format=json&limit=1', {
      headers: { 'User-Agent': 'WeatherApp-Test/1.0' }
    });
    
    if (!response.ok) {
      throw new Error(`Nominatim should handle invalid queries gracefully`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data)) {
      throw new Error('Expected empty array for invalid city');
    }
  }

  printResults() {
    console.log('\n📊 WEATHER API TEST RESULTS\n');
    
    this.results.tests.forEach(test => {
      const icon = test.status === 'PASS' ? '✅' : '❌';
      const duration = test.duration ? ` (${test.duration}ms)` : '';
      console.log(`${icon} ${test.name}${duration}`);
      if (test.error) {
        console.log(`     Error: ${test.error}`);
      }
    });
    
    console.log(`\n📈 Summary: ${this.results.passed} passed, ${this.results.failed} failed`);
    
    const totalTests = this.results.passed + this.results.failed;
    const successRate = Math.round((this.results.passed / totalTests) * 100);
    console.log(`🎯 Success Rate: ${successRate}%\n`);
    
    if (this.results.failed > 0) {
      console.log('💡 Consider checking:');
      console.log('   - Internet connectivity');
      console.log('   - API service status');
      console.log('   - Request rate limits\n');
    }
  }

  async run() {
    console.log('🌤️ Weather API Test Suite Starting...\n');
    
    await this.test('OpenMeteo - Basic Current Weather', () => this.testOpenMeteoBasic());
    await this.test('OpenMeteo - Hourly Forecast', () => this.testOpenMeteoHourly());
    await this.test('OpenMeteo - Daily Forecast', () => this.testOpenMeteoDaily());
    await this.test('Nominatim - Basic Geocoding', () => this.testNominatimBasic());
    await this.test('Nominatim - Special Characters', () => this.testNominatimSpecialCharacters());
    await this.test('API Rate Limits', () => this.testAPIRateLimits());
    await this.test('Weather Code Mapping', () => this.testWeatherCodeMapping());
    await this.test('Error Handling', () => this.testErrorHandling());
    
    this.printResults();
    
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if called directly
if (import.meta.url.startsWith('file:') && process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'))) {
  const tester = new WeatherAPITester();
  tester.run().catch(console.error);
}

export { WeatherAPITester };
