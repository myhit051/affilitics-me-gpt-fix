import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookOAuthServiceImpl, createFacebookOAuthService, getFacebookOAuthService } from '../facebook-oauth-service';
import { FacebookTokens } from '@/types/facebook';

// Mock the config
vi.mock('@/config/facebook', () => ({
  getFacebookConfig: () => ({
    FACEBOOK_APP_ID: 'test_app_id',
    FACEBOOK_API_VERSION: 'v19.0',
    FACEBOOK_REDIRECT_URI: 'http://localhost:3000/auth/facebook/callback',
    FACEBOOK_SCOPES: ['ads_read', 'ads_management'],
  }),
  OAUTH_CONFIG: {
    RESPONSE_TYPE: 'code',
    STATE_LENGTH: 32,
    CODE_CHALLENGE_METHOD: 'S256',
    CODE_VERIFIER_LENGTH: 128,
  },
}));

// Mock the popup manager
const mockPopupManager = {
  openPopup: vi.fn(),
  closePopup: vi.fn(),
  handleMessage: vi.fn(),
};

vi.mock('./oauth-popup-manager', () => ({
  createFacebookOAuthPopupManager: vi.fn(() => mockPopupManager),
}));

// Mock crypto API
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)),
    },
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
  },
});

// Mock fetch
global.fetch = vi.fn();

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
});

// Mock btoa/atob
global.btoa = vi.fn((str) => Buffer.from(str, 'binary').toString('base64'));
global.atob = vi.fn((str) => Buffer.from(str, 'base64').toString('binary'));

// Helper function to encrypt data like the service does
function encryptTestData(data: any): string {
  const jsonData = JSON.stringify(data);
  let encrypted = '';
  const encryptionKey = 'fb_oauth_key_v1';
  for (let i = 0; i < jsonData.length; i++) {
    const keyChar = encryptionKey.charCodeAt(i % encryptionKey.length);
    const dataChar = jsonData.charCodeAt(i);
    encrypted += String.fromCharCode(dataChar ^ keyChar);
  }
  return btoa(encrypted);
}

describe('FacebookOAuthServiceImpl', () => {
  let oauthService: FacebookOAuthServiceImpl;

  beforeEach(() => {
    oauthService = new FacebookOAuthServiceImpl();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('initiateAuth', () => {
    it('should initiate OAuth flow successfully', async () => {
      const mockAuthCode = 'test_auth_code';
      const mockTokens: FacebookTokens = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read', 'ads_management'],
      };

      mockPopupManager.openPopup.mockResolvedValue(mockAuthCode);
      
      // Mock token exchange
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: mockTokens.accessToken,
          refresh_token: mockTokens.refreshToken,
          expires_in: mockTokens.expiresIn,
          token_type: mockTokens.tokenType,
        }),
      });

      await oauthService.initiateAuth();

      expect(mockPopupManager.openPopup).toHaveBeenCalledWith(
        expect.stringContaining('https://www.facebook.com/v19.0/dialog/oauth')
      );
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });

    it('should handle popup failure', async () => {
      const error = new Error('Popup blocked');
      mockPopupManager.openPopup.mockRejectedValue(error);

      await expect(oauthService.initiateAuth()).rejects.toThrow('Failed to initiate OAuth flow');
    });

    it('should handle token exchange failure', async () => {
      const mockAuthCode = 'test_auth_code';
      mockPopupManager.openPopup.mockResolvedValue(mockAuthCode);
      
      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Invalid authorization code' },
        }),
      });

      await expect(oauthService.initiateAuth()).rejects.toThrow('Failed to initiate OAuth flow');
    });
  });

  describe('handleAuthCallback', () => {
    it('should exchange code for tokens successfully', async () => {
      const code = 'test_auth_code';
      const state = 'test_state';
      const codeVerifier = 'test_code_verifier';

      // Mock stored PKCE data
      const mockAuthData = {
        pkce: {
          codeVerifier,
          codeChallenge: 'test_challenge',
          state,
        },
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      const mockTokenResponse = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const tokens = await oauthService.handleAuthCallback(code, state);

      expect(tokens.accessToken).toBe('test_access_token');
      expect(tokens.refreshToken).toBe('test_refresh_token');
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v19.0/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should reject invalid state parameter', async () => {
      const code = 'test_auth_code';
      const state = 'invalid_state';

      const mockAuthData = {
        pkce: {
          codeVerifier: 'test_verifier',
          codeChallenge: 'test_challenge',
          state: 'different_state',
        },
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      await expect(oauthService.handleAuthCallback(code, state)).rejects.toThrow(
        'Invalid state parameter - possible CSRF attack'
      );
    });

    it('should handle missing PKCE data', async () => {
      const code = 'test_auth_code';
      const state = 'test_state';

      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(oauthService.handleAuthCallback(code, state)).rejects.toThrow(
        'Failed to handle OAuth callback'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const refreshToken = 'test_refresh_token';
      const mockTokenResponse = {
        access_token: 'new_access_token',
        expires_in: 3600,
        token_type: 'Bearer',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTokenResponse),
      });

      const tokens = await oauthService.refreshToken(refreshToken);

      expect(tokens.accessToken).toBe('new_access_token');
      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v19.0/oauth/access_token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });

    it('should handle refresh token failure', async () => {
      const refreshToken = 'invalid_refresh_token';

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Invalid refresh token' },
        }),
      });

      await expect(oauthService.refreshToken(refreshToken)).rejects.toThrow(
        'Failed to refresh token'
      );
    });
  });

  describe('revokeToken', () => {
    it('should revoke token successfully', async () => {
      const accessToken = 'test_access_token';

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await oauthService.revokeToken(accessToken);

      expect(fetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v19.0/me/permissions',
        expect.objectContaining({
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })
      );
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should clear tokens even if revocation fails', async () => {
      const accessToken = 'test_access_token';

      (global.fetch as any).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({
          error: { message: 'Token already revoked' },
        }),
      });

      await oauthService.revokeToken(accessToken);

      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true for valid tokens', () => {
      const mockTokens: FacebookTokens = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      const mockAuthData = {
        tokens: mockTokens,
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      expect(oauthService.isAuthenticated()).toBe(true);
    });

    it('should return false for expired tokens', () => {
      const mockTokens: FacebookTokens = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      const mockAuthData = {
        tokens: mockTokens,
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      expect(oauthService.isAuthenticated()).toBe(false);
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });

    it('should return false when no tokens stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      expect(oauthService.isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredTokens', () => {
    it('should return stored tokens', () => {
      const mockTokens: FacebookTokens = {
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      const mockAuthData = {
        tokens: mockTokens,
        expiresAt: Date.now() + 3600000,
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      const tokens = oauthService.getStoredTokens();
      expect(tokens).toEqual(mockTokens);
    });

    it('should return null when no tokens stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const tokens = oauthService.getStoredTokens();
      expect(tokens).toBeNull();
    });

    it('should handle corrupted stored data', () => {
      mockLocalStorage.getItem.mockReturnValue('corrupted_data');

      const tokens = oauthService.getStoredTokens();
      expect(tokens).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear stored tokens', () => {
      oauthService.clearTokens();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('facebook_auth_data');
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.removeItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => oauthService.clearTokens()).not.toThrow();
    });
  });
});

describe('Factory functions', () => {
  it('should create Facebook OAuth service instance', () => {
    const service = createFacebookOAuthService();
    expect(service).toBeInstanceOf(FacebookOAuthServiceImpl);
  });

  it('should return singleton instance', () => {
    const service1 = getFacebookOAuthService();
    const service2 = getFacebookOAuthService();
    expect(service1).toBe(service2);
  });
});

describe('Error Handling and Validation', () => {
  let oauthService: FacebookOAuthServiceImpl;

  beforeEach(() => {
    oauthService = new FacebookOAuthServiceImpl();
    vi.clearAllMocks();
  });

  describe('validateAndRefreshToken', () => {
    it('should return null when no tokens stored', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const result = await oauthService.validateAndRefreshToken();
      expect(result).toBeNull();
    });

    it('should return tokens when they are valid and not expired', async () => {
      const mockTokens: FacebookTokens = {
        accessToken: 'valid_access_token',
        refreshToken: 'valid_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      const mockAuthData = {
        tokens: mockTokens,
        expiresAt: Date.now() + 3600000, // 1 hour from now
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      const result = await oauthService.validateAndRefreshToken();
      expect(result).toEqual(mockTokens);
    });

    it('should attempt refresh when token is expired and refresh token exists', async () => {
      const mockTokens: FacebookTokens = {
        accessToken: 'expired_access_token',
        refreshToken: 'valid_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      const mockAuthData = {
        tokens: mockTokens,
        expiresAt: Date.now() - 1000, // Expired
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      const refreshedTokens: FacebookTokens = {
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: refreshedTokens.accessToken,
          refresh_token: refreshedTokens.refreshToken,
          expires_in: refreshedTokens.expiresIn,
          token_type: refreshedTokens.tokenType,
        }),
      });

      const result = await oauthService.validateAndRefreshToken();
      expect(result?.accessToken).toBe('new_access_token');
    });

    it('should clear tokens when refresh fails', async () => {
      const mockTokens: FacebookTokens = {
        accessToken: 'expired_access_token',
        refreshToken: 'invalid_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read'],
      };

      const mockAuthData = {
        tokens: mockTokens,
        expiresAt: Date.now() - 1000, // Expired
      };

      mockLocalStorage.getItem.mockReturnValue(encryptTestData(mockAuthData));

      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          error: { message: 'Invalid refresh token' },
        }),
      });

      const result = await oauthService.validateAndRefreshToken();
      expect(result).toBeNull();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Token Validation', () => {
    it('should validate correct token structure', () => {
      const validTokens: FacebookTokens = {
        accessToken: 'valid_access_token_123',
        refreshToken: 'valid_refresh_token',
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: ['ads_read', 'ads_management'],
      };

      // Access private method through any cast for testing
      const isValid = (oauthService as any).validateTokenStructure(validTokens);
      expect(isValid).toBe(true);
    });

    it('should reject invalid token structures', () => {
      const invalidTokens = [
        null,
        undefined,
        {},
        { accessToken: '' }, // Empty access token
        { accessToken: 'short' }, // Too short
        { accessToken: 'valid_token', tokenType: '', expiresIn: 3600, scope: ['ads_read'] }, // Empty token type
        { accessToken: 'valid_token', tokenType: 'Bearer', expiresIn: 0, scope: ['ads_read'] }, // Invalid expires
        { accessToken: 'valid_token', tokenType: 'Bearer', expiresIn: 3600, scope: [] }, // Empty scope
        { accessToken: 'valid_token', tokenType: 'Bearer', expiresIn: 3600, scope: 'not_array' }, // Invalid scope type
      ];

      invalidTokens.forEach((tokens, index) => {
        const isValid = (oauthService as any).validateTokenStructure(tokens);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('State Parameter Validation', () => {
    it('should validate matching state parameters', () => {
      const state = 'test_state_parameter_123';
      const isValid = (oauthService as any).validateStateParameter(state, state);
      expect(isValid).toBe(true);
    });

    it('should reject mismatched state parameters', () => {
      const state1 = 'test_state_parameter_123';
      const state2 = 'different_state_parameter';
      const isValid = (oauthService as any).validateStateParameter(state1, state2);
      expect(isValid).toBe(false);
    });

    it('should reject empty or null state parameters', () => {
      const validState = 'test_state_parameter_123';
      
      expect((oauthService as any).validateStateParameter('', validState)).toBe(false);
      expect((oauthService as any).validateStateParameter(null, validState)).toBe(false);
      expect((oauthService as any).validateStateParameter(validState, '')).toBe(false);
      expect((oauthService as any).validateStateParameter(validState, null)).toBe(false);
    });
  });

  describe('PKCE Code Verifier Validation', () => {
    it('should validate correct code verifier', () => {
      const validVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'; // 43 chars
      const isValid = (oauthService as any).validateCodeVerifier(validVerifier);
      expect(isValid).toBe(true);
    });

    it('should reject invalid code verifiers', () => {
      const invalidVerifiers = [
        '', // Empty
        'short', // Too short (< 43 chars)
        'a'.repeat(129), // Too long (> 128 chars)
        'invalid-chars-!@#$%', // Invalid characters
        null,
        undefined,
      ];

      invalidVerifiers.forEach((verifier) => {
        const isValid = (oauthService as any).validateCodeVerifier(verifier);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Error Message Handling', () => {
    it('should handle Facebook API errors with user-friendly messages', () => {
      const facebookErrors = [
        { error: { code: 190, message: 'Invalid access token' } },
        { error: { code: 102, message: 'Session key invalid' } },
        { error: { code: 200, message: 'Permissions error' } },
        { error: { code: 4, message: 'Application request limit reached' } },
      ];

      facebookErrors.forEach((fbError) => {
        const authError = (oauthService as any).handleOAuthError(fbError);
        expect(authError).toBeInstanceOf(Error);
        expect(authError.type).toBe('auth_error');
        expect(authError.message).toBeTruthy();
        expect(authError.message).not.toBe('Authentication failed'); // Should have specific message
      });
    });

    it('should handle network errors', () => {
      const networkError = new Error('fetch failed');
      networkError.name = 'NetworkError';

      const authError = (oauthService as any).handleOAuthError(networkError);
      expect(authError.message).toContain('Network error');
      expect(authError.code).toBe('NETWORK_ERROR');
    });

    it('should handle popup errors', () => {
      const popupError = new Error('popup was blocked');

      const authError = (oauthService as any).handleOAuthError(popupError);
      expect(authError.message).toContain('Popup was blocked');
      expect(authError.code).toBe('POPUP_ERROR');
    });

    it('should handle timeout errors', () => {
      const timeoutError = new Error('authentication timed out');

      const authError = (oauthService as any).handleOAuthError(timeoutError);
      expect(authError.message).toContain('timed out');
      expect(authError.code).toBe('TIMEOUT_ERROR');
    });
  });

  describe('Enhanced handleAuthCallback validation', () => {
    it('should validate input parameters', async () => {
      await expect(oauthService.handleAuthCallback('', 'valid_state')).rejects.toThrow('Invalid authorization code');
      await expect(oauthService.handleAuthCallback('valid_code', '')).rejects.toThrow('Invalid state parameter');
    });

    it('should handle missing PKCE data', async () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      await expect(oauthService.handleAuthCallback('valid_code', 'valid_state')).rejects.toThrow('No PKCE data found');
    });
  });

  describe('Enhanced refreshToken validation', () => {
    it('should validate refresh token input', async () => {
      await expect(oauthService.refreshToken('')).rejects.toThrow('Invalid refresh token provided');
      await expect(oauthService.refreshToken('short')).rejects.toThrow('Refresh token appears to be invalid');
    });

    it('should handle specific HTTP error codes', async () => {
      const testCases = [
        { status: 400, expectedMessage: 'Invalid refresh token - please log in again' },
        { status: 401, expectedMessage: 'Refresh token expired - please log in again' },
        { status: 429, expectedMessage: 'Too many refresh attempts - please try again later' },
      ];

      for (const testCase of testCases) {
        (global.fetch as any).mockResolvedValue({
          ok: false,
          status: testCase.status,
          json: () => Promise.resolve({}),
        });

        await expect(oauthService.refreshToken('valid_refresh_token')).rejects.toThrow(testCase.expectedMessage);
      }
    });
  });
});