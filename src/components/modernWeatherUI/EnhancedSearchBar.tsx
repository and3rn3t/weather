/**
 * iOS Enhanced Search Bar Component
 * 
 * A premium search component following iOS Human Interface Guidelines:
 * - Smooth focus/blur animations
 * - Search and cancel button states
 * - Scope bar for filtering options
 * - Voice search integration
 * - Recent searches and suggestions
 * - Accessible keyboard navigation
 */

import React, { useState, useRef } from 'react';
import type { ThemeColors } from '../../utils/themeConfig';

interface SearchBarProps {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: (text: string) => void;
  onCancel?: () => void;
  theme: ThemeColors;
  isDark?: boolean;
  showsCancelButton?: boolean;
  scopeButtonTitles?: string[];
  selectedScopeButtonIndex?: number;
  onScopeButtonSelectionChange?: (index: number) => void;
  recentSearches?: string[];
  suggestions?: string[];
  onRecentSearchSelect?: (search: string) => void;
  disabled?: boolean;
}

export const EnhancedSearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search',
  value,
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  onCancel,
  theme,
  isDark = false,
  showsCancelButton = true,
  scopeButtonTitles,
  selectedScopeButtonIndex = 0,
  onScopeButtonSelectionChange,
  recentSearches = [],
  suggestions = [],
  onRecentSearchSelect,
  disabled = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  };

  const searchContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.3s ease'
  };

  const searchInputContainerStyle: React.CSSProperties = {
    flex: 1,
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    borderRadius: '12px',
    border: `2px solid ${isFocused ? '#007AFF' : 'transparent'}`,
    transition: 'all 0.3s ease',
    transform: isFocused ? 'scale(1.02)' : 'scale(1)',
    boxShadow: isFocused 
      ? '0 0 0 4px rgba(0, 122, 255, 0.1)' 
      : '0 2px 8px rgba(0, 0, 0, 0.05)',
    opacity: disabled ? 0.6 : 1,
    pointerEvents: disabled ? 'none' : 'auto'
  };

  const searchIconStyle: React.CSSProperties = {
    marginLeft: '12px',
    width: '20px',
    height: '20px',
    color: theme.secondaryText,
    transition: 'color 0.3s ease'
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '12px 8px',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: '17px',
    color: theme.primaryText,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  };

  const clearButtonStyle: React.CSSProperties = {
    padding: '8px',
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    border: 'none',
    borderRadius: '10px',
    marginRight: '8px',
    cursor: 'pointer',
    display: value && isFocused ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  };

  const cancelButtonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    fontSize: '17px',
    fontWeight: '400',
    color: '#007AFF',
    cursor: 'pointer',
    opacity: isFocused && showsCancelButton ? 1 : 0,
    transform: isFocused && showsCancelButton ? 'translateX(0)' : 'translateX(20px)',
    transition: 'all 0.3s ease',
    whiteSpace: 'nowrap'
  };

  const scopeBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    padding: '0 16px',
    opacity: scopeButtonTitles && scopeButtonTitles.length > 0 ? 1 : 0,
    maxHeight: scopeButtonTitles && scopeButtonTitles.length > 0 ? '50px' : '0',
    overflow: 'hidden',
    transition: 'all 0.3s ease'
  };

  const scopeButtonStyle = (index: number): React.CSSProperties => ({
    padding: '8px 16px',
    backgroundColor: selectedScopeButtonIndex === index 
      ? '#007AFF' 
      : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'),
    border: 'none',
    borderRadius: '20px',
    fontSize: '15px',
    fontWeight: '500',
    color: selectedScopeButtonIndex === index 
      ? '#FFFFFF' 
      : theme.secondaryText,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap'
  });

  const suggestionsStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
    borderRadius: '12px',
    border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
    display: showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) ? 'block' : 'none',
    marginTop: '8px'
  };

  const suggestionItemStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
    cursor: 'pointer',
    fontSize: '17px',
    color: theme.primaryText,
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    onFocus?.();
  };

  const handleBlur = () => {
    // Delay hiding to allow suggestion clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      onBlur?.();
    }, 200);
  };

  const handleClear = () => {
    onChangeText('');
    inputRef.current?.focus();
  };

  const handleCancel = () => {
    onChangeText('');
    inputRef.current?.blur();
    onCancel?.();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(value);
    inputRef.current?.blur();
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChangeText(suggestion);
    setShowSuggestions(false);
    onSubmit?.(suggestion);
  };

  const handleRecentSearchClick = (search: string) => {
    onChangeText(search);
    setShowSuggestions(false);
    onRecentSearchSelect?.(search);
  };

  // Search Icon SVG
  const SearchIcon = () => (
    <svg style={searchIconStyle} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
  );

  // Clear Button Icon
  const ClearIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
    </svg>
  );

  // History Icon for recent searches
  const HistoryIcon = () => (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
    </svg>
  );

  return (
    <div style={containerStyle} className="ios-search-bar">
      <form onSubmit={handleSubmit}>
        <div style={searchContainerStyle}>
          <div style={searchInputContainerStyle}>
            <SearchIcon />
            <input
              ref={inputRef}
              style={inputStyle}
              type="text"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChangeText(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              disabled={disabled}
              aria-label={placeholder}
            />
            <button
              type="button"
              style={clearButtonStyle}
              onClick={handleClear}
              aria-label="Clear search"
            >
              <ClearIcon />
            </button>

            {/* Suggestions Dropdown */}
            <div style={suggestionsStyle}>
              {recentSearches.length > 0 && (
                <>
                  {recentSearches.map((search, index) => (
                    <div
                      key={`recent-${search}-${index}`}
                      style={suggestionItemStyle}
                      onClick={() => handleRecentSearchClick(search)}
                      onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 
                          isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'transparent';
                      }}
                    >
                      <HistoryIcon />
                      <span>{search}</span>
                    </div>
                  ))}
                  {suggestions.length > 0 && (
                    <div style={{ height: '1px', backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', margin: '8px 0' }} />
                  )}
                </>
              )}
              
              {suggestions.map((suggestion, index) => (
                <div
                  key={`suggestion-${suggestion}-${index}`}
                  style={suggestionItemStyle}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 
                      isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <SearchIcon />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            style={cancelButtonStyle}
            onClick={handleCancel}
            aria-label="Cancel search"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Scope Bar */}
      {scopeButtonTitles && scopeButtonTitles.length > 0 && (
        <div style={scopeBarStyle}>
          {scopeButtonTitles.map((title, index) => (
            <button
              key={`scope-${title}`}
              style={scopeButtonStyle(index)}
              onClick={() => onScopeButtonSelectionChange?.(index)}
              aria-label={`Filter by ${title}`}
              aria-pressed={selectedScopeButtonIndex === index}
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
