// Performance monitoring for production
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PageLoadMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  firstInputDelay?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = !import.meta.env.DEV && 
                     import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true';
    
    if (this.isEnabled) {
      this.initializeMonitoring();
    }
  }

  private initializeMonitoring() {
    // Monitor page load performance
    this.monitorPageLoad();
    
    // Monitor Core Web Vitals
    this.monitorCoreWebVitals();
    
    // Monitor API performance
    this.monitorAPIPerformance();
    
    // Monitor memory usage
    this.monitorMemoryUsage();
  }

  private monitorPageLoad() {
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics: PageLoadMetrics = {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        };

        this.recordMetric('page_load', metrics.loadComplete, { 
          type: 'page_load',
          url: window.location.pathname,
          ...metrics 
        });
      }
    });
  }

  private monitorCoreWebVitals() {
    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('first_contentful_paint', entry.startTime, {
            type: 'core_web_vital'
          });
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('largest_contentful_paint', lastEntry.startTime, {
        type: 'core_web_vital'
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordMetric('cumulative_layout_shift', clsValue, {
        type: 'core_web_vital'
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // First Input Delay
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric('first_input_delay', (entry as any).processingStart - entry.startTime, {
          type: 'core_web_vital'
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  }

  private monitorAPIPerformance() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      const url = typeof args[0] === 'string' ? args[0] : args[0].url;
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric('api_request', duration, {
          type: 'api_performance',
          url,
          status: response.status,
          success: response.ok
        });

        return response;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;

        this.recordMetric('api_request', duration, {
          type: 'api_performance',
          url,
          success: false,
          error: String(error)
        });

        throw error;
      }
    };
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordMetric('memory_usage', memory.usedJSHeapSize, {
          type: 'memory',
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        });
      }, 30000); // Every 30 seconds
    }
  }

  // Record a performance metric
  recordMetric(name: string, value: number, metadata?: Record<string, any>) {
    if (!this.isEnabled) return;

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      metadata
    };

    this.metrics.push(metric);

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Log critical performance issues
    this.checkPerformanceThresholds(metric);

    // Send to analytics if configured
    if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      this.sendToAnalytics(metric);
    }
  }

  private checkPerformanceThresholds(metric: PerformanceMetric) {
    const thresholds = {
      page_load: 3000, // 3 seconds
      first_contentful_paint: 1800, // 1.8 seconds
      largest_contentful_paint: 2500, // 2.5 seconds
      cumulative_layout_shift: 0.1,
      first_input_delay: 100, // 100ms
      api_request: 5000, // 5 seconds
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    if (threshold && metric.value > threshold) {
      console.warn(`Performance threshold exceeded for ${metric.name}:`, {
        value: metric.value,
        threshold,
        metadata: metric.metadata
      });
    }
  }

  private sendToAnalytics(metric: PerformanceMetric) {
    // Send to analytics service
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric.name,
        metric_value: metric.value,
        custom_map: metric.metadata
      });
    }
  }

  // Get performance summary
  getPerformanceSummary(): {
    totalMetrics: number;
    averagePageLoad: number;
    averageAPIResponse: number;
    coreWebVitals: {
      fcp?: number;
      lcp?: number;
      cls?: number;
      fid?: number;
    };
    recentIssues: PerformanceMetric[];
  } {
    const pageLoadMetrics = this.metrics.filter(m => m.name === 'page_load');
    const apiMetrics = this.metrics.filter(m => m.name === 'api_request');
    
    const averagePageLoad = pageLoadMetrics.length > 0 
      ? pageLoadMetrics.reduce((sum, m) => sum + m.value, 0) / pageLoadMetrics.length 
      : 0;

    const averageAPIResponse = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const coreWebVitals = {
      fcp: this.getLatestMetricValue('first_contentful_paint'),
      lcp: this.getLatestMetricValue('largest_contentful_paint'),
      cls: this.getLatestMetricValue('cumulative_layout_shift'),
      fid: this.getLatestMetricValue('first_input_delay'),
    };

    // Get recent performance issues (last 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentIssues = this.metrics.filter(m => 
      m.timestamp > tenMinutesAgo && this.isPerformanceIssue(m)
    );

    return {
      totalMetrics: this.metrics.length,
      averagePageLoad,
      averageAPIResponse,
      coreWebVitals,
      recentIssues
    };
  }

  private getLatestMetricValue(name: string): number | undefined {
    const metrics = this.metrics.filter(m => m.name === name);
    return metrics.length > 0 ? metrics[metrics.length - 1].value : undefined;
  }

  private isPerformanceIssue(metric: PerformanceMetric): boolean {
    const thresholds = {
      page_load: 3000,
      first_contentful_paint: 1800,
      largest_contentful_paint: 2500,
      cumulative_layout_shift: 0.1,
      first_input_delay: 100,
      api_request: 5000,
    };

    const threshold = thresholds[metric.name as keyof typeof thresholds];
    return threshold ? metric.value > threshold : false;
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = [];
  }

  // Get all metrics
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

export const performanceMonitor = new PerformanceMonitor();