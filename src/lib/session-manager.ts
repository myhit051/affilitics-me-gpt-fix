/**
 * Session Manager
 * Handles session lifecycle, token cleanup, and security events
 */

import { getTokenEncryptionService } from './token-encryption';
import { getFacebookOAuthService } from './facebook-oauth-service';

export interface SessionManager {
  startSession(): void;
  endSession(): Promise<void>;
  isSessionActive(): boolean;
  onSessionExpired(callback: () => void): void;
  onSecurityEvent(callback: (event: SecurityEvent) => void): void;
  checkSessionSecurity(): Promise<boolean>;
}

export interface SecurityEvent {
  type: 'token_expired' | 'invalid_token' | 'suspicious_activity' | 'session_timeout';
  timestamp: Date;
  details: string;
}

interface SessionData {
  startTime: number;
  lastActivity: number;
  sessionId: string;
  userAgent: string;
  ipFingerprint: string;
}

export class SessionManagerImpl implements SessionManager {
  private readonly sessionKey = 'fb_session_data';
  private readonly maxSessionDuration = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxInactivity = 2 * 60 * 60 * 1000; // 2 hours
  private sessionCheckInterval: number | null = null;
  private sessionExpiredCallbacks: (() => void)[] = [];
  private securityEventCallbacks: ((event: SecurityEvent) => void)[] = [];
  private currentSessionId: string | null = null;

  constructor() {
    this.setupEventListeners();
    this.startSessionMonitoring();
  }

  /**
   * Starts a new session
   */
  startSession(): void {
    try {
      const sessionId = this.generateSessionId();
      const sessionData: SessionData = {
        startTime: Date.now(),
        lastActivity: Date.now(),
        sessionId,
        userAgent: navigator.userAgent,
        ipFingerprint: this.generateIPFingerprint(),
      };

      this.currentSessionId = sessionId;
      this.storeSessionData(sessionData);
      
      console.info('Session started:', sessionId);
    } catch (error) {
      console.error('Failed to start session:', error);
      this.emitSecurityEvent('suspicious_activity', 'Failed to start session');
    }
  }

  /**
   * Ends the current session and cleans up all data
   */
  async endSession(): Promise<void> {
    try {
      console.info('Ending session');

      // Revoke tokens if available
      const oauthService = getFacebookOAuthService();
      const tokens = oauthService.getStoredTokens();
      
      if (tokens?.accessToken) {
        try {
          await oauthService.revokeToken(tokens.accessToken);
        } catch (error) {
          console.warn('Failed to revoke token during session end:', error);
        }
      }

      // Clear all stored data
      oauthService.clearTokens();
      this.clearSessionData();
      
      // Clear encryption keys
      const encryptionService = getTokenEncryptionService();
      encryptionService.clearKey();

      // Clear current session
      this.currentSessionId = null;

      console.info('Session ended successfully');
    } catch (error) {
      console.error('Error ending session:', error);
      // Force cleanup even if errors occur
      this.forceCleanup();
    }
  }

  /**
   * Checks if session is currently active
   */
  isSessionActive(): boolean {
    try {
      const sessionData = this.getSessionData();
      if (!sessionData) {
        return false;
      }

      const now = Date.now();
      
      // Check session duration
      if (now - sessionData.startTime > this.maxSessionDuration) {
        this.emitSecurityEvent('session_timeout', 'Session exceeded maximum duration');
        return false;
      }

      // Check inactivity
      if (now - sessionData.lastActivity > this.maxInactivity) {
        this.emitSecurityEvent('session_timeout', 'Session exceeded maximum inactivity');
        return false;
      }

      // Check session integrity
      if (!this.validateSessionIntegrity(sessionData)) {
        this.emitSecurityEvent('suspicious_activity', 'Session integrity check failed');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking session status:', error);
      return false;
    }
  }

  /**
   * Registers callback for session expiration events
   */
  onSessionExpired(callback: () => void): void {
    this.sessionExpiredCallbacks.push(callback);
  }

  /**
   * Registers callback for security events
   */
  onSecurityEvent(callback: (event: SecurityEvent) => void): void {
    this.securityEventCallbacks.push(callback);
  }

  /**
   * Performs comprehensive session security check
   */
  async checkSessionSecurity(): Promise<boolean> {
    try {
      // Check if session is active
      if (!this.isSessionActive()) {
        return false;
      }

      // Validate OAuth tokens
      const oauthService = getFacebookOAuthService();
      const tokens = await oauthService.validateAndRefreshToken();
      
      if (!tokens) {
        this.emitSecurityEvent('invalid_token', 'Token validation failed');
        return false;
      }

      // Update last activity
      this.updateLastActivity();

      return true;
    } catch (error) {
      console.error('Session security check failed:', error);
      this.emitSecurityEvent('suspicious_activity', 'Security check failed');
      return false;
    }
  }

  /**
   * Updates last activity timestamp
   */
  private updateLastActivity(): void {
    try {
      const sessionData = this.getSessionData();
      if (sessionData) {
        sessionData.lastActivity = Date.now();
        this.storeSessionData(sessionData);
      }
    } catch (error) {
      console.warn('Failed to update last activity:', error);
    }
  }

  /**
   * Sets up event listeners for session management
   */
  private setupEventListeners(): void {
    // Update activity on user interactions
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, this.handleUserActivity.bind(this), { passive: true });
    });

    // Handle page visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Handle beforeunload for cleanup
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));

    // Handle storage events (for multi-tab scenarios)
    window.addEventListener('storage', this.handleStorageChange.bind(this));
  }

  /**
   * Handles user activity events
   */
  private handleUserActivity(): void {
    if (this.isSessionActive()) {
      this.updateLastActivity();
    }
  }

  /**
   * Handles page visibility changes
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // Check session when page becomes visible
      if (!this.checkSessionSecurity()) {
        this.handleSessionExpired();
      }
    }
  }

  /**
   * Handles beforeunload event
   */
  private handleBeforeUnload(): void {
    // Don't end session on page unload as user might be navigating
    // Session will be validated when they return
  }

  /**
   * Handles storage changes (multi-tab scenarios)
   */
  private handleStorageChange(event: StorageEvent): void {
    if (event.key === this.sessionKey && event.newValue === null) {
      // Session was cleared in another tab
      this.handleSessionExpired();
    }
  }

  /**
   * Starts session monitoring
   */
  private startSessionMonitoring(): void {
    // Check session every 5 minutes
    this.sessionCheckInterval = window.setInterval(() => {
      if (!this.checkSessionSecurity()) {
        this.handleSessionExpired();
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stops session monitoring
   */
  private stopSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  /**
   * Handles session expiration
   */
  private handleSessionExpired(): void {
    console.warn('Session expired');
    
    // End session
    this.endSession().catch(error => {
      console.error('Error ending expired session:', error);
    });

    // Notify callbacks
    this.sessionExpiredCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in session expired callback:', error);
      }
    });
  }

  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    
    const randomString = Array.from(randomBytes)
      .map(b => b.toString(36))
      .join('');
    
    return `${timestamp}-${randomString}`;
  }

  /**
   * Generates an IP fingerprint for session validation
   */
  private generateIPFingerprint(): string {
    // Create a fingerprint based on available network information
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.deviceMemory || 0,
    ].join('|');

    // Hash the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    
    // Simple hash for fingerprinting (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data[i];
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString(36);
  }

  /**
   * Validates session integrity
   */
  private validateSessionIntegrity(sessionData: SessionData): boolean {
    // Check if user agent matches
    if (sessionData.userAgent !== navigator.userAgent) {
      return false;
    }

    // Check if IP fingerprint matches (basic check)
    const currentFingerprint = this.generateIPFingerprint();
    if (sessionData.ipFingerprint !== currentFingerprint) {
      // Allow some flexibility for network changes
      console.warn('IP fingerprint mismatch - possible network change');
    }

    // Check session ID format
    if (!sessionData.sessionId || !sessionData.sessionId.includes('-')) {
      return false;
    }

    return true;
  }

  /**
   * Stores session data securely
   */
  private storeSessionData(sessionData: SessionData): void {
    try {
      const encryptedData = this.encryptSessionData(JSON.stringify(sessionData));
      localStorage.setItem(this.sessionKey, encryptedData);
    } catch (error) {
      console.error('Failed to store session data:', error);
      throw new Error('Failed to store session data');
    }
  }

  /**
   * Gets stored session data
   */
  private getSessionData(): SessionData | null {
    try {
      const encryptedData = localStorage.getItem(this.sessionKey);
      if (!encryptedData) {
        return null;
      }

      const decryptedData = this.decryptSessionData(encryptedData);
      return JSON.parse(decryptedData);
    } catch (error) {
      console.warn('Failed to get session data:', error);
      this.clearSessionData();
      return null;
    }
  }

  /**
   * Clears session data
   */
  private clearSessionData(): void {
    try {
      localStorage.removeItem(this.sessionKey);
    } catch (error) {
      console.warn('Failed to clear session data:', error);
    }
  }

  /**
   * Simple encryption for session data
   */
  private encryptSessionData(data: string): string {
    // Use a simple XOR encryption with session-specific key
    const key = this.currentSessionId || 'default-session-key';
    let encrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const dataChar = data.charCodeAt(i);
      encrypted += String.fromCharCode(dataChar ^ keyChar);
    }
    
    return btoa(encrypted);
  }

  /**
   * Simple decryption for session data
   */
  private decryptSessionData(encryptedData: string): string {
    try {
      const encrypted = atob(encryptedData);
      const key = this.currentSessionId || 'default-session-key';
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        const keyChar = key.charCodeAt(i % key.length);
        const encryptedChar = encrypted.charCodeAt(i);
        decrypted += String.fromCharCode(encryptedChar ^ keyChar);
      }
      
      return decrypted;
    } catch (error) {
      throw new Error('Failed to decrypt session data');
    }
  }

  /**
   * Forces cleanup of all data
   */
  private forceCleanup(): void {
    try {
      // Clear all possible storage keys
      const keysToRemove = [
        'facebook_auth_data',
        'fb_session_data',
        'fb_token_key_material',
        'facebook_sync_preferences',
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`Failed to remove ${key}:`, error);
        }
      });

      this.currentSessionId = null;
      this.stopSessionMonitoring();
    } catch (error) {
      console.error('Force cleanup failed:', error);
    }
  }

  /**
   * Emits security events to registered callbacks
   */
  private emitSecurityEvent(type: SecurityEvent['type'], details: string): void {
    const event: SecurityEvent = {
      type,
      timestamp: new Date(),
      details,
    };

    console.warn('Security event:', event);

    this.securityEventCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in security event callback:', error);
      }
    });
  }
}

/**
 * Factory function to create session manager
 */
export function createSessionManager(): SessionManager {
  return new SessionManagerImpl();
}

/**
 * Singleton instance for global use
 */
let sessionManagerInstance: SessionManager | null = null;

export function getSessionManager(): SessionManager {
  if (!sessionManagerInstance) {
    sessionManagerInstance = createSessionManager();
  }
  return sessionManagerInstance;
}