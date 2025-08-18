/**
 * Tests for useFacebookAuth hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFacebookAuth } from '../useFacebookAuth';
import { FacebookTokens, AuthError } from '@/types/facebook';

// Mock the Facebook OAuth service
const mockOAuthService = {
  initiateAuth: vi.fn(),
  handleAuthCallback: vi.fn(),
  refreshToken: vi.fn(),
  revokeToken: vi.fn(),
  isAuthenticated: vi.fn(),
  getStoredTokens: vi.fn(),
  clearTokens: vi.fn(),
  validateAndRefreshToken: vi.fn(),
};

vi.mock('@/lib/facebook-oauth-service', () => ({
  getFacebookOAuthService: () => mockOAuthService,
}));

describe('useFacebookAuth', () => {
  const mockTokens: FacebookTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
    expiresIn: 3600,
    tokenType: 'Bearer',
    scope: ['ads_read', 'ads_management'],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockOAuthService.isAuthenticated.mockReturnValue(false);
    mockOAuthService.getStoredTokens.mockReturnValue(null);
    mockOAuthService.validateAndRefreshToken.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useFacebookAuth());

      expect(result.current.state.isLoading).toBe(true);
      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe(null);
    });

    it('should initialize as unauthenticated when no stored tokens', async () => {
      mockOAuthService.isAuthenticated.mockReturnValue(false);
      mockOAuthService.getStoredTokens.mockReturnValue(null);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe(null);
    });

    it('should initialize as authenticated when valid tokens exist', async () => {
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken.mockResolvedValue(mockTokens);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.isAuthenticated).toBe(true);
      expect(result.current.state.tokens).toEqual(mockTokens);
      expect(result.current.state.error).toBe(null);
    });

    it('should handle token validation failure during initialization', async () => {
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken.mockResolvedValue(null);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe(null);
    });

    it('should handle initialization errors gracefully', async () => {
      mockOAuthService.isAuthenticated.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe('Failed to initialize authentication');
    });
  });

  describe('login', () => {
    it('should successfully authenticate user', async () => {
      mockOAuthService.initiateAuth.mockResolvedValue(undefined);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.isAuthenticated).toBe(true);
      expect(result.current.state.tokens).toEqual(mockTokens);
      expect(result.current.state.error).toBe(null);
      expect(result.current.state.isInitiating).toBe(false);
      expect(mockOAuthService.initiateAuth).toHaveBeenCalled();
    });

    it('should set initiating state during login', async () => {
      let resolveAuth: () => void;
      const authPromise = new Promise<void>((resolve) => {
        resolveAuth = resolve;
      });
      
      mockOAuthService.initiateAuth.mockReturnValue(authPromise);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      act(() => {
        result.current.actions.login();
      });

      expect(result.current.state.isInitiating).toBe(true);
      expect(result.current.state.error).toBe(null);

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);

      await act(async () => {
        resolveAuth!();
        await authPromise;
      });

      expect(result.current.state.isInitiating).toBe(false);
    });

    it('should handle popup blocked error', async () => {
      const popupError = new Error('Popup blocked') as AuthError;
      popupError.code = 'POPUP_ERROR';
      popupError.type = 'auth_error';
      
      mockOAuthService.initiateAuth.mockRejectedValue(popupError);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe('Popup was blocked or closed. Please allow popups and try again.');
      expect(result.current.state.isInitiating).toBe(false);
    });

    it('should handle network error', async () => {
      const networkError = new Error('Network failed') as AuthError;
      networkError.code = 'NETWORK_ERROR';
      networkError.type = 'auth_error';
      
      mockOAuthService.initiateAuth.mockRejectedValue(networkError);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.error).toBe('Network error. Please check your connection and try again.');
    });

    it('should handle permissions error', async () => {
      const permissionsError = new Error('Permissions denied') as AuthError;
      permissionsError.code = 'PERMISSIONS_ERROR';
      permissionsError.type = 'auth_error';
      
      mockOAuthService.initiateAuth.mockRejectedValue(permissionsError);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.error).toBe('Required permissions were not granted. Please accept all permissions.');
    });

    it('should handle generic authentication error', async () => {
      const genericError = new Error('Authentication failed');
      mockOAuthService.initiateAuth.mockRejectedValue(genericError);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.error).toBe('Authentication failed');
    });

    it('should handle case where auth completes but no tokens found', async () => {
      mockOAuthService.initiateAuth.mockResolvedValue(undefined);
      mockOAuthService.getStoredTokens.mockReturnValue(null);
      mockOAuthService.isAuthenticated.mockReturnValue(false);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.error).toBe('Authentication completed but no valid tokens found');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      // Setup authenticated state
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken.mockResolvedValue(mockTokens);
      mockOAuthService.revokeToken.mockResolvedValue(undefined);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.actions.logout();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe(null);
      expect(mockOAuthService.revokeToken).toHaveBeenCalledWith(mockTokens.accessToken);
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
    });

    it('should logout even if token revocation fails', async () => {
      // Setup authenticated state
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken.mockResolvedValue(mockTokens);
      mockOAuthService.revokeToken.mockRejectedValue(new Error('Revocation failed'));

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isAuthenticated).toBe(true);
      });

      await act(async () => {
        await result.current.actions.logout();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe(null);
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
    });

    it('should logout when no tokens are present', async () => {
      mockOAuthService.getStoredTokens.mockReturnValue(null);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.logout();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
      expect(mockOAuthService.revokeToken).not.toHaveBeenCalled();
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh token', async () => {
      const newTokens: FacebookTokens = {
        ...mockTokens,
        accessToken: 'new-access-token',
      };

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.refreshToken.mockResolvedValue(newTokens);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.refreshToken();
      });

      expect(result.current.state.isAuthenticated).toBe(true);
      expect(result.current.state.tokens).toEqual(newTokens);
      expect(result.current.state.error).toBe(null);
      expect(mockOAuthService.refreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
    });

    it('should handle missing refresh token', async () => {
      const tokensWithoutRefresh = { ...mockTokens, refreshToken: undefined };
      mockOAuthService.getStoredTokens.mockReturnValue(tokensWithoutRefresh);

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.refreshToken();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe('No refresh token available. Please log in again.');
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
    });

    it('should handle refresh token failure', async () => {
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.actions.refreshToken();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe('Refresh failed');
      expect(mockOAuthService.clearTokens).toHaveBeenCalled();
    });
  });

  describe('clearError', () => {
    it('should clear error state', async () => {
      mockOAuthService.initiateAuth.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Trigger an error
      await act(async () => {
        await result.current.actions.login();
      });

      expect(result.current.state.error).toBeTruthy();

      // Clear the error
      act(() => {
        result.current.actions.clearError();
      });

      expect(result.current.state.error).toBe(null);
    });
  });

  describe('auto token refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-refresh token when valid', async () => {
      const newTokens: FacebookTokens = {
        ...mockTokens,
        accessToken: 'refreshed-access-token',
      };

      // Setup authenticated state
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken
        .mockResolvedValueOnce(mockTokens) // Initial load
        .mockResolvedValueOnce(newTokens); // Auto refresh

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isAuthenticated).toBe(true);
      });

      // Fast-forward 5 minutes to trigger auto-refresh
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
        await vi.runAllTimersAsync();
      });

      expect(result.current.state.tokens).toEqual(newTokens);
      expect(mockOAuthService.validateAndRefreshToken).toHaveBeenCalledTimes(2);
    });

    it('should handle auto-refresh failure', async () => {
      // Setup authenticated state
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken
        .mockResolvedValueOnce(mockTokens) // Initial load
        .mockResolvedValueOnce(null); // Auto refresh fails

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isAuthenticated).toBe(true);
      });

      // Fast-forward 5 minutes to trigger auto-refresh
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
        await vi.runAllTimersAsync();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe('Session expired. Please log in again.');
    });

    it('should handle auto-refresh error', async () => {
      // Setup authenticated state
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.validateAndRefreshToken
        .mockResolvedValueOnce(mockTokens) // Initial load
        .mockRejectedValueOnce(new Error('Network error')); // Auto refresh error

      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isAuthenticated).toBe(true);
      });

      // Fast-forward 5 minutes to trigger auto-refresh
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
        await vi.runAllTimersAsync();
      });

      expect(result.current.state.isAuthenticated).toBe(false);
      expect(result.current.state.tokens).toBe(null);
      expect(result.current.state.error).toBe('Session expired. Please log in again.');
    });

    it('should not auto-refresh when not authenticated', async () => {
      const { result } = renderHook(() => useFacebookAuth());

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });

      // Fast-forward 5 minutes
      await act(async () => {
        vi.advanceTimersByTime(5 * 60 * 1000);
        await vi.runAllTimersAsync();
      });

      // Should only be called once during initialization
      expect(mockOAuthService.validateAndRefreshToken).toHaveBeenCalledTimes(1);
    });
  });
});