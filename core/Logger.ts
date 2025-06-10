import type { LoggerStore, SourceAwareLoggerInterface, LogLevel, LoggerOptions, LogEntry } from '../types';

// Store reference for logging state
let storeReference: LoggerStore | null = null;

// Track discovered sources locally for performance
const discoveredSourcesCache = new Set<string>();

// Default to disabled until store is connected and explicitly enabled
let isStoreConnected = false;

/**
 * Set the Redux store reference for logging state management
 */
export const setLoggerStore = (store: LoggerStore) => {
  storeReference = store;
  isStoreConnected = true;
};

/**
 * Get log level from environment variable, default to appropriate level based on environment
 */
const getLogLevel = (): LogLevel => {
  const level = import.meta.env.VITE_LOG_LEVEL?.toLowerCase();
  const validLevels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

  if (level && validLevels.includes(level as LogLevel)) {
    return level as LogLevel;
  }

  // Default to 'info' in production, 'debug' in development
  return import.meta.env.PROD ? 'info' : 'debug';
};

/**
 * Get disabled log sources from store or environment
 */
const getDisabledLogSources = (): string[] => {
  // Fallback to environment variable if store not available
  if (!storeReference) {
    const disabled = import.meta.env.VITE_DISABLED_LOG_SOURCES?.split(',') || [];
    return disabled.map((source: string) => source.trim().toLowerCase());
  }

  try {
    const state = storeReference.getState();
    return state.logging?.disabledSources || [];
  } catch {
    return [];
  }
};

/**
 * Check if logging is globally disabled
 */
const isGlobalLoggingDisabled = (): boolean => {
  // Check environment variable for early logging control
  const envDisabled = import.meta.env.VITE_DISABLE_ALL_LOGGING === 'true';
  if (envDisabled) {
    return true;
  }

  // If store not connected yet, check if we should allow early logs
  if (!isStoreConnected || !storeReference) {
    // Allow early logs only if explicitly enabled via env var
    return import.meta.env.VITE_ENABLE_EARLY_LOGGING !== 'true';
  }

  try {
    const state = storeReference.getState();
    // If logging state doesn't exist, default to disabled
    return state.logging?.isGloballyDisabled ?? true;
  } catch {
    return true; // On error, default to disabled
  }
};

/**
 * Enhanced logger with source filtering and multiple output targets
 */
export class SourceAwareLogger implements SourceAwareLoggerInterface {
  private options: LoggerOptions;
  private logEntries: LogEntry[] = [];
  private maxEntries = 1000;

  constructor(options: LoggerOptions = {}) {
    this.options = {
      env: import.meta.env.MODE || 'development',
      minLevel: getLogLevel(),
      disabledSources: [],
      includeTimestamp: true,
      includeSource: true,
      ...options,
    };
  }

  private isSourceDisabled(source?: string): boolean {
    // Check global disable first - if globally disabled, block everything
    if (isGlobalLoggingDisabled()) {
      return true;
    }

    if (!source) return false;

    const disabledSources = getDisabledLogSources();
    // Check if the source is in the disabled list (case-sensitive exact match)
    return disabledSources.includes(source);
  }

  private trackDiscoveredSource(source: string): void {
    // Add to local cache
    if (!discoveredSourcesCache.has(source)) {
      discoveredSourcesCache.add(source);

      // Add to Redux store if available
      if (storeReference && storeReference.dispatch) {
        try {
          // Import action dynamically to avoid circular dependency
          import('../store/loggingReducer')
            .then(({ addDiscoveredSource }) => {
              if (storeReference && storeReference.dispatch) {
                storeReference.dispatch(addDiscoveredSource(source));
              }
              return;
            })
            .catch(() => {
              // Silently ignore import/dispatch errors
              return;
            });
        } catch {
          // Silently fail if we can't update the store
        }
      }
    }
  }

  private extractSourceFromMessage(msg: string): string | undefined {
    // Extract source from messages like '[ComponentName]' or '[ComponentName] message'
    const match = msg.match(/^\[([^\]]+)\]/);
    return match ? match[1] : undefined;
  }

  private detectCallingSource(): string | undefined {
    try {
      // Create an error to get the stack trace
      const err = new Error();
      const stack = err.stack || '';
      const stackLines = stack.split('\n');

      // Skip the first few lines (Error message, this function, and the logger method)
      for (let i = 3; i < stackLines.length; i++) {
        const line = stackLines[i];

        // Skip internal logger calls and webpack runtime
        if (line.includes('Logger.ts') || line.includes('webpack') || line.includes('node_modules')) {
          continue;
        }

        // Try to extract filename from the stack trace
        // Match patterns like "at functionName (file.ts:123:45)" or "at file.ts:123:45"
        const fileMatch = line.match(/(?:at\s+)?(?:.*?\s+\()?([^/\s]+?\.(tsx?|jsx?))/);
        if (fileMatch) {
          // Remove file extension and return
          return fileMatch[1].replace(/\.(tsx?|jsx?)$/, '');
        }

        // Try to extract component/function name
        const funcMatch = line.match(/at\s+(\w+)/);
        if (funcMatch && funcMatch[1] !== 'Object' && funcMatch[1] !== 'Module') {
          return funcMatch[1];
        }
      }
    } catch {
      // Silently fail if we can't get stack trace
    }

    return undefined;
  }

  private formatMessage(msg: string, detectedSource?: string): string {
    // If message already has a source identifier, use it as-is
    if (msg.match(/^\[([^\]]+)\]/)) {
      return msg;
    }

    // If we detected a source, prepend it
    if (detectedSource && this.options.includeSource) {
      return `[${detectedSource}] ${msg}`;
    }

    return msg;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];
    const currentLevelIndex = levels.indexOf(this.options.minLevel || 'info');
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private logToConsole(level: LogLevel, message: string, args: unknown[]) {
    if (typeof console === 'undefined') return;

    const timestamp = this.options.includeTimestamp ? new Date().toISOString() : '';
    const formattedMessage = this.options.formatter 
      ? this.options.formatter({ level, message, timestamp: new Date(), args })
      : `${timestamp ? `[${timestamp}] ` : ''}${message}`;

    switch (level) {
      case 'trace':
      case 'debug':
        console.debug(formattedMessage, ...args);
        break;
      case 'info':
        console.info(formattedMessage, ...args);
        break;
      case 'warn':
        console.warn(formattedMessage, ...args);
        break;
      case 'error':
      case 'fatal':
        console.error(formattedMessage, ...args);
        break;
    }
  }

  private addToHistory(level: LogLevel, message: string, source?: string, args?: unknown[]) {
    const entry: LogEntry = {
      level,
      message,
      source,
      timestamp: new Date(),
      args,
    };

    this.logEntries.push(entry);
    
    // Keep only the most recent entries
    if (this.logEntries.length > this.maxEntries) {
      this.logEntries = this.logEntries.slice(-this.maxEntries);
    }
  }

  private log(level: LogLevel, msg: string, ...args: unknown[]) {
    if (isGlobalLoggingDisabled() || !this.shouldLog(level)) {
      return;
    }

    // Try to get source from message first, then auto-detect
    const source = this.extractSourceFromMessage(msg);
    const detectedSource = source || this.detectCallingSource();

    // Track the source if found
    if (detectedSource) {
      this.trackDiscoveredSource(detectedSource);
    }

    if (!this.isSourceDisabled(detectedSource)) {
      const formattedMsg = this.formatMessage(msg, detectedSource);
      
      // Add to history
      this.addToHistory(level, formattedMsg, detectedSource, args);
      
      // Log to console
      this.logToConsole(level, formattedMsg, args);
    }
  }

  trace(msg: string, ...args: unknown[]) {
    this.log('trace', msg, ...args);
  }

  debug(msg: string, ...args: unknown[]) {
    this.log('debug', msg, ...args);
  }

  info(msg: string, ...args: unknown[]) {
    this.log('info', msg, ...args);
  }

  warn(msg: string, ...args: unknown[]) {
    this.log('warn', msg, ...args);
  }

  error(msg: string, ...args: unknown[]) {
    this.log('error', msg, ...args);
  }

  fatal(msg: string, ...args: unknown[]) {
    this.log('fatal', msg, ...args);
  }

  /**
   * Get log history
   */
  getHistory(): LogEntry[] {
    return [...this.logEntries];
  }

  /**
   * Clear log history
   */
  clearHistory(): void {
    this.logEntries = [];
  }

  /**
   * Get discovered sources
   */
  getDiscoveredSources(): string[] {
    return Array.from(discoveredSourcesCache);
  }
}

// Create default logger instance
export const logger = new SourceAwareLogger();

// Export convenience function
export const log = (msg: string) => logger.info(msg);

export default logger;