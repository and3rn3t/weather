import React, { useCallback, useEffect, useState } from 'react';
import type {
  AlertPreferences,
  AlertRule,
  WeatherAlert,
} from '../../services/mobile/WeatherAlertManager';
import { WeatherAlertManager } from '../../services/mobile/WeatherAlertManager';
import './WeatherAlertPanel.css';

interface WeatherAlertPanelProps {
  isVisible: boolean;
  onClose: () => void;
  theme: {
    isDark: boolean;
    colors: {
      primary: string;
      text: string;
      background: string;
    };
  };
}

type TabType = 'alerts' | 'rules' | 'settings';

const WeatherAlertPanel: React.FC<WeatherAlertPanelProps> = ({
  isVisible,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('alerts');
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [preferences, setPreferences] = useState<AlertPreferences | null>(null);

  const alertManager = WeatherAlertManager.getInstance();

  const loadData = useCallback(() => {
    setAlerts(alertManager.getActiveAlerts());
    setRules(alertManager.getAlertRules());
    setPreferences(alertManager.getPreferences());
  }, [alertManager]);

  useEffect(() => {
    if (isVisible) {
      loadData();
    }
  }, [isVisible, loadData]);

  const unreadCount = alerts.filter(
    (alert: WeatherAlert) => !alert.isRead,
  ).length;

  const handleMarkAsRead = (alertId: string) => {
    alertManager.markAlertAsRead(alertId);
    loadData();
  };

  const handleDismissAlert = (alertId: string) => {
    alertManager.dismissAlert(alertId);
    loadData();
  };

  const getSeverityIcon = (severity: string): string => {
    if (severity === 'extreme') return '🚨';
    if (severity === 'severe') return '⚠️';
    if (severity === 'warning') return '⚡';
    return 'ℹ️';
  };

  if (!isVisible) return null;

  return (
    <div
      className="weather-alert-panel"
      role="dialog"
      aria-labelledby="alert-panel-title"
      aria-modal="true"
    >
      {/* Panel Header */}
      <header className="panel-header">
        <h2 id="alert-panel-title">Weather Alerts</h2>
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close weather alerts panel"
          type="button"
        >
          ×
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="panel-tabs">
        <button
          className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
          type="button"
          aria-pressed={activeTab === 'alerts'}
        >
          Alerts
          {unreadCount > 0 && (
            <span
              className="tab-badge"
              aria-label={`${unreadCount} unread alerts`}
            >
              {unreadCount}
            </span>
          )}
        </button>
        <button
          className={`tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
          type="button"
          aria-pressed={activeTab === 'rules'}
        >
          Rules ({rules.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
          type="button"
          aria-pressed={activeTab === 'settings'}
        >
          Settings
        </button>
      </div>

      {/* Tab Content */}
      <main className="panel-content">
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <section>
            <div className="alert-list-header">
              <h3>
                Active Alerts
                {unreadCount > 0 && (
                  <span
                    className="unread-badge"
                    aria-label={`${unreadCount} unread`}
                  >
                    {unreadCount}
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  className="mark-all-read-btn"
                  onClick={() => {
                    alerts.forEach((alert: WeatherAlert) => {
                      if (!alert.isRead) {
                        alertManager.markAlertAsRead(alert.id);
                      }
                    });
                    loadData();
                  }}
                  type="button"
                  aria-label="Mark all alerts as read"
                >
                  Mark All Read
                </button>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="no-alerts">
                <span className="no-alerts-icon" aria-hidden="true">
                  🌤️
                </span>
                <p>No weather alerts</p>
                <small>You'll be notified when weather conditions change</small>
              </div>
            ) : (
              <div className="alerts-container">
                {alerts.map((alert: WeatherAlert) => (
                  <article
                    key={`alert-${alert.id}`}
                    className={`alert-item ${!alert.isRead ? 'unread' : ''} ${
                      !alert.isActive ? 'dismissed' : ''
                    } ${alert.severity}`}
                    aria-label={`Weather alert: ${alert.title}`}
                  >
                    <header className="alert-header">
                      <span className="alert-icon" aria-hidden="true">
                        {getSeverityIcon(alert.severity)}
                      </span>
                      <time
                        className="alert-time"
                        dateTime={alert.startTime.toISOString()}
                      >
                        {alert.startTime.toLocaleTimeString()}
                      </time>
                      {!alert.isRead && (
                        <span className="unread-dot" aria-label="Unread"></span>
                      )}
                    </header>

                    <div className="alert-content">
                      <h4>{alert.title}</h4>
                      <p className="alert-description">{alert.description}</p>
                      <p className="alert-location">📍 {alert.location}</p>

                      <div className="alert-actions">
                        {!alert.isRead && (
                          <button
                            className="action-btn mark-read"
                            onClick={() => handleMarkAsRead(alert.id)}
                            type="button"
                            aria-label={`Mark alert "${alert.title}" as read`}
                          >
                            Mark Read
                          </button>
                        )}
                        {alert.isActive && (
                          <button
                            className="action-btn dismiss"
                            onClick={() => handleDismissAlert(alert.id)}
                            type="button"
                            aria-label={`Dismiss alert "${alert.title}"`}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Rules Tab */}
        {activeTab === 'rules' && (
          <section>
            <div className="rules-header">
              <h3>Alert Rules</h3>
              <p>
                Alert rules are managed programmatically. Use the mobile app
                settings to configure custom alert conditions.
              </p>
            </div>

            <div className="rules-list">
              {rules.map((rule: AlertRule) => (
                <article
                  key={`rule-${rule.id}`}
                  className={`rule-item ${
                    rule.enabled ? 'enabled' : 'disabled'
                  }`}
                >
                  <header className="rule-header">
                    <span className="rule-icon" aria-hidden="true">
                      {getSeverityIcon(rule.severity)}
                    </span>
                    <h4 className="rule-title">{rule.title}</h4>

                    <div className="rule-controls">
                      <label
                        className="toggle-switch"
                        htmlFor={`rule-toggle-${rule.id}`}
                      >
                        <input
                          id={`rule-toggle-${rule.id}`}
                          type="checkbox"
                          checked={rule.enabled}
                          onChange={e => {
                            alertManager.updateAlertRule(rule.id, {
                              enabled: e.target.checked,
                            });
                            loadData();
                          }}
                          aria-describedby={`rule-status-${rule.id}`}
                        />
                        <span className="toggle-slider"></span>
                        <span className="sr-only">
                          Toggle {rule.title} rule
                        </span>
                      </label>
                      <span id={`rule-status-${rule.id}`} className="sr-only">
                        {rule.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </header>

                  <div className="rule-details">
                    <p className="rule-description">{rule.description}</p>
                    <div className="rule-meta">
                      <span className={`severity-badge ${rule.severity}`}>
                        {rule.severity.charAt(0).toUpperCase() +
                          rule.severity.slice(1)}
                      </span>
                      <span className="locations">
                        📍 {rule.locations.length} location(s)
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && preferences && (
          <section>
            <h3>Alert Settings</h3>

            <div className="settings-group">
              <h4>Notifications</h4>

              <div className="setting-item">
                <label className="setting-label" htmlFor="push-notifications">
                  <input
                    id="push-notifications"
                    type="checkbox"
                    checked={preferences.enableNotifications}
                    onChange={e => {
                      alertManager.updatePreferences({
                        enableNotifications: e.target.checked,
                      });
                      loadData();
                    }}
                  />
                  Enable push notifications
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label" htmlFor="sound-alerts">
                  <input
                    id="sound-alerts"
                    type="checkbox"
                    checked={preferences.enableSounds}
                    onChange={e => {
                      alertManager.updatePreferences({
                        enableSounds: e.target.checked,
                      });
                      loadData();
                    }}
                  />
                  Play sound for alerts
                </label>
              </div>

              <div className="setting-item">
                <label className="setting-label" htmlFor="vibration-alerts">
                  <input
                    id="vibration-alerts"
                    type="checkbox"
                    checked={preferences.enableVibration}
                    onChange={e => {
                      alertManager.updatePreferences({
                        enableVibration: e.target.checked,
                      });
                      loadData();
                    }}
                  />
                  Enable vibration
                </label>
              </div>
            </div>

            <div className="settings-group">
              <h4>Alert Frequency</h4>

              <div className="setting-item">
                <label htmlFor="min-severity">Minimum alert severity:</label>
                <select
                  id="min-severity"
                  className="setting-select"
                  value={preferences.minimumSeverity}
                  onChange={e => {
                    alertManager.updatePreferences({
                      minimumSeverity: e.target.value as
                        | 'info'
                        | 'warning'
                        | 'severe'
                        | 'extreme',
                    });
                    loadData();
                  }}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="severe">Severe</option>
                  <option value="extreme">Extreme</option>
                </select>
              </div>

              <div className="setting-item">
                <label htmlFor="max-alerts">Maximum alerts per day:</label>
                <input
                  id="max-alerts"
                  type="number"
                  min="1"
                  max="50"
                  value={preferences.maxAlertsPerDay}
                  onChange={e => {
                    alertManager.updatePreferences({
                      maxAlertsPerDay: parseInt(e.target.value) || 10,
                    });
                    loadData();
                  }}
                />
              </div>
            </div>

            <div className="settings-group">
              <h4>Quiet Hours</h4>

              <div className="quiet-hours">
                <div className="time-input">
                  <label htmlFor="quiet-start">From:</label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={preferences.quietHours.start}
                    onChange={e => {
                      alertManager.updatePreferences({
                        quietHours: {
                          ...preferences.quietHours,
                          start: e.target.value,
                        },
                      });
                      loadData();
                    }}
                  />
                </div>
                <div className="time-input">
                  <label htmlFor="quiet-end">To:</label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={preferences.quietHours.end}
                    onChange={e => {
                      alertManager.updatePreferences({
                        quietHours: {
                          ...preferences.quietHours,
                          end: e.target.value,
                        },
                      });
                      loadData();
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="reset-btn"
                onClick={() => {
                  alertManager.resetPreferences();
                  loadData();
                }}
                type="button"
                aria-label="Reset all settings to default"
              >
                Reset to Defaults
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default WeatherAlertPanel;
