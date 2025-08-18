// Facebook API Configuration

import { FacebookConfig } from '@/types/facebook';
import { API_VERSIONS, FACEBOOK_PERMISSIONS } from '@/lib/facebook-constants';

// Environment variables for Facebook API configuration
export const getFacebookConfig = (): FacebookConfig => {
  const config = {
    FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    FACEBOOK_API_VERSION: import.meta.env.VITE_FACEBOOK_API_VERSION || API_VERSIONS.CURRENT,
    FACEBOOK_REDIRECT_URI: import.meta.env.VITE_FACEBOOK_REDIRECT_URI || `${window.location.origin}/auth/facebook/callback`,
    FACEBOOK_SCOPES: (import.meta.env.VITE_FACEBOOK_SCOPES || `${FACEBOOK_PERMISSIONS.ADS_READ},${FACEBOOK_PERMISSIONS.ADS_MANAGEMENT}`).split(',').map(scope => scope.trim()),
  };

  // Validate API version
  if (!API_VERSIONS.SUPPORTED.includes(config.FACEBOOK_API_VERSION)) {
    console.warn(`Unsupported Facebook API version: ${config.FACEBOOK_API_VERSION}. Supported versions: ${API_VERSIONS.SUPPORTED.join(', ')}`);
  }

  return config;
};

// Validate Facebook configuration
export const validateFacebookConfig = (config: FacebookConfig): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!config.FACEBOOK_APP_ID) {
    errors.push('FACEBOOK_APP_ID is required');
  }

  if (!config.FACEBOOK_API_VERSION) {
    errors.push('FACEBOOK_API_VERSION is required');
  }

  if (!config.FACEBOOK_REDIRECT_URI) {
    errors.push('FACEBOOK_REDIRECT_URI is required');
  }

  if (!config.FACEBOOK_SCOPES || config.FACEBOOK_SCOPES.length === 0) {
    errors.push('FACEBOOK_SCOPES is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Runtime configuration validation
export const validateRuntimeConfig = (): { isValid: boolean; errors: string[]; warnings: string[] } => {
  const config = getFacebookConfig();
  const runtimeConfig = getRuntimeConfig();
  const validation = validateFacebookConfig(config);
  const warnings: string[] = [];
  const errors: string[] = [...validation.errors];

  // Validate feature flags
  if (!FACEBOOK_FEATURE_FLAGS.ENABLE_FACEBOOK_INTEGRATION) {
    warnings.push('Facebook integration is disabled via feature flag');
  }

  // Validate sync configuration
  if (runtimeConfig.sync.interval < 5) {
    warnings.push('Sync interval is very low (< 5 minutes), may hit rate limits');
  }
  
  if (runtimeConfig.sync.interval > 1440) {
    warnings.push('Sync interval is very high (> 24 hours), data may be stale');
  }

  if (runtimeConfig.sync.batchSize > 50) {
    errors.push('Batch size cannot exceed 50 (Facebook API limit)');
  }

  if (runtimeConfig.sync.maxRetries > 10) {
    warnings.push('Max retries is very high, may cause long delays');
  }

  // Validate performance settings
  if (runtimeConfig.performance.cacheTimeout < 60000) {
    warnings.push('Cache timeout is very low (< 1 minute), may cause excessive API calls');
  }

  // Validate debug settings
  if (runtimeConfig.debug.enabled && isProduction()) {
    warnings.push('Debug mode is enabled in production environment');
  }

  // Validate API version
  if (!API_VERSIONS.SUPPORTED.includes(config.FACEBOOK_API_VERSION)) {
    errors.push(`Unsupported Facebook API version: ${config.FACEBOOK_API_VERSION}`);
  }

  // Validate redirect URI format
  try {
    new URL(config.FACEBOOK_REDIRECT_URI);
  } catch {
    errors.push('Invalid redirect URI format');
  }

  // Validate scopes
  const validScopes = Object.values(FACEBOOK_PERMISSIONS);
  const invalidScopes = config.FACEBOOK_SCOPES.filter(scope => !validScopes.includes(scope));
  if (invalidScopes.length > 0) {
    warnings.push(`Unknown Facebook permissions: ${invalidScopes.join(', ')}`);
  }

  const result = {
    isValid: errors.length === 0,
    errors,
    warnings,
  };

  // Log validation results in development
  if (isDevelopment() && (errors.length > 0 || warnings.length > 0)) {
    console.group('Facebook API Configuration Validation:');
    if (errors.length > 0) {
      console.error('Errors:', errors);
    }
    if (warnings.length > 0) {
      console.warn('Warnings:', warnings);
    }
    console.groupEnd();
  }

  return result;
};

// Check if we're in development mode
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

// Check if we're in production mode
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

// Get environment-specific configuration
export const getEnvironmentConfig = () => {
  const baseConfig = getFacebookConfig();
  const env = import.meta.env.MODE || 'development';
  
  return {
    ...baseConfig,
    environment: env,
    isDevelopment: isDevelopment(),
    isProduction: isProduction(),
    debugMode: isDevelopment() && import.meta.env.VITE_DEBUG_FACEBOOK === 'true',
  };
};

// Default configuration values
export const DEFAULT_FACEBOOK_CONFIG = {
  API_VERSION: 'v19.0',
  SCOPES: ['ads_read', 'ads_management'],
  SYNC_INTERVAL: 60, // minutes
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 30000, // milliseconds
  POPUP_WIDTH: 600,
  POPUP_HEIGHT: 700,
} as const;

// Feature flags for Facebook integration
export const FACEBOOK_FEATURE_FLAGS = {
  ENABLE_FACEBOOK_INTEGRATION: import.meta.env.VITE_ENABLE_FACEBOOK_INTEGRATION !== 'false',
  ENABLE_AUTO_SYNC: import.meta.env.VITE_FACEBOOK_AUTO_SYNC !== 'false',
  ENABLE_BATCH_REQUESTS: import.meta.env.VITE_FACEBOOK_BATCH_REQUESTS !== 'false',
  ENABLE_RATE_LIMITING: import.meta.env.VITE_FACEBOOK_RATE_LIMITING !== 'false',
  ENABLE_DATA_CACHING: import.meta.env.VITE_FACEBOOK_DATA_CACHING !== 'false',
  ENABLE_ERROR_RECOVERY: import.meta.env.VITE_FACEBOOK_ERROR_RECOVERY !== 'false',
  ENABLE_VIRTUAL_SCROLLING: import.meta.env.VITE_FACEBOOK_VIRTUAL_SCROLLING !== 'false',
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_FACEBOOK_PERFORMANCE_MONITORING === 'true',
} as const;

// Runtime configuration with feature flags
export const getRuntimeConfig = () => {
  const baseConfig = getFacebookConfig();
  const featureFlags = FACEBOOK_FEATURE_FLAGS;
  
  return {
    ...baseConfig,
    features: featureFlags,
    sync: {
      interval: parseInt(import.meta.env.VITE_FACEBOOK_SYNC_INTERVAL || '60', 10),
      autoSync: featureFlags.ENABLE_AUTO_SYNC,
      batchSize: parseInt(import.meta.env.VITE_FACEBOOK_BATCH_SIZE || '50', 10),
      maxRetries: parseInt(import.meta.env.VITE_FACEBOOK_MAX_RETRIES || '3', 10),
    },
    performance: {
      enableCaching: featureFlags.ENABLE_DATA_CACHING,
      enableVirtualScrolling: featureFlags.ENABLE_VIRTUAL_SCROLLING,
      enableMonitoring: featureFlags.ENABLE_PERFORMANCE_MONITORING,
      cacheTimeout: parseInt(import.meta.env.VITE_FACEBOOK_CACHE_TIMEOUT || '300000', 10), // 5 minutes
    },
    debug: {
      enabled: isDevelopment() && import.meta.env.VITE_DEBUG_FACEBOOK === 'true',
      logLevel: import.meta.env.VITE_FACEBOOK_LOG_LEVEL || 'warn',
      enableApiLogging: import.meta.env.VITE_FACEBOOK_API_LOGGING === 'true',
    },
  };
};

// OAuth configuration
export const OAUTH_CONFIG = {
  RESPONSE_TYPE: 'code',
  STATE_LENGTH: 32,
  CODE_CHALLENGE_METHOD: 'S256',
  CODE_VERIFIER_LENGTH: 128,
} as const;

// Initialize Facebook configuration
export const initializeFacebookConfig = (): { success: boolean; errors: string[]; warnings: string[] } => {
  try {
    const config = getFacebookConfig();
    const runtimeConfig = getRuntimeConfig();
    const validation = validateRuntimeConfig();
    
    if (isDevelopment()) {
      console.group('Facebook API Configuration Initialized:');
      console.log('Basic Config:', {
        appId: config.FACEBOOK_APP_ID ? '***configured***' : 'missing',
        apiVersion: config.FACEBOOK_API_VERSION,
        redirectUri: config.FACEBOOK_REDIRECT_URI,
        scopes: config.FACEBOOK_SCOPES,
        environment: import.meta.env.MODE,
      });
      console.log('Feature Flags:', runtimeConfig.features);
      console.log('Sync Settings:', runtimeConfig.sync);
      console.log('Performance Settings:', runtimeConfig.performance);
      console.log('Debug Settings:', runtimeConfig.debug);
      console.groupEnd();
    }
    
    return {
      success: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown configuration error';
    console.error('Failed to initialize Facebook configuration:', errorMessage);
    
    return {
      success: false,
      errors: [errorMessage],
      warnings: [],
    };
  }
};

// Feature flag utilities
export const isFeatureEnabled = (feature: keyof typeof FACEBOOK_FEATURE_FLAGS): boolean => {
  return FACEBOOK_FEATURE_FLAGS[feature];
};

export const getEnabledFeatures = (): string[] => {
  return Object.entries(FACEBOOK_FEATURE_FLAGS)
    .filter(([, enabled]) => enabled)
    .map(([feature]) => feature);
};

export const getDisabledFeatures = (): string[] => {
  return Object.entries(FACEBOOK_FEATURE_FLAGS)
    .filter(([, enabled]) => !enabled)
    .map(([feature]) => feature);
};

// Configuration health check
export const performHealthCheck = (): {
  status: 'healthy' | 'warning' | 'error';
  checks: Array<{ name: string; status: 'pass' | 'warn' | 'fail'; message: string }>;
} => {
  const checks = [];
  const validation = validateRuntimeConfig();
  
  // Check basic configuration
  checks.push({
    name: 'Basic Configuration',
    status: validation.isValid ? 'pass' : 'fail',
    message: validation.isValid ? 'All required settings configured' : validation.errors.join(', '),
  });
  
  // Check feature flags
  checks.push({
    name: 'Facebook Integration',
    status: isFeatureEnabled('ENABLE_FACEBOOK_INTEGRATION') ? 'pass' : 'warn',
    message: isFeatureEnabled('ENABLE_FACEBOOK_INTEGRATION') ? 'Enabled' : 'Disabled via feature flag',
  });
  
  // Check API version
  const config = getFacebookConfig();
  checks.push({
    name: 'API Version',
    status: API_VERSIONS.SUPPORTED.includes(config.FACEBOOK_API_VERSION) ? 'pass' : 'warn',
    message: `Using ${config.FACEBOOK_API_VERSION}`,
  });
  
  // Check environment
  checks.push({
    name: 'Environment',
    status: 'pass',
    message: `Running in ${import.meta.env.MODE} mode`,
  });
  
  // Determine overall status
  const hasErrors = checks.some(check => check.status === 'fail');
  const hasWarnings = checks.some(check => check.status === 'warn');
  
  const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy';
  
  return { status, checks };
};

// Get configuration summary for debugging
export const getConfigSummary = () => {
  const config = getFacebookConfig();
  const runtimeConfig = getRuntimeConfig();
  const healthCheck = performHealthCheck();
  
  return {
    basic: {
      hasAppId: !!config.FACEBOOK_APP_ID,
      apiVersion: config.FACEBOOK_API_VERSION,
      scopeCount: config.FACEBOOK_SCOPES.length,
      environment: import.meta.env.MODE,
      redirectUri: config.FACEBOOK_REDIRECT_URI,
    },
    features: {
      enabled: getEnabledFeatures(),
      disabled: getDisabledFeatures(),
    },
    sync: runtimeConfig.sync,
    performance: runtimeConfig.performance,
    debug: runtimeConfig.debug,
    health: healthCheck,
  };
};