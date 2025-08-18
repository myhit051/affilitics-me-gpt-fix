// Production configuration
export const PRODUCTION_CONFIG = {
  // API Configuration
  API: {
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
    BATCH_SIZE: 50,
    MAX_CONCURRENT_REQUESTS: 5,
  },

  // Cache Configuration
  CACHE: {
    DEFAULT_TTL: 300000, // 5 minutes
    MAX_SIZE: 100, // MB
    CLEANUP_INTERVAL: 600000, // 10 minutes
  },

  // Sync Configuration
  SYNC: {
    DEFAULT_INTERVAL: 1800000, // 30 minutes
    MAX_ACCOUNTS_PER_SYNC: 10,
    TIMEOUT: 600000, // 10 minutes
    RETRY_FAILED_AFTER: 3600000, // 1 hour
  },

  // Error Handling
  ERROR_HANDLING: {
    MAX_LOG_ENTRIES: 1000,
    LOG_RETENTION_DAYS: 7,
    ALERT_THRESHOLD: 0.1, // 10% error rate
  },

  // Performance
  PERFORMANCE: {
    ENABLE_VIRTUAL_SCROLLING: true,
    VIRTUAL_SCROLL_ITEM_HEIGHT: 60,
    LAZY_LOAD_THRESHOLD: 100,
    DEBOUNCE_DELAY: 300,
  },

  // Security
  SECURITY: {
    TOKEN_ENCRYPTION: true,
    SESSION_TIMEOUT: 3600000, // 1 hour
    REQUIRE_HTTPS: true,
  },

  // Features
  FEATURES: {
    ENABLE_ANALYTICS: true,
    ENABLE_ERROR_REPORTING: true,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_AUTO_SYNC: true,
    ENABLE_OFFLINE_MODE: false, // Future feature
  },

  // UI
  UI: {
    THEME: 'system', // 'light' | 'dark' | 'system'
    LANGUAGE: 'th', // 'th' | 'en'
    ITEMS_PER_PAGE: 50,
    MAX_CHART_DATA_POINTS: 100,
  },
};

// Environment-specific overrides
export const getProductionConfig = () => {
  const config = { ...PRODUCTION_CONFIG };

  // Override based on environment
  if (import.meta.env.VITE_ENVIRONMENT === 'staging') {
    config.ERROR_HANDLING.MAX_LOG_ENTRIES = 500;
    config.FEATURES.ENABLE_ERROR_REPORTING = false;
  }

  if (import.meta.env.VITE_ENVIRONMENT === 'development') {
    config.API.TIMEOUT = 60000; // Longer timeout for dev
    config.CACHE.DEFAULT_TTL = 60000; // Shorter cache for dev
    config.ERROR_HANDLING.MAX_LOG_ENTRIES = 100;
  }

  return config;
};