import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FacebookConnectionPanel from '../FacebookConnectionPanel';
import { FacebookConnectionState } from '@/types/facebook';

// Mock the Facebook services
vi.mock('@/lib/facebook-oauth-service', () => ({
  getFacebookOAuthService: () => ({
    isAuthenticated: vi.fn().mockReturnValue(false),
    initiateAuth: vi.fn().mockResolvedValue(undefined),
    getStoredTokens: vi.fn().mockReturnValue(null),
    revokeToken: vi.fn().mockResolvedValue(undefined),
    clearTokens: vi.fn(),
  }),
}));

vi.mock('@/lib/facebook-api-service', () => ({
  getFacebookAPIService: () => ({
    isAuthenticated: vi.fn().mockReturnValue(false),
    setAccessToken: vi.fn(),
    getAdAccounts: vi.fn().mockResolvedValue([]),
    syncAllData: vi.fn().mockResolvedValue({ campaigns: [], errors: [] }),
  }),
}));

vi.mock('@/hooks/useFacebookAuth', () => ({
  default: () => ({
    state: {
      isAuthenticated: false,
      isLoading: false,
      tokens: null,
      error: null,
    },
    login: vi.fn(),
    logout: vi.fn(),
    clearError: vi.fn(),
  }),
}));

describe('FacebookConnectionPanel', () => {
  const mockOnConnectionChange = vi.fn();
  const mockOnDataSync = vi.fn();

  const defaultProps = {
    onConnectionChange: mockOnConnectionChange,
    onDataSync: mockOnDataSync,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Disconnected State', () => {
    it('renders connect button when not connected', () => {
      render(<FacebookConnectionPanel {...defaultProps} />);

      expect(screen.getByText('Connect Facebook API')).toBeInTheDocument();
      expect(screen.getByText('Access your Facebook Ads data directly')).toBeInTheDocument();
    });

    it('shows loading state during connection', () => {
      const mockUseFacebookAuth = vi.fn(() => ({
        state: {
          isAuthenticated: false,
          isLoading: true,
          tokens: null,
          error: null,
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(mockUseFacebookAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('displays error message when connection fails', () => {
      const mockUseFacebookAuth = vi.fn(() => ({
        state: {
          isAuthenticated: false,
          isLoading: false,
          tokens: null,
          error: 'Connection failed',
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(mockUseFacebookAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      expect(screen.getByText('Connection failed')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  describe('Connected State', () => {
    const mockConnectedAuth = {
      state: {
        isAuthenticated: true,
        isLoading: false,
        tokens: {
          accessToken: 'test_token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          scope: ['ads_read'],
        },
        error: null,
      },
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    it('renders connected state with account info', () => {
      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      expect(screen.getByText('Connected to Facebook')).toBeInTheDocument();
      expect(screen.getByText('Disconnect')).toBeInTheDocument();
    });

    it('handles disconnect action', async () => {
      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      const disconnectButton = screen.getByText('Disconnect');
      fireEvent.click(disconnectButton);

      await waitFor(() => {
        expect(mockConnectedAuth.logout).toHaveBeenCalled();
      });
    });

    it('displays account selection when multiple accounts available', async () => {
      const mockGetAdAccounts = vi.fn().mockResolvedValue([
        { id: 'act_123', name: 'Test Account 1', currency: 'USD' },
        { id: 'act_456', name: 'Test Account 2', currency: 'EUR' },
      ]);

      vi.mocked(require('@/lib/facebook-api-service').getFacebookAPIService).mockReturnValue({
        isAuthenticated: vi.fn().mockReturnValue(true),
        setAccessToken: vi.fn(),
        getAdAccounts: mockGetAdAccounts,
        syncAllData: vi.fn().mockResolvedValue({ campaigns: [], errors: [] }),
      });

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Test Account 1')).toBeInTheDocument();
        expect(screen.getByText('Test Account 2')).toBeInTheDocument();
      });
    });
  });

  describe('Sync Functionality', () => {
    const mockConnectedAuth = {
      state: {
        isAuthenticated: true,
        isLoading: false,
        tokens: {
          accessToken: 'test_token',
          tokenType: 'Bearer',
          expiresIn: 3600,
          scope: ['ads_read'],
        },
        error: null,
      },
      login: vi.fn(),
      logout: vi.fn(),
      clearError: vi.fn(),
    };

    it('displays sync button when connected', () => {
      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      expect(screen.getByText('Sync Data')).toBeInTheDocument();
    });

    it('handles sync action', async () => {
      const mockSyncAllData = vi.fn().mockResolvedValue({
        campaigns: [{ id: '123', name: 'Test Campaign' }],
        errors: [],
      });

      vi.mocked(require('@/lib/facebook-api-service').getFacebookAPIService).mockReturnValue({
        isAuthenticated: vi.fn().mockReturnValue(true),
        setAccessToken: vi.fn(),
        getAdAccounts: vi.fn().mockResolvedValue([]),
        syncAllData: mockSyncAllData,
      });

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockSyncAllData).toHaveBeenCalled();
        expect(mockOnDataSync).toHaveBeenCalled();
      });
    });

    it('shows sync progress during sync operation', async () => {
      const mockSyncAllData = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ campaigns: [], errors: [] }), 100))
      );

      vi.mocked(require('@/lib/facebook-api-service').getFacebookAPIService).mockReturnValue({
        isAuthenticated: vi.fn().mockReturnValue(true),
        setAccessToken: vi.fn(),
        getAdAccounts: vi.fn().mockResolvedValue([]),
        syncAllData: mockSyncAllData,
      });

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      expect(screen.getByText('Syncing...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Sync Data')).toBeInTheDocument();
      });
    });

    it('displays sync errors when sync fails', async () => {
      const mockSyncAllData = vi.fn().mockResolvedValue({
        campaigns: [],
        errors: ['Failed to fetch campaigns'],
      });

      vi.mocked(require('@/lib/facebook-api-service').getFacebookAPIService).mockReturnValue({
        isAuthenticated: vi.fn().mockReturnValue(true),
        setAccessToken: vi.fn(),
        getAdAccounts: vi.fn().mockResolvedValue([]),
        syncAllData: mockSyncAllData,
      });

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(() => mockConnectedAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to fetch campaigns')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles authentication errors gracefully', () => {
      const mockUseFacebookAuth = vi.fn(() => ({
        state: {
          isAuthenticated: false,
          isLoading: false,
          tokens: null,
          error: 'Authentication failed',
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: vi.fn(),
      }));

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(mockUseFacebookAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      expect(screen.getByText('Authentication failed')).toBeInTheDocument();
    });

    it('provides error recovery options', () => {
      const mockClearError = vi.fn();
      const mockUseFacebookAuth = vi.fn(() => ({
        state: {
          isAuthenticated: false,
          isLoading: false,
          tokens: null,
          error: 'Network error',
        },
        login: vi.fn(),
        logout: vi.fn(),
        clearError: mockClearError,
      }));

      vi.mocked(require('@/hooks/useFacebookAuth').default).mockImplementation(mockUseFacebookAuth);

      render(<FacebookConnectionPanel {...defaultProps} />);

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<FacebookConnectionPanel {...defaultProps} />);

      const connectButton = screen.getByRole('button', { name: /connect facebook api/i });
      expect(connectButton).toBeInTheDocument();
    });

    it('supports keyboard navigation', () => {
      render(<FacebookConnectionPanel {...defaultProps} />);

      const connectButton = screen.getByRole('button', { name: /connect facebook api/i });
      connectButton.focus();
      expect(document.activeElement).toBe(connectButton);
    });
  });
});