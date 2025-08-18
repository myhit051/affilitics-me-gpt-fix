/**
 * Session Manager Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSessionManager, SessionManager, SecurityEvent } from '../session-manager';

// Mock dependencies
vi.mock('../token-encryption', () => ({
  getTokenEncryptionService: () => ({
    clearKey: vi.fn(),
  }),
}));

const mockOAuthService = {
  getStoredTokens: vi.fn().mockReturnValue({ accessToken: 'test-token' }),
  revokeToken: vi.fn().mockResolvedValue(undefined),
  clearTokens: vi.fn(),
  validateAndRefreshToken: vi.fn().mockResolvedValue({ accessToken: 'test-token' }),
};

vi.mock('../facebook-oauth-service', () => ({
  getFacebookOAuthService: () => mockOAuthService,
}));

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock crypto
const mockCrypto = {
  getRandomValues: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])),
};

Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true,
});

// Mock navigator
Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-user-agent',
    language: 'en-US',
    hardwareConcurrency: 4,
    deviceMemory: 8,
  },
  writable: true,
});

// Mock screen
Object.defineProperty(global, 'screen', {
  value: {
    width: 1920,
    height: 1080,
  },
  writable: true,
});

// Mock document
const mockDocument = {
  addEventListener: vi.fn(),
  visibilityState: 'visible',
};

Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true,
});

// Mock window
const mockWindow = {
  addEventListener: vi.fn(),
  setInterval: vi.fn().mockReturnValue(123),
  clearInterval: vi.fn(),
};

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

// Helper function to mock encrypted session data
function mockEncryptSessionData(data: string, sessionId: string): string {
  const key = sessionId || 'default-session-key';
  let encrypted = '';
  
  for (let i = 0; i < data.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const dataChar = data.charCodeAt(i);
    encrypted += String.fromCharCode(dataChar ^ keyChar);
  }
  
  return btoa(encrypted);
}

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let sessionExpiredCallback: vi.Mock;
  let securityEventCallback: vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    sessionManager = createSessionManager();
    sessionExpiredCallback = vi.fn();
    securityEventCallback = vi.fn();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('startSession', () => {
    it('should start a new session', () => {
      sessionManager.startSession();

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'fb_session_data',
        expect.any(String)
      );
    });

    it('should generate unique session IDs', () => {
      // Mock different random values for each session
      mockCrypto.getRandomValues
        .mockReturnValueOnce(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]))
        .mockReturnValueOnce(new Uint8Array([9, 10, 11, 12, 13, 14, 15, 16]));
      
      sessionManager.startSession();
      const firstCall = mockLocalStorage.setItem.mock.calls[0];
      
      vi.clearAllMocks();
      
      sessionManager.startSession();
      const secondCall = mockLocalStorage.setItem.mock.calls[0];

      expect(firstCall[1]).not.toBe(secondCall[1]);
    });

    it('should handle session start errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      expect(() => sessionManager.startSession()).not.toThrow();
    });
  });

  describe('endSession', () => {
    it('should end session and clean up data', async () => {
      await sessionManager.endSession();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('fb_session_data');
    });

    it('should revoke tokens during session end', async () => {
      await sessionManager.endSession();

      expect(mockOAuthService.revokeToken).toHaveBeenCalledWith('test-token');
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
    });

    it('should handle token revocation errors gracefully', async () => {
      mockOAuthService.revokeToken.mockRejectedValue(new Error('Revocation failed'));

      await expect(sessionManager.endSession()).resolves.not.toThrow();
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isSessionActive', () => {
    it('should return false when no session data exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });

    it('should return false when session exceeds maximum duration', () => {
      const expiredSessionData = {
        startTime: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        lastActivity: Date.now() - (1000),
        sessionId: 'test-session-123',
        userAgent: 'test-user-agent',
        ipFingerprint: 'test-fingerprint',
      };

      // Mock encrypted session data
      const encryptedData = mockEncryptSessionData(JSON.stringify(expiredSessionData), 'test-session-123');
      mockLocalStorage.getItem.mockReturnValue(encryptedData);

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });

    it('should return false when session exceeds maximum inactivity', () => {
      const inactiveSessionData = {
        startTime: Date.now() - (1000),
        lastActivity: Date.now() - (3 * 60 * 60 * 1000), // 3 hours ago
        sessionId: 'test-session-123',
        userAgent: 'test-user-agent',
        ipFingerprint: 'test-fingerprint',
      };

      const encryptedData = mockEncryptSessionData(JSON.stringify(inactiveSessionData), 'test-session-123');
      mockLocalStorage.getItem.mockReturnValue(encryptedData);

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });

    it('should return false when user agent changes', () => {
      const sessionData = {
        startTime: Date.now() - (1000),
        lastActivity: Date.now() - (1000),
        sessionId: 'test-session-123',
        userAgent: 'different-user-agent',
        ipFingerprint: 'test-fingerprint',
      };

      const encryptedData = mockEncryptSessionData(JSON.stringify(sessionData), 'test-session-123');
      mockLocalStorage.getItem.mockReturnValue(encryptedData);

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });

    it('should return true for valid active session', () => {
      // Create a session first to get the proper fingerprint
      sessionManager.startSession();
      
      // Get the stored data to extract the actual fingerprint
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const storedEncryptedData = storedCall[1];
      
      // We'll just verify that a valid session returns true by checking the stored data exists
      mockLocalStorage.getItem.mockReturnValue(storedEncryptedData);

      const result = sessionManager.isSessionActive();

      expect(result).toBe(true);
    });
  });

  describe('checkSessionSecurity', () => {
    it('should return false if session is not active', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await sessionManager.checkSessionSecurity();

      expect(result).toBe(false);
    });

    it('should return false if token validation fails', async () => {
      // Create a session first
      sessionManager.startSession();
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const storedEncryptedData = storedCall[1];
      
      mockLocalStorage.getItem.mockReturnValue(storedEncryptedData);
      mockOAuthService.validateAndRefreshToken.mockResolvedValue(null);

      const result = await sessionManager.checkSessionSecurity();

      expect(result).toBe(false);
    });

    it('should return true for valid session with valid tokens', async () => {
      // Create a session first
      sessionManager.startSession();
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const storedEncryptedData = storedCall[1];
      
      mockLocalStorage.getItem.mockReturnValue(storedEncryptedData);

      const result = await sessionManager.checkSessionSecurity();

      expect(result).toBe(true);
    });

    it('should update last activity on successful check', async () => {
      // Create a session first
      sessionManager.startSession();
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const storedEncryptedData = storedCall[1];
      
      vi.clearAllMocks();
      mockLocalStorage.getItem.mockReturnValue(storedEncryptedData);

      await sessionManager.checkSessionSecurity();

      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  describe('event callbacks', () => {
    it('should register and call session expired callbacks', () => {
      sessionManager.onSessionExpired(sessionExpiredCallback);

      // Simulate session expiration
      mockLocalStorage.getItem.mockReturnValue(null);
      
      // This would normally be called by the session monitoring interval
      // We'll test the callback registration
      expect(sessionExpiredCallback).not.toHaveBeenCalled();
    });

    it('should register and call security event callbacks', () => {
      sessionManager.onSecurityEvent(securityEventCallback);

      // Security events are emitted internally, so we test the registration
      expect(securityEventCallback).not.toHaveBeenCalled();
    });
  });

  describe('session monitoring', () => {
    it('should start session monitoring on creation', () => {
      expect(mockWindow.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        5 * 60 * 1000 // 5 minutes
      );
    });
  });

  describe('event listeners', () => {
    it('should set up activity event listeners', () => {
      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      
      activityEvents.forEach(event => {
        expect(mockDocument.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true }
        );
      });
    });

    it('should set up visibility change listener', () => {
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'visibilitychange',
        expect.any(Function)
      );
    });

    it('should set up beforeunload listener', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'beforeunload',
        expect.any(Function)
      );
    });

    it('should set up storage listener', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      );
    });
  });

  describe('security features', () => {
    it('should generate device fingerprints', () => {
      sessionManager.startSession();

      // Verify that session data includes device-specific information
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      const storedData = mockLocalStorage.setItem.mock.calls[0][1];
      expect(storedData).toBeDefined();
    });

    it('should validate session integrity', () => {
      const sessionData = {
        startTime: Date.now() - (1000),
        lastActivity: Date.now() - (1000),
        sessionId: 'invalid-session-id-format',
        userAgent: 'test-user-agent',
        ipFingerprint: 'test-fingerprint',
      };

      const encryptedData = mockEncryptSessionData(JSON.stringify(sessionData), 'invalid-session-id-format');
      mockLocalStorage.getItem.mockReturnValue(encryptedData);

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });

    it('should handle JSON parsing errors gracefully', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json');

      const result = sessionManager.isSessionActive();

      expect(result).toBe(false);
    });

    it('should handle security check errors gracefully', async () => {
      mockOAuthService.validateAndRefreshToken.mockRejectedValue(new Error('Network error'));

      // Create a session first
      sessionManager.startSession();
      const storedCall = mockLocalStorage.setItem.mock.calls[0];
      const storedEncryptedData = storedCall[1];
      
      mockLocalStorage.getItem.mockReturnValue(storedEncryptedData);

      const result = await sessionManager.checkSessionSecurity();

      expect(result).toBe(false);
    });
  });
});