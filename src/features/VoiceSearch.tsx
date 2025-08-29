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
  resolving?: boolean; // optional external resolving state (e.g., geocoding)
}

/**
 * Voice Search Feature Component
 * Encapsulates all voice search related functionality
 */
export const VoiceSearchFeature: React.FC<VoiceSearchFeatureProps> = ({
  onCitySelect,
  enabled = true,
  className = '',
  resolving = false,
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
      disabled={isListening || resolving}
      title={
        isListening
          ? 'Listening...'
          : resolving
            ? 'Resolving…'
            : 'Voice Search for City'
      }
      aria-label={
        isListening
          ? 'Voice search is listening'
          : resolving
            ? 'Resolving spoken city'
            : 'Start voice search for city'
      }
    >
      {isListening ? '🎤' : resolving ? '⏳' : '🔍🎤'}
      {isListening && (
        <span className="voice-search-indicator">Listening...</span>
      )}
      {!isListening && resolving && (
        <span className="voice-search-indicator">Resolving…</span>
      )}
    </button>
  );
};

export default VoiceSearchFeature;
