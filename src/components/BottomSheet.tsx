/**
 * Bottom Sheet Component
 * Modern mobile bottom sheet with smooth animations and gesture support
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useHapticFeedback } from '../utils/hapticFeedback';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: number[];
  initialSnapPoint?: number;
  className?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.3, 0.6, 0.9],
  initialSnapPoint = 0.6,
  className = '',
}) => {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragCurrentY, setDragCurrentY] = useState(0);
  
  const sheetRef = useRef<HTMLDivElement>(null);
  const { selection, buttonPress } = useHapticFeedback();

  const getSheetHeight = useCallback((snapPoint: number) => {
    return `${snapPoint * 100}vh`;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
    setDragCurrentY(e.touches[0].clientY);
    selection();
  }, [selection]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    setDragCurrentY(e.touches[0].clientY);
    
    const deltaY = e.touches[0].clientY - dragStartY;
    const viewportHeight = window.innerHeight;
    const deltaSnapPoint = deltaY / viewportHeight;
    
    const newSnapPoint = Math.max(0, Math.min(1, currentSnapPoint - deltaSnapPoint));
    setCurrentSnapPoint(newSnapPoint);
  }, [isDragging, dragStartY, currentSnapPoint]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    const deltaY = dragCurrentY - dragStartY;
    const threshold = 50;
    
    if (deltaY > threshold) {
      // Dragged down - find closest lower snap point or close
      const lowerSnapPoints = snapPoints.filter(point => point < currentSnapPoint);
      if (lowerSnapPoints.length > 0) {
        const closestSnapPoint = Math.max(...lowerSnapPoints);
        setCurrentSnapPoint(closestSnapPoint);
        buttonPress();
      } else {
        onClose();
      }
    } else if (deltaY < -threshold) {
      // Dragged up - find closest higher snap point
      const higherSnapPoints = snapPoints.filter(point => point > currentSnapPoint);
      if (higherSnapPoints.length > 0) {
        const closestSnapPoint = Math.min(...higherSnapPoints);
        setCurrentSnapPoint(closestSnapPoint);
        buttonPress();
      }
    } else {
      // Snap to closest point
      const closest = snapPoints.reduce((prev, curr) => 
        Math.abs(curr - currentSnapPoint) < Math.abs(prev - currentSnapPoint) ? curr : prev
      );
      setCurrentSnapPoint(closest);
    }
  }, [isDragging, dragCurrentY, dragStartY, currentSnapPoint, snapPoints, onClose, buttonPress]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      setCurrentSnapPoint(initialSnapPoint);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSnapPoint]);

  if (!isOpen) return null;

  const sheetStyle: React.CSSProperties = {
    height: getSheetHeight(currentSnapPoint),
    transform: isDragging ? 'none' : undefined,
    transition: isDragging ? 'none' : 'height 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="bottom-sheet-backdrop"
        onClick={handleBackdropClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`bottom-sheet ${className}`}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bottom-sheet-bg, rgba(255, 255, 255, 0.95))',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '20px 20px 0 0',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          ...sheetStyle,
        }}
      >
        {/* Handle */}
        <div
          className="bottom-sheet-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            width: '40px',
            height: '4px',
            background: 'var(--handle-color, rgba(0, 0, 0, 0.2))',
            borderRadius: '2px',
            margin: '12px auto 8px',
            cursor: 'grab',
            touchAction: 'none',
          }}
        />
        
        {/* Header */}
        {title && (
          <div
            className="bottom-sheet-header"
            style={{
              padding: '8px 20px 16px',
              borderBottom: '1px solid var(--border-color, rgba(0, 0, 0, 0.1))',
              flexShrink: 0,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 600,
                color: 'var(--primary-text)',
                textAlign: 'center',
              }}
            >
              {title}
            </h3>
          </div>
        )}
        
        {/* Content */}
        <div
          className="bottom-sheet-content"
          style={{
            flex: 1,
            padding: '20px',
            paddingBottom: `calc(20px + env(safe-area-inset-bottom))`,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default BottomSheet;
