/**
 * @haakco/logging-system
 * 
 * Comprehensive logging framework with UI controls, Redux integration, and multiple log levels
 * extracted from CourierBoost platform.
 */

// Core logger
export {
  SourceAwareLogger,
  logger,
  log,
  setLoggerStore,
} from './core/Logger';

// Redux store integration
export {
  toggleSourceLogging,
  setSourceLogging,
  toggleGlobalLogging,
  setGlobalLogging,
  resetLoggingSettings,
  addDiscoveredSource,
  enableAllSources,
  disableAllSources,
  setLogLevel,
  selectDisabledLogSources,
  selectIsGlobalLoggingDisabled,
  selectDiscoveredSources,
  selectLogLevel,
  selectIsSourceLoggingDisabled,
  selectLoggingStats,
} from './store/loggingReducer';

// React components
export {
  LoggingControl,
  type LoggingControlProps,
  type ReduxHooks,
} from './components/LoggingControl';

// Types
export type {
  LoggingState,
  StoreState,
  LoggerConfig,
  LoggerStore,
  LogLevel,
  SourceAwareLoggerInterface,
  LogEntry,
  LoggerOptions,
} from './types';

// Default export
export { default } from './core/Logger';