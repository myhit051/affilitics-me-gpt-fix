import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import DataImport from '@/components/DataImport';
import { FacebookConnectionState } from '@/types/facebook';

// Mock window.open for popup testing
const mockWindowOpen = vi.fn();
const mockWindowClose = vi.fn();
const mockPopup = {
  close: mockWindowClose,
  closed: false,
  location: { href: 'about:blank' },
  postMessage: vi.fn(),
};

Object.defineProperty(window, 'open', {
  writable: true,
  value: mockWindowOpen.mockReturnValue(mockPopup),
});

// Mock Facebook services with realistic implementations
const mockOAuthService = {
  isAuthenticated: vi.fn().mockReturnValue(false),
  initiateAuth: vi.fn(),
  handleAuthCallback: vi.fn(),
  getStoredTokens: vi.fn().mockReturnValue(null),
  revokeToken: vi.fn(),
  clearTokens: vi.fn(),
  refreshToken: vi.fn(),
};

const mockAPIService = {
  isAuthenticated: vi.fn().mockReturnValue(false),
  setAccessToken: vi.fn(),
  getAdAccounts: vi.fn(),
  getCampaigns: vi.fn(),
  syncAllData: vi.fn(),
};

vi.mock('@/lib/facebook-oauth-service', () => ({
  getFacebookOAuthService: () => mockOAuthService,
}));

vi.mock('@/lib/facebook-api-service', () => ({
  getFacebookAPIService: () => mockAPIService,
}));

describe('Facebook OAuth Integration Flow', () => {
  const mockOnDataImported = vi.fn();
  const mockOnFacebookConnectionChange = vi.fn();

  const defaultProps = {
    onDataImported: mockOnDataImported,
    onFacebookConnectionChange: mockOnFacebookConnectionChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockPopup.closed = false;
    mockOAuthService.isAuthenticated.mockReturnValue(false);
    mockAPIService.isAuthenticated.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete OAuth Flow', () => {
    it('completes full OAuth authentication flow', async () => {
      // Mock successful OAuth flow
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      mockOAuthService.initiateAuth.mockResolvedValue(undefined);
      mockOAuthService.handleAuthCallback.mockResolvedValue(mockTokens);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);

      const facebookConnection: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      // Click connect button
      const connectButton = screen.getByText('Connect Facebook API');
      fireEvent.click(connectButton);

      // Verify OAuth initiation
      await waitFor(() => {
        expect(mockOAuthService.initiateAuth).toHaveBeenCalled();
      });

      // Simulate successful OAuth callback
      act(() => {
        // Simulate popup message with authorization code
        const messageEvent = new MessageEvent('message', {
          data: {
            type: 'FACEBOOK_OAUTH_SUCCESS',
            code: 'test_auth_code',
            state: 'test_state',
          },
          origin: 'https://www.facebook.com',
        });
        window.dispatchEvent(messageEvent);
      });

      // Verify callback handling
      await waitFor(() => {
        expect(mockOAuthService.handleAuthCallback).toHaveBeenCalledWith(
          'test_auth_code',
          'test_state'
        );
      });

      // Verify connection state change
      await waitFor(() => {
        expect(mockOnFacebookConnectionChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isConnected: true,
          })
        );
      });
    });

    it('handles OAuth errors gracefully', async () => {
      mockOAuthService.initiateAuth.mockRejectedValue(new Error('OAuth failed'));

      const facebookConnection: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      const connectButton = screen.getByText('Connect Facebook API');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/oauth failed/i)).toBeInTheDocument();
      });
    });

    it('handles popup blocking', async () => {
      mockWindowOpen.mockReturnValue(null);

      const facebookConnection: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      const connectButton = screen.getByText('Connect Facebook API');
      fireEvent.click(connectButton);

      await waitFor(() => {
        expect(screen.getByText(/popup blocked/i)).toBeInTheDocument();
      });
    });

    it('handles user cancellation', async () => {
      mockOAuthService.initiateAuth.mockResolvedValue(undefined);

      const facebookConnection: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      const connectButton = screen.getByText('Connect Facebook API');
      fireEvent.click(connectButton);

      // Simulate user closing popup
      act(() => {
        mockPopup.closed = true;
        const messageEvent = new MessageEvent('message', {
          data: {
            type: 'FACEBOOK_OAUTH_CANCELLED',
          },
          origin: 'https://www.facebook.com',
        });
        window.dispatchEvent(messageEvent);
      });

      await waitFor(() => {
        expect(screen.getByText(/authentication was cancelled/i)).toBeInTheDocument();
      });
    });
  });

  describe('Token Management', () => {
    it('automatically refreshes expired tokens', async () => {
      const expiredTokens = {
        accessToken: 'expired_token',
        tokenType: 'Bearer',
        expiresIn: -1, // Expired
        scope: ['ads_read'],
      };

      const newTokens = {
        accessToken: 'new_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(expiredTokens);
      mockOAuthService.refreshToken.mockResolvedValue(newTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      await waitFor(() => {
        expect(mockOAuthService.refreshToken).toHaveBeenCalled();
      });
    });

    it('handles token refresh failures', async () => {
      const expiredTokens = {
        accessToken: 'expired_token',
        tokenType: 'Bearer',
        expiresIn: -1,
        scope: ['ads_read'],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(expiredTokens);
      mockOAuthService.refreshToken.mockRejectedValue(new Error('Refresh failed'));
      mockOAuthService.isAuthenticated.mockReturnValue(false);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/please log in again/i)).toBeInTheDocument();
      });
    });
  });

  describe('Account Discovery', () => {
    it('fetches and displays ad accounts after authentication', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      const mockAccounts = [
        { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
        { id: 'act_456', name: 'Test Account 2', currency: 'EUR' },
      ];

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Account 1')).toBeInTheDocument();
        expect(screen.getByText('Test Account 2')).toBeInTheDocument();
      });
    });

    it('handles account fetching errors', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.getAdAccounts.mockRejectedValue(new Error('Failed to fetch accounts'));

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: [],
        syncStatus: 'idle',
        error: 'Failed to fetch accounts',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch accounts/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Synchronization', () => {
    it('completes full data sync workflow', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      const mockAccounts = [
        { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
      ];

      const mockSyncResult = {
        campaigns: [
          {
            id: '123',
            name: 'Test Campaign',
            status: 'ACTIVE',
            objective: 'CONVERSIONS',
            insights: {
              impressions: 1000,
              clicks: 50,
              spend: 25.5,
            },
          },
        ],
        totalSpend: 25.5,
        totalImpressions: 1000,
        totalClicks: 50,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);
      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      // Click sync button
      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Verify sync initiation
      await waitFor(() => {
        expect(mockAPIService.syncAllData).toHaveBeenCalledWith(['act_123']);
      });

      // Verify data import callback
      await waitFor(() => {
        expect(mockOnDataImported).toHaveBeenCalledWith(
          expect.objectContaining({
            campaigns: expect.arrayContaining([
              expect.objectContaining({
                name: 'Test Campaign',
              }),
            ]),
          })
        );
      });
    });

    it('handles sync errors and provides retry options', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      const mockAccounts = [
        { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
      ];

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);
      mockAPIService.syncAllData.mockRejectedValue(new Error('Sync failed'));

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'error',
        error: 'Sync failed',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/sync failed/i)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });
  });

  describe('Disconnection Flow', () => {
    it('completes full disconnection workflow', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.revokeToken.mockResolvedValue(undefined);
      mockAPIService.isAuthenticated.mockReturnValue(true);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: [
          { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
        ],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      // Click disconnect button
      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      // Verify token revocation
      await waitFor(() => {
        expect(mockOAuthService.revokeToken).toHaveBeenCalledWith('test_access_token');
      });

      // Verify token cleanup
      await waitFor(() => {
        expect(mockOAuthService.clearTokens).toHaveBeenCalled();
      });

      // Verify connection state change
      await waitFor(() => {
        expect(mockOnFacebookConnectionChange).toHaveBeenCalledWith(
          expect.objectContaining({
            isConnected: false,
          })
        );
      });
    });

    it('handles disconnection errors gracefully', async () => {
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.revokeToken.mockRejectedValue(new Error('Revocation failed'));
      mockAPIService.isAuthenticated.mockReturnValue(true);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: [
          { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
        ],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      // Should still clear tokens even if revocation fails
      await waitFor(() => {
        expect(mockOAuthService.clearTokens).toHaveBeenCalled();
      });
    });
  });

  describe('Cross-Origin Security', () => {
    it('validates message origins', async () => {
      const facebookConnection: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      // Simulate malicious message from wrong origin
      act(() => {
        const messageEvent = new MessageEvent('message', {
          data: {
            type: 'FACEBOOK_OAUTH_SUCCESS',
            code: 'malicious_code',
            state: 'malicious_state',
          },
          origin: 'https://malicious-site.com',
        });
        window.dispatchEvent(messageEvent);
      });

      // Should not process the message
      await waitFor(() => {
        expect(mockOAuthService.handleAuthCallback).not.toHaveBeenCalled();
      });
    });

    it('validates state parameter to prevent CSRF', async () => {
      mockOAuthService.handleAuthCallback.mockRejectedValue(
        new Error('Invalid state parameter')
      );

      const facebookConnection: FacebookConnectionState = {
        isConnected: false,
        connectedAccounts: [],
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      act(() => {
        const messageEvent = new MessageEvent('message', {
          data: {
            type: 'FACEBOOK_OAUTH_SUCCESS',
            code: 'valid_code',
            state: 'invalid_state',
          },
          origin: 'https://www.facebook.com',
        });
        window.dispatchEvent(messageEvent);
      });

      await waitFor(() => {
        expect(screen.getByText(/invalid state parameter/i)).toBeInTheDocument();
      });
    });
  });
});