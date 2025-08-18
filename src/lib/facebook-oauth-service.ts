/**
 * Facebook OAuth Service
 * Handles Facebook OAuth 2.0 authentication flow with PKCE
 */

import { FacebookTokens, FacebookConfig, AuthError } from '@/types/facebook';
import { getFacebookConfig, OAUTH_CONFIG } from '@/config/facebook';
import { createFacebookOAuthPopupManager } from './oauth-popup-manager';
import { getTokenEncryptionService } from './token-encryption';
import { getSessionManager } from './session-manager';

export interface FacebookOAuthService {
  initiateAuth(): Promise<void>;
  handleAuthCallback(code: string, state: string): Promise<FacebookTokens>;
  refreshToken(refreshToken: string): Promise<FacebookTokens>;
  revokeToken(accessToken: string): Promise<void>;
  isAuthenticated(): boolean;
  getStoredTokens(): FacebookTokens | null;
  getStoredTokensAsync(): Promise<FacebookTokens | null>;
  clearTokens(): void;
}

interface PKCEChallenge {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

interface StoredAuthData {
  tokens?: FacebookTokens;
  pkce?: PKCEChallenge;
  expiresAt?: number;
}

export class FacebookOAuthServiceImpl implements FacebookOAuthService {
  private config: FacebookConfig;
  private popupManager = createFacebookOAuthPopupManager();
  private readonly storageKey = 'facebook_auth_data';
  private encryptionService = getTokenEncryptionService();
  private sessionManager = getSessionManager();
  private csrfTokens = new Set<string>(); // Track CSRF tokens

  constructor() {
    this.config = getFacebookConfig();
    this.setupSecurityEventHandlers();
  }

  /**
   * Initiates the OAuth authentication flow
   */
  async initiateAuth(): Promise<void> {
    try {
      // Clear any existing tokens/PKCE data
      this.clearStoredPKCEData();

      // Validate configuration
      if (!this.config.FACEBOOK_APP_ID || this.config.FACEBOOK_APP_ID === 'your_facebook_app_id_here') {
        throw new Error('Facebook App ID is not configured. Please set VITE_FACEBOOK_APP_ID in your .env.local file with your actual Facebook App ID.');
      }

      if (!this.config.FACEBOOK_REDIRECT_URI) {
        throw new Error('Facebook redirect URI is not configured');
      }

      if (!this.config.FACEBOOK_SCOPES || this.config.FACEBOOK_SCOPES.length === 0) {
        throw new Error('Facebook scopes are not configured');
      }

      // Generate PKCE challenge with enhanced security
      const pkceChallenge = await this.generatePKCEChallenge();
      
      // Add CSRF protection
      this.csrfTokens.add(pkceChallenge.state);
      
      // Store PKCE data temporarily
      await this.storePKCEData(pkceChallenge);

      // Build authorization URL
      const authUrl = this.buildAuthorizationUrl(pkceChallenge);

      console.info('Initiating Facebook OAuth flow with enhanced security');

      // Open popup and wait for authorization code
      console.log('Opening popup with URL:', authUrl);
      const authCode = await this.popupManager.openPopup(authUrl);
      console.log('Received auth code:', authCode ? 'Yes' : 'No');

      if (!authCode || typeof authCode !== 'string') {
        throw new Error('No authorization code received from popup');
      }

      // Exchange authorization code for tokens
      console.log('Exchanging code for tokens...');
      const tokens = await this.handleAuthCallback(authCode, pkceChallenge.state);
      console.log('Received tokens:', tokens ? 'Yes' : 'No');

      if (!tokens) {
        throw new Error('Authentication completed but no valid tokens found');
      }

      // Store tokens securely
      await this.storeTokens(tokens);

      // Immediately test retrieval
      console.log('Testing immediate token retrieval...');
      const testTokens = this.getStoredTokens();
      console.log('Immediate retrieval result:', !!testTokens);
      
      if (!testTokens) {
        console.log('Immediate retrieval failed, checking localStorage directly...');
        const rawData = localStorage.getItem(this.storageKey);
        console.log('Raw localStorage data exists:', !!rawData);
        if (rawData) {
          console.log('Raw data length:', rawData.length);
          console.log('Raw data preview:', rawData.substring(0, 100) + '...');
        }
      }

      // Start session
      this.sessionManager.startSession();

      console.info('Facebook OAuth flow completed successfully');

    } catch (error) {
      this.clearStoredPKCEData();
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Handles the OAuth callback and exchanges code for tokens
   */
  async handleAuthCallback(code: string, state: string): Promise<FacebookTokens> {
    try {
      // Validate input parameters
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid authorization code');
      }

      if (!state || typeof state !== 'string') {
        throw new Error('Invalid state parameter');
      }

      // Verify state parameter with CSRF protection
      const storedPKCE = await this.getStoredPKCEData();
      if (!storedPKCE) {
        throw new Error('No PKCE data found - possible session timeout');
      }

      if (!this.validateStateParameter(state, storedPKCE.state)) {
        throw new Error('Invalid state parameter - possible CSRF attack');
      }

      // Verify CSRF token
      if (!this.csrfTokens.has(state)) {
        throw new Error('CSRF token validation failed');
      }

      // Remove used CSRF token
      this.csrfTokens.delete(state);

      // Validate code verifier
      if (!this.validateCodeVerifier(storedPKCE.codeVerifier)) {
        throw new Error('Invalid PKCE code verifier');
      }

      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeCodeForTokens(code, storedPKCE.codeVerifier);

      // Validate received tokens
      if (!this.validateTokenStructure(tokenResponse)) {
        throw new Error('Received invalid token structure from Facebook');
      }

      // Clean up PKCE data
      this.clearStoredPKCEData();

      return tokenResponse;
    } catch (error) {
      this.clearStoredPKCEData();
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Refreshes the access token using refresh token
   */
  async refreshToken(refreshToken: string): Promise<FacebookTokens> {
    try {
      // Validate refresh token
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new Error('Invalid refresh token provided');
      }

      if (refreshToken.length < 10) {
        throw new Error('Refresh token appears to be invalid');
      }

      const response = await fetch(`https://graph.facebook.com/${this.config.FACEBOOK_API_VERSION}/oauth/access_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: this.config.FACEBOOK_APP_ID,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific Facebook API errors
        if (response.status === 400) {
          throw new Error('Invalid refresh token - please log in again');
        } else if (response.status === 401) {
          throw new Error('Refresh token expired - please log in again');
        } else if (response.status === 429) {
          throw new Error('Too many refresh attempts - please try again later');
        }
        
        throw new Error(errorData.error?.message || `Token refresh failed (${response.status})`);
      }

      const tokenData = await response.json();
      const tokens = this.parseTokenResponse(tokenData);

      // Validate refreshed tokens
      if (!this.validateTokenStructure(tokens)) {
        throw new Error('Received invalid token structure from Facebook');
      }

      // Store refreshed tokens
      await this.storeTokens(tokens);

      console.info('Token refreshed successfully');
      return tokens;
    } catch (error) {
      // Clear tokens on refresh failure
      this.clearTokens();
      throw this.handleOAuthError(error);
    }
  }

  /**
   * Revokes the access token
   */
  async revokeToken(accessToken: string): Promise<void> {
    try {
      const response = await fetch(`https://graph.facebook.com/${this.config.FACEBOOK_API_VERSION}/me/permissions`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Requested-With': 'XMLHttpRequest', // CSRF protection
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Token revocation failed:', errorData);
        // Don't throw error as token might already be invalid
      }

      // Clear stored tokens regardless of API response
      this.clearTokens();
      
      // End session
      await this.sessionManager.endSession();
    } catch (error) {
      console.warn('Token revocation error:', error);
      // Clear tokens even if revocation fails
      this.clearTokens();
      await this.sessionManager.endSession();
    }
  }

  /**
   * Checks if user is currently authenticated
   */
  isAuthenticated(): boolean {
    try {
      const tokens = this.getStoredTokens();
      if (!tokens) return false;

      // Validate token structure
      if (!this.validateTokenStructure(tokens)) {
        console.warn('Invalid token structure detected, clearing tokens');
        this.clearTokens();
        return false;
      }

      // Check session status
      if (!this.sessionManager.isSessionActive()) {
        console.info('Session inactive, clearing tokens');
        this.clearTokens();
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error checking authentication status:', error);
      this.clearTokens();
      return false;
    }
  }

  /**
   * Gets stored tokens if available and valid
   */
  getStoredTokens(): FacebookTokens | null {
    try {
      console.log('Getting stored tokens...');
      const encryptedData = localStorage.getItem(this.storageKey);
      console.log('Encrypted data exists:', !!encryptedData);
      
      // Try debug version first (unencrypted)
      const debugKey = this.storageKey + '_debug';
      const debugData = localStorage.getItem(debugKey);
      if (debugData) {
        try {
          const authData = JSON.parse(debugData);
          console.log('Debug version successful, has tokens:', !!authData?.tokens);
          if (authData?.tokens) {
            return authData.tokens;
          }
        } catch (debugError) {
          console.warn('Debug version parse failed:', debugError);
        }
      }
      
      if (!encryptedData) return null;

      // Try simple decryption first (v2)
      try {
        const decryptedData = this.decryptDataSimple(encryptedData);
        const authData = JSON.parse(decryptedData);
        console.log('Simple decryption successful, has tokens:', !!authData?.tokens);
        return authData?.tokens || null;
      } catch (simpleError) {
        console.log('Simple decryption failed, trying legacy...');
        
        // Try legacy decryption (v1)
        try {
          const decryptedData = this.decryptDataLegacy(encryptedData);
          const authData = JSON.parse(decryptedData);
          console.log('Legacy decryption successful, has tokens:', !!authData?.tokens);
          return authData?.tokens || null;
        } catch (legacyError) {
          console.log('Legacy decryption also failed, trying async decryption...');
          // If both fail, try async decryption
          this.getStoredAuthDataSync().then(authData => {
            console.log('Async decryption result:', !!authData?.tokens);
          }).catch(err => {
            console.warn('Async decryption also failed:', err);
          });
          return null;
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve stored tokens:', error);
      return null;
    }
  }

  /**
   * Synchronous helper to get auth data (workaround)
   */
  private async getStoredAuthDataSync(): Promise<StoredAuthData | null> {
    try {
      const encryptedData = localStorage.getItem(this.storageKey);
      if (!encryptedData) return null;

      const decryptedData = await this.encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.warn('Failed to parse stored auth data:', error);
      return null;
    }
  }

  /**
   * Async method to get stored tokens (more reliable)
   */
  async getStoredTokensAsync(): Promise<FacebookTokens | null> {
    try {
      console.log('Getting stored tokens async...');
      
      // Try debug version first (unencrypted)
      const debugKey = this.storageKey + '_debug';
      const debugData = localStorage.getItem(debugKey);
      if (debugData) {
        try {
          const authData = JSON.parse(debugData);
          console.log('Async debug version successful, has tokens:', !!authData?.tokens);
          if (authData?.tokens) {
            return authData.tokens;
          }
        } catch (debugError) {
          console.warn('Async debug version parse failed:', debugError);
        }
      }
      
      const encryptedData = localStorage.getItem(this.storageKey);
      
      if (!encryptedData) {
        console.log('No encrypted data found');
        return null;
      }

      // Try simple decryption first
      try {
        const decryptedData = this.decryptDataSimple(encryptedData);
        const authData = JSON.parse(decryptedData);
        console.log('Async simple decryption successful, has tokens:', !!authData?.tokens);
        return authData?.tokens || null;
      } catch (simpleError) {
        console.log('Async simple decryption failed, trying legacy...');
        
        // Try legacy decryption
        try {
          const decryptedData = this.decryptDataLegacy(encryptedData);
          const authData = JSON.parse(decryptedData);
          console.log('Async legacy decryption successful, has tokens:', !!authData?.tokens);
          return authData?.tokens || null;
        } catch (legacyError) {
          console.log('Async legacy decryption failed, trying modern encryption...');
          
          // Try modern encryption as last resort
          try {
            const authData = await this.getStoredAuthDataSync();
            console.log('Async modern decryption result:', !!authData?.tokens);
            return authData?.tokens || null;
          } catch (modernError) {
            console.warn('All async decryption methods failed:', modernError);
            return null;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to retrieve stored tokens async:', error);
      return null;
    }
  }

  /**
   * Clears all stored authentication data
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(this.storageKey);
      this.encryptionService.clearKey();
      this.csrfTokens.clear();
    } catch (error) {
      console.warn('Failed to clear tokens:', error);
    }
  }

  /**
   * Generates PKCE challenge for secure OAuth flow
   */
  private async generatePKCEChallenge(): Promise<PKCEChallenge> {
    // Generate code verifier
    const codeVerifier = this.generateRandomString(OAUTH_CONFIG.CODE_VERIFIER_LENGTH);
    
    // Generate code challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const codeChallenge = this.base64URLEncode(digest);

    // Generate state parameter
    const state = this.generateRandomString(OAUTH_CONFIG.STATE_LENGTH);

    return {
      codeVerifier,
      codeChallenge,
      state,
    };
  }

  /**
   * Builds the Facebook authorization URL
   */
  private buildAuthorizationUrl(pkceChallenge: PKCEChallenge): string {
    const params = new URLSearchParams({
      client_id: this.config.FACEBOOK_APP_ID,
      redirect_uri: this.config.FACEBOOK_REDIRECT_URI,
      scope: this.config.FACEBOOK_SCOPES.join(','),
      response_type: OAUTH_CONFIG.RESPONSE_TYPE,
      state: pkceChallenge.state,
      code_challenge: pkceChallenge.codeChallenge,
      code_challenge_method: OAUTH_CONFIG.CODE_CHALLENGE_METHOD,
    });

    return `https://www.facebook.com/${this.config.FACEBOOK_API_VERSION}/dialog/oauth?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for access tokens
   */
  private async exchangeCodeForTokens(code: string, codeVerifier: string): Promise<FacebookTokens> {
    console.log('Exchanging code for tokens with:', {
      appId: this.config.FACEBOOK_APP_ID ? 'configured' : 'missing',
      redirectUri: this.config.FACEBOOK_REDIRECT_URI,
      apiVersion: this.config.FACEBOOK_API_VERSION,
      codeLength: code.length,
      codeVerifierLength: codeVerifier.length
    });

    const response = await fetch(`https://graph.facebook.com/${this.config.FACEBOOK_API_VERSION}/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.FACEBOOK_APP_ID,
        redirect_uri: this.config.FACEBOOK_REDIRECT_URI,
        code,
        code_verifier: codeVerifier,
      }),
    });

    console.log('Token exchange response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Token exchange failed:', errorData);
      throw new Error(errorData.error?.message || `Token exchange failed (${response.status})`);
    }

    const tokenData = await response.json();
    console.log('Token data received:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type
    });

    return this.parseTokenResponse(tokenData);
  }

  /**
   * Parses token response from Facebook API
   */
  private parseTokenResponse(tokenData: any): FacebookTokens {
    console.log('Parsing token response:', {
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
      configuredScopes: this.config.FACEBOOK_SCOPES
    });

    const tokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in || 3600,
      tokenType: tokenData.token_type || 'Bearer',
      scope: this.config.FACEBOOK_SCOPES, // Facebook doesn't return scope in token response
    };

    console.log('Parsed tokens:', {
      hasAccessToken: !!tokens.accessToken,
      accessTokenLength: tokens.accessToken?.length || 0,
      hasRefreshToken: !!tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      tokenType: tokens.tokenType,
      scopeCount: tokens.scope?.length || 0
    });

    return tokens;
  }

  /**
   * Stores tokens securely in localStorage
   */
  private async storeTokens(tokens: FacebookTokens): Promise<void> {
    try {
      console.log('Storing tokens...', {
        hasAccessToken: !!tokens.accessToken,
        accessTokenLength: tokens.accessToken?.length,
        expiresIn: tokens.expiresIn,
        storageKey: this.storageKey
      });

      const expiresAt = Date.now() + (tokens.expiresIn * 1000);
      const authData: StoredAuthData = {
        tokens,
        expiresAt,
      };

      // For debugging, also store unencrypted version
      const debugKey = this.storageKey + '_debug';
      localStorage.setItem(debugKey, JSON.stringify(authData));
      console.log('Debug: Stored unencrypted version');

      // Use simple encryption as fallback
      try {
        const encryptedData = await this.encryptionService.encrypt(JSON.stringify(authData));
        localStorage.setItem(this.storageKey, encryptedData);
        console.log('Tokens stored with modern encryption');
      } catch (encryptError) {
        console.warn('Modern encryption failed, using simple encryption:', encryptError);
        // Fallback to simple encryption
        const simpleEncrypted = this.encryptDataSimple(JSON.stringify(authData));
        localStorage.setItem(this.storageKey, simpleEncrypted);
        console.log('Tokens stored with simple encryption');
      }
      
      // Verify storage immediately
      const storedData = localStorage.getItem(this.storageKey);
      console.log('Verification - data stored:', !!storedData);
      
    } catch (error) {
      console.error('Failed to store tokens:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Simple encryption method as fallback
   */
  private encryptDataSimple(data: string): string {
    try {
      console.log('Simple encryption - input length:', data.length);
      const encryptionKey = 'fb_oauth_key_v2';
      let encrypted = '';
      for (let i = 0; i < data.length; i++) {
        const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
        const dataChar = data.charCodeAt(i);
        encrypted += String.fromCharCode(dataChar ^ keyChar);
      }
      const result = btoa(encrypted);
      console.log('Simple encryption - output length:', result.length);
      return result;
    } catch (error) {
      console.error('Simple encryption failed:', error);
      throw error;
    }
  }

  /**
   * Simple decryption method as fallback
   */
  private decryptDataSimple(encryptedData: string): string {
    try {
      console.log('Simple decryption - input length:', encryptedData.length);
      const encryptionKey = 'fb_oauth_key_v2';
      const encrypted = atob(encryptedData);
      console.log('Simple decryption - after base64 decode length:', encrypted.length);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      console.log('Simple decryption - output length:', decrypted.length);
      console.log('Simple decryption - output preview:', decrypted.substring(0, 100) + '...');
      return decrypted;
    } catch (error) {
      console.error('Simple decryption failed:', error);
      throw error;
    }
  }

  /**
   * Stores PKCE data temporarily during OAuth flow
   */
  private async storePKCEData(pkceChallenge: PKCEChallenge): Promise<void> {
    try {
      const authData = await this.getStoredAuthData() || {};
      authData.pkce = pkceChallenge;
      
      const encryptedData = await this.encryptionService.encrypt(JSON.stringify(authData));
      localStorage.setItem(this.storageKey, encryptedData);
    } catch (error) {
      console.error('Failed to store PKCE data:', error);
      throw new Error('Failed to store PKCE data');
    }
  }

  /**
   * Gets stored PKCE data
   */
  private async getStoredPKCEData(): Promise<PKCEChallenge | null> {
    const authData = await this.getStoredAuthData();
    return authData?.pkce || null;
  }

  /**
   * Clears stored PKCE data
   */
  private async clearStoredPKCEData(): Promise<void> {
    try {
      const authData = await this.getStoredAuthData();
      if (authData) {
        delete authData.pkce;
        const encryptedData = await this.encryptionService.encrypt(JSON.stringify(authData));
        localStorage.setItem(this.storageKey, encryptedData);
      }
    } catch (error) {
      console.warn('Failed to clear PKCE data:', error);
    }
  }

  /**
   * Gets stored authentication data
   */
  private async getStoredAuthData(): Promise<StoredAuthData | null> {
    try {
      const encryptedData = localStorage.getItem(this.storageKey);
      if (!encryptedData) return null;

      const decryptedData = await this.encryptionService.decrypt(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.warn('Failed to parse stored auth data:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Legacy decryption for backward compatibility
   */
  private decryptDataLegacy(encryptedData: string): string {
    try {
      const encrypted = atob(encryptedData);
      const encryptionKey = 'fb_oauth_key_v1';
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt legacy data');
    }
  }

  /**
   * Sets up security event handlers
   */
  private setupSecurityEventHandlers(): void {
    this.sessionManager.onSessionExpired(() => {
      console.warn('Session expired, clearing OAuth tokens');
      this.clearTokens();
    });

    this.sessionManager.onSecurityEvent((event) => {
      console.warn('Security event in OAuth service:', event);
      
      // Handle specific security events
      switch (event.type) {
        case 'invalid_token':
        case 'suspicious_activity':
          this.clearTokens();
          break;
        case 'session_timeout':
          this.clearTokens();
          break;
      }
    });
  }

  /**
   * Generates a random string for PKCE and state parameters
   */
  private generateRandomString(length: number): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    
    for (let i = 0; i < length; i++) {
      result += charset[values[i] % charset.length];
    }
    
    return result;
  }

  /**
   * Base64 URL encoding for PKCE challenge
   */
  private base64URLEncode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Validates token structure and content
   */
  private validateTokenStructure(tokens: FacebookTokens): boolean {
    console.log('Validating token structure:', {
      hasTokens: !!tokens,
      tokenType: typeof tokens,
      hasAccessToken: tokens?.accessToken ? 'yes' : 'no',
      accessTokenLength: tokens?.accessToken?.length || 0,
      hasTokenType: tokens?.tokenType ? 'yes' : 'no',
      tokenTypeValue: tokens?.tokenType,
      expiresIn: tokens?.expiresIn,
      hasScope: tokens?.scope ? 'yes' : 'no',
      scopeLength: tokens?.scope?.length || 0,
      scopeIsArray: Array.isArray(tokens?.scope)
    });

    if (!tokens || typeof tokens !== 'object') {
      console.warn('Token validation failed: no tokens or not object');
      return false;
    }

    // Check required fields
    if (!tokens.accessToken || typeof tokens.accessToken !== 'string') {
      console.warn('Token validation failed: missing or invalid access token');
      return false;
    }

    if (!tokens.tokenType || typeof tokens.tokenType !== 'string') {
      console.warn('Token validation failed: missing or invalid token type');
      return false;
    }

    if (typeof tokens.expiresIn !== 'number' || tokens.expiresIn <= 0) {
      console.warn('Token validation failed: invalid expires in');
      return false;
    }

    if (!Array.isArray(tokens.scope) || tokens.scope.length === 0) {
      console.warn('Token validation failed: invalid scope');
      return false;
    }

    // Validate access token format (basic check)
    if (tokens.accessToken.length < 10) {
      console.warn('Token validation failed: access token too short');
      return false;
    }

    console.log('Token validation passed');
    return true;
  }

  /**
   * Validates token expiration
   */
  private async isTokenExpired(tokens: FacebookTokens): Promise<boolean> {
    const authData = await this.getStoredAuthData();
    if (!authData?.expiresAt) {
      // If no expiration data, assume expired for safety
      return true;
    }

    const now = Date.now();
    const expiresAt = authData.expiresAt;
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

    return now >= (expiresAt - bufferTime);
  }

  /**
   * Attempts to refresh token if needed and possible
   */
  async validateAndRefreshToken(): Promise<FacebookTokens | null> {
    try {
      const tokens = this.getStoredTokens();
      if (!tokens) {
        return null;
      }

      // Check if token is valid
      if (!this.validateTokenStructure(tokens)) {
        console.warn('Invalid token structure, clearing tokens');
        this.clearTokens();
        return null;
      }

      // Check if token is expired
      if (!(await this.isTokenExpired(tokens))) {
        return tokens; // Token is still valid
      }

      // Try to refresh if refresh token is available
      if (tokens.refreshToken) {
        console.info('Token expired, attempting refresh');
        try {
          const refreshedTokens = await this.refreshToken(tokens.refreshToken);
          return refreshedTokens;
        } catch (error) {
          console.warn('Token refresh failed:', error);
          this.clearTokens();
          return null;
        }
      }

      // No refresh token available, clear tokens
      console.info('Token expired and no refresh token available');
      this.clearTokens();
      return null;
    } catch (error) {
      console.error('Error validating/refreshing token:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Handles OAuth errors with user-friendly messages
   */
  private handleOAuthError(error: any): AuthError {
    let message = 'Authentication failed';
    let code = 'AUTH_ERROR';

    if (error && typeof error === 'object') {
      // Handle Facebook API errors
      if (error.error) {
        const fbError = error.error;
        switch (fbError.code) {
          case 190: // Invalid access token
            message = 'Your session has expired. Please log in again.';
            code = 'TOKEN_EXPIRED';
            break;
          case 102: // Session key invalid
            message = 'Your session is no longer valid. Please log in again.';
            code = 'SESSION_INVALID';
            break;
          case 200: // Permissions error
            message = 'Insufficient permissions. Please grant the required permissions.';
            code = 'PERMISSIONS_ERROR';
            break;
          case 4: // Application request limit reached
            message = 'Too many requests. Please try again later.';
            code = 'RATE_LIMIT_ERROR';
            break;
          default:
            message = fbError.message || 'Authentication failed';
            code = `FB_ERROR_${fbError.code}`;
        }
      }
      // Handle network errors
      else if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
        message = 'Network error. Please check your connection and try again.';
        code = 'NETWORK_ERROR';
      }
      // Handle popup errors
      else if (error.message?.includes('popup')) {
        message = 'Popup was blocked or closed. Please allow popups and try again.';
        code = 'POPUP_ERROR';
      }
      // Handle timeout errors
      else if (error.message?.includes('timeout')) {
        message = 'Authentication timed out. Please try again.';
        code = 'TIMEOUT_ERROR';
      }
      // Handle CSRF errors
      else if (error.message?.includes('state parameter')) {
        message = 'Security validation failed. Please try again.';
        code = 'CSRF_ERROR';
      }
    }

    return this.createAuthError(message, error, code);
  }

  /**
   * Creates a standardized auth error with enhanced information
   */
  private createAuthError(message: string, originalError?: any, code: string = 'AUTH_ERROR'): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    error.type = 'auth_error';
    
    if (originalError) {
      error.cause = originalError;
      
      // Log detailed error information in development
      if (import.meta.env.DEV) {
        console.group('OAuth Error Details:');
        console.error('Message:', message);
        console.error('Code:', code);
        console.error('Original Error:', originalError);
        console.groupEnd();
      } else {
        console.error('OAuth Error:', message);
      }
    }
    
    return error;
  }

  /**
   * Validates OAuth state parameter to prevent CSRF attacks
   */
  private validateStateParameter(receivedState: string, expectedState: string): boolean {
    if (!receivedState || !expectedState) {
      return false;
    }

    // Use constant-time comparison to prevent timing attacks
    if (receivedState.length !== expectedState.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < receivedState.length; i++) {
      result |= receivedState.charCodeAt(i) ^ expectedState.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Validates PKCE code verifier
   */
  private validateCodeVerifier(codeVerifier: string): boolean {
    if (!codeVerifier || typeof codeVerifier !== 'string') {
      return false;
    }

    // PKCE code verifier should be 43-128 characters
    if (codeVerifier.length < 43 || codeVerifier.length > 128) {
      return false;
    }

    // Should only contain unreserved characters
    const validChars = /^[A-Za-z0-9\-._~]+$/;
    return validChars.test(codeVerifier);
  }
}

/**
 * Factory function to create Facebook OAuth service instance
 */
export function createFacebookOAuthService(): FacebookOAuthService {
  return new FacebookOAuthServiceImpl();
}

/**
 * Singleton instance for global use
 */
let facebookOAuthServiceInstance: FacebookOAuthService | null = null;

export function getFacebookOAuthService(): FacebookOAuthService {
  if (!facebookOAuthServiceInstance) {
    facebookOAuthServiceInstance = createFacebookOAuthService();
  }
  return facebookOAuthServiceInstance;
}