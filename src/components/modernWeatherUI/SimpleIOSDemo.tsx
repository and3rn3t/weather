/**
 * Simple iOS HIG Demo for Weather App
 * 
 * This component demonstrates how to integrate the simplified iOS components
 * into your existing weather app structure.
 */

import React, { useState } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';
import { 
  SimpleSegmentedControl, 
  SimpleActivityIndicator, 
  SimpleStatusBadge, 
  SimpleEnhancedButton,
  SimpleCard,
  SimpleProgressBar
} from './SimpleIOSComponents';

interface SimpleIOSDemoProps {
  theme: ThemeColors;
}

export const SimpleIOSDemo: React.FC<SimpleIOSDemoProps> = ({ theme }) => {
  const [selectedView, setSelectedView] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(65);
  const [isLoading, setIsLoading] = useState(false);

  const viewSegments = ['Today', 'Weekly', 'Radar'];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: theme.appBackground,
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '400px',
    margin: '0 auto'
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: '0 0 8px 0'
  };

  const weatherData = {
    temperature: '72°F',
    condition: 'Partly Cloudy',
    humidity: '65%',
    windSpeed: '8 mph'
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setLoadingProgress(100);
    }, 2000);
  };

  // Simple weather icon using Unicode
  const WeatherIcon = ({ condition }: { condition: string }) => {
    const iconMap: { [key: string]: string } = {
      'Partly Cloudy': '⛅',
      'Sunny': '☀️',
      'Rainy': '🌧️',
      'Stormy': '⛈️',
      'Snowy': '❄️'
    };
    
    return (
      <span style={{ fontSize: '48px', textAlign: 'center', display: 'block' }}>
        {iconMap[condition] || '🌤️'}
      </span>
    );
  };

  return (
    <div style={containerStyle}>
      {/* Header with Title */}
      <div style={sectionStyle}>
        <h1 style={{ ...titleStyle, fontSize: '28px', textAlign: 'center' }}>
          iOS Weather Demo
        </h1>
        <p style={{ color: theme.secondaryText, textAlign: 'center', margin: 0 }}>
          San Francisco, CA
        </p>
      </div>

      {/* Segmented Control */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>View Selection</h2>
        <SimpleSegmentedControl
          segments={viewSegments}
          selectedIndex={selectedView}
          onChange={setSelectedView}
          theme={theme}
        />
      </div>

      {/* Weather Card */}
      <SimpleCard theme={theme} title="Current Weather">
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <WeatherIcon condition={weatherData.condition} />
          <div style={{ fontSize: '36px', fontWeight: '300', color: theme.primaryText, margin: '8px 0' }}>
            {weatherData.temperature}
          </div>
          <div style={{ fontSize: '18px', color: theme.secondaryText }}>
            {weatherData.condition}
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '500', color: theme.primaryText }}>
              {weatherData.humidity}
            </div>
            <div style={{ fontSize: '14px', color: theme.secondaryText }}>
              Humidity
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '500', color: theme.primaryText }}>
              {weatherData.windSpeed}
            </div>
            <div style={{ fontSize: '14px', color: theme.secondaryText }}>
              Wind Speed
            </div>
          </div>
        </div>
      </SimpleCard>

      {/* Status Badges */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>Weather Alerts</h2>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <SimpleStatusBadge text="Clear Skies" variant="success" />
          <SimpleStatusBadge text="UV Index High" variant="warning" />
          <SimpleStatusBadge text="Air Quality Good" variant="info" />
        </div>
      </div>

      {/* Loading State */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>Data Sync</h2>
        <SimpleCard theme={theme}>
          {isLoading ? (
            <SimpleActivityIndicator size="medium" theme={theme} text="Updating weather data..." />
          ) : (
            <div>
              <SimpleProgressBar 
                progress={loadingProgress} 
                theme={theme} 
                showPercentage={true}
                color="#34C759"
              />
              <div style={{ marginTop: '12px', fontSize: '14px', color: theme.secondaryText }}>
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          )}
        </SimpleCard>
      </div>

      {/* Action Buttons */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>Quick Actions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <SimpleEnhancedButton
            title={isLoading ? "Updating..." : "Refresh Weather"}
            onPress={simulateLoading}
            variant="primary"
            theme={theme}
            disabled={isLoading}
            icon={<span>🔄</span>}
          />
          
          <SimpleEnhancedButton
            title="Add Location"
            onPress={() => alert('Add location feature coming soon!')}
            variant="secondary"
            theme={theme}
            icon={<span>📍</span>}
          />
          
          <SimpleEnhancedButton
            title="Share Weather"
            onPress={() => alert('Sharing weather data...')}
            variant="secondary"
            theme={theme}
            icon={<span>🔗</span>}
          />
        </div>
      </div>

      {/* Forecast Cards */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>5-Day Forecast</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {['Tomorrow', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
            <SimpleCard 
              key={day} 
              theme={theme}
              onPress={() => alert(`Viewing details for ${day}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '500', color: theme.primaryText }}>
                    {day}
                  </div>
                  <div style={{ fontSize: '14px', color: theme.secondaryText }}>
                    Partly Cloudy
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '24px' }}>⛅</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: '500', color: theme.primaryText }}>
                      {75 - index * 2}°F
                    </div>
                    <div style={{ fontSize: '14px', color: theme.secondaryText }}>
                      {60 - index}°F
                    </div>
                  </div>
                </div>
              </div>
            </SimpleCard>
          ))}
        </div>
      </div>

      {/* Demo Controls */}
      <div style={sectionStyle}>
        <h2 style={titleStyle}>Demo Controls</h2>
        <SimpleCard theme={theme}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button 
              onClick={() => setLoadingProgress(Math.max(0, loadingProgress - 25))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: '1px solid #FF3B30', 
                backgroundColor: 'transparent', 
                color: '#FF3B30',
                cursor: 'pointer'
              }}
            >
              -25%
            </button>
            <button 
              onClick={() => setLoadingProgress(Math.min(100, loadingProgress + 25))}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '8px', 
                border: '1px solid #34C759', 
                backgroundColor: 'transparent', 
                color: '#34C759',
                cursor: 'pointer'
              }}
            >
              +25%
            </button>
          </div>
          <div style={{ fontSize: '14px', color: theme.secondaryText }}>
            Use these buttons to test the progress bar animation
          </div>
        </SimpleCard>
      </div>
    </div>
  );
};
