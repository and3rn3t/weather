/**
 * Time and Date Utility Functions
 * Provides standardized time formatting for the weather app
 */

/**
 * Format time for hourly forecast display
 * @param time - ISO time string or Date
 * @returns Formatted time string (e.g., "2 PM")
 */
export const formatTimeForHourly = (time: string | Date): string => {
  const date = typeof time === 'string' ? new Date(time) : time;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    hour12: true,
  });
};

/**
 * Format date for daily forecast display
 * @param date - ISO date string or Date
 * @returns Formatted date string (e.g., "Mon")
 */
export const formatDateForDaily = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
  });
};

/**
 * Format full date and time
 * @param dateTime - ISO datetime string or Date
 * @returns Formatted datetime string (e.g., "Monday, August 22 at 2:30 PM")
 */
export const formatFullDateTime = (dateTime: string | Date): string => {
  const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param time - ISO time string or Date
 * @returns Relative time string
 */
export const getRelativeTime = (time: string | Date): string => {
  const date = typeof time === 'string' ? new Date(time) : time;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffHours >= 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours >= 1) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes >= 1) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
};
