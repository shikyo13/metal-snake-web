import { CONFIG } from '../config/constants.js';
import { errorManager } from './error.js';

export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: [],
      frameTime: [],
      updateTime: [],
      renderTime: [],
      memoryUsage: []
    };
    
    this.maxSamples = 60;
    this.lastFrameTime = performance.now();
    this.monitoringEnabled = CONFIG.DEBUG;
    this.reportInterval = 30000; // Report every 30 seconds
    this.lastReportTime = Date.now();
    
    if (this.monitoringEnabled) {
      this.startMonitoring();
    }
  }
  
  startMonitoring() {
    // Monitor memory usage if available
    if (performance.memory) {
      setInterval(() => {
        this.recordMemoryUsage();
      }, 5000);
    }
    
    // Set up performance observer for long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              errorManager.handleError(new Error('Long task detected'), {
                type: 'performance',
                duration: entry.duration,
                name: entry.name
              }, 'info');
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported:', error);
      }
    }
  }
  
  recordFrameTime() {
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    // Calculate FPS
    const fps = 1000 / deltaTime;
    this.metrics.fps.push(fps);
    this.metrics.frameTime.push(deltaTime);
    
    // Keep only recent samples
    if (this.metrics.fps.length > this.maxSamples) {
      this.metrics.fps.shift();
      this.metrics.frameTime.shift();
    }
    
    // Check for performance issues
    if (fps < 30 && this.metrics.fps.length > 10) {
      const avgFps = this.getAverageFPS();
      if (avgFps < 30) {
        errorManager.handleError(new Error('Low FPS detected'), {
          type: 'performance',
          fps: avgFps,
          strategy: 'performance'
        }, 'warning');
      }
    }
    
    // Report metrics periodically
    if (Date.now() - this.lastReportTime > this.reportInterval) {
      this.reportMetrics();
      this.lastReportTime = Date.now();
    }
  }
  
  recordUpdateTime(duration) {
    this.metrics.updateTime.push(duration);
    if (this.metrics.updateTime.length > this.maxSamples) {
      this.metrics.updateTime.shift();
    }
  }
  
  recordRenderTime(duration) {
    this.metrics.renderTime.push(duration);
    if (this.metrics.renderTime.length > this.maxSamples) {
      this.metrics.renderTime.shift();
    }
  }
  
  recordMemoryUsage() {
    if (!performance.memory) return;
    
    const memoryMB = performance.memory.usedJSHeapSize / (1024 * 1024);
    this.metrics.memoryUsage.push(memoryMB);
    
    if (this.metrics.memoryUsage.length > this.maxSamples) {
      this.metrics.memoryUsage.shift();
    }
    
    // Check for memory leaks (memory consistently increasing)
    if (this.metrics.memoryUsage.length >= 10) {
      const recent = this.metrics.memoryUsage.slice(-10);
      const isIncreasing = recent.every((val, i) => i === 0 || val >= recent[i - 1]);
      
      if (isIncreasing && recent[9] - recent[0] > 50) { // 50MB increase
        errorManager.handleError(new Error('Potential memory leak detected'), {
          type: 'performance',
          memoryIncrease: recent[9] - recent[0],
          currentMemory: recent[9]
        }, 'warning');
      }
    }
  }
  
  getAverageFPS() {
    if (this.metrics.fps.length === 0) return 60;
    return this.metrics.fps.reduce((a, b) => a + b, 0) / this.metrics.fps.length;
  }
  
  getAverageFrameTime() {
    if (this.metrics.frameTime.length === 0) return 16.67;
    return this.metrics.frameTime.reduce((a, b) => a + b, 0) / this.metrics.frameTime.length;
  }
  
  getPerformanceStats() {
    return {
      fps: {
        current: this.metrics.fps[this.metrics.fps.length - 1] || 60,
        average: this.getAverageFPS(),
        min: Math.min(...this.metrics.fps) || 60,
        max: Math.max(...this.metrics.fps) || 60
      },
      frameTime: {
        average: this.getAverageFrameTime(),
        max: Math.max(...this.metrics.frameTime) || 16.67
      },
      updateTime: {
        average: this.metrics.updateTime.length > 0
          ? this.metrics.updateTime.reduce((a, b) => a + b, 0) / this.metrics.updateTime.length
          : 0,
        max: Math.max(...this.metrics.updateTime) || 0
      },
      renderTime: {
        average: this.metrics.renderTime.length > 0
          ? this.metrics.renderTime.reduce((a, b) => a + b, 0) / this.metrics.renderTime.length
          : 0,
        max: Math.max(...this.metrics.renderTime) || 0
      },
      memory: {
        current: this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] || 0,
        average: this.metrics.memoryUsage.length > 0
          ? this.metrics.memoryUsage.reduce((a, b) => a + b, 0) / this.metrics.memoryUsage.length
          : 0
      }
    };
  }
  
  reportMetrics() {
    if (!this.monitoringEnabled) return;
    
    const stats = this.getPerformanceStats();
    
    // Log to console in debug mode
    if (CONFIG.DEBUG) {
      console.log('Performance Stats:', stats);
    }
    
    // Send to Sentry if available
    if (window.Sentry && errorManager.sentryInitialized) {
      window.Sentry.addBreadcrumb({
        category: 'performance',
        message: 'Performance metrics',
        level: 'info',
        data: stats
      });
      
      // Report critical performance issues
      if (stats.fps.average < 30) {
        window.Sentry.captureMessage('Poor performance detected', {
          level: 'warning',
          contexts: {
            performance: stats
          }
        });
      }
    }
  }
  
  createDebugOverlay() {
    if (!CONFIG.DEBUG) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'performance-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border: 1px solid #0f0;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(overlay);
    
    setInterval(() => {
      const stats = this.getPerformanceStats();
      overlay.innerHTML = `
        <strong>Performance Monitor</strong><br>
        FPS: ${stats.fps.current.toFixed(1)} (avg: ${stats.fps.average.toFixed(1)})<br>
        Frame Time: ${stats.frameTime.average.toFixed(2)}ms<br>
        Update: ${stats.updateTime.average.toFixed(2)}ms<br>
        Render: ${stats.renderTime.average.toFixed(2)}ms<br>
        Memory: ${stats.memory.current.toFixed(1)}MB<br>
        Errors: ${errorManager.getErrorStats().total}
      `;
    }, 1000);
  }
}

export const performanceMonitor = new PerformanceMonitor();