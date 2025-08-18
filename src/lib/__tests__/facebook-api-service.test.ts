// Facebook API Service Unit Tests

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FacebookAPIService, getFacebookAPIService, resetFacebookAPIService } from '../facebook-api-service';
import { FacebookAPIClient } from '../facebook-api-client';
import { FACEBOOK_FIELDS, FACEBOOK_INSIGHTS_METRICS } from '../facebook-constants';
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

describe('FacebookAPIService', () => {
  let service: FacebookAPIService;

  beforeEach(() => {
    service = new FacebookAPIService(mockClient);
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetFacebookAPIService();
  });

  describe('constructor', () => {
    it('should create service with default client', () => {
      const defaultService = new FacebookAPIService();
      expect(defaultService).toBeInstanceOf(FacebookAPIService);
    });

    it('should create service with custom client and config', () => {
      const customService = new FacebookAPIService(mockClient, {
        batchSize: 10,
        includeInsights: false,
      });
      expect(customService).toBeInstanceOf(FacebookAPIService);
    });
  });

  describe('authentication', () => {
    it('should set access token on client', () => {
      const token = 'test-access-token';
      service.setAccessToken(token);
      
      expect(mockClient.setAccessToken).toHaveBeenCalledWith(token);
    });

    it('should check authentication status', () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      
      expect(service.isAuthenticated()).toBe(true);
      expect(mockClient.isAuthenticated).toHaveBeenCalled();
    });

    it('should throw error when not authenticated', async () => {
      mockClient.isAuthenticated.mockReturnValue(false);
      
      await expect(service.getAdAccounts()).rejects.toThrow('Not authenticated');
    });
  });

  describe('getAdAccounts', () => {
    const mockAccounts: FacebookAdAccount[] = [
      {
        id: 'act_123',
        name: 'Test Account 1',
        currency: 'USD',
        timezone: 'America/New_York',
        accountStatus: 'ACTIVE',
      },
      {
        id: 'act_456',
        name: 'Test Account 2',
        currency: 'EUR',
        timezone: 'Europe/London',
        accountStatus: 'ACTIVE',
      },
    ];

    beforeEach(() => {
      mockClient.isAuthenticated.mockReturnValue(true);
    });

    it('should fetch ad accounts successfully', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockAccounts },
      });

      const result = await service.getAdAccounts();

      expect(mockClient.get).toHaveBeenCalledWith(
        '/me/adaccounts',
        { fields: FACEBOOK_FIELDS.AD_ACCOUNT }
      );
      expect(result).toEqual(mockAccounts);
    });

    it('should handle empty response', async () => {
      mockClient.get.mockResolvedValue({
        data: {},
      });

      const result = await service.getAdAccounts();
      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getAdAccounts()).rejects.toThrow('Failed to fetch ad accounts');
    });
  });

  describe('getCampaigns', () => {
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
      {
        id: '456',
        name: 'Test Campaign 2',
        status: 'PAUSED',
        objective: 'TRAFFIC',
        created_time: '2024-01-01T00:00:00Z',
        updated_time: '2024-01-02T00:00:00Z',
        account_id: 'act_123',
      },
    ];

    beforeEach(() => {
      mockClient.isAuthenticated.mockReturnValue(true);
    });

    it('should fetch campaigns successfully', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockCampaigns },
      });

      const result = await service.getCampaigns('act_123');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/act_123/campaigns',
        {
          fields: FACEBOOK_FIELDS.CAMPAIGN,
          limit: 100,
        }
      );
      expect(result).toEqual(mockCampaigns);
    });

    it('should apply status filter', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockCampaigns },
      });

      await service.getCampaigns('act_123', {
        status: ['ACTIVE', 'PAUSED'],
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/act_123/campaigns',
        expect.objectContaining({
          filtering: expect.stringContaining('campaign.effective_status'),
        })
      );
    });

    it('should apply date range filter', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockCampaigns },
      });

      const dateRange = {
        since: '2024-01-01',
        until: '2024-01-31',
      };

      await service.getCampaigns('act_123', { dateRange });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/act_123/campaigns',
        expect.objectContaining({
          time_range: JSON.stringify(dateRange),
        })
      );
    });

    it('should handle API errors', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getCampaigns('act_123')).rejects.toThrow('Failed to fetch campaigns');
    });
  });

  describe('getInsights', () => {
    const mockInsights: FacebookInsights[] = [
      {
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
      },
    ];

    beforeEach(() => {
      mockClient.isAuthenticated.mockReturnValue(true);
    });

    it('should fetch insights successfully', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockInsights },
      });

      const result = await service.getInsights('123', 'campaign');

      expect(mockClient.get).toHaveBeenCalledWith(
        '/123/insights',
        {
          fields: FACEBOOK_INSIGHTS_METRICS.join(','),
          level: 'campaign',
          limit: 100,
        }
      );
      expect(result).toEqual(mockInsights);
    });

    it('should apply date range filter', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockInsights },
      });

      const dateRange = {
        since: '2024-01-01',
        until: '2024-01-31',
      };

      await service.getInsights('123', 'campaign', { dateRange });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/123/insights',
        expect.objectContaining({
          time_range: JSON.stringify(dateRange),
        })
      );
    });

    it('should apply custom metrics', async () => {
      mockClient.get.mockResolvedValue({
        data: { data: mockInsights },
      });

      const customMetrics = ['impressions', 'clicks', 'spend'];

      await service.getInsights('123', 'campaign', {
        metrics: customMetrics,
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/123/insights',
        expect.objectContaining({
          fields: customMetrics.join(','),
        })
      );
    });

    it('should handle API errors', async () => {
      mockClient.get.mockRejectedValue(new Error('API Error'));

      await expect(service.getInsights('123', 'campaign')).rejects.toThrow('Failed to fetch insights');
    });
  });

  describe('batchRequest', () => {
    beforeEach(() => {
      mockClient.isAuthenticated.mockReturnValue(true);
    });

    it('should execute batch requests successfully', async () => {
      const batchRequests = [
        { method: 'GET', relative_url: 'me' },
        { method: 'GET', relative_url: 'me/adaccounts' },
      ];

      const batchResponse = [
        { code: 200, body: '{"id":"123"}' },
        { code: 200, body: '{"data":[]}' },
      ];

      mockClient.batch.mockResolvedValue({
        data: batchResponse,
      });

      const result = await service.batchRequest(batchRequests);

      expect(mockClient.batch).toHaveBeenCalledWith(batchRequests);
      expect(result).toHaveLength(2);
      expect(result[0].data).toEqual({ id: '123' });
      expect(result[1].data).toEqual({ data: [] });
    });

    it('should handle empty batch requests', async () => {
      const result = await service.batchRequest([]);
      expect(result).toEqual([]);
    });

    it('should reject oversized batch requests', async () => {
      const largeBatch = Array(60).fill({ method: 'GET', relative_url: 'me' });

      await expect(service.batchRequest(largeBatch)).rejects.toThrow('Batch size cannot exceed');
    });

    it('should handle batch API errors', async () => {
      mockClient.batch.mockRejectedValue(new Error('Batch API Error'));

      await expect(service.batchRequest([
        { method: 'GET', relative_url: 'me' }
      ])).rejects.toThrow('Batch request failed');
    });
  });

  describe('getCampaignsWithInsights', () => {
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
      mockClient.isAuthenticated.mockReturnValue(true);
    });

    it('should fetch campaigns with insights successfully', async () => {
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

      const result = await service.getCampaignsWithInsights('act_123');

      expect(result).toHaveLength(1);
      expect(result[0].insights).toEqual(mockInsights);
    });

    it('should handle campaigns without insights', async () => {
      // Mock campaigns response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockCampaigns },
      });

      // Mock batch insights response with error
      mockClient.batch.mockResolvedValueOnce({
        data: [
          {
            code: 400,
            body: JSON.stringify({ error: { message: 'No insights available' } }),
          },
        ],
      });

      const result = await service.getCampaignsWithInsights('act_123');

      expect(result).toHaveLength(1);
      expect(result[0].insights).toBeUndefined();
    });

    it('should return empty array when no campaigns', async () => {
      mockClient.get.mockResolvedValueOnce({
        data: { data: [] },
      });

      const result = await service.getCampaignsWithInsights('act_123');
      expect(result).toEqual([]);
    });
  });

  describe('getAccountsData', () => {
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

    beforeEach(() => {
      mockClient.isAuthenticated.mockReturnValue(true);
    });

    it('should fetch data for multiple accounts', async () => {
      // Mock accounts response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockAccounts },
      });

      // Mock campaigns response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockCampaigns },
      });

      const result = await service.getAccountsData(['act_123']);

      expect(result).toHaveProperty('act_123');
      expect(result['act_123'].account).toEqual(mockAccounts[0]);
      expect(result['act_123'].campaigns).toEqual(mockCampaigns);
    });

    it('should handle empty account list', async () => {
      const result = await service.getAccountsData([]);
      expect(result).toEqual({});
    });

    it('should handle account fetch errors gracefully', async () => {
      // Mock accounts response
      mockClient.get.mockResolvedValueOnce({
        data: { data: mockAccounts },
      });

      // Mock campaigns response with error
      mockClient.get.mockRejectedValueOnce(new Error('Campaign fetch error'));

      const result = await service.getAccountsData(['act_123']);

      expect(result).toHaveProperty('act_123');
      expect(result['act_123'].account).toEqual(mockAccounts[0]);
      expect(result['act_123'].campaigns).toEqual([]);
    });
  });

  describe('health check and status', () => {
    it('should perform health check', async () => {
      mockClient.healthCheck.mockResolvedValue(true);

      const result = await service.healthCheck();
      expect(result).toBe(true);
      expect(mockClient.healthCheck).toHaveBeenCalled();
    });

    it('should handle health check errors', async () => {
      mockClient.healthCheck.mockRejectedValue(new Error('Health check failed'));

      const result = await service.healthCheck();
      expect(result).toBe(false);
    });

    it('should get service status', () => {
      mockClient.isAuthenticated.mockReturnValue(true);
      mockClient.getRateLimiterStatus.mockReturnValue({
        canMakeRequest: true,
        retryAfter: 0,
      });
      mockClient.getCircuitBreakerStatus.mockReturnValue({
        state: 'CLOSED',
        canExecute: true,
      });

      const status = service.getStatus();

      expect(status.isAuthenticated).toBe(true);
      expect(status.rateLimiter.canMakeRequest).toBe(true);
      expect(status.circuitBreaker.state).toBe('CLOSED');
    });

    it('should reset client state', () => {
      service.reset();

      expect(mockClient.resetRateLimiter).toHaveBeenCalled();
      expect(mockClient.resetCircuitBreaker).toHaveBeenCalled();
    });
  });
});

describe('getFacebookAPIService', () => {
  afterEach(() => {
    resetFacebookAPIService();
  });

  it('should return singleton instance', () => {
    const service1 = getFacebookAPIService();
    const service2 = getFacebookAPIService();
    
    expect(service1).toBe(service2);
    expect(service1).toBeInstanceOf(FacebookAPIService);
  });

  it('should create service with custom config', () => {
    const config = {
      batchSize: 10,
      includeInsights: false,
    };

    const service = getFacebookAPIService(config);
    expect(service).toBeInstanceOf(FacebookAPIService);
  });
});

  describe('syncAllData', () => {
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
      mockClient.isAuthenticated.mockReturnValue(true);
    });

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

    beforeEach(() => {
      mockClient.isAuthenticated.mockReturnValue(true);
    });

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

describe('getFacebookAPIService', () => {
  afterEach(() => {
    resetFacebookAPIService();
  });

  it('should return singleton instance', () => {
    const service1 = getFacebookAPIService();
    const service2 = getFacebookAPIService();
    
    expect(service1).toBe(service2);
    expect(service1).toBeInstanceOf(FacebookAPIService);
  });

  it('should create service with custom config', () => {
    const config = {
      batchSize: 10,
      includeInsights: false,
    };

    const service = getFacebookAPIService(config);
    expect(service).toBeInstanceOf(FacebookAPIService);
  });
});

describe('resetFacebookAPIService', () => {
  it('should reset singleton instance', () => {
    const service1 = getFacebookAPIService();
    resetFacebookAPIService();
    const service2 = getFacebookAPIService();
    
    expect(service1).not.toBe(service2);
  });
});