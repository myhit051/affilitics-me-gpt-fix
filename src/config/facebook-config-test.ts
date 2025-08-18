// Facebook Configuration Test Utility
// This file can be used to test Facebook API configuration

import { 
  getFacebookConfig, 
  validateRuntimeConfig, 
  initializeFacebookConfig,
  getConfigSummary,
  getEnvironmentConfig,
  getRuntimeConfig,
  performHealthCheck
} from './facebook';

// Test configuration function
export const testFacebookConfiguration = () => {
  console.group('🔧 Facebook API Configuration Test');
  
  try {
    // Test basic configuration
    const config = getFacebookConfig();
    const summary = getConfigSummary();
    console.log('✅ Configuration loaded:', summary.basic);
    
    // Test runtime configuration
    const runtimeConfig = getRuntimeConfig();
    console.log('✅ Runtime configuration:', {
      features: summary.features,
      sync: summary.sync,
      performance: summary.performance,
      debug: summary.debug,
    });
    
    // Test validation
    const validation = validateRuntimeConfig();
    if (validation.isValid) {
      console.log('✅ Configuration validation passed');
    } else {
      console.warn('⚠️ Configuration validation issues:', validation.errors);
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Configuration warnings:', validation.warnings);
    }
    
    // Test environment configuration
    const envConfig = getEnvironmentConfig();
    console.log('✅ Environment configuration:', {
      environment: envConfig.environment,
      isDevelopment: envConfig.isDevelopment,
      isProduction: envConfig.isProduction,
      debugMode: envConfig.debugMode,
    });
    
    // Test health check
    const healthCheck = performHealthCheck();
    console.log(`${healthCheck.status === 'healthy' ? '✅' : healthCheck.status === 'warning' ? '⚠️' : '❌'} Health check:`, healthCheck);
    
    // Test initialization
    const initResult = initializeFacebookConfig();
    if (initResult.success) {
      console.log('✅ Configuration initialization successful');
    } else {
      console.error('❌ Configuration initialization failed:', initResult.errors);
    }
    
    if (initResult.warnings && initResult.warnings.length > 0) {
      console.warn('⚠️ Initialization warnings:', initResult.warnings);
    }
    
    return {
      success: validation.isValid && initResult.success,
      config: summary,
      errors: [...validation.errors, ...initResult.errors],
      warnings: [...validation.warnings, ...(initResult.warnings || [])],
      healthCheck,
    };
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error);
    return {
      success: false,
      config: null,
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      warnings: [],
      healthCheck: null,
    };
  } finally {
    console.groupEnd();
  }
};

// Quick configuration check (for development)
export const quickConfigCheck = (): boolean => {
  const config = getFacebookConfig();
  return !!(config.FACEBOOK_APP_ID && config.FACEBOOK_API_VERSION);
};

// Export for console testing
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testFacebookConfig = testFacebookConfiguration;
  (window as any).quickConfigCheck = quickConfigCheck;
}