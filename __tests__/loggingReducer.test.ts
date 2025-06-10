import { describe, it, expect } from 'vitest';
import { loggingSlice, initialState } from '../store/loggingReducer';
import type { LoggingState } from '../types';

const {
  toggleGlobalLogging,
  setLogLevel,
  addDiscoveredSource,
  toggleSourceDisabled,
  setDisabledSources,
  clearHistory,
} = loggingSlice.actions;

describe('loggingReducer', () => {
  describe('initial state', () => {
    it('should have correct initial state', () => {
      expect(initialState).toEqual({
        isGloballyDisabled: false,
        currentLogLevel: 'info',
        disabledSources: [],
        discoveredSources: [],
      });
    });
  });

  describe('toggleGlobalLogging', () => {
    it('should toggle global logging from false to true', () => {
      const state: LoggingState = {
        ...initialState,
        isGloballyDisabled: false,
      };

      const action = toggleGlobalLogging();
      const newState = loggingSlice.reducer(state, action);

      expect(newState.isGloballyDisabled).toBe(true);
    });

    it('should toggle global logging from true to false', () => {
      const state: LoggingState = {
        ...initialState,
        isGloballyDisabled: true,
      };

      const action = toggleGlobalLogging();
      const newState = loggingSlice.reducer(state, action);

      expect(newState.isGloballyDisabled).toBe(false);
    });
  });

  describe('setLogLevel', () => {
    it('should set log level to debug', () => {
      const action = setLogLevel('debug');
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.currentLogLevel).toBe('debug');
    });

    it('should set log level to error', () => {
      const action = setLogLevel('error');
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.currentLogLevel).toBe('error');
    });

    it('should handle all valid log levels', () => {
      const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const;

      validLevels.forEach((level) => {
        const action = setLogLevel(level);
        const newState = loggingSlice.reducer(initialState, action);
        expect(newState.currentLogLevel).toBe(level);
      });
    });
  });

  describe('addDiscoveredSource', () => {
    it('should add a new discovered source', () => {
      const action = addDiscoveredSource('TestComponent');
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.discoveredSources).toContain('TestComponent');
      expect(newState.discoveredSources).toHaveLength(1);
    });

    it('should not add duplicate discovered sources', () => {
      const state: LoggingState = {
        ...initialState,
        discoveredSources: ['TestComponent'],
      };

      const action = addDiscoveredSource('TestComponent');
      const newState = loggingSlice.reducer(state, action);

      expect(newState.discoveredSources).toEqual(['TestComponent']);
      expect(newState.discoveredSources).toHaveLength(1);
    });

    it('should add multiple different sources', () => {
      let state = initialState;

      const action1 = addDiscoveredSource('Component1');
      state = loggingSlice.reducer(state, action1);

      const action2 = addDiscoveredSource('Component2');
      state = loggingSlice.reducer(state, action2);

      expect(state.discoveredSources).toContain('Component1');
      expect(state.discoveredSources).toContain('Component2');
      expect(state.discoveredSources).toHaveLength(2);
    });

    it('should maintain source order', () => {
      let state = initialState;

      const sources = ['ComponentA', 'ComponentB', 'ComponentC'];
      sources.forEach((source) => {
        const action = addDiscoveredSource(source);
        state = loggingSlice.reducer(state, action);
      });

      expect(state.discoveredSources).toEqual(sources);
    });
  });

  describe('toggleSourceDisabled', () => {
    it('should add source to disabled list when not present', () => {
      const action = toggleSourceDisabled('TestComponent');
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.disabledSources).toContain('TestComponent');
      expect(newState.disabledSources).toHaveLength(1);
    });

    it('should remove source from disabled list when present', () => {
      const state: LoggingState = {
        ...initialState,
        disabledSources: ['TestComponent'],
      };

      const action = toggleSourceDisabled('TestComponent');
      const newState = loggingSlice.reducer(state, action);

      expect(newState.disabledSources).not.toContain('TestComponent');
      expect(newState.disabledSources).toHaveLength(0);
    });

    it('should only affect the specified source', () => {
      const state: LoggingState = {
        ...initialState,
        disabledSources: ['Component1', 'Component2'],
      };

      const action = toggleSourceDisabled('Component1');
      const newState = loggingSlice.reducer(state, action);

      expect(newState.disabledSources).not.toContain('Component1');
      expect(newState.disabledSources).toContain('Component2');
      expect(newState.disabledSources).toHaveLength(1);
    });
  });

  describe('setDisabledSources', () => {
    it('should set disabled sources array', () => {
      const sources = ['Component1', 'Component2', 'Component3'];
      const action = setDisabledSources(sources);
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.disabledSources).toEqual(sources);
    });

    it('should replace existing disabled sources', () => {
      const state: LoggingState = {
        ...initialState,
        disabledSources: ['OldComponent1', 'OldComponent2'],
      };

      const newSources = ['NewComponent1', 'NewComponent2'];
      const action = setDisabledSources(newSources);
      const newState = loggingSlice.reducer(state, action);

      expect(newState.disabledSources).toEqual(newSources);
      expect(newState.disabledSources).not.toContain('OldComponent1');
      expect(newState.disabledSources).not.toContain('OldComponent2');
    });

    it('should handle empty array', () => {
      const state: LoggingState = {
        ...initialState,
        disabledSources: ['Component1', 'Component2'],
      };

      const action = setDisabledSources([]);
      const newState = loggingSlice.reducer(state, action);

      expect(newState.disabledSources).toEqual([]);
    });
  });

  describe('clearHistory', () => {
    it('should clear history when called', () => {
      const action = clearHistory();
      const newState = loggingSlice.reducer(initialState, action);

      // The reducer doesn't actually maintain history state,
      // but we test that the action doesn't break anything
      expect(newState).toEqual(initialState);
    });

    it('should not affect other state properties', () => {
      const state: LoggingState = {
        isGloballyDisabled: true,
        currentLogLevel: 'debug',
        disabledSources: ['Component1'],
        discoveredSources: ['Component1', 'Component2'],
      };

      const action = clearHistory();
      const newState = loggingSlice.reducer(state, action);

      expect(newState.isGloballyDisabled).toBe(true);
      expect(newState.currentLogLevel).toBe('debug');
      expect(newState.disabledSources).toEqual(['Component1']);
      expect(newState.discoveredSources).toEqual(['Component1', 'Component2']);
    });
  });

  describe('complex state transitions', () => {
    it('should handle multiple actions in sequence', () => {
      let state = initialState;

      // Add discovered sources
      state = loggingSlice.reducer(state, addDiscoveredSource('Component1'));
      state = loggingSlice.reducer(state, addDiscoveredSource('Component2'));

      // Disable one source
      state = loggingSlice.reducer(state, toggleSourceDisabled('Component1'));

      // Change log level
      state = loggingSlice.reducer(state, setLogLevel('debug'));

      // Toggle global logging
      state = loggingSlice.reducer(state, toggleGlobalLogging());

      expect(state).toEqual({
        isGloballyDisabled: true,
        currentLogLevel: 'debug',
        disabledSources: ['Component1'],
        discoveredSources: ['Component1', 'Component2'],
      });
    });

    it('should maintain immutability', () => {
      const originalState = {
        ...initialState,
        discoveredSources: ['Component1'],
        disabledSources: ['Component2'],
      };

      const action = addDiscoveredSource('Component3');
      const newState = loggingSlice.reducer(originalState, action);

      // Original state should not be mutated
      expect(originalState.discoveredSources).toEqual(['Component1']);
      expect(newState.discoveredSources).toEqual(['Component1', 'Component3']);
      expect(originalState !== newState).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined payload gracefully', () => {
      expect(() => {
        // @ts-ignore - Testing runtime behavior
        loggingSlice.reducer(initialState, { type: 'logging/addDiscoveredSource' });
      }).not.toThrow();
    });

    it('should handle empty string source names', () => {
      const action = addDiscoveredSource('');
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.discoveredSources).toContain('');
    });

    it('should handle special characters in source names', () => {
      const specialSource = 'Component-With_Special.Characters@123';
      const action = addDiscoveredSource(specialSource);
      const newState = loggingSlice.reducer(initialState, action);

      expect(newState.discoveredSources).toContain(specialSource);
    });
  });
});