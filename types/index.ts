export interface LoggingState {
  disabledSources: string[];
  isGloballyDisabled: boolean;
  discoveredSources: string[];
}

export interface StoreState {
  logging?: LoggingState;
}

export interface LoggerConfig {
  serverUrl?: string;
  env?: string;
  logLevel?: LogLevel;
  disabledSources?: string[];
}

export interface LoggerStore {
  getState: () => StoreState;
  dispatch?: (action: unknown) => void;
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface SourceAwareLoggerInterface {
  trace: (msg: string, ...args: unknown[]) => void;
  debug: (msg: string, ...args: unknown[]) => void;
  info: (msg: string, ...args: unknown[]) => void;
  warn: (msg: string, ...args: unknown[]) => void;
  error: (msg: string, ...args: unknown[]) => void;
  fatal: (msg: string, ...args: unknown[]) => void;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  source?: string;
  timestamp: Date;
  args?: unknown[];
}

export interface LoggerOptions {
  /** Environment (development, production, etc.) */
  env?: string;
  /** Minimum log level to output */
  minLevel?: LogLevel;
  /** Sources to disable by default */
  disabledSources?: string[];
  /** Whether to include timestamps in console output */
  includeTimestamp?: boolean;
  /** Whether to include source names in console output */
  includeSource?: boolean;
  /** Custom formatter for log messages */
  formatter?: (entry: LogEntry) => string;
  /** Remote logging endpoint */
  remoteEndpoint?: string;
}