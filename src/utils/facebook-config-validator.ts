/**
 * Facebook Configuration Validator
 * Utility to validate Facebook API configuration and provide setup guidance
 */

import { getFacebookConfig, validateRuntimeConfig } from '@/config/facebook';

export interface ConfigValidationResult {
  isReady: boolean;
  status: 'ready' | 'needs_setup' | 'error';
  checks: ConfigCheck[];
  nextSteps: string[];
}

export interface ConfigCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  action?: string;
}

/**
 * Validates the complete Facebook configuration
 */
export function validateFacebookConfiguration(): ConfigValidationResult {
  const config = getFacebookConfig();
  const validation = validateRuntimeConfig();
  const checks: ConfigCheck[] = [];
  const nextSteps: string[] = [];

  // Check App ID
  if (!config.FACEBOOK_APP_ID || config.FACEBOOK_APP_ID === 'your_facebook_app_id_here') {
    checks.push({
      name: 'Facebook App ID',
      status: 'fail',
      message: 'App ID is not configured',
      action: 'Set VITE_FACEBOOK_APP_ID in .env.local'
    });
    nextSteps.push('Configure your Facebook App ID in .env.local');
  } else if (!/^\d{15,16}$/.test(config.FACEBOOK_APP_ID)) {
    checks.push({
      name: 'Facebook App ID',
      status: 'warning',
      message: 'App ID format looks unusual (should be 15-16 digits)',
      action: 'Verify App ID is correct'
    });
  } else {
    checks.push({
      name: 'Facebook App ID',
      status: 'pass',
      message: `Configured: ${config.FACEBOOK_APP_ID}`
    });
  }

  // Check API Version
  if (config.FACEBOOK_API_VERSION) {
    checks.push({
      name: 'API Version',
      status: 'pass',
      message: `Using ${config.FACEBOOK_API_VERSION}`
    });
  } else {
    checks.push({
      name: 'API Version',
      status: 'fail',
      message: 'API version not configured'
    });
  }

  // Check Redirect URI
  try {
    const redirectUrl = new URL(config.FACEBOOK_REDIRECT_URI);
    if (redirectUrl.pathname === '/auth/facebook/callback') {
      checks.push({
        name: 'Redirect URI',
        status: 'pass',
        message: `Configured: ${config.FACEBOOK_REDIRECT_URI}`
      });
    } else {
      checks.push({
        name: 'Redirect URI',
        status: 'warning',
        message: 'Redirect URI path should be /auth/facebook/callback',
        action: 'Update redirect URI path'
      });
    }
  } catch {
    checks.push({
      name: 'Redirect URI',
      status: 'fail',
      message: 'Invalid redirect URI format'
    });
  }

  // Check Scopes
  if (config.FACEBOOK_SCOPES && config.FACEBOOK_SCOPES.length > 0) {
    const hasRequiredScopes = config.FACEBOOK_SCOPES.includes('ads_read') && 
                             config.FACEBOOK_SCOPES.includes('ads_management');
    if (hasRequiredScopes) {
      checks.push({
        name: 'Permissions/Scopes',
        status: 'pass',
        message: `Configured: ${config.FACEBOOK_SCOPES.join(', ')}`
      });
    } else {
      checks.push({
        name: 'Permissions/Scopes',
        status: 'warning',
        message: 'Missing required scopes: ads_read, ads_management',
        action: 'Add required permissions to VITE_FACEBOOK_SCOPES'
      });
    }
  } else {
    checks.push({
      name: 'Permissions/Scopes',
      status: 'fail',
      message: 'No scopes configured'
    });
  }

  // Check Environment
  const isDev = import.meta.env.DEV;
  checks.push({
    name: 'Environment',
    status: 'pass',
    message: `Running in ${isDev ? 'development' : 'production'} mode`
  });

  // Determine overall status
  const hasErrors = checks.some(check => check.status === 'fail');
  const hasWarnings = checks.some(check => check.status === 'warning');
  
  let status: 'ready' | 'needs_setup' | 'error';
  let isReady = false;

  if (hasErrors) {
    status = 'error';
    nextSteps.push('Fix configuration errors before attempting to connect');
  } else if (hasWarnings) {
    status = 'needs_setup';
    isReady = true; // Can still work with warnings
    nextSteps.push('Review configuration warnings for optimal setup');
  } else {
    status = 'ready';
    isReady = true;
    nextSteps.push('Configuration looks good! You can now connect to Facebook.');
  }

  // Add Facebook App setup steps if needed
  if (hasErrors || hasWarnings) {
    nextSteps.push(
      'Ensure your Facebook App has these settings:',
      '1. Facebook Login product is added',
      '2. Valid OAuth Redirect URI: ' + config.FACEBOOK_REDIRECT_URI,
      '3. Required permissions: ads_read, ads_management'
    );
  }

  return {
    isReady,
    status,
    checks,
    nextSteps
  };
}

/**
 * Quick check if Facebook integration is ready to use
 */
export function isFacebookReady(): boolean {
  const result = validateFacebookConfiguration();
  return result.isReady;
}

/**
 * Get setup instructions for Facebook App configuration
 */
export function getFacebookAppSetupInstructions(appId: string): string[] {
  const config = getFacebookConfig();
  
  return [
    '🔧 Facebook App Setup Instructions:',
    '',
    '1. Go to https://developers.facebook.com/apps/',
    `2. Select your app (ID: ${appId})`,
    '3. Add "Facebook Login" product if not already added',
    '4. Go to Facebook Login > Settings',
    '5. Add this URL to "Valid OAuth Redirect URIs":',
    `   ${config.FACEBOOK_REDIRECT_URI}`,
    '6. Save changes',
    '7. Go to App Review > Permissions and Features',
    '8. Request these permissions if not already approved:',
    '   - ads_read (to read advertising data)',
    '   - ads_management (to access campaign insights)',
    '',
    '💡 Tips:',
    '- Make sure your app is not in "Development Mode" for production use',
    '- Test the connection in development mode first',
    '- Check that popup blockers are disabled for your domain'
  ];
}

/**
 * Test Facebook API connectivity (basic check)
 */
export async function testFacebookConnectivity(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  const config = getFacebookConfig();
  
  if (!config.FACEBOOK_APP_ID) {
    return {
      success: false,
      message: 'Facebook App ID not configured'
    };
  }

  try {
    // Test if we can reach Facebook's API endpoint
    const testUrl = `https://graph.facebook.com/${config.FACEBOOK_API_VERSION}/oauth/access_token`;
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.FACEBOOK_APP_ID,
        grant_type: 'client_credentials',
        client_secret: 'test' // This will fail but tells us if the endpoint is reachable
      }),
    });

    // We expect this to fail with a specific error, which means the endpoint is reachable
    const data = await response.json();
    
    if (data.error && data.error.code === 1) {
      return {
        success: true,
        message: 'Facebook API is reachable',
        details: 'Endpoint connectivity confirmed'
      };
    }

    return {
      success: false,
      message: 'Unexpected response from Facebook API',
      details: data
    };

  } catch (error) {
    return {
      success: false,
      message: 'Cannot reach Facebook API',
      details: error instanceof Error ? error.message : 'Network error'
    };
  }
}

/**
 * Generate a summary report of the current configuration
 */
export function generateConfigReport(): string {
  const validation = validateFacebookConfiguration();
  const config = getFacebookConfig();
  
  const lines = [
    '📊 Facebook API Configuration Report',
    '=' .repeat(50),
    '',
    `Status: ${validation.status.toUpperCase()}`,
    `Ready to Connect: ${validation.isReady ? 'YES' : 'NO'}`,
    '',
    '📋 Configuration Checks:',
  ];

  validation.checks.forEach(check => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
    lines.push(`${icon} ${check.name}: ${check.message}`);
    if (check.action) {
      lines.push(`   → Action: ${check.action}`);
    }
  });

  if (validation.nextSteps.length > 0) {
    lines.push('', '📝 Next Steps:');
    validation.nextSteps.forEach((step, index) => {
      lines.push(`${index + 1}. ${step}`);
    });
  }

  lines.push('', '⚙️ Current Configuration:');
  lines.push(`App ID: ${config.FACEBOOK_APP_ID || 'Not set'}`);
  lines.push(`API Version: ${config.FACEBOOK_API_VERSION}`);
  lines.push(`Redirect URI: ${config.FACEBOOK_REDIRECT_URI}`);
  lines.push(`Scopes: ${config.FACEBOOK_SCOPES.join(', ')}`);
  lines.push(`Environment: ${import.meta.env.MODE}`);

  return lines.join('\n');
}