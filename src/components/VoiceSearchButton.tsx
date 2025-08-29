import React from 'react';
import {
  useVoiceSearchAccessibility,
  useVoiceSearchButton,
} from '../utils/useVoiceSearch';
import './VoiceSearchButton.css';

export interface VoiceSearchButtonProps {
  onCityRecognized: (city: string) => void;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const VoiceSearchButton: React.FC<VoiceSearchButtonProps> = ({
  onCityRecognized,
  label = 'Voice Search',
  size = 'medium',
  className = '',
}) => {
  const { announce, announcements } = useVoiceSearchAccessibility();
  const keyFor = (text: string) =>
    Array.from(text)
      .reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0)
      .toString(36);
  const {
    isSupported,
    isListening,
    isActive,
    pulseAnimation,
    transcript,
    confidence,
    error,
    handleVoiceSearch,
  } = useVoiceSearchButton(city => {
    announce(`Recognized ${city}`);
    onCityRecognized(city);
  });

  const containerClass = ['voice-search-container', className]
    .filter(Boolean)
    .join(' ');
  const btnClass = [
    'voice-search-button',
    `voice-search-button--${size}`,
    isListening ? 'voice-search-button--listening' : '',
    pulseAnimation ? 'voice-search-button--pulse' : '',
    !isSupported ? 'voice-search-button--disabled' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const confidencePct = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const confidenceStep = Math.round(confidencePct / 5) * 5;

  return (
    <div className={containerClass} aria-live="polite">
      <button
        type="button"
        className={btnClass}
        onClick={handleVoiceSearch}
        disabled={!isSupported || isListening}
        aria-label="Start voice search"
        title={
          isSupported ? 'Tap to speak a city' : 'Voice search not supported'
        }
      >
        <div className="voice-search-icon" aria-hidden="true">
          {isListening ? (
            <div className="sound-waves">
              <div className="wave wave-1" />
              <div className="wave wave-2" />
              <div className="wave wave-3" />
            </div>
          ) : (
            <svg
              className="microphone-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M19 11a7 7 0 0 1-14 0"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M12 21v-3" stroke="currentColor" strokeWidth="2" />
            </svg>
          )}
        </div>
        <span className="voice-search-label">{label}</span>
        {isActive && (
          <div className="pulse-ring">
            <div className="pulse-ring-inner" />
          </div>
        )}
      </button>

      {/* Live transcript */}
      {isListening && (
        <output className="voice-transcript" aria-live="polite">
          <div className="transcript-header">
            <span className="transcript-label">Listening…</span>
            <div className="confidence-indicator">
              <div className={`confidence-bar confidence-w${confidenceStep}`} />
            </div>
          </div>
          <div className="transcript-text">
            {transcript || 'Say a city name'}
          </div>
          <div className="transcript-hint">
            Examples: “San Francisco”, “New York City”, “Paris”
          </div>
        </output>
      )}

      {/* Error state */}
      {error && !isListening && (
        <div className="voice-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
          <button className="error-retry" onClick={handleVoiceSearch}>
            Try Again
          </button>
        </div>
      )}

      {/* Accessibility announcements (visually hidden) */}
      <div className="sr-only">
        {announcements.map(a => (
          <div key={keyFor(a)} aria-live="assertive">
            {a}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoiceSearchButton;
