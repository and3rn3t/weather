/**
 * Weather Icons System
 * 
 * A comprehensive collection of SVG weather icons with animations
 * and day/night variations for the Modern Weather App.
 * 
 * Features:
 * - 🎨 Custom SVG icons for each weather condition
 * - 🌅 Day/night variations based on time
 * - ✨ CSS animations and hover effects
 * - 🌈 Gradient colors matching app design
 * - 📱 Responsive sizing
 */

import React from 'react';
import { memo } from 'react';

// ============================================================================
// WEATHER ICON COMPONENT TYPES
// ============================================================================

interface WeatherIconProps {
  /** OpenMeteo weather code (0-99) */
  code: number;
  /** Icon size in pixels */
  size?: number;
  /** Whether it's currently daytime */
  isDay?: boolean;
  /** Additional CSS class name */
  className?: string;
  /** Enable hover animations */
  animated?: boolean;
}

// ============================================================================
// SVG ICON COMPONENTS
// ============================================================================

const SunIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Sun rays */}
    <g className="sun-rays">
      <line x1="50" y1="10" x2="50" y2="20" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="78.66" y1="21.34" x2="72.83" y2="27.17" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="90" y1="50" x2="80" y2="50" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="78.66" y1="78.66" x2="72.83" y2="72.83" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="50" y1="90" x2="50" y2="80" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="21.34" y1="78.66" x2="27.17" y2="72.83" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="10" y1="50" x2="20" y2="50" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
      <line x1="21.34" y1="21.34" x2="27.17" y2="27.17" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round"/>
    </g>
    {/* Sun body */}
    <circle cx="50" cy="50" r="20" fill="url(#sunGradient)" className="sun-body"/>
    <defs>
      <radialGradient id="sunGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fcd34d"/>
        <stop offset="100%" stopColor="#f59e0b"/>
      </radialGradient>
    </defs>
  </svg>
);

const MoonIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Moon crescent */}
    <path 
      d="M 30 20 A 25 25 0 1 1 30 80 A 20 20 0 1 0 30 20" 
      fill="url(#moonGradient)"
      className="moon-body"
    />
    {/* Stars */}
    <circle cx="70" cy="25" r="1.5" fill="#fbbf24" className="star">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite"/>
    </circle>
    <circle cx="80" cy="40" r="1" fill="#fbbf24" className="star">
      <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
    </circle>
    <circle cx="75" cy="60" r="1.2" fill="#fbbf24" className="star">
      <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite"/>
    </circle>
    <defs>
      <radialGradient id="moonGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#e2e8f0"/>
        <stop offset="100%" stopColor="#94a3b8"/>
      </radialGradient>
    </defs>
  </svg>
);

const CloudIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Cloud shape */}
    <path 
      d="M25 60 Q25 45 40 45 Q45 35 55 35 Q70 35 75 45 Q85 45 85 55 Q85 65 75 65 L35 65 Q25 65 25 60"
      fill="url(#cloudGradient)"
      className="cloud-body"
    />
    <defs>
      <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc"/>
        <stop offset="100%" stopColor="#e2e8f0"/>
      </linearGradient>
    </defs>
  </svg>
);

const PartlyCloudyDayIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Sun behind cloud */}
    <circle cx="35" cy="35" r="15" fill="url(#sunGradient)" className="sun-body"/>
    {/* Sun rays */}
    <g className="sun-rays">
      <line x1="35" y1="15" x2="35" y2="20" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="20" x2="52" y2="23" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="55" y1="35" x2="50" y2="35" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="15" y1="35" x2="20" y2="35" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
      <line x1="20" y1="20" x2="23" y2="23" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round"/>
    </g>
    {/* Cloud in front */}
    <path 
      d="M30 65 Q30 50 45 50 Q50 40 60 40 Q75 40 80 50 Q90 50 90 60 Q90 70 80 70 L40 70 Q30 70 30 65"
      fill="url(#cloudGradient)"
      className="cloud-body"
    />
    <defs>
      <radialGradient id="sunGradient" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#fcd34d"/>
        <stop offset="100%" stopColor="#f59e0b"/>
      </radialGradient>
      <linearGradient id="cloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f8fafc"/>
        <stop offset="100%" stopColor="#e2e8f0"/>
      </linearGradient>
    </defs>
  </svg>
);

const RainIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Dark cloud */}
    <path 
      d="M25 50 Q25 35 40 35 Q45 25 55 25 Q70 25 75 35 Q85 35 85 45 Q85 55 75 55 L35 55 Q25 55 25 50"
      fill="url(#rainCloudGradient)"
      className="rain-cloud"
    />
    {/* Rain drops */}
    <g className="rain-drops">
      <line x1="35" y1="60" x2="32" y2="75" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="y1" values="60;65;60" dur="1s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="75;80;75" dur="1s" repeatCount="indefinite"/>
      </line>
      <line x1="45" y1="55" x2="42" y2="70" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="y1" values="55;60;55" dur="1.2s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="70;75;70" dur="1.2s" repeatCount="indefinite"/>
      </line>
      <line x1="55" y1="60" x2="52" y2="75" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="y1" values="60;65;60" dur="0.8s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="75;80;75" dur="0.8s" repeatCount="indefinite"/>
      </line>
      <line x1="65" y1="58" x2="62" y2="73" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round">
        <animate attributeName="y1" values="58;63;58" dur="1.1s" repeatCount="indefinite"/>
        <animate attributeName="y2" values="73;78;73" dur="1.1s" repeatCount="indefinite"/>
      </line>
    </g>
    <defs>
      <linearGradient id="rainCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#64748b"/>
        <stop offset="100%" stopColor="#475569"/>
      </linearGradient>
    </defs>
  </svg>
);

const SnowIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Snow cloud */}
    <path 
      d="M25 50 Q25 35 40 35 Q45 25 55 25 Q70 25 75 35 Q85 35 85 45 Q85 55 75 55 L35 55 Q25 55 25 50"
      fill="url(#snowCloudGradient)"
      className="snow-cloud"
    />
    {/* Snowflakes */}
    <g className="snowflakes">
      <g transform="translate(35,65)">
        <circle cx="0" cy="0" r="2" fill="#f1f5f9">
          <animate attributeName="cy" values="0;10;0" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g transform="translate(50,60)">
        <circle cx="0" cy="0" r="1.5" fill="#f1f5f9">
          <animate attributeName="cy" values="0;15;0" dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.3;1" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      </g>
      <g transform="translate(65,68)">
        <circle cx="0" cy="0" r="2.5" fill="#f1f5f9">
          <animate attributeName="cy" values="0;8;0" dur="1.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite"/>
        </circle>
      </g>
    </g>
    <defs>
      <linearGradient id="snowCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e2e8f0"/>
        <stop offset="100%" stopColor="#cbd5e1"/>
      </linearGradient>
    </defs>
  </svg>
);

const ThunderstormIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Storm cloud */}
    <path 
      d="M25 50 Q25 35 40 35 Q45 25 55 25 Q70 25 75 35 Q85 35 85 45 Q85 55 75 55 L35 55 Q25 55 25 50"
      fill="url(#stormCloudGradient)"
      className="storm-cloud"
    />
    {/* Lightning bolt */}
    <path 
      d="M48 60 L52 60 L47 75 L53 75 L45 85 L50 75 L46 75 L51 60"
      fill="#fbbf24"
      className="lightning"
    >
      <animate attributeName="opacity" values="0;1;0;1;0" dur="2s" repeatCount="indefinite"/>
    </path>
    {/* Rain */}
    <g className="storm-rain">
      <line x1="35" y1="60" x2="32" y2="70" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="0.7;1;0.7" dur="0.5s" repeatCount="indefinite"/>
      </line>
      <line x1="65" y1="58" x2="62" y2="68" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round">
        <animate attributeName="opacity" values="1;0.7;1" dur="0.7s" repeatCount="indefinite"/>
      </line>
    </g>
    <defs>
      <linearGradient id="stormCloudGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#374151"/>
        <stop offset="100%" stopColor="#1f2937"/>
      </linearGradient>
    </defs>
  </svg>
);

const FogIcon: React.FC<{ size: number; animated: boolean }> = ({ size, animated }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 100 100" 
    className={animated ? 'weather-icon-animated' : ''}
  >
    {/* Fog layers */}
    <g className="fog-layers">
      <rect x="20" y="35" width="60" height="3" rx="1.5" fill="#94a3b8" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite"/>
      </rect>
      <rect x="15" y="45" width="70" height="3" rx="1.5" fill="#cbd5e1" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.4;0.7" dur="2.5s" repeatCount="indefinite"/>
      </rect>
      <rect x="25" y="55" width="50" height="3" rx="1.5" fill="#94a3b8" opacity="0.5">
        <animate attributeName="opacity" values="0.5;0.8;0.5" dur="2s" repeatCount="indefinite"/>
      </rect>
      <rect x="10" y="65" width="80" height="3" rx="1.5" fill="#cbd5e1" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.3;0.6" dur="3.5s" repeatCount="indefinite"/>
      </rect>
    </g>
  </svg>
);

// ============================================================================
// MAIN WEATHER ICON COMPONENT
// ============================================================================

/**
 * Enhanced Weather Icon Component
 * 
 * Renders appropriate weather icon based on OpenMeteo weather codes
 * with day/night variations and smooth animations.
 */
const WeatherIconComponent: React.FC<WeatherIconProps> = ({ 
  code, 
  size = 64, 
  isDay = true, 
  className = '', 
  animated = true 
}) => {
  // Determine if it's currently daytime (you can enhance this with actual sunrise/sunset times)
  const currentHour = new Date().getHours();
  const isDaytime = isDay ?? (currentHour >= 6 && currentHour < 18);

  const getIcon = () => {
    // Clear sky
    if (code === 0) {
      return isDaytime ? 
        <SunIcon size={size} animated={animated} /> : 
        <MoonIcon size={size} animated={animated} />;
    }
    
    // Mainly clear
    if (code === 1) {
      return isDaytime ? 
        <PartlyCloudyDayIcon size={size} animated={animated} /> : 
        <MoonIcon size={size} animated={animated} />;
    }
    
    // Partly cloudy / Overcast
    if (code === 2 || code === 3) {
      return <CloudIcon size={size} animated={animated} />;
    }
    
    // Fog
    if (code === 45 || code === 48) {
      return <FogIcon size={size} animated={animated} />;
    }
    
    // Drizzle and light rain
    if ((code >= 51 && code <= 55) || (code >= 80 && code <= 82)) {
      return <RainIcon size={size} animated={animated} />;
    }
    
    // Rain
    if (code >= 61 && code <= 65) {
      return <RainIcon size={size} animated={animated} />;
    }
    
    // Snow
    if (code >= 71 && code <= 75) {
      return <SnowIcon size={size} animated={animated} />;
    }
    
    // Thunderstorms
    if (code >= 95 && code <= 99) {
      return <ThunderstormIcon size={size} animated={animated} />;
    }
    
    // Default fallback
    return isDaytime ? 
      <SunIcon size={size} animated={animated} /> : 
      <MoonIcon size={size} animated={animated} />;
  };

  return (
    <div className={`weather-icon ${className}`} style={{ display: 'inline-block' }}>
      {getIcon()}
    </div>
  );
};

// ============================================================================
// CSS STYLES FOR ANIMATIONS
// ============================================================================

/**
 * CSS styles for weather icon animations.
 * Add this to your main CSS file or include in a <style> tag.
 */
export const weatherIconStyles = `
  .weather-icon-animated {
    transition: transform 0.3s ease;
  }
  
  .weather-icon-animated:hover {
    transform: scale(1.1);
  }
  
  .sun-rays {
    animation: rotate 20s linear infinite;
    transform-origin: 50px 50px;
  }
  
  .sun-body {
    animation: pulse 4s ease-in-out infinite;
  }
  
  .moon-body {
    animation: float 6s ease-in-out infinite;
  }
  
  .cloud-body {
    animation: float 8s ease-in-out infinite;
  }
  
  .rain-cloud {
    animation: sway 3s ease-in-out infinite;
  }
  
  .snow-cloud {
    animation: sway 4s ease-in-out infinite;
  }
  
  .storm-cloud {
    animation: shake 0.8s ease-in-out infinite;
  }
  
  .lightning {
    filter: drop-shadow(0 0 5px #fbbf24);
  }
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }
  
  @keyframes sway {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(3px); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-2px); }
    75% { transform: translateX(2px); }
  }
`;

const WeatherIcon = memo(WeatherIconComponent);
export default WeatherIcon;
