// Facebook API Service Synchronization Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookAPIService, getFacebookAPIService, resetFacebookAPIService } from '../facebook-api-service';
import { FacebookAPIClient } from '../facebook-api-client';
import { FacebookAdAccount, FacebookCampaign, FacebookInsights } from '@/types/facebook';

// Mock the Facebook API client
const mockClient = {
  setAccessToken: vi.fn(),
  isAuthenticated: vi.fn(),
  get: vi.fn(),
  batch: vi.fn(),
  healthCheck: vi.fn(),
  getRateLimiterStatus: vi.fn(),
  getCircuitBreakerStatus: vi.fn(),
  resetRateLimiter: vi.fn(),
  resetCircuitBreaker: vi.fn(),
} as unknown as FacebookAPIClient;

// Mock the client factory
vi.mock('../facebook-api-client', () => ({
  getFacebookAPIClient: vi.fn(() => mockClient),
  FacebookAPIClient: vi.fn(),
}));

describe('FacebookAPIService - Synchronization', () => {
  let service: FacebookAPIService;

  const mockAccounts: FacebookAdAccount[] = [
    {
      id: 'act_123',
      name: 'Test Account 1',
      currency: 'USD',
      timezone: 'America/New_York',
      accountStatus: 'ACTIVE',
    },
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
    },
  ];

  const mockInsights: FacebookInsights = {
    impressions: 1000,
    clicks: 50,
    spend: 25.50,
    reach: 800,
    frequency: 1.25,
    cpm: 25.50,
    cpc: 0.51,
    ctr: 5.0,
    date_start: '2024-01-01',
    date_stop: '2024-01-31',
  };

  beforeEach(() => {
    service = new FacebookAPIService(mockClient);
    mockClient.isAuthenticated.mockReturnValue(true);
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetFacebookAPIService();
  });

  describe('syncAllData', () => {
    it('should sync all data successfully', async () => {
      // Mock accounts response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockAccounts },
      });

      // Mock campaigns response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockCampaigns },
      });

      // Mock batch insights response
      mockClient.batch.mockResolvedValueOnce({
        data: [
          {
            code: 200,
            body: JSON.stringify({ data: [mockInsights] }),
          },
        ],
      });

      const progressUpdates: any[] = [];
      const result = await service.syncAllData({
        accountIds: ['act_123'],
        includeInsights: true,
        onProgress: (progress) => progressUpdates.push({ ...progress }),
      });

      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0].insights).toEqual(mockInsights);
      expect(result.totalSpend).toBe(25.50);
      expect(result.totalImpressions).toBe(1000);
      expect(result.totalClicks).toBe(50);
      expect(result.errors).toHaveLength(0);

      // Check progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].phase).toBe('accounts');
      expect(progressUpdates[progressUpdates.length - 1].phase).toBe('complete');
    });

    it('should handle sync without insights', async () => {
      // Mock accounts response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockAccounts },
      });

      // Mock campaigns response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockCampaigns },
      });

      const result = await service.syncAllData({
        accountIds: ['act_123'],
        includeInsights: false,
      });

      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0].insights).toBeUndefined();
      expect(mockClient.batch).not.toHaveBeenCalled();
    });

    it('should handle empty account list', async () => {
      await expect(service.syncAllData({
        accountIds: [],
      })).rejects.toThrow('No valid accounts found');
    });

    it('should handle account fetch errors gracefully', async () => {
      // Mock accounts response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockAccounts },
      });

      // Mock campaigns response with error
      mockClient.get.mockRejectedValueOnce(new Error('Campaign fetch error'));

      const result = await service.syncAllData({
        accountIds: ['act_123'],
        includeInsights: false,
      });

      expect(result.campaigns).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Campaign fetch error');
    });

    it('should handle insights fetch errors gracefully', async () => {
      // Mock accounts response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockAccounts },
      });

      // Mock campaigns response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockCampaigns },
      });

      // Mock batch insights response with error
      mockClient.batch.mockRejectedValueOnce(new Error('Insights fetch error'));

      const result = await service.syncAllData({
        accountIds: ['act_123'],
        includeInsights: true,
      });

      expect(result.campaigns).toHaveLength(1);
      expect(result.campaigns[0].insights).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getAllCampaigns', () => {
    it('should fetch all campaigns with pagination', async () => {
      // First page
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: mockCampaigns,
          paging: {
            next: 'next_url',
            cursors: { after: 'cursor_123' },
          },
        },
      });

      // Second page (empty)
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: [],
          paging: {},
        },
      });

      const result = await service.getAllCampaigns('act_123');

      expect(result).toEqual(mockCampaigns);
      expect(mockClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle single page response', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: {
          data: mockCampaigns,
          paging: {},
        },
      });

      const result = await service.getAllCampaigns('act_123');

      expect(result).toEqual(mockCampaigns);
      expect(mockClient.get).toHaveBeenCalledTimes(1);
    });

    it('should handle API errors', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getAllCampaigns('act_123')).rejects.toThrow('Failed to fetch all campaigns');
    });
  });

  describe('sync utilities', () => {
    it('should estimate sync duration', async () => {
      const duration = await service.estimateSyncDuration(['act_123', 'act_456'], true);
      expect(duration).toBeGreaterThan(0);
      expect(typeof duration).toBe('number');
    });

    it('should track sync running state', () => {
      expect(service.isSyncRunning()).toBe(false);
      
      // Note: In a real implementation, this would be set during sync
      // For testing, we just verify the method exists and returns boolean
    });

    it('should allow sync cancellation', () => {
      // This should not throw
      expect(() => service.cancelSync()).not.toThrow();
    });
  });
});