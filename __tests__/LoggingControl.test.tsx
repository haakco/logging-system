import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { LoggingControl } from '../components/LoggingControl';
import { loggingSlice } from '../store/loggingReducer';

// Mock Mantine components
vi.mock('@mantine/core', () => ({
  Box: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Title: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  Switch: ({ label, checked, onChange, ...props }: any) => (
    <label {...props}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
        data-testid={props['data-testid']}
      />
      {label}
    </label>
  ),
  Select: ({ label, value, onChange, data, ...props }: any) => (
    <label {...props}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        data-testid={props['data-testid']}
      >
        {data?.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  ),
  MultiSelect: ({ label, value, onChange, data, ...props }: any) => (
    <label {...props}>
      {label}
      <select
        multiple
        value={value}
        onChange={(e) => {
          const selectedValues = Array.from(e.target.selectedOptions).map(
            (option: any) => option.value
          );
          onChange?.(selectedValues);
        }}
        data-testid={props['data-testid']}
      >
        {data?.map((item: any) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  ),
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Group: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  Stack: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

describe('LoggingControl Component', () => {
  let store: any;

  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        logging: loggingSlice.reducer,
      },
      preloadedState: {
        logging: {
          isGloballyDisabled: false,
          currentLogLevel: 'info',
          disabledSources: [],
          discoveredSources: ['Component1', 'Component2', 'Component3'],
          ...initialState,
        },
      },
    });
  };

  const renderWithProvider = (component: React.ReactElement, storeInstance = store) => {
    return render(
      <Provider store={storeInstance}>
        {component}
      </Provider>
    );
  };

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Rendering', () => {
    it('should render logging control panel', () => {
      renderWithProvider(<LoggingControl />);
      
      expect(screen.getByText('Logging Controls')).toBeInTheDocument();
      expect(screen.getByText('Enable Global Logging')).toBeInTheDocument();
      expect(screen.getByText('Log Level')).toBeInTheDocument();
      expect(screen.getByText('Disabled Sources')).toBeInTheDocument();
    });

    it('should render with correct initial state', () => {
      renderWithProvider(<LoggingControl />);
      
      const globalSwitch = screen.getByTestId('global-logging-switch');
      const logLevelSelect = screen.getByTestId('log-level-select');
      
      expect(globalSwitch).toBeChecked();
      expect(logLevelSelect).toHaveValue('info');
    });

    it('should show discovered sources in multiselect', () => {
      renderWithProvider(<LoggingControl />);
      
      const sourcesSelect = screen.getByTestId('disabled-sources-select');
      expect(sourcesSelect).toBeInTheDocument();
      
      // Check that options are available
      expect(screen.getByText('Component1')).toBeInTheDocument();
      expect(screen.getByText('Component2')).toBeInTheDocument();
      expect(screen.getByText('Component3')).toBeInTheDocument();
    });
  });

  describe('Global Logging Toggle', () => {
    it('should dispatch toggleGlobalLogging when switch is clicked', () => {
      const testStore = createTestStore({ isGloballyDisabled: false });
      const dispatchSpy = vi.spyOn(testStore, 'dispatch');
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const globalSwitch = screen.getByTestId('global-logging-switch');
      fireEvent.click(globalSwitch);
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'logging/toggleGlobalLogging',
        })
      );
    });

    it('should reflect disabled state when globally disabled', () => {
      const testStore = createTestStore({ isGloballyDisabled: true });
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const globalSwitch = screen.getByTestId('global-logging-switch');
      expect(globalSwitch).not.toBeChecked();
    });
  });

  describe('Log Level Selection', () => {
    it('should dispatch setLogLevel when level is changed', () => {
      const testStore = createTestStore();
      const dispatchSpy = vi.spyOn(testStore, 'dispatch');
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const logLevelSelect = screen.getByTestId('log-level-select');
      fireEvent.change(logLevelSelect, { target: { value: 'debug' } });
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'logging/setLogLevel',
          payload: 'debug',
        })
      );
    });

    it('should show all available log levels', () => {
      renderWithProvider(<LoggingControl />);
      
      const logLevelSelect = screen.getByTestId('log-level-select');
      
      // Check that all log levels are available as options
      expect(screen.getByDisplayValue('info')).toBeInTheDocument();
      
      // Check individual options exist
      const options = logLevelSelect.querySelectorAll('option');
      const optionValues = Array.from(options).map((opt: any) => opt.value);
      
      expect(optionValues).toContain('trace');
      expect(optionValues).toContain('debug');
      expect(optionValues).toContain('info');
      expect(optionValues).toContain('warn');
      expect(optionValues).toContain('error');
      expect(optionValues).toContain('fatal');
    });
  });

  describe('Source Filtering', () => {
    it('should dispatch toggleSourceDisabled when sources are selected/deselected', () => {
      const testStore = createTestStore();
      const dispatchSpy = vi.spyOn(testStore, 'dispatch');
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const sourcesSelect = screen.getByTestId('disabled-sources-select');
      
      // Select Component1
      fireEvent.change(sourcesSelect, {
        target: {
          selectedOptions: [{ value: 'Component1' }],
        },
      });
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'logging/setDisabledSources',
          payload: ['Component1'],
        })
      );
    });

    it('should show currently disabled sources as selected', () => {
      const testStore = createTestStore({
        disabledSources: ['Component1', 'Component2'],
      });
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const sourcesSelect = screen.getByTestId('disabled-sources-select');
      expect(sourcesSelect.value).toContain('Component1');
      expect(sourcesSelect.value).toContain('Component2');
    });
  });

  describe('Clear History Button', () => {
    it('should dispatch clearHistory when clear button is clicked', () => {
      const testStore = createTestStore();
      const dispatchSpy = vi.spyOn(testStore, 'dispatch');
      
      renderWithProvider(<LoggingControl />);
      
      const clearButton = screen.getByText('Clear Log History');
      fireEvent.click(clearButton);
      
      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'logging/clearHistory',
        })
      );
    });
  });

  describe('Responsive Behavior', () => {
    it('should handle empty discovered sources gracefully', () => {
      const testStore = createTestStore({ discoveredSources: [] });
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const sourcesSelect = screen.getByTestId('disabled-sources-select');
      expect(sourcesSelect).toBeInTheDocument();
      
      // Should not have any options
      const options = sourcesSelect.querySelectorAll('option');
      expect(options).toHaveLength(0);
    });

    it('should handle undefined log level gracefully', () => {
      const testStore = createTestStore({ currentLogLevel: undefined });
      
      renderWithProvider(<LoggingControl />, testStore);
      
      const logLevelSelect = screen.getByTestId('log-level-select');
      expect(logLevelSelect).toBeInTheDocument();
    });
  });

  describe('Integration with Store', () => {
    it('should update when store state changes', () => {
      const testStore = createTestStore({ isGloballyDisabled: false });
      
      renderWithProvider(<LoggingControl />, testStore);
      
      let globalSwitch = screen.getByTestId('global-logging-switch');
      expect(globalSwitch).toBeChecked();
      
      // Dispatch action to change state
      testStore.dispatch(loggingSlice.actions.toggleGlobalLogging());
      
      // Component should reflect the change
      globalSwitch = screen.getByTestId('global-logging-switch');
      expect(globalSwitch).not.toBeChecked();
    });

    it('should reflect new discovered sources when they are added', () => {
      const testStore = createTestStore({ discoveredSources: ['Component1'] });
      
      renderWithProvider(<LoggingControl />, testStore);
      
      // Initially only Component1
      expect(screen.getByText('Component1')).toBeInTheDocument();
      expect(screen.queryByText('NewComponent')).not.toBeInTheDocument();
      
      // Add new discovered source
      testStore.dispatch(loggingSlice.actions.addDiscoveredSource('NewComponent'));
      
      // Should now appear in the list
      expect(screen.getByText('NewComponent')).toBeInTheDocument();
    });
  });
});