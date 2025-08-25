/**
 * iOS Component Showcase - Demo of all iOS HIG components
 *
 * This component demonstrates all the iOS Human Interface Guidelines components
 * we've implemented, showing their various states and configurations.
 */

import React, { useState } from 'react';
import { logInfo } from '../../utils/logger';
import type { ThemeColors } from '../../utils/themeConfig';
import { ActionSheet } from './ActionSheet';
import { NavigationBar } from './NavigationBar';
import { NavigationIcons } from './NavigationIcons';
import {
  SimpleActivityIndicator,
  SimpleCard,
  SimpleEnhancedButton,
  SimpleSegmentedControl,
  SimpleStatusBadge,
} from './SimpleIOSComponents';

interface IOSComponentShowcaseProps {
  theme: ThemeColors;
  onBack: () => void;
  themeName: string;
}

export const IOSComponentShowcase: React.FC<IOSComponentShowcaseProps> = ({
  theme,
  onBack,
  themeName,
}) => {
  const [selectedView, setSelectedView] = useState(0);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: theme.appBackground,
    paddingBottom: '100px',
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
    fontSize: '20px',
    fontWeight: '600',
    color: theme.primaryText,
    margin: '0 0 8px 0',
  };

  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div style={containerStyle}>
      {/* Navigation Bar */}
      <NavigationBar
        title="iOS Components"
        subtitle="Human Interface Guidelines Demo"
        leadingButton={{
          icon: <NavigationIcons.Back />,
          onPress: onBack,
        }}
        trailingButton={{
          icon: <NavigationIcons.Settings />,
          onPress: () => setShowActionSheet(true),
        }}
        theme={theme}
        isDark={themeName === 'dark'}
      />

      <div style={contentStyle}>
        {/* Segmented Control Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Segmented Control</h2>
          <SimpleSegmentedControl
            segments={['Overview', 'Details', 'Settings']}
            selectedIndex={selectedView}
            onChange={setSelectedView}
            theme={theme}
          />
        </div>

        {/* Status Badges Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Status Badges</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <SimpleStatusBadge text="Success" variant="success" />
            <SimpleStatusBadge text="Warning" variant="warning" />
            <SimpleStatusBadge text="Error" variant="error" />
            <SimpleStatusBadge text="Info" variant="info" />
          </div>
        </div>

        {/* Activity Indicators Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Activity Indicators</h2>
          <SimpleCard theme={theme}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '20px',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <SimpleActivityIndicator size="small" theme={theme} />
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: theme.secondaryText,
                  }}
                >
                  Small
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <SimpleActivityIndicator
                  size="medium"
                  theme={theme}
                  text="Loading..."
                />
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: theme.secondaryText,
                  }}
                >
                  Medium
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <SimpleActivityIndicator size="large" theme={theme} />
                <p
                  style={{
                    margin: '8px 0 0 0',
                    fontSize: '12px',
                    color: theme.secondaryText,
                  }}
                >
                  Large
                </p>
              </div>
            </div>
          </SimpleCard>
        </div>

        {/* Enhanced Buttons Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Enhanced Buttons</h2>
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <SimpleEnhancedButton
              title="Primary Action"
              onPress={() => logInfo('Primary pressed')}
              variant="primary"
              theme={theme}
              icon="⭐"
            />
            <SimpleEnhancedButton
              title="Secondary Action"
              onPress={() => logInfo('Secondary pressed')}
              variant="secondary"
              theme={theme}
              icon="🔧"
            />
            <SimpleEnhancedButton
              title={isLoading ? 'Processing...' : 'Simulate Loading'}
              onPress={simulateLoading}
              variant="primary"
              theme={theme}
              disabled={isLoading}
              icon={isLoading ? '⏳' : '🚀'}
            />
          </div>
        </div>

        {/* Cards Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Card Containers</h2>

          <SimpleCard theme={theme} title="Weather Information">
            <div style={{ padding: '16px' }}>
              <p
                style={{
                  color: theme.primaryText,
                  margin: '0 0 8px 0',
                  fontSize: '24px',
                  fontWeight: '600',
                }}
              >
                72°F
              </p>
              <p
                style={{
                  color: theme.secondaryText,
                  margin: '0',
                  fontSize: '14px',
                }}
              >
                Partly cloudy with light winds
              </p>
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <SimpleStatusBadge text="Comfortable" variant="success" />
                <SimpleStatusBadge text="UV: Low" variant="info" />
              </div>
            </div>
          </SimpleCard>

          <SimpleCard theme={theme}>
            <div style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🌤️</div>
              <h3 style={{ color: theme.primaryText, margin: '0 0 8px 0' }}>
                Weather Updates
              </h3>
              <p
                style={{
                  color: theme.secondaryText,
                  margin: '0',
                  fontSize: '14px',
                }}
              >
                Real-time weather data from multiple sources
              </p>
            </div>
          </SimpleCard>
        </div>

        {/* Interactive Demo */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Interactive Elements</h2>
          <SimpleCard theme={theme} title="Try the Components">
            <div
              style={{
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <SimpleEnhancedButton
                title="Show Action Sheet"
                onPress={() => setShowActionSheet(true)}
                variant="secondary"
                theme={theme}
                icon="📋"
              />
              <div>
                <p
                  style={{
                    color: theme.secondaryText,
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                  }}
                >
                  Current Selection:{' '}
                  {['Overview', 'Details', 'Settings'][selectedView]}
                </p>
                <SimpleSegmentedControl
                  segments={['A', 'B', 'C']}
                  selectedIndex={selectedView}
                  onChange={setSelectedView}
                  theme={theme}
                />
              </div>
            </div>
          </SimpleCard>
        </div>

        {/* Demo Controls */}
        <div style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Demo Actions</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <SimpleEnhancedButton
              title="Back to App"
              onPress={onBack}
              variant="primary"
              theme={theme}
              icon="🏠"
            />
            <SimpleEnhancedButton
              title="Toggle Theme"
              onPress={() => logInfo('Theme toggle would go here')}
              variant="secondary"
              theme={theme}
              icon="🌙"
            />
          </div>
        </div>
      </div>

      {/* Action Sheet Demo */}
      <ActionSheet
        isVisible={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title="Component Actions"
        message="Choose an action to demonstrate"
        actions={[
          {
            title: 'Show Success Badge',
            icon: <NavigationIcons.Add />,
            onPress: () => {
              logInfo('Success demo');
              setShowActionSheet(false);
            },
          },
          {
            title: 'Start Loading Demo',
            icon: <NavigationIcons.Refresh />,
            onPress: () => {
              simulateLoading();
              setShowActionSheet(false);
            },
          },
          {
            title: 'Share Components',
            icon: <NavigationIcons.Share />,
            onPress: () => {
              logInfo('Share demo');
              setShowActionSheet(false);
            },
          },
          {
            title: 'Reset Demo',
            icon: <NavigationIcons.Close />,
            destructive: true,
            onPress: () => {
              setSelectedView(0);
              setIsLoading(false);
              setShowActionSheet(false);
            },
          },
        ]}
        theme={theme}
        isDark={themeName === 'dark'}
      />
    </div>
  );
};

export default IOSComponentShowcase;
