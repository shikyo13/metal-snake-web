import { CONFIG } from '../config/constants.js';

export class ErrorManager {
  constructor() {
    this.errors = [];
    this.maxErrors = 100;
    this.errorCounts = {
      critical: 0,
      warning: 0,
      info: 0
    };
    this.recoveryStrategies = new Map();
    this.notificationElement = null;
    this.sentryInitialized = false;
    this.setupGlobalHandlers();
    this.setupRecoveryStrategies();
  }

  setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      this.handleError(new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        type: 'runtime'
      }, 'critical');
      event.preventDefault();
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(new Error(event.reason), {
        type: 'promise',
        promise: event.promise
      }, 'critical');
      event.preventDefault();
    });
  }

  setupRecoveryStrategies() {
    this.recoveryStrategies.set('asset_load', (error, context) => {
      console.warn(`Asset loading failed: ${context.assetName}`, error);
      this.showNotification(`Failed to load ${context.assetType}: ${context.assetName}`, 'warning');
      return context.fallback || null;
    });

    this.recoveryStrategies.set('canvas_context', (error) => {
      this.showNotification('Graphics initialization failed. Please refresh the page.', 'critical');
      throw error;
    });

    this.recoveryStrategies.set('game_loop', (error, context) => {
      if (context.errorCount > 10) {
        this.showNotification('Game encountered critical errors. Please refresh.', 'critical');
        return { stop: true };
      }
      console.error('Game loop error:', error);
      return { stop: false };
    });

    this.recoveryStrategies.set('storage', (error, context) => {
      console.warn('Storage operation failed:', error);
      this.showNotification('Unable to save game data. Progress may be lost.', 'warning');
      return context.defaultValue || null;
    });

    this.recoveryStrategies.set('input', (error) => {
      console.warn('Input handling error:', error);
      return null;
    });

    this.recoveryStrategies.set('powerup', (error, context) => {
      console.warn('Power-up error:', error);
      return context.defaultValue || null;
    });

    this.recoveryStrategies.set('audio', (error) => {
      console.warn('Audio error:', error);
      this.showNotification('Audio playback failed. Playing without sound.', 'info');
      return { muted: true };
    });
  }

  initSentry(dsn) {
    if (!dsn || this.sentryInitialized) return;

    try {
      if (window.Sentry) {
        window.Sentry.init({
          dsn: dsn,
          environment: CONFIG.DEBUG ? 'development' : 'production',
          integrations: [
            new window.Sentry.BrowserTracing(),
          ],
          tracesSampleRate: CONFIG.DEBUG ? 1.0 : 0.1,
          beforeSend: (event) => {
            if (CONFIG.DEBUG) {
              console.log('Sentry event:', event);
            }
            return event;
          }
        });
        this.sentryInitialized = true;
      }
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  handleError(error, context = {}, severity = 'warning') {
    const errorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: Date.now(),
      severity,
      context,
      gameState: window.gameInstance?.state
    };

    this.errors.push(errorInfo);
    this.errorCounts[severity]++;

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    if (CONFIG.DEBUG) {
      console.error(`[${severity.toUpperCase()}]`, error.message, context);
    }

    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.captureException(error, {
        level: severity,
        contexts: {
          game: {
            state: errorInfo.gameState,
            ...context
          }
        }
      });
    }

    const strategyKey = context.strategy || context.type;
    if (strategyKey && this.recoveryStrategies.has(strategyKey)) {
      return this.recoveryStrategies.get(strategyKey)(error, context);
    }

    return null;
  }

  handleAssetError(assetType, assetName, error) {
    return this.handleError(error, {
      type: 'asset_load',
      strategy: 'asset_load',
      assetType,
      assetName
    }, 'warning');
  }

  createErrorBoundary(fn, context = {}) {
    return (...args) => {
      try {
        return fn.apply(this, args);
      } catch (error) {
        return this.handleError(error, context, context.severity || 'warning');
      }
    };
  }

  showNotification(message, severity = 'info') {
    if (!this.notificationElement) {
      this.createNotificationElement();
    }

    const notification = document.createElement('div');
    notification.className = `error-notification error-${severity}`;
    notification.textContent = message;

    this.notificationElement.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => notification.remove(), 300);
    }, severity === 'critical' ? 10000 : 5000);
  }

  createNotificationElement() {
    this.notificationElement = document.createElement('div');
    this.notificationElement.id = 'error-notifications';
    this.notificationElement.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
    `;
    document.body.appendChild(this.notificationElement);

    const style = document.createElement('style');
    style.textContent = `
      .error-notification {
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-family: monospace;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: opacity 0.3s ease;
        animation: slideIn 0.3s ease;
      }
      
      .error-critical {
        background-color: #dc3545;
        border: 1px solid #a02833;
      }
      
      .error-warning {
        background-color: #ffc107;
        color: #000;
        border: 1px solid #d39e00;
      }
      
      .error-info {
        background-color: #17a2b8;
        border: 1px solid #117a8b;
      }
      
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  getErrorStats() {
    return {
      total: this.errors.length,
      counts: { ...this.errorCounts },
      recent: this.errors.slice(-10)
    };
  }

  clearErrors() {
    this.errors = [];
    this.errorCounts = {
      critical: 0,
      warning: 0,
      info: 0
    };
  }

  createErrorModal(title, message, details = null) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: #1a1a1a;
      border: 2px solid #dc3545;
      border-radius: 8px;
      padding: 30px;
      max-width: 500px;
      color: white;
      font-family: monospace;
    `;

    const heading = document.createElement('h2');
    heading.style.cssText = 'color: #dc3545; margin-top: 0;';
    heading.textContent = title;
    content.appendChild(heading);

    const messagePara = document.createElement('p');
    messagePara.style.cssText = 'margin: 20px 0;';
    messagePara.textContent = message;
    content.appendChild(messagePara);

    if (details) {
      const pre = document.createElement('pre');
      pre.style.cssText = 'background: #000; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;';
      pre.textContent = details;
      content.appendChild(pre);
    }

    const buttonDiv = document.createElement('div');
    buttonDiv.style.cssText = 'margin-top: 20px; text-align: right;';

    const refreshBtn = document.createElement('button');
    refreshBtn.style.cssText = 'background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;';
    refreshBtn.textContent = 'Refresh Page';
    refreshBtn.onclick = () => location.reload();

    const closeBtn = document.createElement('button');
    closeBtn.style.cssText = 'background: #666; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;';
    closeBtn.textContent = 'Continue';
    closeBtn.onclick = () => modal.remove();

    buttonDiv.appendChild(refreshBtn);
    buttonDiv.appendChild(closeBtn);
    content.appendChild(buttonDiv);

    modal.appendChild(content);
    document.body.appendChild(modal);
  }
}

export const errorManager = new ErrorManager();