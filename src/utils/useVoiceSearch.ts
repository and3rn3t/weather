/**
 * Voice Search Integration for Weather App
 *
 * Provides hands-free city search using Web Speech API with intelligent
 * voice recognition, popular cities optimization, and mobile-first design.
 *
 * PRIVACY & UX CONFIGURATION:
 * - Voice navigation is DISABLED BY DEFAULT for privacy and user experience
 * - Users must explicitly enable voice search if desired
 * - No automatic listening or voice data collection without user consent
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { logError } from './logger';

// Voice recognition interfaces for TypeScript
interface SpeechRecognitionInterface {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onstart: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

// Voice search configuration
interface VoiceSearchConfig {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  timeout?: number;
  autoStart?: boolean; // Voice navigation disabled by default - users must manually enable
}

// Voice search hook return type
interface UseVoiceSearchReturn {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  voiceSearchCity: (onCityFound: (city: string) => void) => Promise<void>;
}

/**
 * Default voice search configuration - voice navigation disabled by default
 */
export const DEFAULT_VOICE_SEARCH_CONFIG: VoiceSearchConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  maxAlternatives: 3,
  timeout: 10000,
  autoStart: false, // Voice navigation disabled by default for privacy and user experience
};

/**
 * Popular city names for voice recognition optimization
 * Includes phonetic variations and common pronunciations
 */
const VOICE_OPTIMIZED_CITIES = {
  // Exact matches for clear pronunciation
  'new york': ['new york', 'new york city', 'nyc'],
  'los angeles': ['los angeles', 'la', 'l a'],
  'san francisco': ['san francisco', 'san fran', 'frisco'],
  'las vegas': ['las vegas', 'vegas'],
  'new orleans': ['new orleans', 'new orleans'],
  chicago: ['chicago', 'chi town'],
  boston: ['boston'],
  seattle: ['seattle'],
  denver: ['denver'],
  miami: ['miami'],

  // International cities
  london: ['london'],
  paris: ['paris'],
  tokyo: ['tokyo'],
  beijing: ['beijing', 'peking'],
  shanghai: ['shanghai'],
  'hong kong': ['hong kong'],
  singapore: ['singapore'],
  sydney: ['sydney'],
  melbourne: ['melbourne'],
  toronto: ['toronto'],
  vancouver: ['vancouver'],
  montreal: ['montreal'],

  // European cities
  berlin: ['berlin'],
  madrid: ['madrid'],
  rome: ['rome'],
  amsterdam: ['amsterdam'],
  barcelona: ['barcelona'],
  vienna: ['vienna'],
  prague: ['prague'],
  stockholm: ['stockholm'],
  copenhagen: ['copenhagen'],
  oslo: ['oslo'],
  helsinki: ['helsinki'],
  zurich: ['zurich'],

  // Phonetic variations for difficult names
  philadelphia: ['philadelphia', 'philly', 'filadelfia'],
  albuquerque: ['albuquerque', 'alberquerque'],
  worcester: ['worcester', 'wooster'],
  leicester: ['leicester', 'lester'],
  gloucester: ['gloucester', 'gloster'],

  // Asian cities with pronunciation variants
  mumbai: ['mumbai', 'bombay'],
  delhi: ['delhi', 'new delhi'],
  bangalore: ['bangalore', 'bengaluru'],
  kolkata: ['kolkata', 'calcutta'],
  istanbul: ['istanbul', 'constantinople'],
  bangkok: ['bangkok'],
  jakarta: ['jakarta'],
  manila: ['manila'],

  // Middle East & Africa
  dubai: ['dubai'],
  riyadh: ['riyadh'],
  cairo: ['cairo'],
  'tel aviv': ['tel aviv'],
  'cape town': ['cape town'],

  // South America
  'sao paulo': ['sao paulo', 'são paulo'],
  'rio de janeiro': ['rio de janeiro', 'rio'],
  'buenos aires': ['buenos aires'],
  'mexico city': ['mexico city'],
  bogota: ['bogota', 'bogotá'],
  lima: ['lima'],
};

/**
 * Voice Search Hook
 * Provides complete voice search functionality with city recognition
 */
export function useVoiceSearch(
  config: VoiceSearchConfig = {}
): UseVoiceSearchReturn {
  // Merge with default configuration to ensure voice navigation is disabled by default
  const finalConfig = { ...DEFAULT_VOICE_SEARCH_CONFIG, ...config };

  const {
    language,
    continuous,
    interimResults,
    maxAlternatives,
    timeout,
    autoStart, // Voice navigation disabled by default for privacy and UX
  } = finalConfig;

  // State management
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(
    () => 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
  );

  // Refs for speech recognition
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  /**
   * Initialize speech recognition
   */
  const initializeSpeechRecognition = useCallback(() => {
    if (!isSupported) return null;

    // Type assertion for browser speech recognition APIs
    const windowWithSpeech = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionInterface;
      webkitSpeechRecognition?: new () => SpeechRecognitionInterface;
    };

    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition ||
      windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();

    recognition.continuous = continuous ?? false;
    recognition.interimResults = interimResults ?? true;
    recognition.lang = language ?? 'en-US';
    recognition.maxAlternatives = maxAlternatives ?? 3;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);

      // Set timeout for automatic stop
      timeoutRef.current = setTimeout(() => {
        recognition.stop();
        setError('Voice search timed out. Please try again.');
      }, timeout);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      let bestConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const resultTranscript = result[0].transcript;
        const resultConfidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += resultTranscript;
          bestConfidence = Math.max(bestConfidence, resultConfidence);
        } else {
          interimTranscript += resultTranscript;
        }
      }

      setTranscript(finalTranscript || interimTranscript);
      setConfidence(bestConfidence);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false);
      setError(`Voice recognition error: ${event.error}`);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    recognition.onend = () => {
      setIsListening(false);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    return recognition;
  }, [
    isSupported,
    continuous,
    interimResults,
    language,
    maxAlternatives,
    timeout,
  ]);

  /**
   * Start voice recognition
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Voice recognition is not supported in this browser');
      return;
    }

    try {
      if (!recognitionRef.current) {
        recognitionRef.current = initializeSpeechRecognition();
      }

      if (recognitionRef.current && !isListening) {
        setTranscript('');
        setConfidence(0);
        setError(null);
        recognitionRef.current.start();
      }
    } catch (err) {
      logError('Voice recognition start error:', err);
      setError('Failed to start voice recognition');
    }
  }, [isSupported, isListening, initializeSpeechRecognition]);

  /**
   * Stop voice recognition
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  /**
   * Reset transcript and state
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  /**
   * Intelligent city name recognition from voice transcript
   */
  const recognizeCityFromTranscript = useCallback(
    (text: string): string | null => {
      if (!text.trim()) return null;

      const normalizedText = text.toLowerCase().trim();

      // Direct exact matches
      for (const [cityName, variations] of Object.entries(
        VOICE_OPTIMIZED_CITIES
      )) {
        if (variations.some(variation => normalizedText.includes(variation))) {
          return cityName;
        }
      }

      // Fuzzy matching for partial words
      const words = normalizedText.split(/\s+/);
      for (const [cityName, variations] of Object.entries(
        VOICE_OPTIMIZED_CITIES
      )) {
        for (const variation of variations) {
          const variationWords = variation.split(/\s+/);

          // Check if all words of variation are present in transcript
          const allWordsPresent = variationWords.every(varWord =>
            words.some(
              word =>
                word.includes(varWord) ||
                varWord.includes(word) ||
                levenshteinDistance(word, varWord) <= 1
            )
          );

          if (allWordsPresent) {
            return cityName;
          }
        }
      }

      // Fallback: return original text for general search
      return normalizedText;
    },
    []
  );

  /**
   * Voice search specifically for cities
   */
  const voiceSearchCity = useCallback(
    async (onCityFound: (city: string) => void): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isSupported) {
          reject(new Error('Voice search not supported'));
          return;
        }

        // Create one-time recognition for city search
        const cityRecognition = initializeSpeechRecognition();
        if (!cityRecognition) {
          reject(new Error('Failed to initialize voice recognition'));
          return;
        }

        // Override handlers for city-specific search
        cityRecognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[event.results.length - 1];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;

          setTranscript(transcript);
          setConfidence(confidence);

          if (result.isFinal) {
            const recognizedCity = recognizeCityFromTranscript(transcript);
            if (recognizedCity) {
              onCityFound(recognizedCity);
              cityRecognition.stop();
              resolve();
            } else {
              setError('No city recognized. Please try again.');
              reject(new Error('No city recognized'));
            }
          }
        };

        cityRecognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          setError(`Voice search failed: ${event.error}`);
          reject(new Error(event.error));
        };

        cityRecognition.onend = () => {
          setIsListening(false);
        };

        try {
          cityRecognition.start();
          setIsListening(true);
          setError(null);
        } catch (err) {
          reject(err);
        }
      });
    },
    [isSupported, initializeSpeechRecognition, recognizeCityFromTranscript]
  );

  /**
   * Auto-start if enabled
   */
  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      startListening();
    }
  }, [autoStart, isSupported, isListening, startListening]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    voiceSearchCity,
  };
}

/**
 * Simple Levenshtein distance for fuzzy voice matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

  for (let i = 0; i <= str1.length; i += 1) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= str2.length; j += 1) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= str2.length; j += 1) {
    for (let i = 1; i <= str1.length; i += 1) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Voice Search Button Component Hook
 * Provides state management for voice search UI button
 */
export function useVoiceSearchButton(onCitySelect: (city: string) => void) {
  const [isActive, setIsActive] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  const {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    voiceSearchCity,
  } = useVoiceSearch({
    ...DEFAULT_VOICE_SEARCH_CONFIG, // Use default config with voice navigation disabled
    timeout: 8000, // Override timeout for button-triggered searches
  });

  const handleVoiceSearch = useCallback(async () => {
    if (isListening) return;

    setIsActive(true);
    setPulseAnimation(true);

    try {
      await voiceSearchCity(city => {
        onCitySelect(city);
        setIsActive(false);
        setPulseAnimation(false);
      });
    } catch (err) {
      setIsActive(false);
      setPulseAnimation(false);
      logError('Voice search error:', err);
    }
  }, [isListening, voiceSearchCity, onCitySelect]);

  return {
    isSupported,
    isListening,
    isActive,
    pulseAnimation,
    transcript,
    confidence,
    error,
    handleVoiceSearch,
  };
}

/**
 * Voice Search Accessibility Hook
 * Provides accessibility features for voice search
 */
export function useVoiceSearchAccessibility() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);

    // Clear announcement after screen reader has time to read it
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 3000);
  }, []);

  return {
    announcements,
    announce,
  };
}

/**
 * Check if voice search is enabled in the given configuration
 */
export function isVoiceSearchEnabled(config: VoiceSearchConfig = {}): boolean {
  return config.autoStart === true;
}

/**
 * Check if voice search is supported by the browser
 */
export function isVoiceSearchSupported(): boolean {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}
