/**
 * useFacebookAuth Hook
 * React hook for managing Facebook authentication state
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { FacebookTokens, AuthError } from '@/types/facebook';
import { getFacebookOAuthService } from '@/lib/facebook-oauth-service';

export interface FacebookAuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: FacebookTokens | null;
  error: string | null;
  isInitiating: boolean;
}

export interface FacebookAuthActions {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export interface UseFacebookAuthReturn {
  state: FacebookAuthState;
  actions: FacebookAuthActions;
}

/**
 * Custom hook for managing Facebook authentication
 */
export function useFacebookAuth(): UseFacebookAuthReturn {
  const [state, setState] = useState<FacebookAuthState>({
    isAuthenticated: false,
    isLoading: true,
    tokens: null,
    error: null,
    isInitiating: false,
  });

  const oauthService = useRef(getFacebookOAuthService());
  const isInitializedRef = useRef(false);

  /**
   * Initialize authentication state on mount
   */
  useEffect(() => {
    const initializeAuth = async () => {
      if (isInitializedRef.current) return;
      isInitializedRef.current = true;

      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Check if user is already authenticated
        const isAuthenticated = oauthService.current.isAuthenticated();
        const tokens = oauthService.current.getStoredTokens();

        if (isAuthenticated && tokens) {
          // Validate and refresh token if needed
          try {
            const validTokens = await oauthService.current.validateAndRefreshToken();
            if (validTokens) {
              setState(prev => ({
                ...prev,
                isAuthenticated: true,
                tokens: validTokens,
                isLoading: false,
                error: null,
              }));
            } else {
              setState(prev => ({
                ...prev,
                isAuthenticated: false,
                tokens: null,
                isLoading: false,
                error: null,
              }));
            }
          } catch (error) {
            console.warn('Token validation failed during initialization:', error);
            setState(prev => ({
              ...prev,
              isAuthenticated: false,
              tokens: null,
              isLoading: false,
              error: null,
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            tokens: null,
            isLoading: false,
            error: null,
          }));
        }
      } catch (error) {
        console.error('Failed to initialize Facebook auth:', error);
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          tokens: null,
          isLoading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    initializeAuth();
  }, []);

  /**
   * Initiates Facebook OAuth login flow
   */
  const login = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isInitiating: true, 
        error: null 
      }));

      // Initiate OAuth flow
      await oauthService.current.initiateAuth();

      // Wait a bit for tokens to be stored
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the tokens after successful authentication
      const tokens = oauthService.current.getStoredTokens();
      const isAuthenticated = oauthService.current.isAuthenticated();

      console.log('After OAuth completion:', {
        isAuthenticated,
        hasTokens: !!tokens,
        tokenDetails: tokens ? {
          hasAccessToken: !!tokens.accessToken,
          accessTokenLength: tokens.accessToken?.length,
          hasRefreshToken: !!tokens.refreshToken,
          expiresIn: tokens.expiresIn,
          tokenType: tokens.tokenType,
          scopeCount: tokens.scope?.length
        } : null
      });

      if (isAuthenticated && tokens) {
        setState(prev => ({
          ...prev,
          isAuthenticated: true,
          tokens,
          isInitiating: false,
          error: null,
        }));
      } else {
        // Try to get tokens with async method as fallback
        try {
          console.log('Trying async token retrieval...');
          const asyncTokens = await oauthService.current.getStoredTokensAsync();
          if (asyncTokens) {
            console.log('Got tokens via async method');
            setState(prev => ({
              ...prev,
              isAuthenticated: true,
              tokens: asyncTokens,
              isInitiating: false,
              error: null,
            }));
          } else {
            // Last resort: try validateAndRefreshToken
            const refreshedTokens = await oauthService.current.validateAndRefreshToken();
            if (refreshedTokens) {
              console.log('Got tokens via refresh method');
              setState(prev => ({
                ...prev,
                isAuthenticated: true,
                tokens: refreshedTokens,
                isInitiating: false,
                error: null,
              }));
            } else {
              throw new Error('Authentication completed but no valid tokens found');
            }
          }
        } catch (asyncError) {
          console.error('All token retrieval methods failed:', asyncError);
          throw new Error('Authentication completed but no valid tokens found');
        }
      }
    } catch (error) {
      console.error('Facebook login failed:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof Error) {
        const authError = error as AuthError;
        switch (authError.code) {
          case 'POPUP_ERROR':
            errorMessage = 'Popup was blocked or closed. Please allow popups and try again.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection and try again.';
            break;
          case 'TIMEOUT_ERROR':
            errorMessage = 'Login timed out. Please try again.';
            break;
          case 'PERMISSIONS_ERROR':
            errorMessage = 'Required permissions were not granted. Please accept all permissions.';
            break;
          case 'CSRF_ERROR':
            errorMessage = 'Security validation failed. Please try again.';
            break;
          default:
            // Check for configuration errors
            if (authError.message?.includes('Facebook App ID is not configured')) {
              errorMessage = 'Facebook App ID is not configured. Please check your environment configuration.';
            } else {
              errorMessage = authError.message || errorMessage;
            }
        }
      }

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        tokens: null,
        isInitiating: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Logs out the user and clears tokens
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get current tokens for revocation
      const tokens = oauthService.current.getStoredTokens();
      
      if (tokens?.accessToken) {
        // Revoke the token on Facebook's side
        await oauthService.current.revokeToken(tokens.accessToken);
      }

      // Clear local tokens
      oauthService.current.clearTokens();

      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        tokens: null,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.warn('Logout error (tokens cleared locally):', error);
      
      // Even if revocation fails, clear local state
      oauthService.current.clearTokens();
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        tokens: null,
        isLoading: false,
        error: null,
      }));
    }
  }, []);

  /**
   * Manually refreshes the access token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const currentTokens = oauthService.current.getStoredTokens();
      
      if (!currentTokens?.refreshToken) {
        throw new Error('No refresh token available. Please log in again.');
      }

      const newTokens = await oauthService.current.refreshToken(currentTokens.refreshToken);

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        tokens: newTokens,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('Token refresh failed:', error);
      
      let errorMessage = 'Failed to refresh token. Please log in again.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      // Clear tokens on refresh failure
      oauthService.current.clearTokens();
      
      setState(prev => ({
        ...prev,
        isAuthenticated: false,
        tokens: null,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  /**
   * Clears the current error state
   */
  const clearError = useCallback((): void => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  /**
   * Auto-refresh token when it's about to expire
   */
  useEffect(() => {
    if (!state.isAuthenticated || !state.tokens) {
      return;
    }

    const checkTokenExpiration = async () => {
      try {
        const validTokens = await oauthService.current.validateAndRefreshToken();
        
        if (!validTokens) {
          // Token expired and couldn't be refreshed
          setState(prev => ({
            ...prev,
            isAuthenticated: false,
            tokens: null,
            error: 'Session expired. Please log in again.',
          }));
        } else if (validTokens !== state.tokens) {
          // Token was refreshed
          setState(prev => ({
            ...prev,
            tokens: validTokens,
            error: null,
          }));
        }
      } catch (error) {
        console.warn('Auto token refresh failed:', error);
        setState(prev => ({
          ...prev,
          isAuthenticated: false,
          tokens: null,
          error: 'Session expired. Please log in again.',
        }));
      }
    };

    // Check token expiration every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.tokens]);

  return {
    state,
    actions: {
      login,
      logout,
      refreshToken,
      clearError,
    },
  };
}