# @haakco/logging-system

> Comprehensive logging framework with UI controls, Redux integration, and multiple log levels

A production-tested logging system extracted from the CourierBoost platform, providing sophisticated source-aware logging with React UI components, Redux state management, and dynamic configuration.

## Features

- **Source-Aware Logging**: Automatically detects and filters logs by component/source
- **Redux Integration**: Full state management for logging configuration
- **React UI Components**: Ready-to-use logging control panels
- **Multiple Log Levels**: trace, debug, info, warn, error, fatal
- **Dynamic Filtering**: Enable/disable logging for specific sources at runtime
- **Performance Optimized**: Efficient caching and minimal overhead when disabled
- **Environment Aware**: Different defaults for development vs production
- **Log History**: In-memory log storage with configurable limits
- **TypeScript Support**: Full type safety and excellent IntelliSense

## Installation

```bash
npm install @haakco/logging-system
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react @reduxjs/toolkit @mantine/core @mantine/hooks
```

## Quick Start

### 1. Basic Setup

```typescript
import { logger, setLoggerStore } from '@haakco/logging-system';
import { store } from './store'; // Your Redux store

// Connect the logger to your Redux store
setLoggerStore(store);

// Start logging
logger.info('Application started');
logger.debug('[UserComponent] User data loaded');
```

### 2. Redux Store Configuration

Add the logging reducer to your store:

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { loggingSlice } from '@haakco/logging-system/store';

export const store = configureStore({
  reducer: {
    logging: loggingSlice.reducer,
    // ... your other reducers
  },
});
```

### 3. React UI Component

Add the logging control panel to your app:

```typescript
import { LoggingControl } from '@haakco/logging-system/components';

function DebugPanel() {
  return (
    <div>
      <LoggingControl />
    </div>
  );
}
```

## Core API

### Logger Instance

The main logger provides methods for all log levels:

```typescript
import { logger } from '@haakco/logging-system';

// Log levels (in order of severity)
logger.trace('Detailed trace information');
logger.debug('Debug information');
logger.info('General information');
logger.warn('Warning messages');
logger.error('Error conditions');
logger.fatal('Critical errors');

// Source-aware logging (automatically detects calling component)
logger.info('This will show the component name');

// Explicit source specification
logger.info('[MyComponent] Explicit source naming');

// With additional data
logger.error('API call failed', { url: '/api/users', status: 500 });
```

### Custom Logger Instance

Create custom logger instances with specific configurations:

```typescript
import { SourceAwareLogger } from '@haakco/logging-system/core';

const customLogger = new SourceAwareLogger({
  minLevel: 'warn',
  includeTimestamp: false,
  includeSource: true,
  formatter: ({ level, message, timestamp }) => {
    return `[${level.toUpperCase()}] ${message}`;
  },
});
```

### Logger Options

```typescript
interface LoggerOptions {
  env?: string;                    // Environment (defaults to import.meta.env.MODE)
  minLevel?: LogLevel;             // Minimum log level to display
  disabledSources?: string[];      // Sources to disable
  includeTimestamp?: boolean;      // Include timestamps (default: true)
  includeSource?: boolean;         // Include source detection (default: true)
  formatter?: CustomFormatter;     // Custom message formatter
}
```

## Redux Integration

### State Structure

```typescript
interface LoggingState {
  isGloballyDisabled: boolean;     // Global logging on/off
  currentLogLevel: LogLevel;       // Current minimum log level
  disabledSources: string[];       // List of disabled sources
  discoveredSources: string[];     // Auto-discovered logging sources
}
```

### Actions

```typescript
import { loggingSlice } from '@haakco/logging-system/store';

const {
  toggleGlobalLogging,
  setLogLevel,
  addDiscoveredSource,
  toggleSourceDisabled,
  setDisabledSources,
  clearHistory,
} = loggingSlice.actions;

// Usage in components
dispatch(toggleGlobalLogging());
dispatch(setLogLevel('debug'));
dispatch(setDisabledSources(['Component1', 'Component2']));
```

## Environment Configuration

Control logging behavior through environment variables:

```bash
# Set minimum log level
VITE_LOG_LEVEL=debug

# Disable specific sources
VITE_DISABLED_LOG_SOURCES=Component1,Component2,Component3

# Disable all logging
VITE_DISABLE_ALL_LOGGING=true

# Enable early logging (before store connection)
VITE_ENABLE_EARLY_LOGGING=true
```

## React Components

### LoggingControl

A complete control panel for managing logging settings:

```typescript
import { LoggingControl } from '@haakco/logging-system/components';

function DevTools() {
  return (
    <div>
      <h2>Development Tools</h2>
      <LoggingControl />
    </div>
  );
}
```

The component provides:
- Global logging toggle
- Log level selection
- Source filtering (multi-select)
- Clear log history button

## Advanced Features

### Log History

Access in-memory log history:

```typescript
// Get log history
const history = logger.getHistory();
console.log(`Total logs: ${history.length}`);

// Clear history
logger.clearHistory();

// History entries structure
interface LogEntry {
  level: LogLevel;
  message: string;
  source?: string;
  timestamp: Date;
  args?: unknown[];
}
```

### Source Discovery

The logger automatically discovers and tracks logging sources:

```typescript
// Get all discovered sources
const sources = logger.getDiscoveredSources();
console.log('Discovered sources:', sources);

// Sources are automatically tracked when logging
logger.info('[NewComponent] This will add NewComponent to discovered sources');
```

### Custom Formatting

Provide custom log formatting:

```typescript
const logger = new SourceAwareLogger({
  formatter: ({ level, message, timestamp, args }) => {
    const time = timestamp.toISOString().split('T')[1].split('.')[0];
    const argsStr = args?.length ? ` ${JSON.stringify(args)}` : '';
    return `${time} [${level.toUpperCase()}] ${message}${argsStr}`;
  },
});
```

## Best Practices

### 1. Source Naming

Use consistent source naming for better filtering:

```typescript
// Good: Consistent bracket notation
logger.info('[UserService] User authenticated');
logger.debug('[UserService] Fetching user profile');

// Good: Component-based sources
logger.info('[UserProfile] Component mounted');
logger.warn('[UserProfile] Missing user data');
```

### 2. Log Levels

Use appropriate log levels:

```typescript
// TRACE: Very detailed information, typically only for debugging
logger.trace('[UserService] Entering authenticateUser method');

// DEBUG: Detailed information for debugging
logger.debug('[UserService] Validating credentials');

// INFO: General operational messages
logger.info('[UserService] User login successful');

// WARN: Warning conditions that don't stop execution
logger.warn('[UserService] Password will expire in 3 days');

// ERROR: Error conditions that might affect functionality
logger.error('[UserService] Authentication failed', { reason: 'invalid_password' });

// FATAL: Critical errors that might stop the application
logger.fatal('[UserService] Database connection lost');
```

### 3. Production Configuration

For production environments:

```typescript
// Set conservative defaults
const productionLogger = new SourceAwareLogger({
  minLevel: 'warn',           // Only warnings and errors
  includeTimestamp: true,     // Always include timestamps in production
  includeSource: false,       // Reduce overhead by disabling source detection
});
```

### 4. Development Debugging

For development:

```typescript
// Enable verbose logging in development
if (import.meta.env.DEV) {
  logger.debug('[App] Development mode - verbose logging enabled');
  // All log levels will be shown based on environment defaults
}
```

## Performance Considerations

- **Disabled Sources**: When sources are disabled, logging calls are fast-rejected with minimal overhead
- **Global Disable**: When globally disabled, all logging is bypassed immediately
- **Source Detection**: Automatic source detection uses stack traces, which has some performance cost
- **History Limit**: Log history is automatically trimmed to prevent memory leaks (default: 1000 entries)

## Browser Support

- Modern browsers with ES2020 support
- React 18+
- TypeScript 5.0+

## Contributing

1. Clone the repository
2. Install dependencies: `npm install`
3. Run tests: `npm test`
4. Run linting: `npm run lint`
5. Build: `npm run build`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Related Packages

- [`@haakco/api-client-interceptors`](../api-client-interceptors) - HTTP client with interceptors
- [`@haakco/api-schemas`](../api-schemas) - Zod validation schemas
- [`@haakco/debug-panel-react`](../debug-panel-react) - React debugging components

---

**Note**: This package is extracted from the CourierBoost platform and represents battle-tested patterns used in production applications.
