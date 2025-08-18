import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import DataImport from '@/components/DataImport';
import { FacebookConnectionState, FacebookCampaign, FacebookSyncResult } from '@/types/facebook';

// Mock services with realistic data flow
const mockOAuthService = {
  isAuthenticated: vi.fn().mockReturnValue(true),
  getStoredTokens: vi.fn().mockReturnValue({
    accessToken: 'test_access_token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    scope: ['ads_read'],
  }),
};

const mockAPIService = {
  isAuthenticated: vi.fn().mockReturnValue(true),
  setAccessToken: vi.fn(),
  getAdAccounts: vi.fn(),
  getCampaigns: vi.fn(),
  getInsights: vi.fn(),
  syncAllData: vi.fn(),
};

const mockDataTransformer = {
  transformFacebookData: vi.fn(),
  mergeFacebookWithExisting: vi.fn(),
  validateDataStructure: vi.fn(),
};

const mockDataMerger = {
  mergeFacebookData: vi.fn(),
  detectDuplicates: vi.fn(),
  resolveConflicts: vi.fn(),
};

vi.mock('@/lib/facebook-oauth-service', () => ({
  getFacebookOAuthService: () => mockOAuthService,
}));

vi.mock('@/lib/facebook-api-service', () => ({
  getFacebookAPIService: () => mockAPIService,
}));

vi.mock('@/lib/facebook-data-transformer', () => ({
  getFacebookDataTransformer: () => mockDataTransformer,
}));

vi.mock('@/lib/data-merger', () => ({
  getDataMerger: () => mockDataMerger,
}));

describe('Facebook Data Sync Workflow Integration', () => {
  const mockOnDataImported = vi.fn();
  const mockOnFacebookConnectionChange = vi.fn();

  const defaultProps = {
    onDataImported: mockOnDataImported,
    onFacebookConnectionChange: mockOnFacebookConnectionChange,
  };

  const mockAccounts = [
    { id: 'act_123', name: 'Test Account 1', currency: 'USD', timezone: 'America/New_York' },
    { id: 'act_456', name: 'Test Account 2', currency: 'EUR', timezone: 'Europe/London' },
  ];

  const mockCampaigns: FacebookCampaign[] = [
    {
      id: '123',
      name: 'Test Campaign 1',
      status: 'ACTIVE',
      objective: 'CONVERSIONS',
      created_time: '2024-01-01T00:00:00Z',
      updated_time: '2024-01-02T00:00:00Z',
      account_id: 'act_123',
      insights: {
        impressions: 1000,
        clicks: 50,
        spend: 25.5,
        reach: 800,
        frequency: 1.25,
        cpm: 25.5,
        cpc: 0.51,
        ctr: 5,
        date_start: '2024-01-01',
        date_stop: '2024-01-31',
      },
    },
    {
      id: '456',
      name: 'Test Campaign 2',
      status: 'PAUSED',
      objective: 'TRAFFIC',
      created_time: '2024-01-03T00:00:00Z',
      updated_time: '2024-01-04T00:00:00Z',
      account_id: 'act_456',
      insights: {
        impressions: 2000,
        clicks: 100,
        spend: 50.0,
        reach: 1600,
        frequency: 1.25,
        cpm: 25.0,
        cpc: 0.50,
        ctr: 5,
        date_start: '2024-01-01',
        date_stop: '2024-01-31',
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockAPIService.getAdAccounts.mockResolvedValue(mockAccounts);
    mockAPIService.getCampaigns.mockResolvedValue(mockCampaigns);
    mockDataTransformer.transformFacebookData.mockReturnValue({
      campaigns: mockCampaigns,
      ads: [],
      insights: [],
      metadata: { syncTimestamp: new Date(), source: 'facebook_api' },
    });
    mockDataMerger.mergeFacebookData.mockReturnValue({
      campaigns: mockCampaigns,
      duplicatesFound: 0,
      conflictsResolved: 0,
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Complete Data Sync Workflow', () => {
    it('completes full sync from API to dashboard integration', async () => {
      const mockSyncResult: FacebookSyncResult = {
        campaigns: mockCampaigns,
        totalSpend: 75.5,
        totalImpressions: 3000,
        totalClicks: 150,
        syncTimestamp: new Date(),
        errors: [],
      };

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

      // Initiate sync
      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Verify sync progress indication
      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });

      // Verify API calls in correct order
      await waitFor(() => {
        expect(mockAPIService.syncAllData).toHaveBeenCalledWith(['act_123', 'act_456']);
      });

      // Verify data transformation
      await waitFor(() => {
        expect(mockDataTransformer.transformFacebookData).toHaveBeenCalledWith(mockSyncResult);
      });

      // Verify data merging
      await waitFor(() => {
        expect(mockDataMerger.mergeFacebookData).toHaveBeenCalled();
      });

      // Verify final data import
      await waitFor(() => {
        expect(mockOnDataImported).toHaveBeenCalledWith(
          expect.objectContaining({
            campaigns: expect.arrayContaining([
              expect.objectContaining({
                name: 'Test Campaign 1',
                platform: 'facebook',
              }),
            ]),
          })
        );
      });

      // Verify sync completion
      await waitFor(() => {
        expect(screen.getByText('Sync Data')).toBeInTheDocument(); // Button returns to normal state
      });
    });

    it('handles partial sync with some errors', async () => {
      const mockSyncResult: FacebookSyncResult = {
        campaigns: [mockCampaigns[0]], // Only first campaign succeeded
        totalSpend: 25.5,
        totalImpressions: 1000,
        totalClicks: 50,
        syncTimestamp: new Date(),
        errors: ['Failed to fetch campaigns for account act_456'],
      };

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Verify partial data is still imported
      await waitFor(() => {
        expect(mockOnDataImported).toHaveBeenCalledWith(
          expect.objectContaining({
            campaigns: expect.arrayContaining([
              expect.objectContaining({
                name: 'Test Campaign 1',
              }),
            ]),
          })
        );
      });

      // Verify error display
      await waitFor(() => {
        expect(screen.getByText(/failed to fetch campaigns for account act_456/i)).toBeInTheDocument();
      });
    });

    it('handles complete sync failure gracefully', async () => {
      mockAPIService.syncAllData.mockRejectedValue(new Error('Network error'));

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Verify no data was imported
      expect(mockOnDataImported).not.toHaveBeenCalled();
    });
  });

  describe('Data Transformation and Validation', () => {
    it('validates and transforms Facebook data correctly', async () => {
      const mockSyncResult: FacebookSyncResult = {
        campaigns: mockCampaigns,
        totalSpend: 75.5,
        totalImpressions: 3000,
        totalClicks: 150,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);
      mockDataTransformer.validateDataStructure.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockDataTransformer.validateDataStructure).toHaveBeenCalled();
        expect(mockDataTransformer.transformFacebookData).toHaveBeenCalledWith(mockSyncResult);
      });
    });

    it('handles data validation failures', async () => {
      const mockSyncResult: FacebookSyncResult = {
        campaigns: mockCampaigns,
        totalSpend: 75.5,
        totalImpressions: 3000,
        totalClicks: 150,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);
      mockDataTransformer.validateDataStructure.mockReturnValue({
        isValid: false,
        errors: ['Invalid campaign structure'],
        warnings: ['Missing insights data'],
      });

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid campaign structure/i)).toBeInTheDocument();
        expect(screen.getByText(/missing insights data/i)).toBeInTheDocument();
      });
    });

    it('handles currency conversion for multi-currency accounts', async () => {
      const multiCurrencyCampaigns = [
        { ...mockCampaigns[0], account_id: 'act_123' }, // USD
        { ...mockCampaigns[1], account_id: 'act_456' }, // EUR
      ];

      const mockSyncResult: FacebookSyncResult = {
        campaigns: multiCurrencyCampaigns,
        totalSpend: 75.5,
        totalImpressions: 3000,
        totalClicks: 150,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);
      mockDataTransformer.transformFacebookData.mockReturnValue({
        campaigns: multiCurrencyCampaigns.map(campaign => ({
          ...campaign,
          normalizedSpend: campaign.insights?.spend || 0, // Normalized to USD
          originalCurrency: campaign.account_id === 'act_123' ? 'USD' : 'EUR',
        })),
        ads: [],
        insights: [],
        metadata: { syncTimestamp: new Date(), source: 'facebook_api' },
      });

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockDataTransformer.transformFacebookData).toHaveBeenCalledWith(
          expect.objectContaining({
            campaigns: expect.arrayContaining([
              expect.objectContaining({ account_id: 'act_123' }),
              expect.objectContaining({ account_id: 'act_456' }),
            ]),
          })
        );
      });
    });
  });

  describe('Data Merging and Deduplication', () => {
    it('merges Facebook data with existing imported data', async () => {
      const existingData = [
        {
          id: 'existing_1',
          name: 'Existing Campaign',
          platform: 'manual_import',
          spend: 100,
        },
      ];

      const mockSyncResult: FacebookSyncResult = {
        campaigns: mockCampaigns,
        totalSpend: 75.5,
        totalImpressions: 3000,
        totalClicks: 150,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);
      mockDataMerger.mergeFacebookData.mockReturnValue({
        campaigns: [...existingData, ...mockCampaigns],
        duplicatesFound: 0,
        conflictsResolved: 0,
      });

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
          storedData={{ campaigns: existingData }}
        />
      );

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(mockDataMerger.mergeFacebookData).toHaveBeenCalledWith(
          expect.objectContaining({
            campaigns: mockCampaigns,
          }),
          expect.objectContaining({
            campaigns: existingData,
          })
        );
      });

      await waitFor(() => {
        expect(mockOnDataImported).toHaveBeenCalledWith(
          expect.objectContaining({
            campaigns: expect.arrayContaining([
              expect.objectContaining({ name: 'Existing Campaign' }),
              expect.objectContaining({ name: 'Test Campaign 1' }),
            ]),
          })
        );
      });
    });

    it('detects and handles duplicate campaigns', async () => {
      const duplicateCampaign = { ...mockCampaigns[0], id: 'duplicate_123' };
      const mockSyncResult: FacebookSyncResult = {
        campaigns: [duplicateCampaign],
        totalSpend: 25.5,
        totalImpressions: 1000,
        totalClicks: 50,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);
      mockDataMerger.detectDuplicates.mockReturnValue([
        {
          facebookCampaign: duplicateCampaign,
          existingCampaign: mockCampaigns[0],
          similarity: 0.95,
        },
      ]);
      mockDataMerger.mergeFacebookData.mockReturnValue({
        campaigns: [mockCampaigns[0]], // Deduplicated
        duplicatesFound: 1,
        conflictsResolved: 0,
      });

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
          storedData={{ campaigns: mockCampaigns }}
        />
      );

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/1 duplicate found and merged/i)).toBeInTheDocument();
      });
    });

    it('resolves data conflicts intelligently', async () => {
      const conflictingCampaign = {
        ...mockCampaigns[0],
        insights: {
          ...mockCampaigns[0].insights!,
          spend: 30.0, // Different spend value
        },
      };

      const mockSyncResult: FacebookSyncResult = {
        campaigns: [conflictingCampaign],
        totalSpend: 30.0,
        totalImpressions: 1000,
        totalClicks: 50,
        syncTimestamp: new Date(),
        errors: [],
      };

      mockAPIService.syncAllData.mockResolvedValue(mockSyncResult);
      mockDataMerger.resolveConflicts.mockReturnValue({
        resolvedCampaign: {
          ...conflictingCampaign,
          insights: {
            ...conflictingCampaign.insights!,
            spend: 30.0, // Facebook API data takes precedence
          },
        },
        conflictType: 'spend_mismatch',
        resolution: 'facebook_api_preferred',
      });
      mockDataMerger.mergeFacebookData.mockReturnValue({
        campaigns: [conflictingCampaign],
        duplicatesFound: 0,
        conflictsResolved: 1,
      });

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'idle',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
          storedData={{ campaigns: mockCampaigns }}
        />
      );

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/1 conflict resolved/i)).toBeInTheDocument();
      });
    });
  });

  describe('Progress Tracking and User Feedback', () => {
    it('provides detailed progress updates during sync', async () => {
      let syncResolver: (value: FacebookSyncResult) => void;
      const syncPromise = new Promise<FacebookSyncResult>((resolve) => {
        syncResolver = resolve;
      });

      mockAPIService.syncAllData.mockReturnValue(syncPromise);

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Check initial progress state
      await waitFor(() => {
        expect(screen.getByText('Syncing...')).toBeInTheDocument();
      });

      // Simulate progress updates
      act(() => {
        syncResolver!({
          campaigns: mockCampaigns,
          totalSpend: 75.5,
          totalImpressions: 3000,
          totalClicks: 150,
          syncTimestamp: new Date(),
          errors: [],
        });
      });

      // Check completion state
      await waitFor(() => {
        expect(screen.getByText('Sync completed successfully')).toBeInTheDocument();
      });
    });

    it('displays sync statistics after completion', async () => {
      const mockSyncResult: FacebookSyncResult = {
        campaigns: mockCampaigns,
        totalSpend: 75.5,
        totalImpressions: 3000,
        totalClicks: 150,
        syncTimestamp: new Date(),
        errors: [],
      };

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      await waitFor(() => {
        expect(screen.getByText(/2 campaigns synced/i)).toBeInTheDocument();
        expect(screen.getByText(/\$75\.5 total spend/i)).toBeInTheDocument();
        expect(screen.getByText(/3000 total impressions/i)).toBeInTheDocument();
      });
    });

    it('handles sync cancellation', async () => {
      let syncResolver: (value: FacebookSyncResult) => void;
      const syncPromise = new Promise<FacebookSyncResult>((resolve) => {
        syncResolver = resolve;
      });

      mockAPIService.syncAllData.mockReturnValue(syncPromise);

      const facebookConnection: FacebookConnectionState = {
        isConnected: true,
        connectedAccounts: mockAccounts,
        syncStatus: 'syncing',
      };

      render(
        <DataImport 
          {...defaultProps}
          facebookConnection={facebookConnection}
        />
      );

      // Should show cancel button during sync
      await waitFor(() => {
        expect(screen.getByText('Cancel')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.getByText('Sync cancelled')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('implements exponential backoff for failed requests', async () => {
      let attemptCount = 0;
      mockAPIService.syncAllData.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Temporary network error'));
        }
        return Promise.resolve({
          campaigns: mockCampaigns,
          totalSpend: 75.5,
          totalImpressions: 3000,
          totalClicks: 150,
          syncTimestamp: new Date(),
          errors: [],
        });
      });

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Should eventually succeed after retries
      await waitFor(() => {
        expect(mockOnDataImported).toHaveBeenCalled();
      }, { timeout: 10000 });

      expect(attemptCount).toBe(3);
    });

    it('provides manual retry option after failure', async () => {
      mockAPIService.syncAllData
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          campaigns: mockCampaigns,
          totalSpend: 75.5,
          totalImpressions: 3000,
          totalClicks: 150,
          syncTimestamp: new Date(),
          errors: [],
        });

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

      const syncButton = screen.getByText('Sync Data');
      fireEvent.click(syncButton);

      // Wait for error state
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });

      // Click retry
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // Should succeed on retry
      await waitFor(() => {
        expect(mockOnDataImported).toHaveBeenCalled();
      });
    });
  });
});