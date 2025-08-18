/**
 * Policy Files Checker
 * Utility to verify that privacy policy and terms of service are accessible
 */

export interface PolicyCheckResult {
  privacyPolicy: {
    url: string;
    accessible: boolean;
    error?: string;
  };
  termsOfService: {
    url: string;
    accessible: boolean;
    error?: string;
  };
  allAccessible: boolean;
}

/**
 * Check if policy files are accessible
 */
export async function checkPolicyFiles(): Promise<PolicyCheckResult> {
  const baseUrl = window.location.origin;
  const privacyPolicyUrl = `${baseUrl}/privacy-policy.html`;
  const termsOfServiceUrl = `${baseUrl}/terms-of-service.html`;

  const result: PolicyCheckResult = {
    privacyPolicy: {
      url: privacyPolicyUrl,
      accessible: false,
    },
    termsOfService: {
      url: termsOfServiceUrl,
      accessible: false,
    },
    allAccessible: false,
  };

  // Check Privacy Policy
  try {
    const privacyResponse = await fetch(privacyPolicyUrl, { method: 'HEAD' });
    result.privacyPolicy.accessible = privacyResponse.ok;
    if (!privacyResponse.ok) {
      result.privacyPolicy.error = `HTTP ${privacyResponse.status}: ${privacyResponse.statusText}`;
    }
  } catch (error) {
    result.privacyPolicy.error = error instanceof Error ? error.message : 'Network error';
  }

  // Check Terms of Service
  try {
    const termsResponse = await fetch(termsOfServiceUrl, { method: 'HEAD' });
    result.termsOfService.accessible = termsResponse.ok;
    if (!termsResponse.ok) {
      result.termsOfService.error = `HTTP ${termsResponse.status}: ${termsResponse.statusText}`;
    }
  } catch (error) {
    result.termsOfService.error = error instanceof Error ? error.message : 'Network error';
  }

  result.allAccessible = result.privacyPolicy.accessible && result.termsOfService.accessible;

  return result;
}

/**
 * Get Facebook App configuration URLs for copy-paste
 */
export function getFacebookAppUrls(): {
  privacyPolicyUrl: string;
  termsOfServiceUrl: string;
  oauthRedirectUri: string;
} {
  const baseUrl = window.location.origin;
  
  return {
    privacyPolicyUrl: `${baseUrl}/privacy-policy.html`,
    termsOfServiceUrl: `${baseUrl}/terms-of-service.html`,
    oauthRedirectUri: `${baseUrl}/auth/facebook/callback`,
  };
}

/**
 * Generate Facebook App setup instructions
 */
export function generateFacebookAppInstructions(): string[] {
  const urls = getFacebookAppUrls();
  
  return [
    '🔧 Facebook App Setup Instructions:',
    '',
    '1. Go to https://developers.facebook.com/apps/',
    '2. Select your app (ID: 1264041048749910)',
    '3. Go to Settings → Basic',
    '4. Fill in the following information:',
    '',
    '   📝 Basic Information:',
    '   • Display Name: Affilitics.me',
    '   • App Domains: localhost',
    '   • Category: Business',
    '',
    '   🔗 Policy URLs:',
    `   • Privacy Policy URL: ${urls.privacyPolicyUrl}`,
    `   • Terms of Service URL: ${urls.termsOfServiceUrl}`,
    '',
    '5. Save Changes',
    '6. Go to Products → Add Product → Facebook Login',
    '7. Go to Facebook Login → Settings',
    '8. Add Valid OAuth Redirect URI:',
    `   ${urls.oauthRedirectUri}`,
    '9. Save Changes',
    '',
    '10. Add yourself as App Tester:',
    '    • Go to Roles → Roles',
    '    • Add your Facebook account as Administrator/Developer',
    '',
    '11. Or switch to Live Mode:',
    '    • Go to Settings → Basic',
    '    • Click "Switch to Live" (requires complete app info)',
    '',
    '💡 Tips:',
    '• Make sure your development server is running',
    '• Test the policy URLs in your browser first',
    '• Use Development Mode for testing',
    '• Switch to Live Mode only when ready for production'
  ];
}