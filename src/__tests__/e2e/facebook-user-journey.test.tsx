import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { FacebookConnectionState } from '@/types/facebook';

// Mock React Router
vi.mock('react-router-dom', () => ({
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Route: ({ element }: { element: React.ReactNode }) => <div>{element}</div>,
  useNavigate: () => vi.fn(),
}));

// Mock all Facebook services for E2E testing
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
  getInsights: vi.fn(),
  syncAllData: vi.fn(),
};

const mockSyncScheduler = {
  startAutoSync: vi.fn(),
  stopAutoSync: vi.fn(),
  isAutoSyncEnabled: vi.fn().mockReturnValue(false),
  getNextSyncTime: vi.fn(),
};

vi.mock('@/lib/facebook-oauth-service', () => ({
  getFacebookOAuthService: () => mockOAuthService,
}));

vi.mock('@/lib/facebook-api-service', () => ({
  getFacebookAPIService: () => mockAPIService,
}));

vi.mock('@/lib/facebook-sync-scheduler', () => ({
  getFacebookSyncScheduler: () => mockSyncScheduler,
}));

// Mock window.open for popup testing
const mockPopup = {
  close: vi.fn(),
  closed: false,
  location: { href: 'about:blank' },
  postMessage: vi.fn(),
};

Object.defineProperty(window, 'open', {
  writable: true,
  value: vi.fn().mockReturnValue(mockPopup),
});

describe('Facebook Integration E2E User Journey', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPopup.closed = false;
    mockOAuthService.isAuthenticated.mockReturnValue(false);
    mockAPIService.isAuthenticated.mockReturnValue(false);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('First-Time User Journey', () => {
    it('completes full onboarding flow from connection to data sync', async () => {
      // Mock successful authentication flow
      const mockTokens = {
        accessToken: 'test_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      const mockAccounts = [
        { id: 'act_123', name: 'My Business Account', currency: 'USD' },
        { id: 'act_456', name: 'Client Account', currency: 'EUR' },
      ];

      const mockCampaigns = [
        {
          id: '123',
          name: 'Summer Sale Campaign',
          status: 'ACTIVE',
          objective: 'CONVERSIONS',
          insights: {
            impressions: 10000,
            clicks: 500,
            spend: 250.0,
            ctr: 5.0,
            cpc: 0.50,
          },
        },
        {
          id: '456',
          name: 'Brand Awareness Campaign',
          status: 'ACTIVE',
          objective: 'BRAND_AWARENESS',
          insights: {
            impressions: 50000,
            clicks: 1000,
            spend: 500.0,
            ctr: 2.0,
            cpc: 0.50,
          },
        },
      ];

      mockOAuthService.initiateAuth.mockResolvedValue(undefined);
      mockOAuthService.handleAuthCallback.mockResolvedValue(mockTokens);
      mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);
      mockAPIService.syncAllData.mockResolvedValue({
        campaigns: mockCampaigns,
        totalSpend: 750.0,
        totalImpressions: 60000,
        totalClicks: 1500,
        syncTimestamp: new Date(),
        errors: [],
      });

      render(<App />);

      // Step 1: User navigates to data import
      await waitFor(() => {
        expect(screen.getByText('Data Import')).toBeInTheDocument();
      });

      // Step 2: User sees Facebook API option
      expect(screen.getByText('Facebook API')).toBeInTheDocument();
      expect(screen.getByText('Connect Facebook API')).toBeInTheDocument();
      expect(screen.getByText('Access your Facebook Ads data directly')).toBeInTheDocument();

      // Step 3: User clicks connect button
      const connectButton = screen.getByText('Connect Facebook API');
      await user.click(connectButton);

      // Step 4: OAuth flow initiates
      await waitFor(() => {
        expect(mockOAuthService.initiateAuth).toHaveBeenCalled();
      });

      // Step 5: Simulate successful OAuth callback
      act(() => {
        mockOAuthService.isAuthenticated.mockReturnValue(true);
        mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
        mockAPIService.isAuthenticated.mockReturnValue(true);

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

      // Step 6: User sees connected state and account selection
      await waitFor(() => {
        expect(screen.getByText('Connected to Facebook')).toBeInTheDocument();
        expect(screen.getByText('My Business Account')).toBeInTheDocument();
        expect(screen.getByText('Client Account')).toBeInTheDocument();
      });

      // Step 7: User selects accounts to sync
      const businessAccountCheckbox = screen.getByLabelText(/my business account/i);
      const clientAccountCheckbox = screen.getByLabelText(/client account/i);
      
      await user.click(businessAccountCheckbox);
      await user.click(clientAccountCheckbox);

      // Step 8: User initiates data sync
      const syncButton = screen.getByText('Sync Data');
      await user.click(syncButton);

      // Step 9: User sees sync progress
      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });

      // Step 10: Sync completes successfully
      await waitFor(() => {
        expect(screen.getByText('Sync completed successfully')).toBeInTheDocument();
        expect(screen.getByText(/2 campaigns synced/i)).toBeInTheDocument();
        expect(screen.getByText(/\$750 total spend/i)).toBeInTheDocument();
      });

      // Step 11: User navigates to dashboard to see data
      const viewDashboardButton = screen.getByText('View Dashboard');
      await user.click(viewDashboardButton);

      // Step 12: User sees Facebook campaigns in dashboard
      await waitFor(() => {
        expect(screen.getByText('Summer Sale Campaign')).toBeInTheDocument();
        expect(screen.getByText('Brand Awareness Campaign')).toBeInTheDocument();
      });

      // Step 13: User can filter by Facebook platform
      const platformFilter = screen.getByLabelText(/platform filter/i);
      await user.selectOptions(platformFilter, 'facebook');

      await waitFor(() => {
        expect(screen.getByText('Summer Sale Campaign')).toBeInTheDocument();
        expect(screen.getByText('Brand Awareness Campaign')).toBeInTheDocument();
      });
    });

    it('handles user abandoning OAuth flow', async () => {
      render(<App />);

      const connectButton = screen.getByText('Connect Facebook API');
      await user.click(connectButton);

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
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });
  });

  describe('Returning User Journey', () => {
    it('handles returning user with existing connection', async () => {
      // Mock existing authentication
      const mockTokens = {
        accessToken: 'existing_access_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      const mockAccounts = [
        { id: 'act_123', name: 'My Business Account', currency: 'USD' },
      ];

      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.getStoredTokens.mockReturnValue(mockTokens);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);

      render(<App />);

      // User should see connected state immediately
      await waitFor(() => {
        expect(screen.getByText('Connected to Facebook')).toBeInTheDocument();
        expect(screen.getByText('My Business Account')).toBeInTheDocument();
      });

      // User can immediately sync data
      expect(screen.getByText('Sync Data')).toBeInTheDocument();
    });

    it('handles token refresh for returning user', async () => {
      // Mock expired tokens
      const expiredTokens = {
        accessToken: 'expired_token',
        tokenType: 'Bearer',
        expiresIn: -1,
        scope: ['ads_read'],
      };

      const newTokens = {
        accessToken: 'refreshed_token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        scope: ['ads_read'],
      };

      mockOAuthService.getStoredTokens.mockReturnValue(expiredTokens);
      mockOAuthService.refreshToken.mockResolvedValue(newTokens);
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);

      render(<App />);

      // Should automatically refresh tokens
      await waitFor(() => {
        expect(mockOAuthService.refreshToken).toHaveBeenCalled();
      });

      // User should see connected state after refresh
      await waitFor(() => {
        expect(screen.getByText('Connected to Facebook')).toBeInTheDocument();
      });
    });
  });

  describe('Settings and Preferences Journey', () => {
    it('allows user to configure sync preferences', async () => {
      // Mock authenticated state
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);

      render(<App />);

      // Navigate to settings
      const settingsButton = screen.getByText('Settings');
      await user.click(settingsButton);

      // Find Facebook sync settings
      await waitFor(() => {
        expect(screen.getByText('Facebook Sync Settings')).toBeInTheDocument();
      });

      // Enable auto sync
      const autoSyncCheckbox = screen.getByLabelText(/enable automatic sync/i);
      await user.click(autoSyncCheckbox);

      // Set sync interval
      const syncIntervalInput = screen.getByLabelText(/sync interval/i);
      await user.clear(syncIntervalInput);
      await user.type(syncIntervalInput, '120');

      // Enable notifications
      const notifyCheckbox = screen.getByLabelText(/notify on sync completion/i);
      await user.click(notifyCheckbox);

      // Save settings
      const saveButton = screen.getByText('Save Settings');
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Settings saved successfully')).toBeInTheDocument();
      });

      // Verify auto sync is started
      expect(mockSyncScheduler.startAutoSync).toHaveBeenCalledWith(120);
    });

    it('allows user to manage connected accounts', async () => {
      const mockAccounts = [
        { id: 'act_123', name: 'Business Account', currency: 'USD' },
        { id: 'act_456', name: 'Client Account', currency: 'EUR' },
        { id: 'act_789', name: 'Test Account', currency: 'GBP' },
      ];

      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);

      render(<App />);

      // Navigate to account management
      const manageAccountsButton = screen.getByText('Manage Accounts');
      await user.click(manageAccountsButton);

      await waitFor(() => {
        expect(screen.getByText('Business Account')).toBeInTheDocument();
        expect(screen.getByText('Client Account')).toBeInTheDocument();
        expect(screen.getByText('Test Account')).toBeInTheDocument();
      });

      // Select specific accounts for sync
      const businessAccountCheckbox = screen.getByLabelText(/business account/i);
      const clientAccountCheckbox = screen.getByLabelText(/client account/i);
      
      await user.click(businessAccountCheckbox);
      await user.click(clientAccountCheckbox);

      // Save account selection
      const saveSelectionButton = screen.getByText('Save Selection');
      await user.click(saveSelectionButton);

      await waitFor(() => {
        expect(screen.getByText('Account selection saved')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Recovery Journey', () => {
    it('guides user through connection error recovery', async () => {
      // Mock connection failure
      mockOAuthService.initiateAuth.mockRejectedValue(new Error('Network error'));

      render(<App />);

      const connectButton = screen.getByText('Connect Facebook API');
      await user.click(connectButton);

      // User sees error message
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // User clicks retry
      mockOAuthService.initiateAuth.mockResolvedValue(undefined);
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);

      // Should attempt connection again
      await waitFor(() => {
        expect(mockOAuthService.initiateAuth).toHaveBeenCalledTimes(2);
      });
    });

    it('handles sync errors with user-friendly messages', async () => {
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockAPIService.syncAllData.mockRejectedValue(new Error('Rate limit exceeded'));

      render(<App />);

      const syncButton = screen.getByText('Sync Data');
      await user.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/rate limit exceeded/i)).toBeInTheDocument();
        expect(screen.getByText(/please try again in a few minutes/i)).toBeInTheDocument();
      });
    });

    it('provides help and support options', async () => {
      render(<App />);

      // User can access help
      const helpButton = screen.getByText('Help');
      await user.click(helpButton);

      await waitFor(() => {
        expect(screen.getByText('Facebook Integration Help')).toBeInTheDocument();
        expect(screen.getByText('Troubleshooting Guide')).toBeInTheDocument();
        expect(screen.getByText('Contact Support')).toBeInTheDocument();
      });

      // User can view troubleshooting guide
      const troubleshootingButton = screen.getByText('Troubleshooting Guide');
      await user.click(troubleshootingButton);

      await waitFor(() => {
        expect(screen.getByText('Common Issues and Solutions')).toBeInTheDocument();
        expect(screen.getByText('Connection Problems')).toBeInTheDocument();
        expect(screen.getByText('Sync Issues')).toBeInTheDocument();
      });
    });
  });

  describe('Data Management Journey', () => {
    it('allows user to view and manage synced data', async () => {
      const mockCampaigns = [
        {
          id: '123',
          name: 'Summer Sale Campaign',
          status: 'ACTIVE',
          platform: 'facebook',
          spend: 250.0,
          impressions: 10000,
          clicks: 500,
        },
        {
          id: '456',
          name: 'Winter Campaign',
          status: 'PAUSED',
          platform: 'facebook',
          spend: 150.0,
          impressions: 5000,
          clicks: 200,
        },
      ];

      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);

      render(<App />);

      // Navigate to campaign management
      const campaignsButton = screen.getByText('Campaigns');
      await user.click(campaignsButton);

      await waitFor(() => {
        expect(screen.getByText('Summer Sale Campaign')).toBeInTheDocument();
        expect(screen.getByText('Winter Campaign')).toBeInTheDocument();
      });

      // User can sort campaigns
      const spendHeader = screen.getByText('Spend');
      await user.click(spendHeader);

      // User can filter campaigns
      const statusFilter = screen.getByLabelText(/status filter/i);
      await user.selectOptions(statusFilter, 'ACTIVE');

      await waitFor(() => {
        expect(screen.getByText('Summer Sale Campaign')).toBeInTheDocument();
        expect(screen.queryByText('Winter Campaign')).not.toBeInTheDocument();
      });

      // User can search campaigns
      const searchInput = screen.getByPlaceholderText(/search campaigns/i);
      await user.type(searchInput, 'Summer');

      await waitFor(() => {
        expect(screen.getByText('Summer Sale Campaign')).toBeInTheDocument();
      });
    });

    it('allows user to export Facebook data', async () => {
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);

      render(<App />);

      // Navigate to export options
      const exportButton = screen.getByText('Export Data');
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export Facebook Data')).toBeInTheDocument();
      });

      // Select export format
      const formatSelect = screen.getByLabelText(/export format/i);
      await user.selectOptions(formatSelect, 'csv');

      // Select date range
      const startDateInput = screen.getByLabelText(/start date/i);
      const endDateInput = screen.getByLabelText(/end date/i);
      
      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');

      // Start export
      const startExportButton = screen.getByText('Start Export');
      await user.click(startExportButton);

      await waitFor(() => {
        expect(screen.getByText('Export completed successfully')).toBeInTheDocument();
        expect(screen.getByText('Download File')).toBeInTheDocument();
      });
    });
  });

  describe('Disconnection Journey', () => {
    it('allows user to safely disconnect Facebook integration', async () => {
      mockOAuthService.isAuthenticated.mockReturnValue(true);
      mockAPIService.isAuthenticated.mockReturnValue(true);
      mockOAuthService.revokeToken.mockResolvedValue(undefined);

      render(<App />);

      // User navigates to disconnect option
      const settingsButton = screen.getByText('Settings');
      await user.click(settingsButton);

      const disconnectButton = screen.getByText('Disconnect Facebook');
      await user.click(disconnectButton);

      // User sees confirmation dialog
      await waitFor(() => {
        expect(screen.getByText('Disconnect Facebook Account?')).toBeInTheDocument();
        expect(screen.getByText(/this will remove access to your facebook data/i)).toBeInTheDocument();
      });

      // User confirms disconnection
      const confirmButton = screen.getByText('Yes, Disconnect');
      await user.click(confirmButton);

      // Verify disconnection process
      await waitFor(() => {
        expect(mockOAuthService.revokeToken).toHaveBeenCalled();
        expect(mockOAuthService.clearTokens).toHaveBeenCalled();
      });

      // User sees disconnected state
      await waitFor(() => {
        expect(screen.getByText('Facebook account disconnected successfully')).toBeInTheDocument();
        expect(screen.getByText('Connect Facebook API')).toBeInTheDocument();
      });
    });
  });
});