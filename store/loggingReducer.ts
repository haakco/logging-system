import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { LoggingState } from '../types';

const initialState: LoggingState = {
  disabledSources: [],
  isGloballyDisabled: true, // Start with logging disabled by default
  discoveredSources: [], // Track all sources that have attempted to log
};

const loggingSlice = createSlice({
  name: 'logging',
  initialState,
  reducers: {
    toggleSourceLogging: (state, action: PayloadAction<string>) => {
      const source = action.payload;
      const index = state.disabledSources.indexOf(source);

      if (index === -1) {
        state.disabledSources.push(source);
      } else {
        state.disabledSources.splice(index, 1);
      }
    },
    setSourceLogging: (state, action: PayloadAction<{ source: string; disabled: boolean }>) => {
      const { source, disabled } = action.payload;
      const index = state.disabledSources.indexOf(source);

      if (disabled && index === -1) {
        state.disabledSources.push(source);
      } else if (!disabled && index !== -1) {
        state.disabledSources.splice(index, 1);
      }
    },
    toggleGlobalLogging: (state) => {
      state.isGloballyDisabled = !state.isGloballyDisabled;
    },
    setGlobalLogging: (state, action: PayloadAction<boolean>) => {
      state.isGloballyDisabled = action.payload;
    },
    resetLoggingSettings: (state) => {
      state.disabledSources = [];
      state.isGloballyDisabled = false;
      // Keep discovered sources
    },
    addDiscoveredSource: (state, action: PayloadAction<string>) => {
      const source = action.payload;
      // Ensure discoveredSources is initialized
      if (!state.discoveredSources) {
        state.discoveredSources = [];
      }
      if (!state.discoveredSources.includes(source)) {
        state.discoveredSources.push(source);
        state.discoveredSources.sort(); // Keep sorted for better UI
      }
    },
    enableAllSources: (state) => {
      state.disabledSources = [];
    },
    disableAllSources: (state) => {
      state.disabledSources = [...state.discoveredSources];
    },
    setLogLevel: (state, action: PayloadAction<string>) => {
      // Store log level in state for persistence
      (state as any).logLevel = action.payload;
    },
  },
});

export const {
  toggleSourceLogging,
  setSourceLogging,
  toggleGlobalLogging,
  setGlobalLogging,
  resetLoggingSettings,
  addDiscoveredSource,
  enableAllSources,
  disableAllSources,
  setLogLevel,
} = loggingSlice.actions;

// Base selectors
const selectLoggingState = (state: { logging?: LoggingState }) => state.logging;

// Memoized selectors to prevent unnecessary re-renders
export const selectDisabledLogSources = createSelector(
  [selectLoggingState],
  (logging) => logging?.disabledSources || [],
);

export const selectIsGlobalLoggingDisabled = createSelector(
  [selectLoggingState],
  (logging) => logging?.isGloballyDisabled ?? true, // Default to disabled
);

export const selectDiscoveredSources = createSelector(
  [selectLoggingState],
  (logging) => logging?.discoveredSources || [],
);

export const selectLogLevel = createSelector(
  [selectLoggingState],
  (logging) => (logging as any)?.logLevel || 'info',
);

// Parameterized selector for checking if a specific source is disabled
export const selectIsSourceLoggingDisabled = (source: string) =>
  createSelector(
    [selectDisabledLogSources, selectIsGlobalLoggingDisabled],
    (disabledSources, isGloballyDisabled) => disabledSources.includes(source) || isGloballyDisabled,
  );

// Selector for logging statistics
export const selectLoggingStats = createSelector(
  [selectDiscoveredSources, selectDisabledLogSources, selectIsGlobalLoggingDisabled],
  (discoveredSources, disabledSources, isGloballyDisabled) => ({
    totalSources: discoveredSources.length,
    enabledSources: isGloballyDisabled ? 0 : discoveredSources.length - disabledSources.length,
    disabledSources: isGloballyDisabled ? discoveredSources.length : disabledSources.length,
    isGloballyDisabled,
  }),
);

export default loggingSlice.reducer;