import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import DataImport from '../DataImport';
import { FacebookConnectionState } from '@/types/facebook';

// Mock the Facebook services
vi.mock('@/lib/facebook-oauth-service', () => ({
  getFacebookOAuthService: () => ({
    initiateAuth: vi.fn().mockResolvedValue(undefined),
    getStoredTokens: vi.fn().mockReturnValue(null),
    clearTokens: vi.fn(),
    revokeToken: vi.fn().mockResolvedValue(undefined),
    validateAndRefreshToken: vi.fn().mockResolvedValue(null),
  }),
}));

vi.mock('@/lib/facebook-api-service', () => ({
  getFacebookAPIService: () => ({
    setAccessToken: vi.fn(),
    getAdAccounts: vi.fn().mockResolvedValue([]),
  }),
}));

describe('DataImport - Facebook Connection UI', () => {
  const mockOnDataImported = vi.fn();
  const mockOnFacebookConnectionChange = vi.fn();

  const defaultProps = {
    onDataImported: mockOnDataImported,
    onFacebookConnectionChange: mockOnFacebookConnectionChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Facebook API connection section when not connected', () => {
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

    expect(screen.getByText('Facebook API')).toBeInTheDocument();
    expect(screen.getByText('Connect Facebook API')).toBeInTheDocument();
    expect(screen.getByText('Access your Facebook Ads data directly')).toBeInTheDocument();
  });

  it('renders connected state when Facebook is connected', () => {
    const facebookConnection: FacebookConnectionState = {
      isConnected: true,
      connectedAccounts: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account',
          currency: 'USD',
          timezone: 'America/New_York',
          accountStatus: 'ACTIVE',
        },
      ],
      syncStatus: 'idle',
      lastSyncTime: new Date('2024-01-01T12:00:00Z'),
    };

    render(
      <DataImport 
        {...defaultProps}
        facebookConnection={facebookConnection}
      />
    );

    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('1 ad account(s)')).toBeInTheDocument();
    expect(screen.getByText('Test Ad Account')).toBeInTheDocument();
  });

  it('shows basic UI elements correctly', () => {
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

    // Check if the component renders without crashing
    expect(screen.getByText('Facebook API')).toBeInTheDocument();
  });

  it('shows account selection interface when connected with multiple accounts', () => {
    const facebookConnection: FacebookConnectionState = {
      isConnected: true,
      connectedAccounts: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account 1',
          currency: 'USD',
          timezone: 'America/New_York',
          accountStatus: 'ACTIVE',
        },
        {
          id: 'act_987654321',
          name: 'Test Ad Account 2',
          currency: 'EUR',
          timezone: 'Europe/London',
          accountStatus: 'ACTIVE',
        },
      ],
      syncStatus: 'idle',
    };

    render(
      <DataImport 
        {...defaultProps}
        facebookConnection={facebookConnection}
      />
    );

    expect(screen.getByText('Connected Accounts:')).toBeInTheDocument();
    expect(screen.getByText('Select')).toBeInTheDocument();
    expect(screen.getByText('Test Ad Account 1')).toBeInTheDocument();
    expect(screen.getByText('Test Ad Account 2')).toBeInTheDocument();
  });

  it('displays account selection controls when selector is shown', () => {
    const facebookConnection: FacebookConnectionState = {
      isConnected: true,
      connectedAccounts: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account 1',
          currency: 'USD',
          timezone: 'America/New_York',
          accountStatus: 'ACTIVE',
        },
      ],
      syncStatus: 'idle',
    };

    render(
      <DataImport 
        {...defaultProps}
        facebookConnection={facebookConnection}
      />
    );

    // The component should render without errors
    expect(screen.getByText('Connected Accounts:')).toBeInTheDocument();
  });

  it('displays sync controls when connected', () => {
    const facebookConnection: FacebookConnectionState = {
      isConnected: true,
      connectedAccounts: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account',
          currency: 'USD',
          timezone: 'America/New_York',
          accountStatus: 'ACTIVE',
        },
      ],
      syncStatus: 'idle',
      lastSyncTime: new Date('2024-01-01T12:00:00Z'),
    };

    render(
      <DataImport 
        {...defaultProps}
        facebookConnection={facebookConnection}
      />
    );

    expect(screen.getByText('Sync Status:')).toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
    expect(screen.getByText('Last sync:')).toBeInTheDocument();
    expect(screen.getByText('Sync Data')).toBeInTheDocument();
  });

  it('shows error state in sync controls', () => {
    const facebookConnection: FacebookConnectionState = {
      isConnected: true,
      connectedAccounts: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account',
          currency: 'USD',
          timezone: 'America/New_York',
          accountStatus: 'ACTIVE',
        },
      ],
      syncStatus: 'error',
      error: 'Sync failed',
    };

    render(
      <DataImport 
        {...defaultProps}
        facebookConnection={facebookConnection}
      />
    );

    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getAllByText('Sync failed')).toHaveLength(2); // One in connection error, one in sync error
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('displays data freshness indicator', () => {
    const facebookConnection: FacebookConnectionState = {
      isConnected: true,
      connectedAccounts: [
        {
          id: 'act_123456789',
          name: 'Test Ad Account',
          currency: 'USD',
          timezone: 'America/New_York',
          accountStatus: 'ACTIVE',
        },
      ],
      syncStatus: 'idle',
      lastSyncTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    };

    render(
      <DataImport 
        {...defaultProps}
        facebookConnection={facebookConnection}
      />
    );

    expect(screen.getByText(/Data is \d+ hour\(s\) old/)).toBeInTheDocument();
  });
});