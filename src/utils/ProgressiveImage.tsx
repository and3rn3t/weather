/**
 * Progressive Image Loading Component
 *
 * Provides smooth loading experience for weather icons and images
 * with blur-to-clear transitions and fallback handling.
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from './useTheme';
import WeatherIcon from './weatherIcons';

// ============================================================================
// PROGRESSIVE IMAGE COMPONENT
// ============================================================================

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  width?: number;
  height?: number;
  priority?: boolean; // For above-the-fold images
  onLoad?: () => void;
  onError?: () => void;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  placeholder,
  className = '',
  style = {},
  width,
  height,
  priority = false,
  onLoad,
  onError,
}) => {
  const { theme, isMobile } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Preload image
  useEffect(() => {
    const img = new Image();

    img.onload = () => {
      setImageLoaded(true);
      setShowPlaceholder(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageError(true);
      setShowPlaceholder(false);
      onError?.();
    };

    // Set priority loading for above-the-fold images
    if (priority) {
      img.loading = 'eager';
    }

    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src, priority, onLoad, onError]);

  // Base image styles
  const imageStyles: React.CSSProperties = {
    transition: 'all 0.3s ease',
    width: width || 'auto',
    height: height || 'auto',
    ...style,
  };

  // Placeholder styles with shimmer effect
  const placeholderStyles: React.CSSProperties = {
    ...imageStyles,
    backgroundColor: theme.cardBackground,
    backgroundImage: `linear-gradient(90deg, ${theme.cardBackground} 25%, ${theme.toggleBackground} 50%, ${theme.cardBackground} 75%)`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.secondaryText,
    fontSize: isMobile ? '12px' : '14px',
  };

  // Error state styles
  const errorStyles: React.CSSProperties = {
    ...imageStyles,
    backgroundColor: theme.cardBackground,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: theme.secondaryText,
    fontSize: isMobile ? '20px' : '24px',
  };

  // Show error state
  if (imageError) {
    return (
      <div style={errorStyles} className={className}>
        🌐
      </div>
    );
  }

  // Show placeholder while loading
  if (showPlaceholder || !imageLoaded) {
    return (
      <div style={placeholderStyles} className={className}>
        {placeholder || '📷'}
      </div>
    );
  }

  // Show loaded image
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={{
        ...imageStyles,
        opacity: imageLoaded ? 1 : 0,
        filter: imageLoaded ? 'none' : 'blur(4px)',
      }}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
};

// ============================================================================
// WEATHER ICON WITH PROGRESSIVE LOADING
// ============================================================================

interface ProgressiveWeatherIconProps {
  code: number;
  size?: number;
  animated?: boolean;
  className?: string;
}

export const ProgressiveWeatherIcon: React.FC<ProgressiveWeatherIconProps> = ({
  code,
  size = 32,
  animated = false,
  className = '',
}) => {
  // Render the unified SVG WeatherIcon for consistency with iOS26 design
  return (
    <WeatherIcon
      code={code}
      size={size}
      animated={animated}
      className={className}
    />
  );
};

// ============================================================================
// OPTIMIZED IMAGE GALLERY
// ============================================================================

interface ImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    placeholder?: string;
  }>;
  columns?: number;
  gap?: number;
}

export const OptimizedImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  columns = 3,
  gap = 16,
}) => {
  const { isMobile, isTablet } = useTheme();

  // Responsive columns
  const getColumns = () => {
    if (isMobile) return Math.min(columns, 2);
    if (isTablet) return Math.min(columns, 3);
    return columns;
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getColumns()}, 1fr)`,
        gap: `${gap}px`,
        width: '100%',
      }}
    >
      {images.map((image, index) => (
        <ProgressiveImage
          key={`gallery-img-${image.src.split('/').pop()}-${index}`}
          src={image.src}
          alt={image.alt}
          placeholder={image.placeholder}
          priority={index < 4} // Prioritize first 4 images
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '8px',
            objectFit: 'cover',
          }}
        />
      ))}
    </div>
  );
};

export default {
  ProgressiveImage,
  ProgressiveWeatherIcon,
  OptimizedImageGallery,
};
