/**
 * Production Logger Utility
 * 
 * Provides conditional logging that can be disabled in production builds
 * while maintaining useful debug information during development.
 */

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isViteDevServer = Boolean(import.meta.hot);

export interface LogLevel {
  TRACE: 0;
  DEBUG: 1;
  INFO: 2;
  WARN: 3;
  ERROR: 4;
  SILENT: 5;
}

export const LOG_LEVELS: LogLevel = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  SILENT: 5
} as const;

// Production log level (only warnings and errors)
const PRODUCTION_LOG_LEVEL = LOG_LEVELS.WARN;
// Development log level (all logs)
const DEVELOPMENT_LOG_LEVEL = LOG_LEVELS.TRACE;

const currentLogLevel = (isDevelopment || isViteDevServer) ? DEVELOPMENT_LOG_LEVEL : PRODUCTION_LOG_LEVEL;

/**
 * Logger class with conditional output based on environment
 */
class Logger {
  private shouldLog(level: number): boolean {
    return level >= currentLogLevel;
  }

  private formatMessage(category: string, message: string, ...args: unknown[]): [string, ...unknown[]] {
    const timestamp = new Date().toLocaleTimeString();
    return [`[${timestamp}] ${category} ${message}`, ...args];
  }

  // Weather-specific logging
  weatherHaptic(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('🌤️', message, ...args));
    }
  }

  weatherTransition(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('🌦️', message, ...args));
    }
  }

  temperatureChange(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('🌡️', message, ...args));
    }
  }

  pressureChange(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('📊', message, ...args));
    }
  }

  windChange(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('💨', message, ...args));
    }
  }

  weatherLoading(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('🔄', message, ...args));
    }
  }

  interaction(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('🎯', message, ...args));
    }
  }

  location(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('📍', message, ...args));
    }
  }

  api(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(...this.formatMessage('📡', message, ...args));
    }
  }

  // Standard logging levels
  trace(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.TRACE)) {
      console.trace(...this.formatMessage('🔍', message, ...args));
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(...this.formatMessage('🐛', message, ...args));
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.INFO)) {
      console.info(...this.formatMessage('ℹ️', message, ...args));
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.WARN)) {
      console.warn(...this.formatMessage('⚠️', message, ...args));
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LOG_LEVELS.ERROR)) {
      console.error(...this.formatMessage('❌', message, ...args));
    }
  }

  // Performance logging
  performance(label: string, fn: () => void): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      const start = performance.now();
      fn();
      const end = performance.now();
      console.log(...this.formatMessage('⚡', `${label} took ${(end - start).toFixed(2)}ms`));
    } else {
      fn();
    }
  }

  // Group logging for related operations
  group(label: string, fn: () => void): void {
    if (this.shouldLog(LOG_LEVELS.DEBUG)) {
      console.group(label);
      fn();
      console.groupEnd();
    } else {
      fn();
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for common patterns
export const logWeatherHaptic = logger.weatherHaptic.bind(logger);
export const logWeatherTransition = logger.weatherTransition.bind(logger);
export const logTemperatureChange = logger.temperatureChange.bind(logger);
export const logPressureChange = logger.pressureChange.bind(logger);
export const logWindChange = logger.windChange.bind(logger);
export const logWeatherLoading = logger.weatherLoading.bind(logger);
export const logInteraction = logger.interaction.bind(logger);
export const logLocation = logger.location.bind(logger);
export const logApi = logger.api.bind(logger);

export default logger;
