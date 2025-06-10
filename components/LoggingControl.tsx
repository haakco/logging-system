import { Switch, TextInput } from '@mantine/core';
import { useState } from 'react';

import {
  resetLoggingSettings,
  selectDisabledLogSources,
  selectDiscoveredSources,
  selectIsGlobalLoggingDisabled,
  selectLoggingStats,
  setGlobalLogging,
  setSourceLogging,
  enableAllSources,
  disableAllSources,
} from '../store/loggingReducer';
import type { StoreState } from '../types';

// Generic Redux hooks interface - make library independent of specific store implementation
export interface ReduxHooks {
  useAppDispatch: () => (action: unknown) => void;
  useAppSelector: <TSelected>(selector: (state: StoreState) => TSelected) => TSelected;
}

export interface LoggingControlProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  useAppDispatch: ReduxHooks['useAppDispatch'];
  useAppSelector: ReduxHooks['useAppSelector'];
  commonLogSources?: string[];
  theme?: 'light' | 'dark' | 'auto';
}

const DEFAULT_COMMON_LOG_SOURCES = [
  // Component logs
  'Dashboard',
  'UserProfile',
  'Navigation',
  'AuthGuard',
  'ErrorBoundary',

  // Redux reducer logs
  'authReducer',
  'userReducer',
  'appReducer',

  // API thunk logs
  'login.fulfilled',
  'logout.fulfilled',
  'getUserProfile.fulfilled',
  'updateProfile.fulfilled',

  // API validation logs
  'API Validation',
  'simpleApiValidator',
  'formValidation',

  // Performance logs
  'Performance',
  'NetworkMonitor',
  'ComponentRender',
];

/**
 * LoggingControl Component
 * 
 * Provides a UI for controlling application logging at both global and source-specific levels.
 * Integrates with Redux store to persist logging preferences.
 * 
 * @example
 * ```tsx
 * import { LoggingControl } from '@haakco/logging-system';
 * import { useAppDispatch, useAppSelector } from './store/hooks';
 * 
 * function App() {
 *   return (
 *     <>
 *       {/* Your app content *\/}
 *       <LoggingControl
 *         useAppDispatch={useAppDispatch}
 *         useAppSelector={useAppSelector}
 *         position="bottom-right"
 *         commonLogSources={['MyComponent', 'myReducer']}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function LoggingControl({
  enabled = import.meta.env.VITE_SHOW_LOGGING_CONTROLS === 'true',
  position = 'bottom-right',
  useAppDispatch,
  useAppSelector,
  commonLogSources = DEFAULT_COMMON_LOG_SOURCES,
  theme = 'auto',
}: LoggingControlProps) {
  const dispatch = useAppDispatch();
  const disabledSources = useAppSelector(selectDisabledLogSources);
  const isGloballyDisabled = useAppSelector(selectIsGlobalLoggingDisabled);
  const discoveredSources = useAppSelector(selectDiscoveredSources);
  const loggingStats = useAppSelector(selectLoggingStats);
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Don't render if not enabled or not in development
  if (!enabled || import.meta.env.PROD) {
    return null;
  }

  // Theme detection
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);

  const handleGlobalToggle = (checked: boolean) => {
    dispatch(setGlobalLogging(!checked)); // Inverted because switch shows "logging enabled"
  };

  const handleSourceToggle = (source: string, checked: boolean) => {
    dispatch(setSourceLogging({ source, disabled: !checked })); // Inverted because switch shows "logging enabled"
  };

  const handleReset = () => {
    dispatch(resetLoggingSettings());
  };

  const handleEnableAll = () => {
    dispatch(enableAllSources());
  };

  const handleDisableAll = () => {
    dispatch(disableAllSources());
  };

  const isSourceEnabled = (source: string) => {
    // Show the actual state of the source toggle, regardless of global state
    return !disabledSources.includes(source);
  };

  const globalLoggingEnabled = !isGloballyDisabled;

  const positionStyles = {
    'top-left': { top: '10px', left: '10px' },
    'top-right': { top: '10px', right: '10px' },
    'bottom-left': { bottom: '10px', left: '10px' },
    'bottom-right': { bottom: '10px', right: '10px' },
  };

  const baseStyles = positionStyles[position];

  // Theme styles
  const themeStyles = isDark ? {
    background: 'rgba(31, 41, 55, 0.9)',
    border: '1px solid #4b5563',
    color: '#f9fafb',
    expandedBackground: 'rgba(17, 24, 39, 0.95)',
    sectionBackground: '#1f2937',
    textMuted: '#9ca3af',
    buttonPrimary: '#3b82f6',
    buttonSecondary: '#6b7280',
    buttonSuccess: '#10b981',
    buttonDanger: '#ef4444',
  } : {
    background: 'rgba(75, 85, 99, 0.9)',
    border: '1px solid #374151',
    color: 'white',
    expandedBackground: 'rgba(255, 255, 255, 0.95)',
    sectionBackground: '#f9fafb',
    textMuted: '#6b7280',
    buttonPrimary: '#3b82f6',
    buttonSecondary: '#6b7280',
    buttonSuccess: '#10b981',
    buttonDanger: '#ef4444',
  };

  // Collapsed state
  if (!isExpanded) {
    return (
      <div
        style={{
          position: 'fixed',
          ...baseStyles,
          zIndex: 9998,
          backgroundColor: themeStyles.background,
          border: themeStyles.border,
          borderRadius: '8px',
          padding: '8px 12px',
          cursor: 'pointer',
          color: themeStyles.color,
          fontSize: '12px',
          fontFamily: 'system-ui, sans-serif',
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        }}
        onClick={() => setIsExpanded(true)}
        title={`Logging: ${globalLoggingEnabled ? 'Enabled' : 'Disabled'} (${loggingStats.enabledSources}/${loggingStats.totalSources} sources)`}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔧 Logs</span>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: globalLoggingEnabled ? '#10b981' : '#ef4444',
            }}
          />
          <span style={{ fontSize: '10px' }}>
            {loggingStats.enabledSources}/{loggingStats.totalSources}
          </span>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <div
      style={{
        position: 'fixed',
        ...baseStyles,
        zIndex: 9999,
        backgroundColor: themeStyles.expandedBackground,
        border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
        borderRadius: '8px',
        padding: '16px',
        maxHeight: '400px',
        maxWidth: '350px',
        overflow: 'auto',
        fontSize: '12px',
        fontFamily: 'system-ui, sans-serif',
        color: isDark ? '#f9fafb' : '#374151',
        backdropFilter: 'blur(8px)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>🔧 Logging Controls</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleReset}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              cursor: 'pointer',
              backgroundColor: themeStyles.buttonPrimary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}>
            Reset
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              cursor: 'pointer',
              backgroundColor: themeStyles.buttonSecondary,
              color: 'white',
              border: 'none',
              borderRadius: '4px',
            }}>
            ✕
          </button>
        </div>
      </div>

      {/* Global Toggle */}
      <div style={{ 
        marginBottom: '16px', 
        padding: '12px', 
        backgroundColor: themeStyles.sectionBackground, 
        borderRadius: '6px' 
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '500', marginBottom: '2px' }}>Global Logging</div>
            <div style={{ fontSize: '10px', color: themeStyles.textMuted }}>
              Enable/disable all console logs ({loggingStats.enabledSources}/{loggingStats.totalSources} sources)
            </div>
          </div>
          <Switch
            checked={globalLoggingEnabled}
            onChange={(event) => handleGlobalToggle(event.currentTarget.checked)}
            color="blue"
            size="sm"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '12px' }}>
        <TextInput
          placeholder="Search log sources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="xs"
          style={{ fontSize: '11px' }}
        />
      </div>

      {/* Individual Component Toggles */}
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h4
            style={{
              fontSize: '10px',
              fontWeight: '500',
              color: themeStyles.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}>
            Log Sources
          </h4>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={handleEnableAll}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                cursor: 'pointer',
                backgroundColor: themeStyles.buttonSuccess,
                color: 'white',
                border: 'none',
                borderRadius: '3px',
              }}>
              Enable All
            </button>
            <button
              onClick={handleDisableAll}
              style={{
                fontSize: '9px',
                padding: '2px 6px',
                cursor: 'pointer',
                backgroundColor: themeStyles.buttonDanger,
                color: 'white',
                border: 'none',
                borderRadius: '3px',
              }}>
              Disable All
            </button>
          </div>
        </div>

        {/* Combine common sources with discovered sources, remove duplicates */}
        {(() => {
          const allSources = [...new Set([...commonLogSources, ...(discoveredSources || [])])].sort();
          const filteredSources = searchQuery
            ? allSources.filter((source) => source.toLowerCase().includes(searchQuery.toLowerCase()))
            : allSources;

          if (filteredSources.length === 0) {
            return (
              <div style={{ 
                padding: '16px', 
                textAlign: 'center', 
                color: themeStyles.textMuted, 
                fontSize: '11px' 
              }}>
                {searchQuery ? 'No sources found matching your search' : 'No log sources discovered yet'}
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredSources.map((source) => {
                const isDiscovered = (discoveredSources || []).includes(source);
                const isCommon = commonLogSources.includes(source);

                return (
                  <div
                    key={source}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      backgroundColor: isGloballyDisabled ? (isDark ? '#1f2937' : '#f3f4f6') : themeStyles.sectionBackground,
                      borderRadius: '4px',
                      opacity: isGloballyDisabled ? 0.6 : isDiscovered || isCommon ? 1 : 0.7,
                    }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: '500',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                        {source}
                      </div>
                      <div style={{ fontSize: '9px', color: themeStyles.textMuted }}>
                        {isGloballyDisabled
                          ? 'Blocked by global'
                          : disabledSources.includes(source)
                            ? 'Disabled'
                            : 'Enabled'}
                        {isDiscovered && !isCommon && ' • Auto-discovered'}
                      </div>
                    </div>
                    <Switch
                      checked={isSourceEnabled(source)}
                      onChange={(event) => handleSourceToggle(source, event.currentTarget.checked)}
                      disabled={false} // Allow configuration even when global is off
                      color={isGloballyDisabled ? 'gray' : 'green'}
                      size="xs"
                    />
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: isDark ? '#1e40af' : '#dbeafe',
          borderRadius: '4px',
          fontSize: '10px',
        }}>
        <strong>Status:</strong>{' '}
        {isGloballyDisabled
          ? 'All logging disabled'
          : disabledSources.length === 0
            ? 'All logging enabled'
            : `${disabledSources.length} sources disabled`}
      </div>
    </div>
  );
}

export default LoggingControl;