/**
 * Voice Search Feature Module
 * Lazy-loaded feature for voice search functionality
 */

import React from 'react';
import { useVoiceSearchButton } from '../utils/useVoiceSearch';

export interface VoiceSearchFeatureProps {
  onCitySelect: (city: string) => void;
  enabled?: boolean;
  className?: string;
}

/**
 * Voice Search Feature Component
 * Encapsulates all voice search related functionality
 */
export const VoiceSearchFeature: React.FC<VoiceSearchFeatureProps> = ({
  onCitySelect,
  enabled = true,
  className = '',
}) => {
  const { isListening, isSupported, handleVoiceSearch } =
    useVoiceSearchButton(onCitySelect);

  if (!enabled || !isSupported) {
    return null;
  }

  return (
    <button
      className={`voice-search-button ${className}`}
      onClick={handleVoiceSearch}
      disabled={isListening}
      title={isListening ? 'Listening...' : 'Voice Search for City'}
      aria-label={
        isListening
          ? 'Voice search is listening'
          : 'Start voice search for city'
      }
    >
      {isListening ? '🎤' : '🔍🎤'}
      {isListening && (
        <span className="voice-search-indicator">Listening...</span>
      )}
    </button>
  );
};

export default VoiceSearchFeature;
