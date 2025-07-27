/**
 * Location Services Tests
 * 
 * Tests for the useLocationServices hook and LocationButton component.
 * Covers GPS functionality, permission handling, and reverse geocoding.
 */

import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { useLocationServices } from '../useLocationServices';
import LocationButton from '../LocationButton';
import { HapticFeedbackProvider } from '../hapticContext';
import { ThemeProvider } from '../themeContext';
import { lightTheme } from '../themeConfig';
import { createNavigatorMock } from './testUtils';

// ============================================================================
// MOCK SETUP
// ============================================================================

const { mockGeolocation, mockPermissions } = createNavigatorMock();

// Mock fetch for reverse geocoding
global.fetch = vi.fn();

// Test wrapper with providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <HapticFeedbackProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </HapticFeedbackProvider>
);

describe('useLocationServices', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Capability Detection', () => {
    it('should detect geolocation support', () => {
      const { result } = renderHook(() => useLocationServices(), { wrapper });
      expect(result.current.isSupported).toBe(true);
    });

    it('should handle unsupported browsers', () => {
      // Mock unsupported browser by removing geolocation from navigator
      const originalGeolocation = navigator.geolocation;
      
      // Remove geolocation from navigator to simulate unsupported browser
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { result } = renderHook(() => useLocationServices(), { wrapper });
      expect(result.current.isSupported).toBe(false);

      // Restore geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Permission Status', () => {
    it('should check permission status', async () => {
      mockPermissions.query.mockResolvedValue({ state: 'granted' });

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let status: string = '';
      await act(async () => {
        status = await result.current.checkPermissionStatus();
      });

      expect(status).toBe('granted');
      expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    it('should handle permission check failures', async () => {
      mockPermissions.query.mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let status: string = '';
      await act(async () => {
        status = await result.current.checkPermissionStatus();
      });

      expect(status).toBe('unknown');
    });
  });

  describe('Location Retrieval', () => {
    beforeEach(() => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{
          display_name: 'New York, NY, USA',
          address: {
            city: 'New York',
            state: 'New York',
            country: 'United States',
          },
        }]),
      } as Response);
    });

    it('should get current location successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let locationData: unknown = null;
      await act(async () => {
        locationData = await result.current.getCurrentLocation();
      });

      expect(locationData).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
        address: {
          city: 'New York',
          display: 'New York, NY, USA',
        },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('nominatim.openstreetmap.org')
      );
    });

    it('should handle location errors', async () => {
      const mockError = { code: 1, message: 'Permission denied' };
      mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
        error(mockError);
      });

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let locationData: unknown = undefined;
      await act(async () => {
        locationData = await result.current.getCurrentLocation();
      });

      expect(locationData).toBeNull();
      expect(result.current.error).toEqual({
        code: 1,
        message: 'Permission denied',
        type: 'PERMISSION_DENIED',
      });
    });

    it('should handle reverse geocoding failures gracefully', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let locationData: unknown = null;
      await act(async () => {
        locationData = await result.current.getCurrentLocation();
      });

      expect(locationData).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
      });

      expect(global.fetch).toHaveBeenCalled();
    });

    it('should skip address lookup when disabled', async () => {
      const mockPosition = {
        coords: {
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 10,
        },
        timestamp: Date.now(),
      };

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let locationData: unknown = null;
      await act(async () => {
        locationData = await result.current.getCurrentLocation({ includeAddress: false });
      });

      expect(locationData).toEqual({
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: mockPosition.timestamp,
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Location Watching', () => {
    it('should start watching location', () => {
      const mockWatchId = 123;
      mockGeolocation.watchPosition.mockReturnValue(mockWatchId);

      const { result } = renderHook(() => useLocationServices(), { wrapper });

      let watchId: number | null = null;
      act(() => {
        watchId = result.current.watchLocation();
      });

      expect(watchId).toBe(mockWatchId);
      expect(mockGeolocation.watchPosition).toHaveBeenCalled();
    });

    it('should stop watching location', () => {
      const mockWatchId = 123;
      const { result } = renderHook(() => useLocationServices(), { wrapper });

      act(() => {
        result.current.stopWatching(mockWatchId);
      });

      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });
  });

  describe('Utility Functions', () => {
    it('should format location display correctly', () => {
      const { result } = renderHook(() => useLocationServices(), { wrapper });

      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now(),
        address: {
          city: 'New York',
          display: 'New York, NY, USA',
        },
      };

      act(() => {
        expect(result.current.formatLocationDisplay(mockLocation)).toBe('New York, NY, USA');
      });
    });

    it('should format coordinates when no city available', () => {
      const { result } = renderHook(() => useLocationServices(), { wrapper });

      const mockLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
        timestamp: Date.now(),
      };

      act(() => {
        expect(result.current.formatLocationDisplay(mockLocation)).toBe('40.7128, -74.0060');
      });
    });

    it('should clear location data', () => {
      const { result } = renderHook(() => useLocationServices(), { wrapper });

      act(() => {
        result.current.clearLocation();
      });

      expect(result.current.location).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('LocationButton', () => {
  const defaultProps = {
    theme: lightTheme,
    isMobile: false,
    onLocationReceived: vi.fn(),
    onError: vi.fn(),
    size: 'medium' as const,
    variant: 'primary' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        address: { city: 'New York', country: 'United States' },
      }),
    } as Response);
  });

  it('should render location button', () => {
    render(
      <HapticFeedbackProvider>
        <ThemeProvider>
          <LocationButton {...defaultProps} />
        </ThemeProvider>
      </HapticFeedbackProvider>
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Use My Location')).toBeInTheDocument();
  });

  it('should handle location request', async () => {
    const mockPosition = {
      coords: {
        latitude: 40.7128,
        longitude: -74.0060,
        accuracy: 10,
      },
      timestamp: Date.now(),
    };

    mockGeolocation.getCurrentPosition.mockImplementation((success) => {
      success(mockPosition);
    });

    render(
      <HapticFeedbackProvider>
        <ThemeProvider>
          <LocationButton {...defaultProps} />
        </ThemeProvider>
      </HapticFeedbackProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(defaultProps.onLocationReceived).toHaveBeenCalledWith(
        expect.any(String), // city
        40.7128, // latitude  
        -74.0060 // longitude
      );
    });
  });

  it('should handle location errors', async () => {
    const mockError = { code: 1, message: 'Permission denied' };
    mockGeolocation.getCurrentPosition.mockImplementation((_, error) => {
      error(mockError);
    });

    render(
      <HapticFeedbackProvider>
        <ThemeProvider>
          <LocationButton {...defaultProps} />
        </ThemeProvider>
      </HapticFeedbackProvider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith(
        'Permission denied'
      );
    });
  });
});
