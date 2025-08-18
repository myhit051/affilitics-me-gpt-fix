// Analytics and error tracking for production
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class Analytics {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === 'true';
  }

  // Track user events
  track(event: AnalyticsEvent) {
    if (!this.isEnabled) return;

    // Google Analytics 4
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', event.name, event.properties);
    }

    // Console log for development
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', event);
    }
  }

  // Track page views
  pageView(path: string) {
    if (!this.isEnabled) return;

    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
      });
    }
  }

  // Track Facebook connection events
  trackFacebookConnection(status: 'success' | 'error', error?: string) {
    this.track({
      name: 'facebook_connection',
      properties: {
        status,
        error: error || null,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track data sync events
  trackDataSync(accountCount: number, campaignCount: number) {
    this.track({
      name: 'data_sync',
      properties: {
        account_count: accountCount,
        campaign_count: campaignCount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track user actions
  trackUserAction(action: string, details?: Record<string, any>) {
    this.track({
      name: 'user_action',
      properties: {
        action,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export const analytics = new Analytics();