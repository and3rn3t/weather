import React, { useEffect, useState } from 'react';

interface ContentPriority {
  id: string;
  priority: number;
  shouldShow: boolean;
  loadOrder: number;
}

interface SmartContentWrapperProps {
  priority: ContentPriority;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const SmartContentWrapper: React.FC<SmartContentWrapperProps> = ({
  priority,
  children,
  fallback = null,
}) => {
  const [isVisible, setIsVisible] = useState(priority.priority >= 7);
  const [hasIntersected, setHasIntersected] = useState(false);

  useEffect(() => {
    // Immediate render for high priority content
    if (priority.priority >= 7) {
      setIsVisible(true);
      return;
    }

    // Intersection observer for lazy loading
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
          // Slight delay to prevent overwhelming the main thread
          setTimeout(() => setIsVisible(true), priority.loadOrder * 100);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      },
    );

    const element = document.getElementById(`content-${priority.id}`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [priority, hasIntersected]);

  if (!priority.shouldShow) {
    return null;
  }

  return (
    <div
      id={`content-${priority.id}`}
      className={`smart-content-wrapper priority-${priority.priority}`}
    >
      {isVisible ? children : fallback}
    </div>
  );
};

export default SmartContentWrapper;
