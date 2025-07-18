/**
 * HomeScreen Component Test Suite
 * 
 * Tests for the legacy HomeScreen component (Note: This component is deprecated)
 * These tests ensure backward compatibility but the inline home screen in AppNavigator is preferred
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import HomeScreen from '../HomeScreen';

// Define proper navigation type
type NavigationProp = {
  navigate: (screenName: string) => void;
};

// Mock navigation prop
const mockNavigate = jest.fn();
const mockNavigation: NavigationProp = { navigate: mockNavigate };

describe('HomeScreen Component (Legacy)', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  // ========================================================================
  // RENDERING TESTS
  // ========================================================================

  describe('Component Rendering', () => {
    test('renders home screen with title and button', () => {
      render(<HomeScreen navigation={mockNavigation} />);
      
      expect(screen.getByText('Welcome to the Weather App')).toBeInTheDocument();
      expect(screen.getByText('View Weather')).toBeInTheDocument();
    });

    test('renders button with proper styling', () => {
      render(<HomeScreen navigation={mockNavigation} />);
      
      const button = screen.getByText('View Weather');
      expect(button).toBeInTheDocument();
      expect(button).toHaveStyle('background-color: #007AFF');
    });
  });

  // ========================================================================
  // INTERACTION TESTS
  // ========================================================================

  describe('User Interactions', () => {
    test('calls navigation when button is clicked', async () => {
      const user = userEvent.setup();
      render(<HomeScreen navigation={mockNavigation} />);
      
      const button = screen.getByText('View Weather');
      await user.click(button);
      
      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('WeatherDetails');
    });
  });

  // ========================================================================
  // LAYOUT AND STYLING TESTS
  // ========================================================================

  describe('Layout and Styling', () => {
    test('has proper container styling', () => {
      const { container } = render(<HomeScreen navigation={mockNavigation} />);
      
      const rootDiv = container.firstChild as HTMLElement;
      expect(rootDiv).toHaveStyle('display: flex');
      expect(rootDiv).toHaveStyle('flex-direction: column');
      expect(rootDiv).toHaveStyle('justify-content: center');
      expect(rootDiv).toHaveStyle('align-items: center');
    });

    test('has proper typography', () => {
      render(<HomeScreen navigation={mockNavigation} />);
      
      const title = screen.getByText('Welcome to the Weather App');
      expect(title).toHaveStyle('font-size: 24px');
      expect(title).toHaveStyle('font-weight: bold');
    });
  });

  // ========================================================================
  // ACCESSIBILITY TESTS
  // ========================================================================

  describe('Accessibility', () => {
    test('has proper semantic structure', () => {
      render(<HomeScreen navigation={mockNavigation} />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Welcome to the Weather App');
    });

    test('button is keyboard accessible', () => {
      render(<HomeScreen navigation={mockNavigation} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toHaveAttribute('disabled');
    });
  });

  // ========================================================================
  // DEPRECATION NOTICE TEST
  // ========================================================================

  describe('Deprecation Notice', () => {
    test('component exists for backward compatibility', () => {
      // This test serves as documentation that this component is deprecated
      // but still functional for backward compatibility
      render(<HomeScreen navigation={mockNavigation} />);
      
      expect(screen.getByText('Welcome to the Weather App')).toBeInTheDocument();
    });
  });
});
