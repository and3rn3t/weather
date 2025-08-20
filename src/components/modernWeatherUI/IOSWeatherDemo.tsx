/**
 * iOS HIG Integration Example
 *
 * This component demonstrates how to integrate all the new iOS Human Interface Guidelines
 * components into your weather app for a premium, native-like experience.
 */

import React, { useState } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';
import {
  SegmentedControl,
  ActivityIndicator,
  StatusBadge,
  ListItem,
  ProgressIndicator,
} from './IOSComponents';
import { ActionSheet } from './ActionSheet';
import { EnhancedSearchBar } from './EnhancedSearchBar';
import { NavigationBar } from './NavigationBar';
import { NavigationIcons } from './NavigationIcons';
import { logInfo } from '../utils/logger';


interface IOSWeatherDemoProps {
  theme: ThemeColors;
  isDark?: boolean;
}

export const IOSWeatherDemo: React.FC<IOSWeatherDemoProps> = ({
  theme,
  isDark = false,
}) => {
  const [selectedView, setSelectedView] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(75);

  const viewSegments = ['Today', 'Weekly', 'Radar'];

  const searchSuggestions = ['San Francisco', 'New York', 'London', 'Tokyo'];
  const recentSearches = ['Los Angeles', 'Miami'];

  const actionSheetActions = [
    {
      title: 'Share Weather',
      icon: <NavigationIcons.Share />,
      onPress: () => logInfo('Share weather'),
    },
    {
      title: 'Add to Favorites',
      icon: <NavigationIcons.Add />,
      onPress: () => logInfo('Add to favorites'),
    },
    {
      title: 'Refresh Data',
      icon: <NavigationIcons.Refresh />,
      onPress: () => logInfo('Refresh data'),
    },
    {
      title: 'Delete Location',
      icon: <NavigationIcons.Close />,
      destructive: true,
      onPress: () => logInfo('Delete location'),
    },
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: theme.appBackground,
    color: theme.primaryText,
  };

  const contentStyle: React.CSSProperties = {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '400px',
    margin: '0 auto',
  };

  const sectionStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '22px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: '0 0 8px 0',
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBackground,
    borderRadius: '16px',
    padding: '20px',
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div style={containerStyle}>
      {/* Navigation Bar */}
      <NavigationBar
        title="Weather"
        subtitle="San Francisco, CA"
        leadingButton={{
          icon: <NavigationIcons.Menu />,
          onPress: () => logInfo('Menu pressed'),
        }}
        trailingButton={{
          icon: <NavigationIcons.Settings />,
          onPress: () => setShowActionSheet(true),
        }}
        searchBar={
          <EnhancedSearchBar
            placeholder="Search cities..."
            value={searchText}
            onChangeText={setSearchText}
            theme={theme}
            isDark={isDark}
            suggestions={searchSuggestions}
            recentSearches={recentSearches}
            onSubmit={text => logInfo('Search:', text)}
          />
        }
        theme={theme}
        isDark={isDark}
      />

      <div style={contentStyle}>
        {/* Segmented Control Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>View Options</h2>
          <SegmentedControl
            segments={viewSegments}
            selectedIndex={selectedView}
            onChange={setSelectedView}
            theme={theme}
          />
        </div>

        {/* Status Badges Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Weather Alerts</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <StatusBadge text="Sunny" variant="success" theme={theme} />
            <StatusBadge text="Rain Alert" variant="warning" theme={theme} />
            <StatusBadge text="Storm Warning" variant="error" theme={theme} />
            <StatusBadge text="Air Quality Good" variant="info" theme={theme} />
          </div>
        </div>

        {/* Activity Indicator Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Loading States</h2>
          <div style={cardStyle}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" theme={theme} text="Loading..." />
              <ActivityIndicator size="medium" theme={theme} />
              <ActivityIndicator size="large" theme={theme} color="#007AFF" />
            </div>
          </div>
        </div>

        {/* Progress Indicator Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Data Sync Progress</h2>
          <div style={cardStyle}>
            <ProgressIndicator
              progress={loadingProgress}
              theme={theme}
              showPercentage={true}
              color="#34C759"
            />
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
              <button
                onClick={() =>
                  setLoadingProgress(Math.max(0, loadingProgress - 25))
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#FF3B30',
                  color: 'white',
                }}
              >
                -25%
              </button>
              <button
                onClick={() =>
                  setLoadingProgress(Math.min(100, loadingProgress + 25))
                }
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#34C759',
                  color: 'white',
                }}
              >
                +25%
              </button>
            </div>
          </div>
        </div>

        {/* List Items Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Weather Locations</h2>
          <div style={cardStyle}>
            <ListItem
              title="Current Location"
              subtitle="San Francisco, CA • 72°F"
              icon={<NavigationIcons.Location />}
              badge="Now"
              disclosure={true}
              onPress={() => logInfo('Current location pressed')}
              theme={theme}
            />
            <ListItem
              title="New York"
              subtitle="Partly Cloudy • 68°F"
              disclosure={true}
              onPress={() => logInfo('New York pressed')}
              theme={theme}
            />
            <ListItem
              title="London"
              subtitle="Rainy • 55°F"
              badge="3h ago"
              disclosure={true}
              onPress={() => logInfo('London pressed')}
              theme={theme}
            />
            <ListItem
              title="Tokyo"
              subtitle="Offline"
              disabled={true}
              theme={theme}
            />
          </div>
        </div>

        {/* Demo Action Button */}
        <div style={sectionStyle}>
          <button
            onClick={() => setShowActionSheet(true)}
            style={{
              padding: '16px',
              backgroundColor: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Show Action Sheet
          </button>
        </div>
      </div>

      {/* Action Sheet */}
      <ActionSheet
        isVisible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Weather Options"
        message="Choose an action for this location"
        actions={actionSheetActions}
        theme={theme}
        isDark={isDark}
      />
    </div>
  );
};
