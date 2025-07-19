/**
 * City Selector Component
 * 
 * Provides a dropdown interface for selecting from favorite and recent cities.
 * Features quick search, favorites management, and smooth animations.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCityManagement, type SavedCity } from './useCityManagement';
import { useHaptic } from './hapticHooks';
import type { ThemeColors } from './themeConfig';

interface CitySelectorProps {
  theme: ThemeColors;
  isMobile: boolean;
  onCitySelected: (cityName: string, latitude: number, longitude: number) => void;
  disabled?: boolean;
  currentCity?: string;
  className?: string;
}

const CitySelector: React.FC<CitySelectorProps> = ({
  theme,
  isMobile,
  onCitySelected,
  disabled = false,
  currentCity,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const {
    favorites,
    recentCities,
    getQuickAccessCities,
    toggleFavorite,
    removeFromFavorites
  } = useCityManagement();
  
  const haptic = useHaptic();

  // Filter cities based on search term
  const filteredCities = useCallback(() => {
    const allCities = getQuickAccessCities();
    if (!searchTerm.trim()) return allCities;
    
    const term = searchTerm.toLowerCase();
    return allCities.filter(city => 
      city.name.toLowerCase().includes(term) ||
      city.displayName.toLowerCase().includes(term) ||
      city.country?.toLowerCase().includes(term) ||
      city.state?.toLowerCase().includes(term)
    );
  }, [getQuickAccessCities, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleCitySelect = useCallback((city: SavedCity) => {
    haptic.buttonConfirm();
    onCitySelected(city.name, city.latitude, city.longitude);
    setIsOpen(false);
    setSearchTerm('');
    setHoveredIndex(-1);
  }, [haptic, onCitySelected]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      const cities = filteredCities();
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHoveredIndex(prev => (prev + 1) % cities.length);
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHoveredIndex(prev => prev <= 0 ? cities.length - 1 : prev - 1);
          break;
        case 'Enter':
          event.preventDefault();
          if (hoveredIndex >= 0 && cities[hoveredIndex]) {
            handleCitySelect(cities[hoveredIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hoveredIndex, filteredCities, handleCitySelect]);

  const handleToggle = () => {
    if (disabled) return;
    haptic.buttonPress();
    setIsOpen(!isOpen);
    setSearchTerm('');
    setHoveredIndex(-1);
  };

  const handleToggleFavorite = (city: SavedCity, event: React.MouseEvent) => {
    event.stopPropagation();
    haptic.buttonPress();
    toggleFavorite(city.name, city.latitude, city.longitude, city.displayName, city.country, city.state);
  };

  const handleRemoveCity = (city: SavedCity, event: React.MouseEvent) => {
    event.stopPropagation();
    haptic.buttonPress();
    removeFromFavorites(city.id);
  };

  // Format city display name
  const formatCityDisplay = (city: SavedCity): string => {
    if (city.displayName !== city.name) {
      return city.displayName;
    }
    if (city.state && city.country) {
      return `${city.name}, ${city.state}, ${city.country}`;
    }
    if (city.country) {
      return `${city.name}, ${city.country}`;
    }
    return city.name;
  };

  // Get current city display
  const getCurrentCityDisplay = (): string => {
    if (!currentCity) return 'Select City';
    if (currentCity.length > 20 && isMobile) {
      return currentCity.substring(0, 17) + '...';
    }
    return currentCity;
  };

  const cities = filteredCities();
  const hasNoCities = favorites.length === 0 && recentCities.length === 0;

  // Responsive sizing
  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    minWidth: isMobile ? '120px' : '200px',
    maxWidth: isMobile ? '200px' : '300px',
    padding: isMobile ? '12px 16px' : '14px 18px',
    background: theme.toggleBackground,
    color: theme.primaryText,
    border: `1px solid ${theme.toggleBorder}`,
    borderRadius: '14px',
    fontSize: isMobile ? '15px' : '16px',
    fontWeight: '500',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
    opacity: disabled ? 0.6 : 1,
    transform: isOpen ? 'translateY(-1px)' : 'translateY(0)',
    boxShadow: isOpen ? theme.buttonShadow : 'none'
  };

  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    background: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '16px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
    backdropFilter: 'blur(20px)',
    zIndex: 1000,
    maxHeight: isMobile ? '70vh' : '400px',
    overflow: 'hidden',
    transform: isOpen ? 'scale(1)' : 'scale(0.95)',
    opacity: isOpen ? 1 : 0,
    visibility: isOpen ? 'visible' : 'hidden',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }} className={className}>
      {/* Trigger Button */}
      <button
        onClick={handleToggle}
        disabled={disabled}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!disabled) {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            target.style.borderColor = theme.weatherCardBorder;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            const target = e.target as HTMLButtonElement;
            target.style.backgroundColor = theme.toggleBackground;
            target.style.borderColor = theme.toggleBorder;
          }
        }}
        title="Select from saved cities"
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left'
        }}>
          {getCurrentCityDisplay()}
        </span>
        <span style={{ 
          marginLeft: '8px',
          fontSize: '12px',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </button>

      {/* Dropdown */}
      <div style={dropdownStyle}>
        {/* Search Input */}
        <div style={{ padding: '16px 16px 8px 16px' }}>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${theme.toggleBorder}`,
              borderRadius: '8px',
              background: theme.toggleBackground,
              color: theme.primaryText,
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = theme.weatherCardBorder}
            onBlur={(e) => e.target.style.borderColor = theme.toggleBorder}
          />
        </div>

        {/* City List */}
        <div style={{ 
          maxHeight: isMobile ? 'calc(70vh - 80px)' : '320px', 
          overflowY: 'auto',
          padding: '8px'
        }}>
          {hasNoCities && (
            <div style={{
              padding: '24px 16px',
              textAlign: 'center',
              color: theme.secondaryText,
              fontSize: '14px'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏙️</div>
              <div>No saved cities yet</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Search for cities to add them to your list
              </div>
            </div>
          )}
          
          {!hasNoCities && cities.length === 0 && searchTerm && (
            <div style={{
              padding: '16px',
              textAlign: 'center',
              color: theme.secondaryText,
              fontSize: '14px'
            }}>
              No cities found for "{searchTerm}"
            </div>
          )}

          {!hasNoCities && cities.length > 0 && cities.map((city, index) => (
            <button
              key={city.id}
              onClick={() => handleCitySelect(city)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: 'none',
                background: index === hoveredIndex ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              <div style={{ flex: 1 }}>
                <div style={{
                  color: theme.primaryText,
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '2px'
                }}>
                  {formatCityDisplay(city)}
                </div>
                {city.isFavorite && (
                  <div style={{
                    color: theme.secondaryText,
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⭐ Favorite
                  </div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={(e) => handleToggleFavorite(city, e)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '16px',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s ease'
                  }}
                  title={city.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  {city.isFavorite ? '⭐' : '☆'}
                </button>
                
                {city.isFavorite && (
                  <button
                    onClick={(e) => handleRemoveCity(city, e)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '14px',
                      padding: '4px',
                      borderRadius: '4px',
                      color: theme.secondaryText,
                      transition: 'all 0.2s ease'
                    }}
                    title="Remove from favorites"
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
                      target.style.color = '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.backgroundColor = 'transparent';
                      target.style.color = theme.secondaryText;
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        {cities.length > 0 && (
          <div style={{
            padding: '8px 16px',
            borderTop: `1px solid ${theme.toggleBorder}`,
            fontSize: '12px',
            color: theme.secondaryText,
            textAlign: 'center'
          }}>
            {favorites.length} favorites • {recentCities.length} recent
          </div>
        )}
      </div>
    </div>
  );
};

export default CitySelector;
