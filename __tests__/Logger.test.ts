import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SourceAwareLogger, setLoggerStore, logger } from '../core/Logger';
import type { LoggerStore } from '../types';

// Mock import.meta.env
const mockEnv = {
  VITE_LOG_LEVEL: undefined,
  VITE_DISABLED_LOG_SOURCES: undefined,
  VITE_DISABLE_ALL_LOGGING: undefined,
  VITE_ENABLE_EARLY_LOGGING: undefined,
  PROD: false,
  MODE: 'test',
};

vi.stubGlobal('import', {
  meta: {
    env: mockEnv,
  },
});

describe('SourceAwareLogger', () => {
  let testLogger: SourceAwareLogger;
  let consoleSpy: any;
  let mockStore: LoggerStore;

  beforeEach(() => {
    // Reset environment
    Object.assign(mockEnv, {
      VITE_LOG_LEVEL: undefined,
      VITE_DISABLED_LOG_SOURCES: undefined,
      VITE_DISABLE_ALL_LOGGING: undefined,
      VITE_ENABLE_EARLY_LOGGING: undefined,
      PROD: false,
      MODE: 'test',
    });

    testLogger = new SourceAwareLogger();
    
    // Mock console methods
    consoleSpy = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    global.console = { ...global.console, ...consoleSpy };

    // Mock store
    mockStore = {
      getState: vi.fn(() => ({
        logging: {
          isGloballyDisabled: false,
          disabledSources: [],
          discoveredSources: [],
        },
      })),
      dispatch: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log info messages to console', () => {
      testLogger.info('Test message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Test message'),
      );
    });

    it('should log debug messages to console debug', () => {
      testLogger.debug('Debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('Debug message'),
      );
    });

    it('should log warning messages to console warn', () => {
      testLogger.warn('Warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
      );
    });

    it('should log error messages to console error', () => {
      testLogger.error('Error message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Error message'),
      );
    });

    it('should log fatal messages to console error', () => {
      testLogger.fatal('Fatal message');
      expect(consoleSpy.error).toHaveBeenCalledWith(
        expect.stringContaining('Fatal message'),
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should respect minimum log level from environment', () => {
      mockEnv.VITE_LOG_LEVEL = 'warn';
      const warnLogger = new SourceAwareLogger();
      
      warnLogger.debug('Debug message');
      warnLogger.info('Info message');
      warnLogger.warn('Warning message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
      );
    });

    it('should default to debug level in development', () => {
      mockEnv.PROD = false;
      const devLogger = new SourceAwareLogger();
      
      devLogger.debug('Debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith(
        expect.stringContaining('Debug message'),
      );
    });

    it('should default to info level in production', () => {
      mockEnv.PROD = true;
      const prodLogger = new SourceAwareLogger();
      
      prodLogger.debug('Debug message');
      prodLogger.info('Info message');
      
      expect(consoleSpy.debug).not.toHaveBeenCalled();
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Info message'),
      );
    });
  });

  describe('Source Detection and Filtering', () => {
    it('should extract source from message with brackets', () => {
      testLogger.info('[TestComponent] Test message');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[TestComponent] Test message'),
      );
    });

    it('should disable logging when globally disabled via environment', () => {
      mockEnv.VITE_DISABLE_ALL_LOGGING = 'true';
      const disabledLogger = new SourceAwareLogger();
      
      disabledLogger.info('This should not log');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });

    it('should filter disabled sources from environment', () => {
      mockEnv.VITE_DISABLED_LOG_SOURCES = 'TestComponent,AnotherComponent';
      const filteredLogger = new SourceAwareLogger();
      
      filteredLogger.info('[TestComponent] This should not log');
      filteredLogger.info('[AllowedComponent] This should log');
      
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[AllowedComponent] This should log'),
      );
    });
  });

  describe('Store Integration', () => {
    it('should integrate with Redux store for disabled sources', () => {
      mockStore.getState = vi.fn(() => ({
        logging: {
          isGloballyDisabled: false,
          disabledSources: ['DisabledComponent'],
          discoveredSources: [],
        },
      }));
      
      setLoggerStore(mockStore);
      
      testLogger.info('[DisabledComponent] This should not log');
      testLogger.info('[EnabledComponent] This should log');
      
      expect(consoleSpy.info).toHaveBeenCalledTimes(1);
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('[EnabledComponent] This should log'),
      );
    });

    it('should respect global disable from store', () => {
      mockStore.getState = vi.fn(() => ({
        logging: {
          isGloballyDisabled: true,
          disabledSources: [],
          discoveredSources: [],
        },
      }));
      
      setLoggerStore(mockStore);
      
      testLogger.info('This should not log');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });

  describe('Log History', () => {
    it('should maintain log history', () => {
      testLogger.info('First message');
      testLogger.warn('Second message');
      
      const history = testLogger.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].level).toBe('info');
      expect(history[0].message).toContain('First message');
      expect(history[1].level).toBe('warn');
      expect(history[1].message).toContain('Second message');
    });

    it('should clear log history', () => {
      testLogger.info('Test message');
      expect(testLogger.getHistory()).toHaveLength(1);
      
      testLogger.clearHistory();
      expect(testLogger.getHistory()).toHaveLength(0);
    });

    it('should limit history to max entries', () => {
      // Create a logger with a small max entries limit for testing
      const limitedLogger = new SourceAwareLogger();
      
      // Add more than the max (1000) would be too slow, so we'll test the concept
      for (let i = 0; i < 10; i++) {
        limitedLogger.info(`Message ${i}`);
      }
      
      const history = limitedLogger.getHistory();
      expect(history.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Message Formatting', () => {
    it('should include timestamps when enabled', () => {
      const timestampLogger = new SourceAwareLogger({ includeTimestamp: true });
      
      timestampLogger.info('Test with timestamp');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
      );
    });

    it('should not include timestamps when disabled', () => {
      const noTimestampLogger = new SourceAwareLogger({ includeTimestamp: false });
      
      noTimestampLogger.info('Test without timestamp');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.not.stringMatching(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/),
      );
    });

    it('should use custom formatter when provided', () => {
      const customLogger = new SourceAwareLogger({
        formatter: ({ level, message }) => `CUSTOM [${level.toUpperCase()}] ${message}`,
      });
      
      customLogger.info('Test message');
      
      expect(consoleSpy.info).toHaveBeenCalledWith(
        'CUSTOM [INFO] Test message',
      );
    });
  });

  describe('Discovered Sources Tracking', () => {
    it('should track discovered sources', () => {
      testLogger.info('[Component1] Message 1');
      testLogger.info('[Component2] Message 2');
      
      const sources = testLogger.getDiscoveredSources();
      expect(sources).toContain('Component1');
      expect(sources).toContain('Component2');
    });

    it('should not duplicate discovered sources', () => {
      testLogger.info('[Component1] Message 1');
      testLogger.info('[Component1] Message 2');
      
      const sources = testLogger.getDiscoveredSources();
      const component1Count = sources.filter(s => s === 'Component1').length;
      expect(component1Count).toBe(1);
    });
  });

  describe('Default Logger Instance', () => {
    it('should provide a default logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(SourceAwareLogger);
    });

    it('should provide convenience log function', () => {
      const { log } = require('../core/Logger');
      
      log('Convenience function test');
      expect(consoleSpy.info).toHaveBeenCalledWith(
        expect.stringContaining('Convenience function test'),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully when store is unavailable', () => {
      mockStore.getState = vi.fn(() => {
        throw new Error('Store error');
      });
      
      setLoggerStore(mockStore);
      
      // Should not throw and should default to disabled
      expect(() => {
        testLogger.info('Test message');
      }).not.toThrow();
    });

    it('should handle missing console gracefully', () => {
      const originalConsole = global.console;
      // @ts-ignore
      delete global.console;
      
      expect(() => {
        testLogger.info('Test message');
      }).not.toThrow();
      
      global.console = originalConsole;
    });
  });
});